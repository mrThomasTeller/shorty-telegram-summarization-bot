import {
  myTgUser,
  myTgGroupId,
  createSummarizeCommandMessage,
  createTgMessages,
  myTgGroup2Id,
} from '../../lib/tgUtils.ts';
import _ from 'lodash';
import { mapTgMessagesToDbMessages } from '../../lib/dbUtils.ts';
import { expectBotSentMessagesToTg } from '../../lib/expectations.ts';
import { gptTestSummary, createGptChatMessage } from '../../lib/gptUtils.ts';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext.ts';
import { t } from '../../../../config/translations/index.ts';
import { setTimeout } from 'node:timers/promises';

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
