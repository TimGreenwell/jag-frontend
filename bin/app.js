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
const bodyParser = require(`body-parser`)
const https = require(`https`);
const path = require(`path`);
console.log(`requiring ../routes/postgresRoutes`)
const postgresRoutes = require(`../routes/postgresRoutes`)

const cors = require(`cors`);             // added
const morgan = require(`morgan`);         // added

const port = process.env.PORT || 8888;
const root = process.argv[2] || `.`;
const app = express();

app.use(`/api/v1`, postgresRoutes);
app.use(express.static(path.join(process.cwd(), root)));   // original
app.use(express.json());             // added
app.use(cors());                     // added
app.use(morgan(`common`));    // added
// app.use(todoRoutes);                 // added

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
