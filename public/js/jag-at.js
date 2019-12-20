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

	library.addEventListener('item-selected', (e) => {
		playground.handleItemSelected(e.data);
	});

	graph_service.addEventListener('resources', (e) => {
		library.handleResourceUpdate(e.data);
	});

	graph_service.addEventListener('inputs', (e) => {
		ide.handleInputs(e.data);
	});

	graph_service.addEventListener('connection', (e) => {
		ide.handleConnection(e.data);
	});

	graph_service.addEventListener('error', (e) => {
		ide.handleError(e.data);
	});

	graph_service.addEventListener('info', (e) => {
		ide.handleInfo(e.data);
	});

	playground.addEventListener('selection', (e) => {
		properties.handleSelectionUpdate(e.data);
		ide.handleSelectionUpdate(e.data);
	});

	ide.addEventListener('connect', (e) => {
		graph_service.connect();
	});

	ide.addEventListener('upload', (e) => {
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

	ide.addEventListener('run', (e) => {
		const urn = playground.getSelectedURN();
		if(urn == undefined) {
			ide.handleError({
				data: 'No graph selected.'
			});

			ide.stop();
		} else {
			graph_service.runGraph(urn, e.data);
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

