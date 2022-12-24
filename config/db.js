const Pool = require(`pg`).Pool;
// or//   const { Pool } = require('pg')

const pool = new Pool({
    host: `localhost`,
    database: `teamworks`,
    user: `postgres`,
    password: `d0r0thee`,
    port: `5433` //  (pg15 using 5433)   (pg14 on 5432)
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
