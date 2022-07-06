/**
 * @file Joint activity graph web tools' development web server.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.25
 */

const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 8080;
const root = process.argv[2] || '.';

const app = express();

app.use(express.static(path.join(process.cwd(), root)));

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

