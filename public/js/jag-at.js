import Library from './library.js';
import Playground from './playground.js';
import IDE from './ide.js';
import Properties from './ui/properties.js';
import GraphService from './net/graph-service.js';

document.addEventListener('DOMContentLoaded', (e) => {
	const body = document.querySelector('body');

	const playground_container = document.querySelector('#playground');
	const playground = new Playground(playground_container);

	const ide_container = document.querySelector('#ide');
	const ide = new IDE(ide_container);

	const properties_container = document.querySelector('#properties');
	const properties = new Properties(properties_container);

	const library_container = document.querySelector('#library');
	const library = new Library(library_container);

	const graph_service = new GraphService();

	library.addListener('item-selected', (item) => {
		playground.handleItemSelected(item);
	});

	properties.addListener('update', (event) => {
		playground.handlePropertyUpdate(event);
	});

	graph_service.addListener('resources', (event) => {
		library.handleResourceUpdate(event);
	});

	graph_service.addListener('inputs', (event) => {
		ide.handleInputs(event);
	});

	graph_service.addListener('connection-opened', (event) => {
		ide.handleNewConnection(event);
	});

	playground.addListener('selection', (event) => {
		properties.handleSelectionUpdate(event);
		ide.handleSelectionUpdate(event);
	});

	ide.addListener('connect', (event) => {
		graph_service.connect();
	});

	ide.addListener('upload', (event) => {
		const json = playground.getSelectedAsJSON();
		console.log(JSON.stringify(json));
		if(json != undefined)
			graph_service.uploadGraph(json);
	});

	ide.addListener('run', (data) => {
		const urn = playground.getSelectedURN();
		console.log(data);

		if(urn != undefined)
			graph_service.runGraph(urn, data);
	});

	loadStaticLibrary(library);
});

function loadStaticLibrary(library) {
	library.addItem({
		urn: '',
		name: 'Empty',
		description: 'Empty node that can be used to create new behaviors.',
		inputs: [],
		outputs: []
	});
}

