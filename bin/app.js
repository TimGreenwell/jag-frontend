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

import express from 'express';
// import { Issuer, Strategy } from 'C';
import passport from 'passport';
import expressSession from 'express-session';

import {Issuer, Strategy} from 'openid-client';

const app = express();
import {config} from "dotenv";
config({path: `./.env`});
import https from "https";

import path from "path";

import morgan from "morgan";         // added
import {postgresRouter as router} from "../api/routes/postgresRoutes.js";
import cookieParser from "cookie-parser";

console.log(`start`);
const keycloakIssuer = await Issuer.discover(`http://localhost:8082/auth/realms/realm1`);

console.log(`finish`);
console.log(`Discovered issuer %s %O`, keycloakIssuer.issuer, keycloakIssuer.metadata);


console.log(`10`);
// Issuer.discover(`http://localhost:8082/auth/realms/realm1`).
//     then((keycloakIssuer) => {
//         const client = new keycloakIssuer.Client({
//             client_id: `client1`,
//             client_secret: `j9wYVyD3zXZPMo3LTq/xSU/sMu9/shiFKpTHKfqAutM=`,
//             redirect_uris: [`http://localhost:8084/auth/callback`],
//             post_logout_redirect_uris: [`http://localhost:8085/logout/callback`],
//             token_endpoint_auth_method: `client_secret_post`
//         });
//         //  ? - const keycloakIssuer = await Issuer.discover(`http://localhost:8082/auth/realms/jag`);
//         console.log(`Discovered issuer %s %O`, keycloakIssuer.issuer, keycloakIssuer.metadata);
//         const memoryStore = new expressSession.MemoryStore();
//         app.use(express.json({limit: `15mb`}));
//         app.use(expressSession({
//             secret: `another_long_secret`,
//             resave: false,
//             saveUninitialized: true
//             // store: memoryStore
//         }));
//         console.log(`2`);
//
//         app.use(passport.initialize());
//         app.use(passport.session());
//         console.log(`3`);
//         // default protected route /test
//         app.get(`/test`, (req, res, next) => {
//             passport.authenticate(`oidc`)(req, res, next);
//         });
//         console.log(`4`);
//         // callback always routes to test
//         app.get(`/auth/callback`, (req, res, next) => {
//             passport.authenticate(`oidc`, {
//                 successRedirect: `/testauth`,
//                 failureRedirect: `/`
//             })(req, res, next);
//         });
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


// const PREFERRED_SOURCE = process.env.PREFERRED_SOURCE || "postgresdb";
// console.log(`Preferred source set as :> ${PREFERRED_SOURCE}`);

console.log(`8`);
app.use(cookieParser());
console.log(`9`);
app.use(express.urlencoded({
    extended: true
}));
console.log(`10`);
const port = process.env.PORT || 8888;

const root = process.argv[2] || `.`;


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
const checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect(`/test`);
};
app.use(express.static(path.join(process.cwd(), root)));   // original
// app.use(`/api/v1`, router);
app.get(`/api/v1`, checkAuthenticated, router);
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


// https://github.com/austincunningham/keycloak-express-openid-client/blob/master/index.js
