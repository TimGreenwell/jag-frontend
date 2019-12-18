const express = require('express');
const https = require('https');
const session = require('express-session');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '../public')));

app.set('port', 8888);

const server = app.listen(app.get('port'), () => {
	console.log('HTTP server started on ' + app.get('port') + '.')
});

process.on('SIGTERM', () => {
	console.error("\nTerminating server.");
	server.close();
});
process.on('SIGINT', () => {
	console.error("\nInterrupting server.");
	server.close();
});