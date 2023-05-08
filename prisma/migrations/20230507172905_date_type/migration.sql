-- Создаем новую временную колонку с типом timestamp
ALTER TABLE
  "Message"
ADD
  COLUMN date_temp TIMESTAMP;

-- Обновляем данные в новой колонке, конвертируя UNIX-время в timestamp
UPDATE
  "Message"
SET
  date_temp = TO_TIMESTAMP(DATE);

-- Удаляем старую колонку с типом int
ALTER TABLE
  "Message" DROP COLUMN DATE;

-- Переименовываем временную колонку в "date"
ALTER TABLE
  "Message" RENAME COLUMN date_temp TO DATE;