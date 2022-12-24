CREATE TABLE IF NOT EXISTS "node"
(
    "node_id" VARCHAR(255) NOT NULL,
    "node_child_id" VARCHAR(255),
    "node_con_desc" VARCHAR(255),
    "node_contextual_expected_duration" VARCHAR(255),
    "node_con_name" VARCHAR(255),
    "node_is_expanded" boolean,
    "node_is_locked" boolean,
    "node_parent_id" VARCHAR(255),
    "node_project_id" VARCHAR(255),
    "node_return_state" VARCHAR(255),
    "node_return_value" VARCHAR(255),
    "node_test_return_state" VARCHAR(255),
    "node_test_return_value" VARCHAR(255),
    "node_urn" VARCHAR(255),
    "node_x" integer,
    "node_y" integer,
    "node_child_parent_fk" VARCHAR(255),
    CONSTRAINT "PK_node" PRIMARY KEY ("node_id"),
    CONSTRAINT "FK_node_child_parent" FOREIGN KEY ("node_child_parent_fk")
    REFERENCES node ("node_id") MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
);