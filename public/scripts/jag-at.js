/**
 * @file Joint Activity Graph - Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.57
 *
 * Concepts and vocabulary clarification:
 *   JAG Record: the bare JSON used for storage and transmission
 *   JAG Entity: Defined by models/jag, {id,name,desc,childrenID, inputs, outputs, bindings, annotations, ...}
 *               and events on data changes and functions to construct JAG Models  [type JAG]
 *   JAG Model: set[JAG Entity] - JAG parent entity with descendent entities
 *   JAG (AT) Node: Defined by views/jag - JAG Entity +  AT graphics + events on graphics
 *
 */

import Playground from './playground.js';                     // AT - Center graphic view of JAG Nodes // ?? - seems unused currently
import Library from './views/library.js';                     // AT - Left view of available JAG Entities
import ProjectLibrary from './views/node-library.js';
import Menu from './views/menu.js';                           // AT - Top view of user actions (plus title/logo)
import Properties from './views/properties.js';               // AT - Right view of JAG Node data entry fields
import IDE from './ide.js';                                   // ?? - seems unused currently
import GraphService from './services/graph-service.js';       // ?? - seems unused currently
import StorageService from './services/storage-service.js';   // Interface services with JAG in storage(s)
import IndexedDBStorage from './storages/indexed-db.js';      // Available storage option (IndexedDB)
import RESTStorage from './storages/rest.js';
import ControllerAT from "./controllers/controllerAT.js";
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
	StorageService.setStoragesSynced(false);                    // write to all storages or just preferred
	StorageService.senderId = 'jag-at';

	let controller = new ControllerAT();

	// @TODO - I need to better understand these two
	const ide = new IDE();
	const graph_service = new GraphService();

	// Load DOM outer skeleton for Authoring Tool
	const body = document.querySelector('body');
	const library = new Library();
	const projectLibrary = new ProjectLibrary();
	const menu = new Menu();
	const playground = new Playground();
	const properties = new Properties();
	body.appendChild(menu)
	body.appendChild(library);
	library.appendChild(projectLibrary);
	body.appendChild(playground);
	body.appendChild(properties);
	controller.menu = menu;
	controller.library = library;
	controller.projectLibrary = projectLibrary;
	controller.playground = playground;
	controller.properties = properties;
	await controller.initialize();

	// The below really belong in the AT Controller - but I need to understand them better

	//////////////////////////////////////////////////////////////////////
	// Event: 'refresh' (storage-sync-requested)(?)
	playground.addEventListener('refresh', (e) => {
		library.refreshItem(e.detail.jagModel, e.detail.refreshed);
	});
	//////////////////////////////////////////////////////////////////////
	// Event: 'resources' (???)
	graph_service.addEventListener('resources', (e) => {
		library.handleResourceUpdate(e.detail);
	});
	//////////////////////////////////////////////////////////////////////
	// Event: 'refresh' (storage-sync-requested)(?)
	library.addEventListener('refresh', (e) => {
		playground.handleRefresh(e.detail);
	});
});
