import {
  getStartSummarizeMessage,
  getEndSummarizeMessage,
  getSummaryHeader,
  getQueryProcessErrorMessage,
  getTooManyRequestsToGptErrorMessage,
  getMaxQueriesToGptExceeded,
} from '../../../../commands/summarize.js';
import {
  myTgUser,
  myTgGroupId,
  createSummarizeCommandMessage,
  createTgMessages,
} from '../../lib/tgUtils.js';
import { ChatGPTError } from 'chatgpt';
import { mapTgMessagesToDbMessages } from '../../lib/dbUtils.js';
import { expectTgBotServiceHasSentMessages } from '../../lib/expectations.js';
import { gptTestSummary, createGptChatMessage } from '../../lib/gptUtils.js';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext.js';

describe('summarizeBotServer summarize command', () => {
  it('with unexpected error from gpt', async (): Promise<void> => {
    const { telegramBotService, dbService, gptService, simulateChatMessage } =
      await createSummarizeBotServerContext();

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
      await createSummarizeBotServerContext();

    const tgMessages = createTgMessages(10);
    const dbMessages = mapTgMessagesToDbMessages(tgMessages);

    // mocks
    dbService.getChatMessages.mockResolvedValue(dbMessages);

    const error = new ChatGPTError('gpt summary error');
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

    const error = new ChatGPTError('gpt summary error');
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
