CREATE TABLE IF NOT EXISTS "analysis"
(
    "analysis_id" VARCHAR(255) NOT NULL,
    "analysis_desc" VARCHAR(255) ,
    "analysis_is_locked" VARCHAR(255) NOT NULL,
    "analysis_name" VARCHAR(255) NOT NULL,
    "analysis_root_urn" VARCHAR(255) NOT NULL,
    "analysis_team" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_analysis" PRIMARY KEY ("analysis_id")
);