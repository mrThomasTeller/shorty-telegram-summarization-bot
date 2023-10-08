import {
  myTgUser,
  myTgGroupId,
  otherTgUser,
  createSummarizeCommandMessage,
  createTgMessages,
} from '../../lib/tgUtils.ts';
import _ from 'lodash';
import { mapTgMessagesToDbMessages } from '../../lib/dbUtils.ts';
import {
  expectBotHasRetrievedMessagesFromDb,
  expectTgBotServiceHasSentMessages,
  expectBotHasCreatedUsers,
  expectBotHasCreatedDbChatMessages,
  expectBotHasQueriedSummaryFromGpt,
} from '../../lib/expectations.ts';
import { gptTestSummary, createGptChatMessage } from '../../lib/gptUtils.ts';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext.ts';
import { t } from '../../../../config/translations/index.ts';

describe('summarizeBotServer summarize command', () => {
  it('without messages', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    // mocks
    db.getChatMessages.mockResolvedValue([]);

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectBotHasRetrievedMessagesFromDb(db);
    expect(gpt.sendMessage).not.toHaveBeenCalled();
    expectTgBotServiceHasSentMessages(telegramBot, myTgGroupId, [
      t('summarize.message.start'),
      t('summarize.message.end'),
    ]);
  });

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

function testCorrectSummary({
  messagesCount,
  summaryPartPointsCount,
  messagesCountInOneSummaryQuery = Number.MAX_SAFE_INTEGER,
}: {
  messagesCount: number;
  summaryPartPointsCount: number;
  messagesCountInOneSummaryQuery?: number;
}) {
  return async (): Promise<void> => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

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
    db.getChatMessages.mockResolvedValue(dbMessages);

    for (const summary of gptTestSummaries) {
      gpt.sendMessage.mockResolvedValueOnce(createGptChatMessage(summary));
    }

    // story
    for (const tgMessage of tgMessages) {
      await simulateChatMessage(tgMessage);
    }
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectBotHasCreatedUsers(db, [myTgUser, otherTgUser]);
    expect(db.getOrCreateChat).toHaveBeenCalledWith(myTgGroupId);
    expectBotHasCreatedDbChatMessages(db, tgMessages);
    expectBotHasRetrievedMessagesFromDb(db);
    expectBotHasQueriedSummaryFromGpt(gpt, summaryPartPointsCount, dbMessagesChunksForGpt);
    expectTgBotServiceHasSentMessages(telegramBot, myTgGroupId, [
      t('summarize.message.start'),
      t('summarize.message.header'),
      ...gptTestSummariesWithReEnumeratedPoints,
      t('summarize.message.end'),
    ]);
  };
}
