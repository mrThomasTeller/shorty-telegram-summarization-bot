import { t } from '../../config/translations/index.js';
import recoveryMessage from '../../entryPoints/recoveryMessage.js';
import { loggerMock } from '../env.js';
import createContext from './lib/createContext.js';
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

    expect(loggerMock.info).toHaveBeenCalledWith(
      t('recovery.debugInfo', { count: chats.length })
    );
  });
});
