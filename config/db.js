const Pool = require(`pg`).Pool;
// or --  const { Pool } = require('pg')

const pool = new Pool({
    host: `localhost`,
    database: `teamworks`,
    user: `postgres`,
    password: `d0r0thee`,
    port: `5433` //  postgresql.conf (locate)
});

module.exports = {
    query: (text, params, callback) => {
        return pool.query(text, params, callback);
    }
};
