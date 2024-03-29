import {
  myTgUser,
  myTgGroupId,
  createSummarizeCommandMessage,
  createTgMessages,
  myTgGroup2Id,
} from '../../lib/tgUtils.ts';
import { mapTgMessagesToDbMessages } from '../../lib/dbUtils.ts';
import { expectBotSentExactMessagesToTg } from '../../lib/expectations.ts';
import { gptTestSummary, createGptChatMessage } from '../../lib/gptUtils.ts';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext.ts';
import { t } from '../../../../config/translations/index.ts';
import { setTimeout } from 'node:timers/promises';
import _ from 'lodash';

describe('summarizeBotServer summarize command special cases', () => {
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
    expectBotSentExactMessagesToTg(
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

  // TODO: fix this test
  it('will not change order of summaries if second summary came earlier than first', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    // 40 messages turns into 2 summary parts with 4 points each
    const pointsCount = 4;
    const tgMessages = createTgMessages(40);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    db.messages = dbMessages.all;
    // delay first response from gpt
    gpt.sendMessage.mockReturnValueOnce(
      setTimeout(20, createGptChatMessage(gptTestSummary(0, pointsCount, 0)))
    );
    gpt.sendMessage.mockResolvedValueOnce(createGptChatMessage(gptTestSummary(1, pointsCount, 0)));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
    await setTimeout(30);

    // expectations
    expectBotSentExactMessagesToTg(
      telegramBot,
      [
        t('summarize.message.start'),
        t('summarize.message.header'),
        gptTestSummary(0, pointsCount),
        gptTestSummary(1, pointsCount),
        t('summarize.message.end'),
      ],
      myTgGroupId
    );
  });

  it('removes full stop at the and of every summary part generated by gpt', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const dbMessages = mapTgMessagesToDbMessages(createTgMessages(3));

    // mocks
    db.messages = dbMessages.all;
    gpt.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5) + '.'));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expect(telegramBot.sendMessage).toHaveBeenCalledWith(myTgGroupId, gptTestSummary(0, 5));
  });

  it("shouldn't generate more than 5 summary parts", async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    // 120 messages turns into 6 summary parts with 2 points each
    const tgMessages = createTgMessages(140);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);
    // 5 summary parts is maximum (from 1 to 5 page, 0 page is rejected)
    const allowedPagesRange = _.range(1, 6);

    // mocks
    db.messages = dbMessages.all;
    for (const page of allowedPagesRange) {
      gpt.sendMessage.mockResolvedValueOnce(createGptChatMessage(gptTestSummary(page, 2, 0)));
    }

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectBotSentExactMessagesToTg(
      telegramBot,
      [
        t('summarize.message.start'),
        t('summarize.message.tooManyMessages'),
        t('summarize.message.header'),
        ...allowedPagesRange.map((page, index) => gptTestSummary(page, 2, index)),
        t('summarize.message.end'),
      ],
      myTgGroupId
    );
  });
});
