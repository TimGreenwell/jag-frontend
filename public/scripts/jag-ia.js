/**
 * @fileOverview IA table application.
 *
 * @author mvignati
 * @version 0.31
 */

'use strict';

//import JAGService from './services/jag.js';
//import NodeService from './services/node.js';
//import AgentService from './services/agent.js';
//import TeamService from './services/team.js';
//import AnalysisService from './services/analysis.js';
import IndexedDBStorage from './storages/indexed-db.js';
import IATable from './ui/ia-table.js';
import AnalysisLibrary from './views/analysis-library.js';
import RESTStorage from './storages/rest.js';
import TeamEditor from './views/team.js';
import StorageService from "./services/storage-service.js";
import SharedService from "./services/shared-service.js";

document.addEventListener('DOMContentLoaded', async () => {


	// SharedService.worker = new SharedWorker('scripts/services/shared-worker.js');
	// SharedService.senderId = 'jag-ia';
	//
	// SharedService.worker.port.onmessage = handleNewMessage;
	//
	// function handleNewMessage({ data }) {
	// 	console.log("Don't think I will need this handler - but checking out this new data");
	// 	console.log({ data });
	// }
	//
	// function postStorageMessage(command, paramList) {
	// 	console.log("Posting new data from jagat");
	// }
    
	// Initializes local storage
	const idb_storage = new IndexedDBStorage('joint-activity-graphs', 1);
	await idb_storage.init();

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
    //JAGService.createInstance('idb-service', idb_storage);
	StorageService.addStorageInstance('idb-service', idb_storage);

	// @TODO: this should be setup by the user (configuration file).
	// Initializes a rest storage
	const rest_storage = new RESTStorage('localhost', 1, 'http://localhost:7465/api');
	//JAGService.createInstance('local-rest-service', rest_storage);
	StorageService.addStorageInstance('local-rest-service', rest_storage);

	StorageService.setPreferredStorage('idb-service');          // which storage used for reads
	StorageService.setStoragesSynced(false);                    // write to all storages or just preferred
	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
    //NodeService.createInstance('idb-service', idb_storage);

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
	//AgentService.createInstance('idb-service', idb_storage);

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
	//TeamService.createInstance('idb-service', idb_storage);

	// @TODO: put this name in a default/configuration object globaly accessible and frozen.
	//AnalysisService.createInstance('idb-service', idb_storage);

	const body = document.querySelector('body');

	const table = new IATable();
	const library = new AnalysisLibrary();
	const editor = new TeamEditor();

	body.appendChild(library);
	body.appendChild(table);
	body.appendChild(editor);

	library.addEventListener('item-selected', (e) => {
		table.analysis = e.detail.model;
		editor.team = e.detail.model.team;
	});

	table.addEventListener('create-analysis', (e) => {
	//	library.addItem(e.detail.analysis, 0);
		editor.team = e.detail.analysis.team;
	});
});
