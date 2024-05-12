CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO
  "ActivationKey" ("id", "tariffId")
VALUES
  (uuid_generate_v4(), '+100s'),
  (uuid_generate_v4(), '+20s'),
  (uuid_generate_v4(), '+20s,x2'),
  (uuid_generate_v4(), 'x2');