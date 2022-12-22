CREATE TABLE IF NOT EXISTS "team"
(
    "team_pk" VARCHAR(255) NOT NULL,
    "team_name" VARCHAR(255) NOT NULL,
    CONSTRAINT "team_pkey" PRIMARY KEY ("team_pk")
);