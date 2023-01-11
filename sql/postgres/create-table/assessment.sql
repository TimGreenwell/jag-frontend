CREATE TABLE IF NOT EXISTS "assessment"
(
    "assessment_id" VARCHAR(255) NOT NULL,
    "assessment_score" integer NOT NULL,
    "assessment_agent_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_assessment" PRIMARY KEY ("assessment_id"),
    CONSTRAINT "FK_assessment_agent" FOREIGN KEY ("assessment_agent_fk")
    REFERENCES agent ("agent_id") MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
);