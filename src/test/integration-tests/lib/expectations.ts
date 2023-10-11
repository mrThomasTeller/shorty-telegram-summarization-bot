import type TelegramBot from 'node-telegram-bot-api';
import { getFormattedMessage } from '../../../data/dbChatMessageUtils.ts';
import type DbChatMessage from '../../../data/DbChatMessage.ts';
import { required } from '../../../lib/common.ts';
import { type TestContext } from './createContext.ts';
import { t } from '../../../config/translations/index.ts';
import { now } from 'lodash';
import { myTgGroupId } from './tgUtils.ts';

export function expectBotHasCreatedUsers(db: TestContext['db'], users: TelegramBot.User[]): void {
  for (const user of users) {
    expect(db.getOrCreateUser).toHaveBeenCalledWith(
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
  db: TestContext['db'],
  messages: TelegramBot.Message[]
): void {
  for (const message of messages) {
    expect(db.createChatMessageIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        text: message.text,
        userId: BigInt(required(message.from?.id)),
      })
    );
  }
}

export function expectBotHasQueriedSummaryFromGpt(
  gpt: TestContext['gpt'],
  summaryPartPointsCount: number,
  messagesBunches: DbChatMessage[][]
): void {
  for (const [index, messages] of messagesBunches.entries()) {
    expect(gpt.sendMessage).toHaveBeenNthCalledWith(
      index + 1,
      t(summaryPartPointsCount === 1 ? 'summarize.gptQuery' : 'summarize.gptQueryWithPoints', {
        pointsCount: summaryPartPointsCount,
        text: messages.map((message) => getFormattedMessage(message)).join('\n'),
      }),
      expect.objectContaining({
        completionParams: { max_tokens: 2048 },
      })
    );
  }
}

export function expectBotSentMessagesToTg(
  telegramBot: TestContext['telegramBot'],
  messages: (string | [message: string, userId: number])[],
  userId: number = myTgGroupId
): void {
  for (const [index, message] of messages.entries()) {
    const [messageText, messageUserId] = Array.isArray(message) ? message : [message, userId];
    expect(telegramBot.sendMessage).toHaveBeenNthCalledWith(index + 1, messageUserId, messageText);
  }
  expect(telegramBot.sendMessage).toHaveBeenCalledTimes(messages.length);
}

export function expectBotHasAddedSummariesToDb(
  db: TestContext['db'],
  chatId: number,
  gptTestSummariesCount: number
): void {
  expect(db.createSummary).toHaveBeenCalledTimes(gptTestSummariesCount);
  for (const call of db.createSummary.mock.calls) {
    expect(call[0]).toBe(chatId);
    expect(call[1].getTime()).toBeCloseTo(now(), -4); // 10 seconds
  }
}
