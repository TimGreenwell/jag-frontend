/**
 * @file Joint activity graph web tools' development web server.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.25
 *
 * Delete after dev -- morgan(HTTP logger)
 */

require(`dotenv`).config({path: `./.env`});
// console.log(process.env);
const express = require(`express`);
const https = require(`https`);
const path = require(`path`);
const {PREFERRED_SOURCE} = require(`../config/environment`);
const cookieParser = require('cookie-parser');
const {Issuer, Strategy} = require('openid-client');
const  passport = require('passport');
const  expressSession = require('express-session');
const app = express();

app.use(cookieParser());
app.use(express.urlencoded({
    extended: true,
}));


// const PREFERRED_SOURCE = process.env.PREFERRED_SOURCE || "postgresdb";
console.log(`Preferred source set as :> ${PREFERRED_SOURCE}`);

const postgresRoutes = require(`../api/routes/postgresRoutes`);

const morgan = require(`morgan`);         // added

const port = process.env.PORT || 8888;

const root = process.argv[2] || `.`;
// [
//     '/usr/bin/node',
//     '/home/tgreenwell/IdeaProjects/hubbed-joint-activity-graph/bin/app.js',
//     './public'
// ]
// use the issuer url here
// const keycloakIssuer = await Issuer.discover(`http://localhost:8082/auth/realms/jag`);
// don't think I should be console.logging this but its only a demo app
// nothing bad ever happens from following the docs :)
// console.log(`Discovered issuer %s %O`, keycloakIssuer.issuer, keycloakIssuer.metadata);
//
// const client = new keycloakIssuer.Client({
//     client_id: `keycloak-express`,
//     client_secret: `long_secret-here`,
//     redirect_uris: [`http://localhost:8082/auth/callback`],
//     post_logout_redirect_uris: [`http://localhost:8082/logout/callback`],
//     response_types: [`code`]
// });

// const memoryStore = new expressSession.MemoryStore();
app.use(express.json({ limit: '15mb' }));
app.use(expressSession({
    secret: `another_long_secret`,
    resave: false,
    saveUninitialized: true
    // store: memoryStore
}));

app.use(passport.initialize());
app.use(passport.session());

// passport.use(`oidc`, new Strategy({client}, (tokenSet, userinfo, done) => {
//     return done(null, tokenSet.claims());
// }));

passport.serializeUser(function (user, done) {
    console.log('-----------------------------');
    console.log('serialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    console.log('-----------------------------');
    console.log('deserialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});

// default protected route /test
app.get(`/test`, (req, res, next) => {
    passport.authenticate(`oidc`)(req, res, next);
});

// callback always routes to test
app.get(`/auth/callback`, (req, res, next) => {
    passport.authenticate(`oidc`, {
        successRedirect: `/testauth`,
        failureRedirect: `/`
    })(req, res, next);
});


// function to check weather user is authenticated, req.isAuthenticated is populated by password.js
// use this function to protect all routes
const checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect(`/test`);
};


// start logout request
app.get(`/logout`, (req, res) => {
    res.redirect(client.endSessionUrl());
});

// logout callback
app.get(`/logout/callback`, (req, res) => {
    // clears the persisted user from the local storage
    req.logout();
    // redirects the user to a public route
    res.redirect(`/`);
});


app.use(express.static(path.join(process.cwd(), root)));   // original

// app.use(`/api/v1`, postgresRoutes);
app.get(`/api/v1`, checkAuthenticated, postgresRoutes);

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