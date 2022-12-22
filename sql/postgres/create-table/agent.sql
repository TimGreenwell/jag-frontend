CREATE TABLE IF NOT EXISTS "agent"
(
    "agent_pk" VARCHAR(255) NOT NULL,
    "agent_date_created" timestamp without time zone,
    "agent_description" VARCHAR(255),
    "agent_is_locked" boolean,
    "agent_name" VARCHAR(255) NOT NULL,
    "agent_urn" VARCHAR(255) NOT NULL,
    "agent_team_fk" VARCHAR(255)  NOT NULL,
    CONSTRAINT "agent_pkey" PRIMARY KEY ("agent_pk"),
    CONSTRAINT "fkfy9mc9le8rq0uab5v5785wwb0" FOREIGN KEY ("agent_team_fk")
        REFERENCES team ("team_pk") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);