import {
  myTgUser,
  myTgGroupId,
  createSummarizeCommandMessage,
  createTgMessages,
} from '../../lib/tgUtils.ts';
import { ChatGPTError } from 'chatgpt';
import { mapTgMessagesToDbMessages } from '../../lib/dbUtils.ts';
import { expectTgBotServiceHasSentMessages } from '../../lib/expectations.ts';
import { gptTestSummary, createGptChatMessage } from '../../lib/gptUtils.ts';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext.ts';
import { setTimeout } from 'node:timers/promises';
import { t } from '../../../../config/translations/index.ts';

describe('summarizeBotServer summarize command errors', () => {
  it('with unexpected error from gpt', async (): Promise<void> => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    db.getChatMessages.mockResolvedValue(dbMessages);
    gpt.sendMessage.mockRejectedValue(createGptSummaryError());

    // story
    for (const tgMessage of tgMessages) {
      await simulateChatMessage(tgMessage);
    }
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectTgBotServiceHasSentMessages(telegramBot, myTgGroupId, [
      t('summarize.message.start'),
      t('summarize.errors.queryProcess'),
    ]);
  });

  it('with Too Many Requests error from gpt', async (): Promise<void> => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    db.getChatMessages.mockResolvedValue(dbMessages);

    const error = createGptSummaryError();
    error.statusCode = 429;
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5)));

    // story
    for (const tgMessage of tgMessages) {
      await simulateChatMessage(tgMessage);
    }
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
    await setTimeout(100);

    // expectations
    expectTgBotServiceHasSentMessages(telegramBot, myTgGroupId, [
      t('summarize.message.start'),
      t('summarize.errors.tooManyRequestsToGpt'),
      t('summarize.errors.tooManyRequestsToGpt'),
      t('summarize.message.header'),
      gptTestSummary(0, 5),
      t('summarize.message.end'),
    ]);
  });

  it('with 5 Too Many Requests error from gpt', async (): Promise<void> => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    db.getChatMessages.mockResolvedValue(dbMessages);

    const error = createGptSummaryError();
    error.statusCode = 429;
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5)));

    // story
    for (const tgMessage of tgMessages) {
      await simulateChatMessage(tgMessage);
    }
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
    await setTimeout(100);

    // expectations
    expectTgBotServiceHasSentMessages(telegramBot, myTgGroupId, [
      t('summarize.message.start'),
      t('summarize.errors.tooManyRequestsToGpt'),
      t('summarize.errors.tooManyRequestsToGpt'),
      t('summarize.errors.tooManyRequestsToGpt'),
      t('summarize.errors.tooManyRequestsToGpt'),
      t('summarize.errors.maxQueriesToGptExceeded'),
    ]);
  });
});

const createGptSummaryError = (): ChatGPTError => new ChatGPTError('gpt summary error');
