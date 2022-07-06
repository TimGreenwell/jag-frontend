/**
 * @fileOverview IA table application.
 *
 * @author mvignati
 * @version 0.31
 */

'use strict';

import IndexedDBStorage from './storages/indexed-db.js';
import IATable from './ui/ia-table.js';
import AnalysisLibrary from './views/analysis-library.js';
import RESTStorage from './storages/rest.js';
import TeamEditor from './views/team.js';
import StorageService from "./services/storage-service.js";
import SharedService from "./services/shared-service.js";
import ControllerIA from "./controllers/controllerIA.js";
import UserPrefs from "./utils/user-prefs.js";


document.addEventListener('DOMContentLoaded', async () => {

	// Initializes local storage
	const idb_storage = new IndexedDBStorage('joint-activity-graphs', 1);
	await idb_storage.init();
	StorageService.addStorageInstance('idb-service', idb_storage);

	// Initializes a rest storage
	const rest_storage = new RESTStorage('localhost', 1, 'http://localhost:8080/api/v1');
	await rest_storage.init();
	StorageService.addStorageInstance('local-rest-service', rest_storage);

    // storage choices
	 StorageService.setPreferredStorage('idb-service');          // which storage used for reads
	//StorageService.setPreferredStorage('local-rest-service');          // which storage used for reads
	StorageService.setStoragesSynced(false);                    // write to all storages or just preferred
	SharedService.senderId = 'jag-ia';


	let controller = new ControllerIA();

	// Load DOM outer skeleton for Authoring Tool
	const body = document.querySelector('body');
	const iaTable = new IATable();
	const analysisLibrary = new AnalysisLibrary();
	const editor = new TeamEditor();
	body.appendChild(analysisLibrary);
	body.appendChild(iaTable);
	body.appendChild(editor);
	controller.analysisLibrary = analysisLibrary;
	controller.iaTable = iaTable;
	controller.editor = editor;
	await controller.initialize();


	//////////////////////////////////////////////////////////////////////
	// Event: 'item-selected' -

	//////////////////////////////////////////////////////////////////////
	// Event: 'create-analysis' -
	iaTable.addEventListener('create-analysis', (e) => {
	//	library.addItem(e.detail.analysis, 0);
		///////////////////////////////////////////////editor.team = e.detail.analysis.team;
	});
});
