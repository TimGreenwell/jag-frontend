SELECT
    b.binding_id AS "id",
    b.binding_to AS "to",
    b.binding_from AS "from"
--     b.binding_activity_fk AS "fk"
FROM binding b
WHERE b.binding_activity_fk = $1