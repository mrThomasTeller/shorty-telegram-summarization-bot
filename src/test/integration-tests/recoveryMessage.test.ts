import recoveryMessage, {
  getRecoveryMessage,
  getRecoveryMessagesSentInfoMessage,
} from '../../entryPoints/recoveryMessage';
import { consoleMock } from '../env';
import createContext from './lib/createContext';
import { type Chat } from '@prisma/client';

describe('recoveryMessage', () => {
  it('respond to messages from non-white chats with maintenance message', async () => {
    const context = createContext();
    const { dbService } = context;

    const chats: Chat[] = [{ id: 1n }, { id: 2n }, { id: -1003n }];
    dbService.getAllChats.mockResolvedValue(chats);

    await recoveryMessage(context);

    for (const { id } of chats) {
      expect(context.telegramBotService.sendMessage).toHaveBeenCalledWith(
        Number(id),
        expect.stringContaining(getRecoveryMessage())
      );
    }

    expect(consoleMock.info).toHaveBeenCalledWith(getRecoveryMessagesSentInfoMessage(chats.length));
  });
});
