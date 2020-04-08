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

document.addEventListener('DOMContentLoaded', (e) => {
	JAGService.initialize().then(() => {
		JAGService.loadFromFile('/static-jags.json').then(() => {
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
		});
	}).catch((error) => {
		alert(error);
	});
});