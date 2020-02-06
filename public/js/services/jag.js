/**
 * @fileOverview JAG service.
 *
 * @author mvignati
 * @version 0.13
 */

'use strict';

import JAG from '../models/jag.js';
import IndexedDBUtils from '../utils/indexed-db.js';

export default class JAGService {

	static get storageDefinition() {
		return JAGService.JAG_STORE;
	}

	static store(model) {
		model.addEventListener('update', JAGService._updateHandler);

		if (!JAGService.CACHE.has(model.urn)) {
			JAGService.CACHE.set(model.urn, model);
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

		return cursor;
	}

	// @TODO: change that to only query for key existence.
	static async has(urn) {
		if(JAGService.CACHE.has(urn)) {
			return true;
		}

		const json = await IndexedDBUtils.get(
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

		const json = await IndexedDBUtils.get(
			JAGService.DB_INSTANCE,
			JAGService.JAG_STORE.name,
			urn
		);

		if(json === undefined)
			return undefined;

		const model = JAG.fromJSON(json);
		JAGService.CACHE.set(urn, model);

		return model;
	}

	static async _updateHandler(e) {
		JAGService.store(JAGService.CACHE.get(e.detail.urn));
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