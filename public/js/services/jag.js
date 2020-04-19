/**
 * @fileOverview JAG service.
 *
 * @author mvignati
 * @version 0.13
 */

'use strict';

import JAG from '../models/jag.js';
import IndexedDBUtils from '../utils/indexed-db.js';
import UndefinedJAG from '../models/undefined.js';

export default class JAGService extends EventTarget {

	static async initialize() {
		const db = await IndexedDBUtils.initStorage(
			"somethingthatmakessenselikejags",
			1,
			[JAGService.JAG_STORE]
		);

		JAGService.DB_INSTANCE = db;
	}

	static get storageDefinition() {
		return JAGService.JAG_STORE;
	}

	static store(model) {
		if (!JAGService.CACHE.has(model.urn)) {
			model.addEventListener('update', JAGService._updateHandler);
			JAGService.CACHE.set(model.urn, model);
			JAGService.resolve(model);
		}

		return IndexedDBUtils.store(
			JAGService.DB_INSTANCE,
			JAGService.JAG_STORE.name,
			model.toJSON(),
			model.urn
		);
	}

	static async getAllAvailable() {
		const cursor = await IndexedDBUtils.getKeys(
			JAGService.DB_INSTANCE,
			JAGService.JAG_STORE.name
		);

		let keys = new Set();

		for (let key of cursor) {
			keys.add(key);
		}

		for (let key of JAGService.STATIC.keys()) {
			keys.add(key);
		}

		for (let key of JAGService.UNDEFINED.keys()) {
			keys.add(key);
		}

		return keys;
	}

	// TODO: change that to only query for key existence.
	static async has(urn) {
		if (JAGService.CACHE.has(urn)) {
			return true;
		}

		const json = await IndexedDBUtils.get(
			JAGService.DB_INSTANCE,
			JAGService.JAG_STORE.name,
			urn
		);

		if (json !== undefined) {
			return true;
		}

		return JAGService.STATIC.has(urn);
	}

	static async get(urn) {
		// If the cache contains a model for this URN,
		if (JAGService.CACHE.has(urn)) {
			// Return the model in the cache.
			return JAGService.CACHE.get(urn);
		}

		// Else, attempt to retrieve a definition for this URN from IndexedDB.
		let json = await IndexedDBUtils.get(
			JAGService.DB_INSTANCE,
			JAGService.JAG_STORE.name,
			urn
		);

		// If a definition does not exist,
		if (json === undefined) {
			// If the static library does not contain a definition,
			if (!JAGService.STATIC.has(urn)) {
				// If the undefined list does not contain a definition,
				if (!JAGService.UNDEFINED.has(urn)) {
					// Point this URN in the undefined list to a new undefined node.
					JAGService.UNDEFINED.set(urn, new UndefinedJAG(urn));
				}

				return JAGService.UNDEFINED.get(urn);
			}

			// Else, retrieve the definition from the static library.
			json = JAGService.STATIC.get(urn);
		}

		// Create a new model from the definition.
		const model = JAG.fromJSON(json);

		// Resolve the tree of children for this model.
		await JAGService.resolve(model);

		// Attach an update listener to this model.
		model.addEventListener('update', JAGService._updateHandler);

		// Store the model in the cache.
		JAGService.CACHE.set(urn, model);

		// Return the model.
		return model;
	}

	static async resolve(model) {
		// For each child of this model,
		for (let child of model.children) {
			// If child does not have model set,
			if (child.model === undefined) {
				// Check if model is set for URN.
				let check = await JAGService.has(child.urn);

				// If definition for child URN exists,
				if (check) {
					// Set the child model.
					child.model = await JAGService.get(child.urn);
				// Else,
				} else {
					// If other models are also seeking this child URN,
					if (JAGService.MISSING.has(child.urn)) {
						// Add this model to the list.
						let missing_list = JAGService.MISSING.get(child.urn);
						missing_list.push(model);
					// Else,
					} else {
						// Create a new list of models seeking this child URN.
						JAGService.MISSING.set(child.urn, [model]);

						// Set the URN to an undefined JAG.
						JAGService.UNDEFINED.set(child.urn, new UndefinedJAG(child.urn));
					}
				}
			}
		}

		// If other models have been seeking this model URN,
		if (JAGService.MISSING.has(model.urn)) {
			// Retrieve the list of models seeking this model URN.
			let missing_list = JAGService.MISSING.get(model.urn);

			// Remove this URN from the missing list.
			JAGService.MISSING.delete(model.urn);

			// For each model in the list,
			for (let seeking_model of missing_list) {
				// For each child of the model,
				for (let child of seeking_model.children) {
					// If the child URN matches this model,
					if (child.urn == model.urn) {
						// Set the child's model to this model.
						child.model = model;
					}
				}
			}

			// Retrieve the UndefinedJAG in place of the previously missing model.
			let undefinedJAG = JAGService.UNDEFINED.get(model.urn);

			// Remove this URN from the undefined list.
			JAGService.UNDEFINED.delete(model.urn);

			// Notify listeners that the model has been defined.
			undefinedJAG.defined(model);
		}
	}

	static async _updateHandler(e) {
		await JAGService.store(JAGService.CACHE.get(e.detail.urn));
	}
	
	static async loadFromFile(path) {
		const response = await fetch(path);

		if (!response.ok) {
			window.alert("Failed to load static file '" + path + "'.");
			return;
		}

		const static_library = await response.json();

		for (let item of static_library)
		{
			JAGService.STATIC.set(item.urn, item);
		}
	}
}

JAGService.CACHE = new Map();

JAGService.STATIC = new Map();

JAGService.MISSING = new Map();

JAGService.UNDEFINED = new Map();

JAGService.JAG_STORE = {
	name: 'jag',
	indexes: [
		{
			name: 'urn-index',
			property: 'urn',
			options: {
				unique: true
			}
		}
	]
};