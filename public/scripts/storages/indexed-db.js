/**
 * @file Handles storage of joint-activity-graphs using indexed db.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.18
 */

import IndexedDBUtils from '../utils/indexed-db.js';

export default class IndexedDBStorage {

	constructor(name, version) {
		this._name = name,
		this._version = version;
		this._db = undefined;
	}

	async init() {
		this._db = await IndexedDBUtils.initStorage(
			this._name,
			this._version,
			[__JAG_STORE]
		);
	}

	async all() {
		const cursor = await IndexedDBUtils.all(this._db, __JAG_STORE.name);
		return Array.from(cursor);
	}

	async get(urn) {
		const description = await IndexedDBUtils.get(this._db, __JAG_STORE.name, urn);
		return description;
	}

	async has(urn) {
		const key = await IndexedDBUtils.getKey(this._db, __JAG_STORE.name, urn);
		return key !== undefined;
	}

	async create(description) {
		return IndexedDBUtils.store(this._db, __JAG_STORE.name, description, description.urn);
	}

}

const __JAG_STORE = {
	name: 'joint-activity-graph',
	indexes: [
		{
			name: 'urn-index',
			property: 'urn',
			options: {unique: true}
		}
	]
};

