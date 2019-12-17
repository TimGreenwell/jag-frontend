const Server = require('goblin/lib/server.js').Server;
const FileHandler = require('goblin/lib/file-handler.js');

const server = new Server(process.argv[2], process.argv[3]);
server.addRoute('*', new FileHandler());
server.start();