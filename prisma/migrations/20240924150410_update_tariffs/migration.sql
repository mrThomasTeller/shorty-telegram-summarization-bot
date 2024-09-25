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

update "Tariff"
set "id" = '+23s', "name" = '+23 выжимки', "summaries" = 23
where "id" = '+20s';

update "Tariff"
set "id" = '+23s,x2', "name" = '+23 выжимки и x2 сообщений для выжимки', "summaries" = 23
where "id" = '+20s,x2';

update "Tariff"
set "id" = '+23s,x3', "name" = '+23 выжимки и x3 сообщений для выжимки', "summaries" = 23
where "id" = '+20s,x3';

-- descriptions, prices

update "Tariff"
set "description" = '23 дополнительные выжимки в месяц. Вместе с бесплатными у вас будет больше 35 выжимок в месяц: с лихвой хватит на каждый день!', "price" = 15000
where "id" = '+23s';

update "Tariff"
set "description" = '', "price" = 25000
where "id" = '+50s';

update "Tariff"
set "description" = 'Увеличивает в два раза лимит на количество сообщений для одной выжимки. Подходит для чатов с большим количеством сообщений.', "price" = 27000
where "id" = '+23s,x2';

update "Tariff"
set "description" = 'В три раза увеличивает лимит на количество сообщений для одной выжимки! Если в вашем чате очень очень много сообщений! 😃', "price" = 40000
where "id" = '+23s,x3';

update "Tariff"
set "description" = '', "price" = 47500
where "id" = '+100s';
