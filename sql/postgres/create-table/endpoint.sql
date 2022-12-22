CREATE TABLE IF NOT EXISTS "endpoint"
(
    "endpoint_pk" VARCHAR(255) NOT NULL,
    "endpoint_direction" VARCHAR(255) NOT NULL,
    "endpoint_exchange_name" VARCHAR(255) NOT NULL,
    "endpoint_urn" VARCHAR(255) NOT NULL,
    "endpoint_exchange_type" VARCHAR(255) NOT NULL,
    "produce_activity_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "endpoint_pkey" PRIMARY KEY ("endpoint_pk"),
    CONSTRAINT "fknm7w6vy45ns8uxgqnpf2u85s5" FOREIGN KEY ("produce_activity_fk")
    REFERENCES activity ("activity_urn") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);