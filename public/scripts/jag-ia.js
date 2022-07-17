/**
 * @fileOverview IA table application.
 *
 * @author mvignati
 * @version 0.31
 */

'use strict';

import IATable from './views/ia-table.js';
import IAMenu from './views/ia-menu.js';
import IAAnalysisLibrary from './views/ia-analysis-library.js';
import TeamEditor from './views/ia-properties.js';
import IAAgentLibrary from './views/ia-agent-library.js';
import IndexedDBStorage from './storages/indexed-db.js';
import RESTStorage from './storages/rest.js';
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

	StorageService.setPreferredStorage(UserPrefs.getDefaultStorageService());          // which storage used for reads
	StorageService.setStoragesSynced(false);                                           // write to all storages or just preferred
	SharedService.senderId = 'jag-ia';

	let controller = new ControllerIA();

	// Load DOM outer skeleton for Authoring Tool
	const body = document.querySelector('body');
	const mainPanels = document.createElement("div")
	mainPanels.setAttribute("id","main-panels")
	const leftPanel = document.createElement("div")
	leftPanel.setAttribute("id","left-panel")
	const rightPanel = document.createElement("div")
	rightPanel.setAttribute("id","right-panel")
	const iaMenu = new IAMenu();
	const analysisLibrary = new IAAnalysisLibrary();
	const agentLibrary = new IAAgentLibrary();
	const iaTable = new IATable();
	const editor = new TeamEditor();
	body.appendChild(iaMenu);
	mainPanels.appendChild(leftPanel);
	leftPanel.appendChild(analysisLibrary)
	mainPanels.appendChild(iaTable);
	mainPanels.appendChild(rightPanel);
	rightPanel.appendChild(editor)
	rightPanel.appendChild(agentLibrary)
	body.appendChild(mainPanels)

	controller.analysisLibrary = analysisLibrary;
	controller.iaTable = iaTable;
	controller.iaMenu = iaMenu;
	controller.editor = editor;
	controller.agentLibrary = agentLibrary;
	await controller.initialize();

	//////////////////////////////////////////////////////////////////////
	// Event: 'create-analysis' -
	iaTable.addEventListener('create-analysis', (e) => {
	//	library.addItem(e.detail.analysis, 0);
		///////////////////////////////////////////////editor.team = e.detail.analysis.team;
	});
});
