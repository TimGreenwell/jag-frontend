/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.27
 */

import Playground from './playground.js';
import IDE from './ide.js';
import Library from './views/library.js';
import Properties from './views/properties.js';
import GraphService from './services/graph-service.js';
import JAGService from './services/jag.js';
import JAG from './models/jag.js';
import IndexedDBUtils from './utils/indexed-db.js';

document.addEventListener('DOMContentLoaded', (e) => {
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

	graph_service.addEventListener('resources', (e) => {
		library.handleResourceUpdate(e.detail);
	});

	playground.addEventListener('selection', (e) => {
		properties.handleSelectionUpdate(e.detail);
		//ide.handleSelectionUpdate(e.detail);
	});

	loadStaticLibrary(library);
});

async function loadStaticLibrary(library) {
	await initializeStorage();

	library.addItem({name: 'New', description: 'Empty node that can be used to create new behaviors.'});

	const response = await fetch('/static-jags.json');
	if(!response.ok) return;

	const static_library = await response.json();

	for(let item of static_library)
	{
		// Store the item in the local database.
		await JAGService.store(JAG.fromJSON(item));

		// Retrieve the instance of the definition and store in the cache.
		const model = await JAGService.get(item.urn);

		// Add the instance of the definition to the library for events to bubble up.
		library.addItem(model);
	}
}

async function initializeStorage()
{
	const db = await IndexedDBUtils.initStorage(
		"somethingthatmakessenselikejags",
		1,
		[JAGService.JAG_STORE]
	);

	JAGService.DB_INSTANCE = db;
}