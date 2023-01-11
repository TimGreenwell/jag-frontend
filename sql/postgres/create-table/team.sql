CREATE TABLE IF NOT EXISTS "team"
(
    "team_id" VARCHAR(255) NOT NULL,
    "team_name" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_team" PRIMARY KEY ("team_id")
);