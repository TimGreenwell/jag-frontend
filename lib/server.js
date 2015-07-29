// Loads global modules
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configures application paths
const APPLICATION_ROOT = path.join(__dirname,'..');
const LIB_PATH = path.join(APPLICATION_ROOT, 'lib');
const DOCUMENT_ROOT = path.join(APPLICATION_ROOT, 'public');

// Loads local module
const Router = require(path.join(LIB_PATH, 'router'));

const DEFAULT_PORT = 2859;

const MIME_TYPES = {
	'.js' : 'application/javascript',
	'.css' : 'text/css',
	'.png' : 'image/png',
	'default' : 'text/html'
};

function Server() {
	this.router = new Router();
}


Server.prototype.start = function(options) {
	options = options || {};
	let port = options.port || DEFAULT_PORT;
	let server = http.createServer(this.processRequest.bind(this));
	server.listen(port);
	console.log('Server is listenning on port', port);
};

Server.prototype.processRequest = function(req, res) {
	let response = this.router.route(req),
	view_file = path.join(DOCUMENT_ROOT,response.file),
	ext = path.extname(view_file),
	content_type = MIME_TYPES[ext] || MIME_TYPES['default'],
	rs = fs.createReadStream(view_file);
	
	rs.on('open', function() {
		res.writeHead(200, {'Content-Type': content_type});
		rs.pipe(res);
	});

	rs.on('error', function(err) {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		console.log(err.message);
		res.end('File not found.');
	});
};

exports = module.exports = Server;

