CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO
  "ActivationKey" (id, "tariffId")
SELECT
  uuid_generate_v4(),
  id
FROM
  "Tariff";