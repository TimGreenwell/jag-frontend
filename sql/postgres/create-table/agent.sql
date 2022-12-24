CREATE TABLE IF NOT EXISTS "agent"
(
    "agent_id" VARCHAR(255) NOT NULL,
    "agent_date_created" timestamp without time zone,
    "agent_description" VARCHAR(255),
    "agent_is_locked" boolean,
    "agent_name" VARCHAR(255) NOT NULL,
    "agent_urn" VARCHAR(255) NOT NULL,
    "agent_team_fk" VARCHAR(255)  NOT NULL,
    CONSTRAINT "PK_agent" PRIMARY KEY ("agent_id"),
    CONSTRAINT "FK_team_id" FOREIGN KEY ("agent_team_fk")
        REFERENCES team ("team_id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);