const path = require('path');

function Router() {

}

Router.prototype.route = function(req) {
	console.log('Routing request', req.method, req.url);
	let route = {};

	if(req.url == '/')
		route.file = 'index.html';
	else
		route.file = req.url;

	return route;
};

exports = module.exports = Router;
