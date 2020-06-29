/**
 * @fileOverview JAG Node service.
 *
 * @author mvignati
 * @version 0.02
 */

'use strict';

import JAGNodeModel from '../models/jag-node.js';
import IndexedDBStorage from '../utils/indexed-db.js';

export default class NodeService {

	static get storageDefinition() {
		return NodeService.NODE_STORE;
	}

	static store(model) {
		//@TODO: check what happen if the jag already exists
		NodeService.CACHE.set(model.id, model);

		return IndexedDBStorage.store(
			NodeService.DB_INSTANCE,
			NodeService.NODE_STORE.name,
			model.toJSON(),
			model.id
		);
	}

	static async getAllAvailable() {
		const cursor = await IndexedDBStorage.getKeys(
			NodeService.DB_INSTANCE,
			NodeService.NODE_STORE.name
		);

		return cursor;
	}

	// @TODO: change that to only query for key existence.
	static async has(id) {
		if(NodeService.CACHE.has(id)) {
			return true;
		}

		const json = await IndexedDBStorage.get(
			NodeService.DB_INSTANCE,
			NodeService.NODE_STORE.name,
			id
		);

		return json !== undefined;
	}

	static async get(id) {
		if(NodeService.CACHE.has(id)) {
			return NodeService.CACHE.get(id);
		}

		const json = await IndexedDBStorage.get(
			NodeService.DB_INSTANCE,
			NodeService.NODE_STORE.name,
			id
		);

		if(json === undefined)
			return undefined;

		const model = JAGNodeModel.fromJSON(json);
		NodeService.CACHE.set(id, model);

		return model;
	}

}

NodeService.CACHE = new Map();

NodeService.NODE_STORE = {
	name: 'node',
	indexes: [
		{
			name: 'id-index',
			property: 'id',
			options: {
				unique: true
			}
		}
	]
};

