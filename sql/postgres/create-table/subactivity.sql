CREATE TABLE IF NOT EXISTS "subactivity"
(
    "subactivity_pk" VARCHAR(255) NOT NULL,
    "subactivity_urn" VARCHAR(255) NOT NULL,
    "subactivity_parent_fk" VARCHAR(255),
    CONSTRAINT "subactivity_pkey" PRIMARY KEY ("subactivity_pk"),
    CONSTRAINT "fko8dlh2kjimer9b2ra06l32o37" FOREIGN KEY ("subactivity_parent_fk")
    REFERENCES activity ("activity_urn") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);