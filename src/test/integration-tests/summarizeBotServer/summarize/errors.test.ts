import {
  getStartSummarizeMessage,
  getEndSummarizeMessage,
  getSummaryHeader,
  getQueryProcessErrorMessage,
  getTooManyRequestsToGptErrorMessage,
  getMaxQueriesToGptExceeded,
} from '../../../../commands/summarize';
import {
  myTgUser,
  myTgGroupId,
  createSummarizeCommandMessage,
  createTgMessages,
} from '../../lib/tgUtils';
import { ChatGPTError } from 'chatgpt';
import { mapTgMessagesToDbMessages } from '../../lib/dbUtils.ts';
import { expectTgBotServiceHasSentMessages } from '../../lib/expectations.ts';
import { gptTestSummary, createGptChatMessage } from '../../lib/gptUtils.ts';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext.ts';

describe('summarizeBotServer summarize command', () => {
  it('with unexpected error from gpt', async (): Promise<void> => {
    const { telegramBotService, dbService, gptService, simulateChatMessage } =
      await createSummarizeBotServerContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    dbService.getChatMessages.mockResolvedValue(dbMessages);
    gptService.sendMessage.mockRejectedValue(createGptSummaryError());

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
      await createSummarizeBotServerContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    dbService.getChatMessages.mockResolvedValue(dbMessages);

    const error = createGptSummaryError();
    error.statusCode = 429;
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5)));

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
      gptTestSummary(0, 5),
      getEndSummarizeMessage(),
    ]);
  });

  it('with 5 Too Many Requests error from gpt', async (): Promise<void> => {
    const { telegramBotService, dbService, gptService, simulateChatMessage } =
      await createSummarizeBotServerContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    dbService.getChatMessages.mockResolvedValue(dbMessages);

    const error = createGptSummaryError();
    error.statusCode = 429;
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockRejectedValueOnce(error);
    gptService.sendMessage.mockResolvedValue(createGptChatMessage(gptTestSummary(0, 5)));

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

const createGptSummaryError = (): ChatGPTError => new ChatGPTError('gpt summary error');
