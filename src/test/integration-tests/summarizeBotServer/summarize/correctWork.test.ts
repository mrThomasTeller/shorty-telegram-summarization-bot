import {
  myTgUser,
  myTgGroupId,
  otherTgUser,
  createSummarizeCommandMessage,
  createTgMessages,
  type TgMessagesBunchDesc,
  myTgGroup2Id,
} from '../../lib/tgUtils.ts';
import _ from 'lodash';
import { mapTgMessagesToDbMessages } from '../../lib/dbUtils.ts';
import {
  expectBotSentMessagesToTg,
  expectBotHasCreatedUsers,
  expectBotHasCreatedDbChatMessages,
  expectBotHasQueriedSummaryFromGpt,
  expectBotHasAddedSummariesToDb,
} from '../../lib/expectations.ts';
import { gptTestSummary, createGptChatMessage } from '../../lib/gptUtils.ts';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext.ts';
import { t } from '../../../../config/translations/index.ts';
import { daysAgo, hoursAgo } from '../../../../lib/date.ts';
import { setTimeout } from 'node:timers/promises';

// todo use text length instead of messages count
describe('summarizeBotServer summarize command', () => {
  it(
    'with 3 messages (1 summary part, 1 point)',
    testCorrectSummary({
      messages: 3,
      summaryPartPointsCount: 1,
    })
  );

  it(
    'with 6 messages (1 summary part, 2 point)',
    testCorrectSummary({
      messages: 6,
      summaryPartPointsCount: 2,
    })
  );

  it(
    'with 9 messages (1 summary part, 3 point)',
    testCorrectSummary({
      messages: 9,
      summaryPartPointsCount: 3,
    })
  );

  it(
    'with 12 messages (1 summary part, 4 points)',
    testCorrectSummary({
      messages: 12,
      summaryPartPointsCount: 4,
    })
  );

  it(
    'with 15 messages (1 summary part, 5 points)',
    testCorrectSummary({
      messages: 15,
      summaryPartPointsCount: 5,
    })
  );

  it(
    'with 40 messages (2 summary parts, 4 points)',
    testCorrectSummary({
      messages: 40,
      summaryPartPointsCount: 4,
    })
  );

  it(
    'with 70 messages (3 summary parts, 3 points)',
    testCorrectSummary({
      messages: 70,
      summaryPartPointsCount: 3,
    })
  );

  it(
    'with 90 messages (4 summary parts, 2 points)',
    testCorrectSummary({
      messages: 90,
      summaryPartPointsCount: 2,
    })
  );

  it(
    'with 140 messages (2 points)',
    testCorrectSummary({
      messages: 140,
      summaryPartPointsCount: 2,
    })
  );

  it(
    'with 15 actual and 15 outdated messages (should take only actual messages)',
    testCorrectSummary({
      messages: [
        { date: daysAgo(2), count: 15, shouldBeSkipped: true },
        { date: new Date(), count: 15 },
      ],
      summaryPartPointsCount: 5,
    })
  );

  it(
    "last summary was queried more than 24 hours ago, so it shouldn't be taken into summary",
    testCorrectSummary({
      messages: [
        { date: daysAgo(2), count: 15, shouldBeSkipped: true },
        { date: new Date(), count: 15 },
      ],
      lastSummaryDate: daysAgo(3),
      summaryPartPointsCount: 5,
    })
  );

  it(
    "don't take into new summary messages sent before last summary",
    testCorrectSummary({
      messages: [
        { date: hoursAgo(3), count: 10, shouldBeSkipped: true },
        { date: hoursAgo(1), count: 10 },
        { date: new Date(), count: 10 },
      ],
      lastSummaryDate: hoursAgo(2),
      summaryPartPointsCount: 5,
    })
  );

  it('two summaries from two different chats at the same time is ok', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const dbMessages = mapTgMessagesToDbMessages(createTgMessages(10, myTgGroupId));
    const dbMessages2 = mapTgMessagesToDbMessages(createTgMessages(10, myTgGroup2Id));

    // mocks
    db.messages = [...dbMessages.all, ...dbMessages2.all];
    gpt.sendMessage.mockReturnValue(setTimeout(50, createGptChatMessage(gptTestSummary(0, 5))));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser, myTgGroupId));
    await setTimeout(10);
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser, myTgGroup2Id));
    await setTimeout(50);

    // expectations
    expectBotSentMessagesToTg(
      telegramBot,
      [
        [t('summarize.message.start'), myTgGroupId],
        [t('summarize.message.start'), myTgGroup2Id],
        [t('summarize.message.header'), myTgGroupId],
        [t('summarize.message.header'), myTgGroup2Id],
        [gptTestSummary(0, 5), myTgGroupId],
        [gptTestSummary(0, 5), myTgGroup2Id],
        [t('summarize.message.end'), myTgGroupId],
        [t('summarize.message.end'), myTgGroup2Id],
      ],
      myTgGroupId
    );
  });
});

function testCorrectSummary({
  messages,
  lastSummaryDate,
  summaryPartPointsCount,
  messagesCountInOneSummaryQuery = 25,
}: {
  messages: number | TgMessagesBunchDesc[];
  lastSummaryDate?: Date;
  summaryPartPointsCount: number;
  messagesCountInOneSummaryQuery?: number;
}) {
  return async (): Promise<void> => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    if (typeof messages === 'number') {
      messages = [{ date: new Date(), count: messages }];
    }

    const tgMessages = createTgMessages(messages);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);
    const dbMessagesChunksForGpt = _.chunk(dbMessages.actual, messagesCountInOneSummaryQuery);
    const gptTestSummariesCount = dbMessagesChunksForGpt.length;

    const gptTestSummariesWithReEnumeratedPoints = _.range(gptTestSummariesCount).map((page) =>
      gptTestSummary(page, summaryPartPointsCount)
    );

    // mocks
    if (lastSummaryDate) {
      db.summaries = [
        {
          id: 1,
          date: lastSummaryDate,
          chatId: BigInt(myTgGroupId),
        },
      ];
    }
    db.messages = dbMessages.all;
    gpt.sendMessage.mockResolvedValue(
      createGptChatMessage(gptTestSummary(0, summaryPartPointsCount))
    );

    // story
    for (const tgMessage of tgMessages) {
      await simulateChatMessage(tgMessage);
    }
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectBotHasCreatedUsers(db, [myTgUser, otherTgUser]);
    expect(db.getOrCreateChat).toHaveBeenCalledWith(myTgGroupId);
    expectBotHasCreatedDbChatMessages(db, tgMessages);
    expectBotHasQueriedSummaryFromGpt(gpt, summaryPartPointsCount, dbMessagesChunksForGpt);
    expectBotHasAddedSummariesToDb(db, myTgGroupId, 1);
    expectBotSentMessagesToTg(
      telegramBot,
      [
        t('summarize.message.start'),
        t('summarize.message.header'),
        ...gptTestSummariesWithReEnumeratedPoints,
        t('summarize.message.end'),
      ],
      myTgGroupId
    );
  };
}
