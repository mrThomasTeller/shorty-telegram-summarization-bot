import type TelegramBot from 'node-telegram-bot-api';
import { getSummaryQueryMessage } from '../../commands/summarize.js';
import { getFormattedMessage } from '../../lib/summarizeUtils.js';
import type DbChatMessage from '../../lib/types/DbChatMessage.js';
import { yesterday, required } from '../../lib/utils.js';
import { type TestContext } from '../lib/createContext.js';
import '../lib/env.js';
import { myTgGroupId } from '../lib/utils.js';

export function expectBotHasCreatedUsers(
  dbService: TestContext['dbService'],
  users: TelegramBot.User[]
): void {
  for (const user of users) {
    expect(dbService.getOrCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
      })
    );
  }
}

export function expectBotHasCreatedDbChatMessages(
  dbService: TestContext['dbService'],
  messages: TelegramBot.Message[]
): void {
  for (const message of messages) {
    expect(dbService.createChatMessageIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        text: message.text,
        userId: BigInt(required(message.from?.id)),
      })
    );
  }
}

export function expectBotHasRetrievedMessagesFromDb(dbService: TestContext['dbService']): void {
  const [getChatMessagesChatId, getChatMessagesFromDate] = dbService.getChatMessages.mock.calls[0];
  expect(getChatMessagesChatId).toBe(myTgGroupId);
  expect(getChatMessagesFromDate?.getTime()).toBeCloseTo(yesterday().getTime(), -4);
}

export function expectBotHasQueriedSummaryFromGpt(
  gptService: TestContext['gptService'],
  summaryPartPointsCount: number,
  messagesBunches: DbChatMessage[][]
): void {
  messagesBunches.forEach((messages, index) => {
    expect(gptService.sendMessage).toHaveBeenNthCalledWith(
      index + 1,
      getSummaryQueryMessage(
        summaryPartPointsCount,
        messages.map((message) => getFormattedMessage(message)).join('\n')
      ),
      expect.objectContaining({
        completionParams: { max_tokens: 2048 },
      })
    );
  });
}

export function expectTgBotServiceHasSentMessages(
  telegramBotService: TestContext['telegramBotService'],
  userId: number,
  messages: string[]
): void {
  messages.forEach((message, index) => {
    expect(telegramBotService.sendMessage).toHaveBeenNthCalledWith(index + 1, userId, message);
  });
}
