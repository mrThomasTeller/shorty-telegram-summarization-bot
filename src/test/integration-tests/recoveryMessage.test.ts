import recoveryMessage, {
  getRecoveryMessage,
  getRecoveryMessagesSentInfoMessage,
} from '../../entryPoints/recoveryMessage';
import { consoleMock } from '../env.ts';
import createContext from './lib/createContext.ts';
import { type Chat } from '@prisma/client';

describe('recoveryMessage', () => {
  it('respond to messages from non-white chats with maintenance message', async () => {
    const context = createContext();
    const { dbService, telegramBotService } = context;

    const chats: Chat[] = [{ id: 1n }, { id: 2n }, { id: -1003n }];
    dbService.getAllChats.mockResolvedValue(chats);

    await recoveryMessage(context);

    for (const { id } of chats) {
      expect(telegramBotService.sendMessage).toHaveBeenCalledWith(
        Number(id),
        expect.stringContaining(getRecoveryMessage())
      );
    }

    expect(consoleMock.info).toHaveBeenCalledWith(getRecoveryMessagesSentInfoMessage(chats.length));
  });
});
