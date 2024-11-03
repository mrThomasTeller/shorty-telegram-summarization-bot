export const isGroupChat = (chatId: number | bigint): boolean => chatId < 0;

export const isPrivateChat = (chatId: number | bigint): boolean => chatId > 0;
