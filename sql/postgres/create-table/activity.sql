CREATE TABLE IF NOT EXISTS "activity"
(
    "activity_urn" VARCHAR(255) NOT NULL,
    "activity_author" VARCHAR(255),
    "activity_collapsed" boolean,
    "connector_exec" VARCHAR(255) NOT NULL,
    "connector_oper" VARCHAR(255) NOT NULL,
    "connector_rtns" VARCHAR(255),
    "activity_created_date" timestamp without time zone,
    "activity_description" VARCHAR(255),
    "activity_expected_duration" VARCHAR(255),
    "activity_is_locked" boolean,
    "activity_locked_by" VARCHAR(255),
    "activity_modified_date" timestamp without time zone,
    "activity_name" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_activity" PRIMARY KEY ("activity_urn")
);