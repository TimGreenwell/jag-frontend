/**
 * @file Joint activity graph web tools' development web server.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.25
 *
 * Delete after dev -- morgan(HTTP logger)
 */

const express = require('express');
const {Pool, Client} = require("pg");
const https = require('https');
const path = require('path');
const fs = require('fs');
const morgan = require("morgan")

const port = process.env.PORT || 8888;
const root = process.argv[2] || '.';

const app = express();

app.use(express.static(path.join(process.cwd(), root)));
app.use(morgan("common"))

app.get("/goober",(req, res) => {
    res.json({
        message: "Greetsryi"
    })
})

const server = app.listen(port);

server.on('listening', () => console.log(`HTTP server started on ${port}`));

process.on('SIGTERM', () => {
    console.error("\nTerminating server.");
    server.close();
});

process.on('SIGINT', () => {
    console.error("\nInterrupting server.");
    server.close();
});

/**
 * To run -
 * npm start - official
 * npm run dev - to use nodemon (auto server restarts)
 *
 *
 * Middleware we can delete after devving --
 * morgan - logging HTTP requests on the terminal
 *
 */