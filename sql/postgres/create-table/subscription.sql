CREATE TABLE IF NOT EXISTS "subscription"
(
    "subscription_pk" VARCHAR(255) NOT NULL,
    "subscription_data" VARCHAR(255),
    "subscription_lrt" timestamp without time zone,
    "subscription_node_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "subscription_pkey" PRIMARY KEY ("subscription_pk"),
    CONSTRAINT "fk965ychmbrvuldm06p8ygx6n4r" FOREIGN KEY ("subscription_node_fk")
    REFERENCES node ("node_pk") MATCH SIMPLE
                                 ON UPDATE NO ACTION
                                 ON DELETE NO ACTION
);