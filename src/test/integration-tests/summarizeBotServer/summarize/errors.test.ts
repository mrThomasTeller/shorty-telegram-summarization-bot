import {
  myTgUser,
  myTgGroupId,
  createSummarizeCommandMessage,
  createTgMessages,
} from '../../lib/tgUtils';
import { ChatGPTError } from 'chatgpt';
import { createSummaries, mapTgMessagesToDbMessages } from '../../lib/dbUtils';
import { expectBotSentExactMessagesToTg } from '../../lib/expectations';
import { gptTestSummary, createGptChatMessage } from '../../lib/gptUtils';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext';
import { setTimeout } from 'node:timers/promises';
import { t } from '../../../../config/translations/index';
import { getEnv } from '../../../../config/envVars';

describe('summarizeBotServer summarize command errors', () => {
  it('no messages to summarize', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    // mocks
    db.messages = [];

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expect(gpt.sendMessage).not.toHaveBeenCalled();
    expectBotSentExactMessagesToTg(telegramBot, [t('summarize.errors.noMessages')]);
  });

  it('few messages to summarize', async () => {
    const { telegramBot, db, simulateChatMessage } = await createSummarizeBotServerContext();

    const tgMessages = createTgMessages(getEnv().MIN_MESSAGES_COUNT_TO_SUMMARIZE - 1);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    db.messages = dbMessages.all;

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectBotSentExactMessagesToTg(
      telegramBot,
      [t('summarize.errors.fewMessages', { count: getEnv().MIN_MESSAGES_COUNT_TO_SUMMARIZE })],
      myTgGroupId
    );
  });

  it('with unexpected error from gpt', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const dbMessages = mapTgMessagesToDbMessages(createTgMessages(10));

    // mocks
    db.messages = dbMessages.all;
    gpt.sendMessage.mockRejectedValue(createGptSummaryError());

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectBotSentExactMessagesToTg(
      telegramBot,
      [t('summarize.message.start'), t('summarize.errors.queryProcess')],
      myTgGroupId
    );
  });

  it('with Too Many Requests error from gpt', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const dbMessages = mapTgMessagesToDbMessages(createTgMessages(10));

    // mocks
    db.messages = dbMessages.all;

    const error = createGptSummaryError();
    error.statusCode = 429;
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5)));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
    await setTimeout(100);

    // expectations
    expectBotSentExactMessagesToTg(
      telegramBot,
      [
        t('summarize.message.start'),
        t('summarize.errors.tooManyRequestsToGpt'),
        t('summarize.errors.tooManyRequestsToGpt'),
        t('summarize.message.header'),
        gptTestSummary(0, 5),
        // t('summarize.message.end.free'),
        { message: t('summarize.message.dontShowAds'), parseMode: 'HTML' },
      ],
      myTgGroupId
    );
  });

  it('with 5 Too Many Requests errors from gpt', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const dbMessages = mapTgMessagesToDbMessages(createTgMessages(10));

    // mocks
    db.messages = dbMessages.all;

    const error = createGptSummaryError();
    error.statusCode = 429;
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockRejectedValueOnce(error);
    gpt.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5)));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
    await setTimeout(100);

    // expectations
    expectBotSentExactMessagesToTg(
      telegramBot,
      [
        t('summarize.message.start'),
        t('summarize.errors.tooManyRequestsToGpt'),
        t('summarize.errors.tooManyRequestsToGpt'),
        t('summarize.errors.tooManyRequestsToGpt'),
        t('summarize.errors.tooManyRequestsToGpt'),
        t('summarize.errors.maxQueriesToGptExceeded'),
      ],
      myTgGroupId
    );
  });

  it('allowed count of summaries per day is ok', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const dbMessages = mapTgMessagesToDbMessages(createTgMessages(10));

    // mocks
    db.messages = dbMessages.all;
    db.summaries = createSummaries(myTgGroupId, getEnv().MAX_SUMMARIES_PER_WEEK - 1, 3);
    gpt.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5)));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    expectBotSentExactMessagesToTg(
      telegramBot,
      [
        t('summarize.message.start'),
        t('summarize.message.header'),
        gptTestSummary(0, 5),
        // t('summarize.message.end.free'),
        { message: t('summarize.message.dontShowAds'), parseMode: 'HTML' },
      ],
      myTgGroupId
    );
  });

  it('allowed count of summaries per day is exceeded', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const dbMessages = mapTgMessagesToDbMessages(createTgMessages(10));

    // mocks
    db.messages = dbMessages.all;
    db.summaries = createSummaries(myTgGroupId, getEnv().MAX_SUMMARIES_PER_WEEK, 3);
    gpt.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5)));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    // expectBotSentExactMessagesToTg(
    //   telegramBot,
    //   [
    //     {
    //       message: t('summarize.errors.maxSummariesExceeded.free', {
    //         count: getEnv().MAX_SUMMARIES_PER_WEEK,
    //       }),
    //       parseMode: 'HTML',
    //     },
    //   ],
    //   myTgGroupId
    // );
  });

  it('no messages for summary and allowed count of summaries per day is exceeded', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    // mocks
    db.summaries = createSummaries(myTgGroupId, getEnv().MAX_SUMMARIES_PER_WEEK);
    gpt.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5)));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));

    // expectations
    // expectBotSentExactMessagesToTg(
    //   telegramBot,
    //   [
    //     {
    //       message: t('summarize.errors.maxSummariesExceeded.free', {
    //         count: getEnv().MAX_SUMMARIES_PER_WEEK,
    //       }),
    //       parseMode: 'HTML',
    //     },
    //   ],
    //   myTgGroupId
    // );
  });

  it('if you try to create two summaries at the same time, the second one will be just omitted', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const dbMessages = mapTgMessagesToDbMessages(createTgMessages(10));

    // mocks
    db.messages = dbMessages.all;
    gpt.sendMessage.mockReturnValue(setTimeout(50, createGptChatMessage(gptTestSummary(0, 5))));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
    await setTimeout(10);
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
    await setTimeout(50);

    // expectations
    expectBotSentExactMessagesToTg(
      telegramBot,
      [
        t('summarize.message.start'),
        t('summarize.message.header'),
        gptTestSummary(0, 5),
        // t('summarize.message.end.free'),
        { message: t('summarize.message.dontShowAds'), parseMode: 'HTML' },
      ],
      myTgGroupId
    );
  });

  it('two summaries: one after another is ok (but too few messages for the second)', async () => {
    const { telegramBot, db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();

    const dbMessages = mapTgMessagesToDbMessages(createTgMessages(10));

    // mocks
    db.messages = dbMessages.all;
    gpt.sendMessage.mockReturnValue(setTimeout(10, createGptChatMessage(gptTestSummary(0, 5))));

    // story
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
    await setTimeout(20);
    await setTimeout(getEnv().TIME_TO_SHOW_ADS);
    await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
    await setTimeout(20);

    // expectations
    expectBotSentExactMessagesToTg(
      telegramBot,
      [
        t('summarize.message.start'),
        t('summarize.message.header'),
        gptTestSummary(0, 5),
        // t('summarize.message.end.free'),
        { message: t('summarize.message.dontShowAds'), parseMode: 'HTML' },
        t('summarize.errors.noMessages'),
      ],
      myTgGroupId
    );
  });
});

const createGptSummaryError = (): ChatGPTError => new ChatGPTError('gpt summary error');
