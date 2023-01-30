const Pool = require(`pg`).Pool;
// or --  const { Pool } = require('pg')

const pool = new Pool({
    host: `db`,
    database: `teamworks`,
    user: `teamworks`,
    password: `teamworks`,
    port: `5432` //  postgresql.conf (locate)
});

module.exports = {
    query: (text, params, callback) => {
        return pool.query(text, params, callback);
    }
};
