CREATE TABLE IF NOT EXISTS "agent_assessment"
(
    "agent_id" VARCHAR(255) NOT NULL,
    "assessment" integer,
    "activity" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_agent_assessment" PRIMARY KEY ("agent_id", "activity"),
    CONSTRAINT "FK_agent_id" FOREIGN KEY ("agent_id")
    REFERENCES agent ("agent_id") MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
)