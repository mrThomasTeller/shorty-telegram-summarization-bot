import type TelegramBot from 'node-telegram-bot-api';
import {
  getStartSummarizeMessage,
  getEndSummarizeMessage,
  getSummaryHeader,
  getSummaryQueryMessage,
  getQueryProcessErrorMessage,
  getTooManyRequestsToGptErrorMessage,
  getMaxQueriesToGptExceeded,
} from '../../commands/summarize.js';
import { getEnv } from '../../config/env.js';
import { getFormattedMessage } from '../../lib/summarizeUtils.js';
import type DbChatMessage from '../../lib/types/DbChatMessage.js';
import { yesterdayBeforeYesterday, yesterday, required } from '../../lib/utils.js';
import createContext, { type TestContext } from '../lib/createContext.js';
import '../lib/env.js';
import {
  myTgUser,
  myTgGroupId,
  createGptChatMessage,
  otherTgUser,
  createTgMessageInGroup,
  createDbMessageInGroup,
} from '../lib/utils.js';
import _ from 'lodash';
import { ChatGPTError } from 'chatgpt';

describe('summarizeBotServer summarize command', () => {
  it('without messages', async () => {
    const { telegramBotService, dbService, gptService, simulateChatMessage } =
      await createContext();

    // mocks
    dbService.getChatMessages.mockResolvedValue([]);

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectBotHasRetrievedMessagesFromDb(dbService);
    expect(gptService.sendMessage).not.toHaveBeenCalled();
    expectTgBotServiceHasSentMessages(telegramBotService, myTgGroupId, [
      getStartSummarizeMessage(),
      getEndSummarizeMessage(),
    ]);
  });

  // fixme reenumarate
  const testCorrectSummary =
    ({
      messagesCount,
      summaryPartPointsCount,
      messagesCountInOneSummaryQuery = Number.MAX_SAFE_INTEGER,
    }: {
      messagesCount: number;
      summaryPartPointsCount: number;
      messagesCountInOneSummaryQuery?: number;
    }) =>
    async (): Promise<void> => {
      const { telegramBotService, dbService, gptService, simulateChatMessage } =
        await createContext();

      const tgMessages = createTgMessages(messagesCount);
      const dbMessages = mapTgMessagesToDbMessages(tgMessages);
      const dbMessagesBunchesForSummaryQuery = _.chunk(dbMessages, messagesCountInOneSummaryQuery);
      const gptTestSummaries = dbMessagesBunchesForSummaryQuery.map((_, index) =>
        gptTestSummary(index)
      );

      // mocks
      dbService.getChatMessages.mockResolvedValue(dbMessages);
      gptTestSummaries.forEach((summary) =>
        gptService.sendMessage.mockResolvedValueOnce(createGptChatMessage(summary))
      );

      // story
      for (const tgMessage of tgMessages) {
        await simulateChatMessage(tgMessage);
      }
      await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

      // expectations
      expectBotHasCreatedUsers(dbService, [myTgUser, otherTgUser]);
      expect(dbService.getOrCreateChat).toHaveBeenCalledWith(myTgGroupId);
      expectBotHasCreatedDbChatMessages(dbService, tgMessages);
      expectBotHasRetrievedMessagesFromDb(dbService);
      expectBotHasQueriedSummaryFromGpt(
        gptService,
        summaryPartPointsCount,
        dbMessagesBunchesForSummaryQuery
      );
      expectTgBotServiceHasSentMessages(telegramBotService, myTgGroupId, [
        getStartSummarizeMessage(),
        getSummaryHeader(),
        ...gptTestSummaries,
        getEndSummarizeMessage(),
      ]);
    };

  it(
    'with 10 messages (5 summary part points)',
    testCorrectSummary({
      messagesCount: 10,
      summaryPartPointsCount: 5,
    })
  );

  it(
    'with 50 messages (4 summary part points)',
    testCorrectSummary({
      messagesCount: 50,
      summaryPartPointsCount: 4,
      messagesCountInOneSummaryQuery: 25,
    })
  );

  it(
    'with 70 messages (3 summary part points)',
    testCorrectSummary({
      messagesCount: 70,
      summaryPartPointsCount: 3,
      messagesCountInOneSummaryQuery: 25,
    })
  );

  it(
    'with 100 messages (2 summary part points)',
    testCorrectSummary({
      messagesCount: 100,
      summaryPartPointsCount: 2,
      messagesCountInOneSummaryQuery: 25,
    })
  );

  it(
    'with 150 messages (2 summary part points)',
    testCorrectSummary({
      messagesCount: 150,
      summaryPartPointsCount: 2,
      messagesCountInOneSummaryQuery: 25,
    })
  );

  it('with unexpected error from gpt', async (): Promise<void> => {
    const { telegramBotService, dbService, gptService, simulateChatMessage } =
      await createContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    dbService.getChatMessages.mockResolvedValue(dbMessages);
    gptService.sendMessage.mockRejectedValue(new ChatGPTError('gpt summary error'));

    // story
    for (const tgMessage of tgMessages) {
      await simulateChatMessage(tgMessage);
    }
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectTgBotServiceHasSentMessages(telegramBotService, myTgGroupId, [
      getStartSummarizeMessage(),
      getQueryProcessErrorMessage(),
    ]);
  });

  it('with Too Many Requests error from gpt', async (): Promise<void> => {
    const { telegramBotService, dbService, gptService, simulateChatMessage } =
      await createContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    dbService.getChatMessages.mockResolvedValue(dbMessages);

    const error = new ChatGPTError('gpt summary error');
    error.statusCode = 429;
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary()));

    // story
    for (const tgMessage of tgMessages) {
      await simulateChatMessage(tgMessage);
    }
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectTgBotServiceHasSentMessages(telegramBotService, myTgGroupId, [
      getStartSummarizeMessage(),
      getTooManyRequestsToGptErrorMessage(),
      getTooManyRequestsToGptErrorMessage(),
      getSummaryHeader(),
      gptTestSummary(),
      getEndSummarizeMessage(),
    ]);
  });

  it('with 5 Too Many Requests error from gpt', async (): Promise<void> => {
    const { telegramBotService, dbService, gptService, simulateChatMessage } =
      await createContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    dbService.getChatMessages.mockResolvedValue(dbMessages);

    const error = new ChatGPTError('gpt summary error');
    error.statusCode = 429;
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary()));

    // story
    for (const tgMessage of tgMessages) {
      await simulateChatMessage(tgMessage);
    }
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectTgBotServiceHasSentMessages(telegramBotService, myTgGroupId, [
      getStartSummarizeMessage(),
      getTooManyRequestsToGptErrorMessage(),
      getTooManyRequestsToGptErrorMessage(),
      getTooManyRequestsToGptErrorMessage(),
      getTooManyRequestsToGptErrorMessage(),
      getMaxQueriesToGptExceeded(),
    ]);
  });
});

const gptTestSummary = (index = 0): string => `gpt test summary ${index}`;

const createSummarizeCommandMessage = (user: TelegramBot.User): TelegramBot.Message =>
  createTgMessageInGroup({ text: `/summarize@${getEnv().BOT_NAME}`, user });

const createTgMessages = (
  currentCount: number,
  outdatedCount: number = 10
): TelegramBot.Message[] =>
  _.range(-outdatedCount + 1, currentCount).map((num) =>
    createTgMessageInGroup({
      text: `Message: ${num}. Text: ${'a'.repeat(100)}}`,
      user: num % 2 === 0 ? myTgUser : otherTgUser,
      date: num < 1 ? yesterdayBeforeYesterday() : yesterday(),
    })
  );

const mapTgMessagesToDbMessages = (
  tgMessages: TelegramBot.Message[],
  from: Date = yesterday()
): DbChatMessage[] =>
  tgMessages
    .filter((tgMessage) => tgMessage.date >= from.getTime() / 1000)
    .map((tgMessage) =>
      createDbMessageInGroup({
        text: tgMessage.text ?? '',
        messageId: tgMessage.message_id,
        date: new Date(tgMessage.date * 1000),
        user: tgMessage.from,
      })
    );

function expectBotHasCreatedUsers(
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

function expectBotHasCreatedDbChatMessages(
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

function expectBotHasRetrievedMessagesFromDb(dbService: TestContext['dbService']): void {
  const [getChatMessagesChatId, getChatMessagesFromDate] = dbService.getChatMessages.mock.calls[0];
  expect(getChatMessagesChatId).toBe(myTgGroupId);
  expect(getChatMessagesFromDate?.getTime()).toBeCloseTo(yesterday().getTime(), -4);
}

function expectBotHasQueriedSummaryFromGpt(
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

function expectTgBotServiceHasSentMessages(
  telegramBotService: TestContext['telegramBotService'],
  userId: number,
  messages: string[]
): void {
  messages.forEach((message, index) => {
    expect(telegramBotService.sendMessage).toHaveBeenNthCalledWith(index + 1, userId, message);
  });
}
