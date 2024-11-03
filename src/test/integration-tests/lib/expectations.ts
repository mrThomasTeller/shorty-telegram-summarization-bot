import type TelegramBot from 'node-telegram-bot-api';
import { getFormattedMessage } from '../../../data/dbChatMessageUtils';
import type DbChatMessage from '../../../data/types/DbChatMessage';
import { required } from '../../../lib/lang';
import { type TestContext } from './createContext';
import { t } from '../../../config/translations/index';
import { now } from 'lodash';
import { myTgGroupId } from './tgUtils';
import { decryptIfExists } from '../../../data/encryption';
import { type TelegramBotSendMessageOptions } from '../../../services/TelegramBotService';

export function expectBotCreatedUsers(db: TestContext['db'], users: TelegramBot.User[]): void {
  for (const user of users) {
    const userFound = db.users.some(
      (dbUser) =>
        dbUser.id === BigInt(user.id) &&
        decryptIfExists(dbUser.username) === user.username &&
        decryptIfExists(dbUser.firstName) === user.first_name &&
        decryptIfExists(dbUser.lastName) === user.last_name
    );

    expect(userFound).toBe(true);
  }
}

export function expectBotCreatedDbChatMessages(
  db: TestContext['db'],
  messages: TelegramBot.Message[]
): void {
  for (const message of messages) {
    const messageFound = db.messages.some(
      (dbMessage) =>
        decryptIfExists(dbMessage.text) === message.text &&
        dbMessage.userId === BigInt(required(message.from?.id))
    );

    expect(messageFound).toBe(true);
  }
}

export function expectBotQueriedSummaryFromGpt(
  gpt: TestContext['gpt'],
  summaryPartPointsCount: number,
  messagesBunches: DbChatMessage[][]
): void {
  for (const [index, messages] of messagesBunches.entries()) {
    const call = gpt.sendMessage.mock.calls[index];

    expect(call).toBeTruthy();

    expect(required(call)[0]).toBe(
      t(summaryPartPointsCount === 1 ? 'summarize.gptQuery' : 'summarize.gptQueryWithPoints', {
        pointsCount: summaryPartPointsCount,
        text: messages.map((message) => getFormattedMessage(message)).join('\n'),
      })
    );

    expect(required(call)[1]).toEqual(
      expect.objectContaining({
        completionParams: { max_tokens: 2048 },
      })
    );
  }

  expect(gpt.sendMessage).toHaveBeenCalledTimes(messagesBunches.length);
}

export function expectBotSentExactMessagesToTg(
  telegramBot: TestContext['telegramBot'],
  messages: (
    | string
    | jest.AsymmetricMatcher
    | {
        message: string | jest.AsymmetricMatcher;
        userId?: number;
        parseMode?: TelegramBotSendMessageOptions['parse_mode'];
      }
  )[],
  userId: number = myTgGroupId
): void {
  for (const [index, messageObj] of messages.entries()) {
    const {
      message,
      parseMode = undefined,
      userId: messageReceiver = userId,
    } = typeof messageObj === 'object' && 'message' in messageObj
      ? messageObj
      : { message: messageObj };

    expect(telegramBot.sendMessage).toHaveBeenNthCalledWith(
      index + 1,
      messageReceiver,
      message,
      parseMode && { parse_mode: parseMode }
    );
  }
  expect(telegramBot.sendMessage).toHaveBeenCalledTimes(messages.length);
}

export function expectBotAddedSummariesToDb(
  db: TestContext['db'],
  chatId: number,
  gptTestSummariesCount: number
): void {
  expect(db.createSummary).toHaveBeenCalledTimes(gptTestSummariesCount);
  for (const [{ date, chatId }] of db.createSummary.mock.calls) {
    expect(chatId).toBe(chatId);
    expect(date.getTime()).toBeCloseTo(now(), -4); // 10 seconds
  }
}
