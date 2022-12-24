CREATE TABLE IF NOT EXISTS "subscription"
(
    "subscription_id" VARCHAR(255) NOT NULL,
    "subscription_data" VARCHAR(255),
    "subscription_lrt" timestamp without time zone,
    "subscription_node_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_subscription" PRIMARY KEY ("subscription_id"),
    CONSTRAINT "FK_node_id" FOREIGN KEY ("subscription_node_fk")
    REFERENCES node ("node_id") MATCH SIMPLE
                                 ON UPDATE NO ACTION
                                 ON DELETE NO ACTION
);