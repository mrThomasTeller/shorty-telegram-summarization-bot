-- [{"id":"35s","summaries":35,"messagesMultiplier":1,"name":"35 выжимок","description":"35 выжимок в месяц: с лихвой хватит на каждый день!","price":15000,"discountedPrice":0},{"id":"70s","summaries":70,"messagesMultiplier":1,"name":"70 выжимок","description":"","price":25000,"discountedPrice":0},{"id":"35s_x2","summaries":35,"messagesMultiplier":2,"name":"35 выжимок и x2 сообщений для выжимки","description":"Увеличивает в два раза лимит на количество сообщений для одной выжимки. Подходит для чатов с большим количеством сообщений.","price":27000,"discountedPrice":0},{"id":"35s_x3","summaries":35,"messagesMultiplier":3,"name":"35 выжимок и x3 сообщений для выжимки","description":"В три раза увеличивает лимит на количество сообщений для одной выжимки! Если в вашем чате очень очень много сообщений! 😃","price":40000,"discountedPrice":0},{"id":"120s","summaries":120,"messagesMultiplier":1,"name":"120 выжимок","description":"","price":47500,"discountedPrice":0}]
UPDATE
  "Tariff"
SET
  "price" = 15000,
  "discountedPrice" = 12000
WHERE
  "id" = '35s';

UPDATE
  "Tariff"
SET
  "price" = 25000,
  "discountedPrice" = 20000
WHERE
  "id" = '70s';

UPDATE
  "Tariff"
SET
  "price" = 27000,
  "discountedPrice" = 22000
WHERE
  "id" = '35s_x2';

UPDATE
  "Tariff"
SET
  "price" = 40000,
  "discountedPrice" = 35000
WHERE
  "id" = '35s_x3';

UPDATE
  "Tariff"
SET
  "price" = 47500,
  "discountedPrice" = 40000
WHERE
  "id" = '120s';