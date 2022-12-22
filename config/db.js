const Pool = require(`pg`).Pool;
// or//   const { Pool } = require('pg')

const pool = new Pool({
    host: `localhost`,
    database: `team`, // `my_todos_db`
    user: `postgres`, // default postgres
    password: `d0r0thee`, // added during PostgreSQL and pgAdmin installation
    port: `5432` // default port
});

// const execute = async (query) => {
//     try {
//         await client.connect();     // gets connection
//         await client.query(query);  // sends queries
//         return true;
//     } catch (error) {
//         console.error(error.stack);
//         return false;
//     } finally {
//         await client.end();         // closes connection
//     }
// };


module.exports = {
    query: (text, params, callback) => {
        return pool.query(text, params, callback);
    }
};
