/**
 * @fileOverview JAG service.
 *
 * @author mvignati
 * @version 0.13
 */

'use strict';

import JAGModel from '../models/jag-ia.js';
import IndexedDBStorage from '../utils/indexed-db.js';

export default class JAGService {

	static get storageDefinition() {
		return JAGService.JAG_STORE;
	}

	static store(model) {
		//@TODO: check what happen if the jag already exists
		JAGService.CACHE.set(model.urn, model);

		return IndexedDBStorage.store(
			JAGService.DB_INSTANCE,
			JAGService.JAG_STORE.name,
			model.toJSON(),
			model.urn
		);
	}

	static async getAllAvailable() {
		const cursor = await IndexedDBStorage.getKeys(
			JAGService.DB_INSTANCE,
			JAGService.JAG_STORE.name
		);

		return cursor;
	}

	// @TODO: change that to only query for key existence.
	static async has(urn) {
		if(JAGService.CACHE.has(urn)) {
			return true;
		}

		const json = await IndexedDBStorage.get(
			JAGService.DB_INSTANCE,
			JAGService.JAG_STORE.name,
			urn
		);

		return json !== undefined;
	}

	static async get(urn) {
		if(JAGService.CACHE.has(urn)) {
			return JAGService.CACHE.get(urn);
		}

		const json = await IndexedDBStorage.get(
			JAGService.DB_INSTANCE,
			JAGService.JAG_STORE.name,
			urn
		);

		if(json === undefined)
			return undefined;

		const model = JAGModel.fromJSON(json);
		JAGService.CACHE.set(urn, model);

		return model;
	}

}

JAGService.CACHE = new Map();

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

