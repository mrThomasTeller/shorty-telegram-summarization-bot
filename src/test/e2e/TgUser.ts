import { createInterface } from 'node:readline';
import { Logger, TelegramClient, type Api } from 'telegram';
import { NewMessage, type NewMessageEvent } from 'telegram/events';
import { StoreSession } from 'telegram/sessions';
import { required } from '../../lib/common/lang';
import { getEnv } from '../../config/envVars';
import { testConfig } from './testConfig';
import { expectTgMessagesSnapshot } from './utils';
import { setTimeout } from 'node:timers/promises';
import { expect } from 'bun:test';
import type TelegramBotService from '../../services/TelegramBotService';
import type { Message } from 'node-telegram-bot-api';

export class TgUser {
  private readonly client: TelegramClient;
  private readonly rl;
  private _me?: Promise<Api.User>;
  private readonly _receivedMessages: Api.Message[] = [];

  constructor(private readonly telegramBot: TelegramBotService) {
    const envVars = getEnv();
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.client = new TelegramClient(
      new StoreSession('.tgSessionData'),
      required(envVars.TG_API_ID),
      required(envVars.TG_API_HASH),
      {
        connectionRetries: 5,
        baseLogger: new NoLogger(),
      }
    );
  }

  clearMessages(): void {
    this._receivedMessages.length = 0;
  }

  async connect(): Promise<void> {
    await this.client.start({
      phoneNumber: required(getEnv().TG_PHONE_NUMBER),
      password: async () => await this.promptUser('Please enter your password: '),
      phoneCode: async () => await this.promptUser('Please enter the code you received: '),
      onError: (err: Error) => {
        throw err;
      },
    });

    this.setupMessageHandler();
    await this.saveSession();
  }

  getDgbMessages(): Api.Message[] {
    return this._receivedMessages.filter((x) => isDevGroupBotMessage(x));
  }

  get me(): Promise<Api.User> {
    return (this._me ??= this.client.getMe());
  }

  async sendMessage(message: string, to = testConfig.groupId): Promise<void> {
    const { id: userId } = await this.me;

    const promise = new Promise<void>((resolve) => {
      const listener = (msg: Message): void => {
        if (msg.chat.id === to && msg.from?.id === Number(userId) && msg.text === message) {
          this.telegramBot.__bot.removeListener('message', listener);
          // todo нужно подождать пока сервер обработает сообщение
          global.setTimeout(() => resolve(), 50);
        }
      };

      this.telegramBot.__bot.addListener('message', listener);
    });

    await this.client.sendMessage(to, { message });
    return await promise;
  }

  async sendTestMessages({
    count = getEnv().MIN_MESSAGES_COUNT_TO_SUMMARIZE,
    length,
    totalLength,
    to = testConfig.groupId,
  }: { count?: number; length?: number; totalLength?: number; to?: number } = {}): Promise<void> {
    const { firstName } = await this.me;

    if (totalLength != null) {
      if (length != null) throw new Error('length and totalLength cannot be provided together');
      length = Math.ceil(totalLength / count);
    }
    length ??= 1;

    const messageLength = Math.max(1, length - (firstName?.length ?? 0) - 2);

    for (let i = 0; i < count; i++) {
      const message = Array.from({ length: messageLength })
        .fill(0)
        .map((_, index) => (index + i) % 10)
        .join('');

      await this.sendMessage(message, to);
    }
  }

  async sendSummarizeCommand(to = testConfig.groupId): Promise<void> {
    await this.sendMessage(`@${testConfig.botUsername}`, to);
  }

  async disconnect(): Promise<void> {
    this.rl.close();
    await this.client.disconnect();
  }

  async expectNoFurtherDbgMessages(): Promise<void> {
    this.clearMessages();
    await setTimeout(500);
    expect(this.getDgbMessages().length).toBe(0);
  }

  async matchDgbMessagesSnapshot(count: number): Promise<void> {
    await new Promise<void>((resolve) => {
      const receivedMessages: Api.Message[] = this.getDgbMessages();
      const newMessageEvent = new NewMessage({});

      const checkMessages = (): boolean => {
        if (receivedMessages.length >= count) {
          expectTgMessagesSnapshot(receivedMessages);
          return true;
        }
        return false;
      };

      if (checkMessages()) {
        resolve();
        return;
      }

      const handler = (event: NewMessageEvent): void => {
        if (isDevGroupBotMessage(event.message)) {
          receivedMessages.push(event.message);
          if (checkMessages()) {
            this.client.removeEventHandler(handler, newMessageEvent);
            resolve();
          } else {
            // eslint-disable-next-line no-console
            console.log(`Received ${receivedMessages.length} of ${count} expected messages`);
          }
        }
      };

      this.client.addEventHandler(handler, newMessageEvent);
    });

    this.clearMessages();
  }

  private async promptUser(question: string): Promise<string> {
    return await new Promise((resolve) => this.rl.question(question, resolve));
  }

  private setupMessageHandler(): void {
    this.client.addEventHandler((event: NewMessageEvent) => {
      this._receivedMessages.push(event.message);
    }, new NewMessage({}));
  }

  private async saveSession(): Promise<void> {
    this.client.session.save();
  }
}

class NoLogger extends Logger {
  override _log(): void {}
}

const isDevGroupBotMessage = (message: Api.Message): boolean =>
  message.chatId?.toJSNumber() === testConfig.groupId &&
  message.fromId?.className === 'PeerUser' &&
  message.fromId.userId.toJSNumber() === testConfig.botUserId;
