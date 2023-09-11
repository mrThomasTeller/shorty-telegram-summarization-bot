import { t } from '../../config/translations/index.ts';
import recoveryMessage from '../../entryPoints/recoveryMessage.ts';
import { consoleMock } from '../env.ts';
import createContext from './lib/createContext.ts';
import { type Chat } from '@prisma/client';

describe('recoveryMessage', () => {
  it('respond to messages from non-white chats with maintenance message', async () => {
    const context = createContext();
    const { db, telegramBot } = context;

    const chats: Chat[] = [{ id: 1n }, { id: 2n }, { id: -1003n }];
    db.getAllChats.mockResolvedValue(chats);

    await recoveryMessage(context);

    for (const { id } of chats) {
      expect(telegramBot.sendMessage).toHaveBeenCalledWith(
        Number(id),
        expect.stringContaining(t('recovery.message'))
      );
    }

    expect(consoleMock.info).toHaveBeenCalledWith(t('recovery.debugInfo', { count: chats.length }));
  });
});
