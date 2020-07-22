/**
 * @file Handles storage of joint-activity-graphs using a REST interface.
 *
 * @author mvignati
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.16
 */

import RESTUtils from '../utils/rest.js';

export default class RESTStorage {

	constructor(name, version, endpoint) {
		this._name = name,
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

	async all() {
		const keys = await RESTUtils.list(this._endpoint, __REST_PATHS.list);
		return keys;
	}

	async get(urn) {
		const description = await RESTUtils.get(this._endpoint, __REST_PATHS.read, urn);
		return description;
	}

	async has(urn) {
		const exists = await RESTUtils.check(this._endpoint, __REST_PATHS.check, urn);
		return exists;
	}

	async create(description) {
		return await RESTUtils.create(this._endpoint, __REST_PATHS.create, description.urn, description);
	}

	async update(description) {
		return await RESTUtils.update(this._endpoint, __REST_PATHS.update, description.urn, description);
	}
}

const __REST_PATHS = {
	list: '/jags',
	check: '/jags/{urn}',
	create: '/jags/{urn}',
	read: '/jags/{urn}',
	update: '/jags/{urn}',
	delete: '/jags/{urn}'
};

