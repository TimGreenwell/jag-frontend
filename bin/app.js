/**
 * @file Joint activity graph web tools' development web server.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.25
 *
 * Delete after dev -- morgan(HTTP logger)
 */

require('dotenv').config({path: `./.env`});
// console.log(process.env);
const express = require(`express`);
const https = require(`https`);
const path = require(`path`);
const {PREFERRED_SOURCE} = require(`../config/environment`);

// const PREFERRED_SOURCE = process.env.PREFERRED_SOURCE || "postgresdb";
console.log(`Preferred source set as :> ${PREFERRED_SOURCE}`);

const postgresRoutes = require(`../api/routes/postgresRoutes`);

const morgan = require(`morgan`);         // added

const port = process.env.PORT || 8888;
const app = express();
const root = process.argv[2] || `.`;

app.use(express.static(path.join(process.cwd(), root)));   // original
app.use(`/api/v1`, postgresRoutes);
app.use(express.json());             // added
app.use(morgan(`dev`));    // added
const server = app.listen(port);
server.on(`listening`, () => {
    return console.log(`API server started on ${port}`);
});



process.on(`SIGTERM`, () => {
    console.error(`\nTerminating server.`);
    server.close();
});

process.on(`SIGINT`, () => {
    console.error(`\nInterrupting server.`);
    server.close();
});

/**
 * To run -
 * npm start - official
 * npm run dev - to use nodemon (auto server restarts)
 *
 *
 * Middleware we can delete after dev --
 * morgan - logging HTTP requests on the terminal
 *
 * Dotenv useful as dev for setting environment variables... used by node's process and docker-compose
 */
