/**
 * @fileOverview IA table application.
 *
 * @author mvignati
 * @version 0.18
 */

'use strict';

import JAGService from './services/jag.js';
import NodeService from './services/node.js';
import AgentService from './services/agent.js';
import TeamService from './services/team.js';
import AnalysisService from './services/analysis.js';
import IndexedDBStorage from './storages/indexed-db.js';
import IATable from './ui/ia-table.js';
import Library from './views/library.js';
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

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
    NodeService.createInstance('idb-service', idb_storage);

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
	AgentService.createInstance('idb-service', idb_storage);

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
	TeamService.createInstance('idb-service', idb_storage);

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
	AnalysisService.createInstance('idb-service', idb_storage);

	const body = document.querySelector('body');

	const table = new IATable();
	const library = new Library();

	body.appendChild(library);
	body.appendChild(table);

	library.addEventListener('item-selected', (e) => {
		// TODO: add to table
	});

	library.addEventListener('refresh', (e) => {
		// TODO: refresh table
	});
});
