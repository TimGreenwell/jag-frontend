/**
 * @file Joint activity graph web tools' development web server.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.25
 *
 * Delete after dev -- morgan(HTTP logger)
 */

const express = require(`express`);
const https = require(`https`);
const path = require(`path`);
const fs = require(`fs`);

const cors = require(`cors`);             // added
const morgan = require(`morgan`);         // added
const pgController = require(`../controllers/postgresQueries`);
// const bodyParser = require(`body-parser`);
// const db = require('../config/db')

const port = process.env.PORT || 8888;
const root = process.argv[2] || `.`;

const app = express();


// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({
//     extended: true
// }));
app.get('/get', pgController.getItems)
app.get('/create', pgController.createTables)
app.get('/drop', pgController.dropTables)
app.use(express.static(path.join(process.cwd(), root)));   // original
app.use(express.json());             // added
app.use(cors());                     // added
app.use(morgan(`common`));    // added
// app.use(todoRoutes);                 // added

// app.get(`/api`, (req, res) => {
//     res.json({message: `Greetsryi`});
// });
//
// app.get(`/api2`, (request, response) => {
//     response.json({info: `Node.js, Express, and Postgres API`});
// });
//
//
// app.get('/users', db.getUsers)
// app.get('/users/:id', db.getUserById)
// app.post('/users', db.createUser)
// app.put('/users/:id', db.updateUser)
// app.delete('/users/:id', db.deleteUser)


const server = app.listen(port);

server.on(`listening`, () => {
    return console.log(`HTTP server started on ${port}`);
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
 * Middleware we can delete after devving --
 * morgan - logging HTTP requests on the terminal
 *
 */
