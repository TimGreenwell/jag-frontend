const Server = require('goblin/lib/server.js');
const FileHandler = require('goblin/lib/file-handler.js');
const RollupHandler = require('goblin/lib/rollup-handler.js');
const ROLLUP_OPTIONS = {
	include_paths: {
		include: {},
		paths: ['./node_modules/'],
		external: [],
		extensions: ['.js']
	}
};

const server = new Server(process.argv[2], process.argv[3]);
server.addRoute('*', new FileHandler());
server.addRoute('^.*.js\\+bundle$', new RollupHandler(ROLLUP_OPTIONS));
server.start();