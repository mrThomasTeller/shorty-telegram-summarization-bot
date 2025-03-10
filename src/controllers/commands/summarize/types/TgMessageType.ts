export type TgMessageType = {
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
  };
  from?: {
    id: number;
  };
};
