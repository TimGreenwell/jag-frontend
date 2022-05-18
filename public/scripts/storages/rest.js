/**
 * @file Handles storage of joint-activity-graphs using a REST interface.
 *
 * @author mvignati
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.17
 */

import RESTUtils from '../utils/rest.js';
import SchemaManager from "./schemas.js";

export default class RESTStorage {

	constructor(name, version, endpoint) {
		this._name = name;
		this._version = version;
		this._endpoint = endpoint;
	}

	async init() {
		// TODO: provide init functions

		// TODO: test connection to ensure availability?
		// TODO: implement handlers for identity requirements?
		// TODO: enforce secure connections or other requirements?
		// TODO: ensure API version is compatible with endpoint?
	}

	async all(schema) {
		console.log(schema);
		const restAccess = SchemaManager.getRest(schema);
		console.log(restAccess);
		const path = __REST_PATHS.all.replace("{schema}", restAccess);
		console.log(path);
		const keys = await RESTUtils.all(this._endpoint + path);
		console.log(keys);
		return keys;
	}

	async get(schema, id) {
		const path = __REST_PATHS.all.replace("{schema}", schema).replace("{id}",id);
		const description = await RESTUtils.get(this._endpoint + path);
		return description;
	}

	async has(schema, id) {
		const path = __REST_PATHS.all.replace("{schema}", schema).replace("{id}",id);
		const exists = await RESTUtils.has(this._endpoint + path);
		return exists;
	}

	async create(schema, id, description) {
		const path = __REST_PATHS.all.replace("{schema}", schema).replace("{id}",id);
		const outcome =  await RESTUtils.create(this._endpoint + path, description);
		return outcome;
	}

	async update(schema, id, description) {
		const path = __REST_PATHS.all.replace("{schema}", schema).replace("{id}",id);
		const outcome = await RESTUtils.update(this._endpoint + path, description);
		return outcome;
	}

	async delete(schema, id) {
		const path = __REST_PATHS.all.replace("{schema}", schema).replace("{id}",id);
		const outcome = await RESTUtils.delete(this._endpoint + path);
		return outcome;
	}

}

const __REST_PATHS = {
	all: '/{schema}',
	has: '/{schema}/{id}',
	create: '/{schema}/{id}',
	get: '/{schema}/{id}',
	update: '/{schema}/{id}',
	delete: '/{schema}/{id}'
};

