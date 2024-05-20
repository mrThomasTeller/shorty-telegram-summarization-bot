DELETE FROM
  "Tariff"
WHERE
  "id" = 'x2';

INSERT INTO
  "Tariff" (
    "id",
    "summaries",
    "messagesMultiplier"
  )
VALUES
  ('+20s,x3', 20, 3),
  ('+50s', 50, 1);