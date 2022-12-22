CREATE TABLE IF NOT EXISTS "agent_assessment"
(
    "agent_pk" VARCHAR(255) NOT NULL,
    "assessment" integer,
    "activity" VARCHAR(255) NOT NULL,
    CONSTRAINT "agent_assessment_pkey" PRIMARY KEY ("agent_pk", "activity"),
    CONSTRAINT "fkqg68rtxwmx8hjc4n7ytbawrsm" FOREIGN KEY ("agent_pk")
    REFERENCES agent ("agent_pk") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
)