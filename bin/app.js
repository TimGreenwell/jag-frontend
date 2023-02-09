/**
 * @file Joint activity graph web tools' development web server.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.25
 *
 * Delete after dev -- morgan(HTTP logger)
 */

'use strict';

import express from "express";
import dotenv from "dotenv";
dotenv.config({path: `./.env`});
import https from "https";
import path from "path";
// import passport from 'passport';
// import expressSession from 'express-session';
// import {Issuer, Strategy} from 'openid-client';

import {postgresRouter} from "../api/routes/postgresRoutes.js";
import morgan from "morgan";         // added
import cookieParser from "cookie-parser";

const app = express();
console.log(`start`);
console.log(`10`);
const port = process.env.PORT || 8888;
const root = process.argv[2] || `.`;
app.use(`/jag`, express.static(path.join(process.cwd(), root)));   // /app/public
app.use(`/api/v1`, postgresRouter);

// app.use(express.static("public"));   // /app/public

// app.use(cookieParser());
// app.use(express.urlencoded({
//     extended: true
// }));
// app.use(express.json({limit: `15mb`}));

const server = app.listen(port);
// app.use(express.json());             // added
// app.use(morgan(`dev`));    // added

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


// https://github.com/austincunningham/keycloak-express-openid-client/blob/master/index.js


// const PREFERRED_SOURCE = process.env.PREFERRED_SOURCE || "postgresdb";
// console.log(`Preferred source set as :> ${PREFERRED_SOURCE}`);
// const keycloakIssuer = await Issuer.discover(`http://jag-auth:8080/auth/realms/realm1`);
//
//
// const client = new keycloakIssuer.Client({
//     client_id: `clientid`,
//     client_secret: `long_secret-here`,
//     redirect_uris: [`http://localhost:8082/jag/*`],
//     post_logout_redirect_uris: [`http://localhost:8082/jag/*`],
//     response_types: [`code`]
// });
// console.log(`10`);
//
// const memoryStore = new expressSession.MemoryStore();
// app.use(expressSession({
//     secret: `another_long_secret`,
//     resave: false,
//     saveUninitialized: true,
//     store: memoryStore
// }));
//
// app.use(passport.initialize());
// app.use(passport.authenticate(`session`));
//
// // this creates the strategy
// passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
//     return done(null, tokenSet.claims());
// }));
//
// passport.serializeUser(function (user, done) {
//     done(null, user);
// });
// passport.deserializeUser(function (user, done) {
//     done(null, user);
// });


// app.get(`/test`, (req, res, next) => {
//     passport.authenticate(`oidc`)(req, res, next);
// });
//         console.log(`4`);
//         // callback always routes to test
// app.get(`/auth/callback`, (req, res, next) => {
//     passport.authenticate(`oidc`, {
//         successRedirect: `/testauth`,
//         failureRedirect: `/`
//     })(req, res, next);
// });
//         console.log(`5`);
//
//         // start logout request
//         app.get(`/logout`, (req, res) => {
//             res.redirect(client.endSessionUrl());
//             console.log(`6`);
//             //     // clears the persisted user from the local storage
//             req.logout();
//             console.log(`7`);
//             // redirects the user to a public route
//             res.redirect(`/`);
//         });
//     });


// passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
//     return done(null, tokenSet.claims());
// }));

// passport.serializeUser(function (user, done) {
//     console.log('-----------------------------');
//     console.log('serialize user');
//     console.log(user);
//     console.log('-----------------------------');
//     done(null, user);
// });
// passport.deserializeUser(function (user, done) {
//     console.log('-----------------------------');
//     console.log('deserialize user');
//     console.log(user);
//     console.log('-----------------------------');
//     done(null, user);
// });


// function to check weather user is authenticated, req.isAuthenticated is populated by password.js
// use this function to protect all routes
// const checkAuthenticated = (req, res, next) => {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     res.redirect(`/test`);
// };

