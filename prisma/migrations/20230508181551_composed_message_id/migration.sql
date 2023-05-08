-- Добавляем новую колонку messageId в таблицу Message
ALTER TABLE
  "Message"
ADD
  COLUMN "messageId" BIGINT;

-- Обновляем значения messageId, используя значения id
UPDATE
  "Message"
SET
  "messageId" = "id";

-- Удаляем старую колонку id
ALTER TABLE
  "Message" DROP COLUMN "id";

-- Добавляем первичный ключ для messageId и chatId
ALTER TABLE
  "Message"
ADD
  PRIMARY KEY ("messageId", "chatId");