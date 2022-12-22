CREATE TABLE IF NOT EXISTS "analysis"
(
    "analysis_pk" VARCHAR(255) NOT NULL,
    "analysis_desc" VARCHAR(255) ,
    "analysis_is_locked" VARCHAR(255) NOT NULL,
    "analysis_name" VARCHAR(255) NOT NULL,
    "analysis_root_urn" VARCHAR(255) NOT NULL,
    "analysis_team" VARCHAR(255) NOT NULL,
    CONSTRAINT "analysis_pkey" PRIMARY KEY ("analysis_pk")
);