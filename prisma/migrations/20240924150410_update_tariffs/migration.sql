-- insert into
--   "Tariff" ("id", "messagesMultiplier", "name", "summaries")
-- values
--   ('+100s', 1, '+100 выжимок', 100),
--   ('+20s', 1, '+20 выжимок', 20),
--   (
--     '+20s,x2',
--     2,
--     '+20 выжимок и x2 сообщений для выжимки',
--     20
--   ),
--   (
--     '+20s,x3',
--     3,
--     'x3 сообщений для выжимки и +23 выжимок',
--     23
--   ),
--   ('+50s', 1, '+50 выжимок', 50)
UPDATE
  "Tariff"
SET
  "id" = '35s',
  "name" = '35 выжимок',
  "summaries" = 35
WHERE
  "id" = '+20s';

UPDATE
  "Tariff"
SET
  "id" = '35s_x2',
  "name" = '35 выжимок и x2 сообщений для выжимки',
  "summaries" = 35
WHERE
  "id" = '+20s,x2';

UPDATE
  "Tariff"
SET
  "id" = '35s_x3',
  "name" = '35 выжимок и x3 сообщений для выжимки',
  "summaries" = 35
WHERE
  "id" = '+20s,x3';

UPDATE
  "Tariff"
SET
  "id" = '70s',
  "name" = '70 выжимок',
  "summaries" = 70
WHERE
  "id" = '+50s';

UPDATE
  "Tariff"
SET
  "id" = '120s',
  "name" = '120 выжимок',
  "summaries" = 120
WHERE
  "id" = '+100s';

-- descriptions, prices
UPDATE
  "Tariff"
SET
  "description" = '35 выжимок в месяц: с лихвой хватит на каждый день!',
  "price" = 15000
WHERE
  "id" = '35s';

UPDATE
  "Tariff"
SET
  "description" = '',
  "price" = 25000
WHERE
  "id" = '70s';

UPDATE
  "Tariff"
SET
  "description" = 'Увеличивает в два раза лимит на количество сообщений для одной выжимки. Подходит для чатов с большим количеством сообщений.',
  "price" = 27000
WHERE
  "id" = '35s_x2';

UPDATE
  "Tariff"
SET
  "description" = 'В три раза увеличивает лимит на количество сообщений для одной выжимки! Если в вашем чате очень очень много сообщений! 😃',
  "price" = 40000
WHERE
  "id" = '35s_x3';

UPDATE
  "Tariff"
SET
  "description" = '',
  "price" = 47500
WHERE
  "id" = '120s';