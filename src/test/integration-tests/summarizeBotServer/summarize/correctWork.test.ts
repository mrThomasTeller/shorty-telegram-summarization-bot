import {
  getStartSummarizeMessage,
  getEndSummarizeMessage,
  getSummaryHeader,
} from '../../../../commands/summarize';
import {
  myTgUser,
  myTgGroupId,
  otherTgUser,
  createSummarizeCommandMessage,
  createTgMessages,
} from '../../lib/tgUtils';
import _ from 'lodash';
import { mapTgMessagesToDbMessages } from '../../lib/dbUtils';
import {
  expectBotHasRetrievedMessagesFromDb,
  expectTgBotServiceHasSentMessages,
  expectBotHasCreatedUsers,
  expectBotHasCreatedDbChatMessages,
  expectBotHasQueriedSummaryFromGpt,
} from '../../lib/expectations';
import { gptTestSummary, createGptChatMessage } from '../../lib/gptUtils';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext';

describe('summarizeBotServer summarize command', () => {
  it('without messages', async () => {
    const { telegramBotService, dbService, gptService, simulateChatMessage } =
      await createSummarizeBotServerContext();

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
        await createSummarizeBotServerContext();

      const tgMessages = createTgMessages(messagesCount);
      const dbMessages = mapTgMessagesToDbMessages(tgMessages);
      const dbMessagesChunksForGpt = _.chunk(dbMessages, messagesCountInOneSummaryQuery);

      const gptTestSummaries = _.range(dbMessagesChunksForGpt.length).map(() =>
        gptTestSummary(0, summaryPartPointsCount)
      );
      const gptTestSummariesWithReEnumeratedPoints = gptTestSummaries.map((_, page) =>
        gptTestSummary(page, summaryPartPointsCount)
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
      expectBotHasQueriedSummaryFromGpt(gptService, summaryPartPointsCount, dbMessagesChunksForGpt);
      expectTgBotServiceHasSentMessages(telegramBotService, myTgGroupId, [
        getStartSummarizeMessage(),
        getSummaryHeader(),
        ...gptTestSummariesWithReEnumeratedPoints,
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
});
