CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO
  "ActivationKey" (id, "tariffId")
SELECT
  uuid_generate_v4(),
  t.id
FROM
  "Tariff" t
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      "ActivationKey" ak
    WHERE
      ak."tariffId" = t.id
  );