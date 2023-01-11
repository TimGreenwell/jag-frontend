CREATE TABLE IF NOT EXISTS "binding"
(
    "binding_id" VARCHAR(255) NOT NULL,
    "binding_from" VARCHAR(255) NOT NULL,
    "binding_to" VARCHAR(255) NOT NULL,
    "binding_activity_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_binding" PRIMARY KEY ("binding_id"),
    CONSTRAINT "FK_binding_from" FOREIGN KEY ("binding_from")
        REFERENCES endpoint ("endpoint_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "FK_binding_to" FOREIGN KEY ("binding_to")
        REFERENCES endpoint ("endpoint_id") MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT "FK_activity_id" FOREIGN KEY ("binding_activity_fk")
    REFERENCES activity ("activity_urn") MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
);