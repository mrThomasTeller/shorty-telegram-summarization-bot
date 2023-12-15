import { getEnv, setEnv } from '../../../../config/envVars.js';
import { t } from '../../../../config/translations/index.js';
import { decrypt } from '../../../../data/encryption.js';
import { required } from '../../../../lib/common.js';
import { createGptChatMessage } from '../../lib/gptUtils.js';
import { createSummarizeCommandMessage, createTgMessageInGroup, myTgUser, } from '../../lib/tgUtils.js';
import createSummarizeBotServerContext from '../createSummarizeBotServerContext.js';
describe('summarizeBotServer summarize command encryption', () => {
    const minMessagesCountToSummarize = getEnv().MIN_MESSAGES_COUNT_TO_SUMMARIZE;
    beforeEach(() => {
        setEnv({ MIN_MESSAGES_COUNT_TO_SUMMARIZE: 1 });
    });
    afterEach(() => {
        setEnv({ MIN_MESSAGES_COUNT_TO_SUMMARIZE: minMessagesCountToSummarize });
    });
    it('bot encrypts message text and username before saving to db', async () => {
        const { db, gpt, simulateChatMessage } = await createSummarizeBotServerContext();
        const messageText = 'text tg message text';
        const tgMessage = createTgMessageInGroup({
            text: messageText,
            user: myTgUser,
        });
        // mocks
        gpt.sendMessage.mockImplementation(async (message) => {
            expect(message).toBe(t('summarize.gptQuery', { text: messageText }));
            return createGptChatMessage(`summary: ${message}`);
        });
        // story
        await simulateChatMessage(tgMessage);
        await simulateChatMessage(createSummarizeCommandMessage(myTgUser));
        // expectations
        const createdUser = required(db.users[0]);
        expect(decrypt(required(createdUser.firstName))).toBe(myTgUser.first_name);
        expect(decrypt(required(createdUser.lastName))).toBe(myTgUser.last_name);
        expect(decrypt(required(createdUser.username))).toBe(myTgUser.username);
        const createdMessage = required(db.messages[0]);
        expect(decrypt(required(createdMessage.text))).toBe(messageText);
        expect(gpt.sendMessage).toHaveBeenCalled();
    });
});
