import type TelegramBot from 'node-telegram-bot-api';
import { getFormattedMessage } from '../../../data/dbChatMessageUtils.ts';
import type DbChatMessage from '../../../data/DbChatMessage.ts';
import { required } from '../../../lib/common.ts';
import { yesterday } from '../../../lib/date.ts';
import { type TestContext } from './createContext.ts';
import { myTgGroupId } from './tgUtils.ts';
import { t } from '../../../config/translations/index.ts';

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

export function expectBotHasRetrievedMessagesFromDb(db: TestContext['db']): void {
  const [getChatMessagesChatId, getChatMessagesFromDate] = required(
    db.getChatMessages.mock.calls[0]
  );
  expect(getChatMessagesChatId).toBe(myTgGroupId);
  expect(getChatMessagesFromDate?.getTime()).toBeCloseTo(yesterday().getTime(), -4);
}

export function expectBotHasQueriedSummaryFromGpt(
  gpt: TestContext['gpt'],
  summaryPartPointsCount: number,
  messagesBunches: DbChatMessage[][]
): void {
  for (const [index, messages] of messagesBunches.entries()) {
    expect(gpt.sendMessage).toHaveBeenNthCalledWith(
      index + 1,
      t('summarize.gptQuery', {
        pointsCount: summaryPartPointsCount,
        part: messages.map((message) => getFormattedMessage(message)).join('\n'),
      }),
      expect.objectContaining({
        completionParams: { max_tokens: 2048 },
      })
    );
  }
}

export function expectTgBotServiceHasSentMessages(
  telegramBot: TestContext['telegramBot'],
  userId: number,
  messages: string[]
): void {
  for (const [index, message] of messages.entries()) {
    expect(telegramBot.sendMessage).toHaveBeenNthCalledWith(index + 1, userId, message);
  }
}
