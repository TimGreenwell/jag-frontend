CREATE TABLE IF NOT EXISTS "performer"
(
    "performer_id" VARCHAR(255) NOT NULL,
    "performer_name" VARCHAR(255) NOT NULL,
    "performer_team_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_performer" PRIMARY KEY ("performer_id"),
    CONSTRAINT "FK_team_id" FOREIGN KEY ("performer_team_fk")
    REFERENCES team ("team_id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);