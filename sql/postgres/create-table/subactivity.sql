CREATE TABLE IF NOT EXISTS "subactivity"
(
    "subactivity_id" VARCHAR(255) NOT NULL,
    "subactivity_urn" VARCHAR(255) NOT NULL,
    "subactivity_parent_fk" VARCHAR(255),
    CONSTRAINT "PK_subactivity" PRIMARY KEY ("subactivity_id"),
    CONSTRAINT "FK_subactivity_parent" FOREIGN KEY ("subactivity_parent_fk")
    REFERENCES activity ("activity_urn") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);