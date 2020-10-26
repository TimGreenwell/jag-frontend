/**
 * @file Handles storage of joint-activity-graphs using indexed db.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.29
 */

import IndexedDBUtils from '../utils/indexed-db.js';
import SchemaManager from './schemas.js';

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
			SchemaManager.all()
		);
	}

	async all(schema) {
		const cursor = await IndexedDBUtils.all(this._db, SchemaManager.get(schema).name);
		return Array.from(cursor);
	}

	async get(schema, key) {
		const description = await IndexedDBUtils.get(this._db, SchemaManager.get(schema).name, key);
		return description;
	}

	async has(schema, key) {
		const result = await IndexedDBUtils.getKey(this._db, SchemaManager.get(schema).name, key);
		return result !== undefined;
	}

	async create(schema, key, description) {
		return IndexedDBUtils.store(this._db, SchemaManager.get(schema).name, description, key);
	}

	async update(schema, key, description) {
		return IndexedDBUtils.store(this._db, SchemaManager.get(schema).name, description, key);
	}

}
