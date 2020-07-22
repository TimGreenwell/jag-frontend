/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.51
 */

import Playground from './playground.js';
import IDE from './ide.js';
import Library from './views/library.js';
import Properties from './views/properties.js';
import GraphService from './services/graph-service.js';
import JAGService from './services/jag.js';
import IndexedDBStorage from './storages/indexed-db.js';
import RESTStorage from './storages/rest.js';


document.addEventListener('DOMContentLoaded', async () => {

	// Initializes local storage
	const idb_storage = new IndexedDBStorage('joint-activity-graphs', 1);
	await idb_storage.init();

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
	JAGService.createInstance('idb-service', idb_storage);

	// @TODO: this should be setup by the user (configuration file).
	// Initializes a rest storage
	const rest_storage = new RESTStorage('localhost', 1, 'http://localhost:7465/api');
	JAGService.createInstance('local-rest-service', rest_storage);

	const body = document.querySelector('body');

	const library = new Library();

	const playground = new Playground();
	const properties = new Properties();
	const ide = new IDE();

	body.appendChild(library)
	body.appendChild(playground)
	body.appendChild(properties)

	const graph_service = new GraphService();

	library.addEventListener('item-selected', (e) => {
		playground.handleItemSelected(e.detail);
	});

	library.addEventListener('refresh', (e) => {
		playground.handleRefresh(e.detail);
	});

	graph_service.addEventListener('resources', (e) => {
		library.handleResourceUpdate(e.detail);
	});

	playground.addEventListener('selection', (e) => {
		properties.handleSelectionUpdate(e.detail);
		//ide.handleSelectionUpdate(e.detail);
	});

	playground.addEventListener('refresh', (e) => {
		library.refreshItem(e.detail.model, e.detail.refreshed);
	});

});
