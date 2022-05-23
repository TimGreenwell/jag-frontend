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

import Playground from './playground.js';                     // AT - Center graphic view of JAG Nodes
import IDE from './ide.js';                                   // ?? - seems unused currently
import Library from './views/library.js';                     // AT - Left view of available JAG Entities
import Menu from './views/menu.js';                           // AT - Top view of user actions (plus title/logo)
import Properties from './views/properties.js';               // AT - Right view of JAG Node data entry fields
import GraphService from './services/graph-service.js';       // ?? - seems unused currently
import StorageService from './services/storage-service.js';   // Interface services with JAG in storage(s)
import IndexedDBStorage from './storages/indexed-db.js';      // Available storage option (IndexedDB)
import RESTStorage from './storages/rest.js';

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
	StorageService.setPreferredStorage('local-rest-service');          // which storage used for reads
	StorageService.setStoragesSynced(false);                    // write to all storages or just preferred
	StorageService.senderId = 'jag-at';

	const ide = new IDE();
	const graph_service = new GraphService();

	// Load DOM outer skeleton for Authoring Tool
	const body = document.querySelector('body');
	const library = new Library();
	const menu = new Menu();
	const playground = new Playground();
	const properties = new Properties();
	body.appendChild(menu)
	body.appendChild(library);
	body.appendChild(playground);
	body.appendChild(properties);

	/**
	 * EventListeners triggering action in different panel
	 * Event: 'item-selected' (menu-item-selected) or (library-item-selected)
	 *        menu:'clear'      detail": { "action": "clear" }
	 *        library:<JAGentity>  detail: {model: model, model_set: all_models, expanded: event.shiftKey}
	 * @TODO Add more menu events (New Node, Clear Workspace, Delete Node, ...)
	 * @TODO Move library selection to its own unique event (after 'New' to moved to menu)
	 */

	//////////////////////////////////////////////////////////////////////
	// Event: 'clear-playground' - menu item selected to clear nodes from playground
	menu.addEventListener('clear-playground', (e) => {
		playground.clearPlayground();
	});
	//////////////////////////////////////////////////////////////////////
	// Event: 'add-new-node-to-playground' - when menu or library adds a (new or existing) node to playground
	// @TODO
	menu.addEventListener('add-new-node', (e) => {
		playground._handleNewNodePopup(e);
	});
    //////////////////////////////////////////////////////////////////////
	// Event: 'delete item' - when menu or library adds a (new or existing) node to playground
	// @TODO
	menu.addEventListener('delete-selected', (e) => {
		playground.handleDeleteSelected(e);
	});
	//////////////////////////////////////////////////////////////////////
	// Event: 'item-selected' from library (defined-node-added)
	// @TODO Playgrounds handlers can be combined or merged.
	library.addEventListener('library-lineItem-selected', (e) => {
		playground.handleLibraryListItemSelected(e.detail);
	});
	//////////////////////////////////////////////////////////////////////
	// Event: 'playground-nodes-selected' (playground-node-selected)
	playground.addEventListener('playground-nodes-selected', (e) => {
		properties.handleSelectionUpdate(e.detail);
		//ide.handleSelectionUpdate(e.detail);
	});

	//////////////////////////////////////////////////////////////////////
	// Event: 'refresh' (storage-sync-requested)(?)
	playground.addEventListener('refresh', (e) => {
		library.refreshItem(e.detail.model, e.detail.refreshed);
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
