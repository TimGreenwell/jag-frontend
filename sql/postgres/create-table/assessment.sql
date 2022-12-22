CREATE TABLE IF NOT EXISTS "assessment"
(
    "assessment_pk" VARCHAR(255) NOT NULL,
    "assessment_score" integer NOT NULL,
    "assessment_agent_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "assessment_pkey" PRIMARY KEY ("assessment_pk"),
    CONSTRAINT "fk2repoy0eqabm2xy6ry8wdydgk" FOREIGN KEY ("assessment_agent_fk")
    REFERENCES agent ("agent_pk") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);