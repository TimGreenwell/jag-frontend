CREATE TABLE IF NOT EXISTS "endpoint"
(
    "endpoint_id" VARCHAR(255) NOT NULL,
    "endpoint_direction" VARCHAR(255) NOT NULL,
    "endpoint_exchange_name" VARCHAR(255) NOT NULL,
    "endpoint_urn" VARCHAR(255) NOT NULL,
    "endpoint_exchange_type" VARCHAR(255) NOT NULL,
    "endpoint_activity_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_endpoint" PRIMARY KEY ("endpoint_id"),
    CONSTRAINT "FK_activity_urn" FOREIGN KEY ("endpoint_activity_fk")
    REFERENCES activity ("activity_urn") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);