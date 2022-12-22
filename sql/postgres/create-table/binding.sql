CREATE TABLE IF NOT EXISTS "binding"
(
    "binding_id" bigint NOT NULL,
    "binding_activity_fk" VARCHAR(255) NOT NULL,
    "binding_from" VARCHAR(255) NOT NULL,
    "binding_to" VARCHAR(255) NOT NULL,
    CONSTRAINT "binding_pkey" PRIMARY KEY ("binding_id"),
    CONSTRAINT "fk9gub2cyc2mxv0prub768ygjb9" FOREIGN KEY ("binding_to")
    REFERENCES endpoint ("endpoint_pk") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION,
    CONSTRAINT "fkier2d7rqo2b8n052bxs6cj5vs" FOREIGN KEY ("binding_activity_fk")
    REFERENCES activity ("activity_urn") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION,
    CONSTRAINT "fkjbayshbxe1vgvkr4krl43iha6" FOREIGN KEY ("binding_from")
    REFERENCES endpoint ("endpoint_pk") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);