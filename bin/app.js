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

const express = require(`express`);
const https = require(`https`);
const path = require(`path`);
const { PREFERRED_SOURCE } = require('../config/environment');
console.log(`Your port is ${PREFERRED_SOURCE}`); // 8626

// const PREFERRED_SOURCE = process.env.PREFERRED_SOURCE || "postgresdb";
console.log(`Preferred source set as :> ${PREFERRED_SOURCE}`)
const postgresRoutes = require(`../api/routes/postgresRoutes`);

const morgan = require(`morgan`);         // added

const frontPort = process.env.PORT || 8888;
const backPort = 8083;
const root = process.argv[2] || `.`;
const frontApp = express();
const backApp = express();

frontApp.use(express.static(path.join(process.cwd(), root)));   // original
frontApp.use(express.json());             // added
frontApp.use(cors());                     // added
frontApp.use(morgan(`dev`));    // added
frontApp.use(cors({
    origin: '*'
}));
frontApp.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));
    next();
});
app.use(`/api/v1`, postgresRoutes);
app.use(express.static(path.join(process.cwd(), root)));   // original
app.use(express.json());             // added
app.use(morgan(`dev`));    // added

backApp.use(express.static(path.join(process.cwd(), root)));   // original
backApp.use(`/api/v1`, postgresRoutes);
backApp.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));
    next();
});

backApp.use(express.json());             // added
backApp.use(cors({
    origin: '*'
}));                     // added
backApp.use(morgan(`dev`));    // added

const frontServer = frontApp.listen(frontPort);
const backServer = backApp.listen(backPort);
frontServer.on(`listening`, () => {
    return console.log(`HTTP server started on ${frontPort}`);
});
backServer.on(`listening`, () => {
    return console.log(`API server started on ${backPort}`);
});
process.on(`SIGTERM`, () => {
    console.error(`\nTerminating server.`);
    frontServer.close();
    backServer.close();
});

process.on(`SIGINT`, () => {
    console.error(`\nInterrupting server.`);
    frontServer.close();
    backServer.close();
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
