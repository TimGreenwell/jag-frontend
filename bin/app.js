const express = require('express');
const https = require('https');
const session = require('express-session');
const path = require('path');

const app = express();
app.set('env', process.argv[2] || process.env.NODE_ENV );
app.use(express.static(path.join(__dirname, '../public')));

const credentials = require('../config/credentials')[app.get('env')];
if (!credentials) throw new Error('Failed to initialize environment; ensure environment credentials for ' + app.get('env') + ' exist in /config/credentials.js.');
app.use(session(credentials.session));

try {
	require('../config/env/' + app.get('env'))(app);
} catch (e) {
	throw new Error('Failed to initialize environment; ensure environment configuration for ' + app.get('env') + ' exists in /config/env.');
}

app.set('port', app.get('port') || process.env.PORT || 8888);

const server = credentials.ssl
	? https.createServer(credentials.ssl, app).listen(app.get('port'), () => {
			console.log('HTTPS server started on ' + app.get('port') + '.');
		})
	: app.listen(app.get('port'), () => {
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