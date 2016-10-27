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

	graph_service.addListener('resources', (message) => {
		library.handleResourceUpdate(message);
	});

	graph_service.addListener('inputs', (message) => {
		ide.handleInputs(message);
	});

	graph_service.addListener('connection', (event) => {
		ide.handleConnection(event);
	});

	graph_service.addListener('error', (message) => {
		ide.handleError(message);
	});

	graph_service.addListener('info', (message) => {
		ide.handleInfo(message);
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
		if(json == undefined) {
			ide.handleError({
				data: 'No graph selected.'
			});

			ide.stop();
		} else {
			graph_service.uploadGraph(json);
		}
	});

	ide.addListener('run', (data) => {
		const urn = playground.getSelectedURN();
		if(urn == undefined) {
			ide.handleError({
				data: 'No graph selected.'
			});

			ide.stop();
		} else {
			graph_service.runGraph(urn, data);
		}
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

