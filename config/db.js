const Pool = require(`pg`).Pool;
// or//   const { Pool } = require('pg')




const pool = new Pool({
    host: `localhost`,
    database: `teamworks`,
    user: `postgres`,
    password: `d0r0thee`,
    port: `5433` //  (pg15 using 5433)   (pg14 on 5432)
});

(async () => {
    const res = await pool.query(`SELECT $1::text as connected`, [`Connection to postgres successful!`]);
    console.log(`Checking connection to DB`)
    console.log(res.rows[0].connected);
})();

module.exports = {
    query: (text, params, callback) => {
        return pool.query(text, params, callback);
    }
};
