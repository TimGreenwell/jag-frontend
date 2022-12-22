CREATE TABLE IF NOT EXISTS "performer"
(
    "performer_pk" VARCHAR(255) NOT NULL,
    "performer_name" VARCHAR(255) NOT NULL,
    "performer_team_fk" VARCHAR(255) NOT NULL,
    CONSTRAINT "performer_pkey" PRIMARY KEY ("performer_pk"),
    CONSTRAINT "fk3yklmjbfrpn4vq2hr0me0hoo" FOREIGN KEY ("performer_team_fk")
    REFERENCES team ("team_pk") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);