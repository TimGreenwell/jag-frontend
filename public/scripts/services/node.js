/**
 * @fileOverview JAG Node service.
 *
 * @author mvignati
 * @version 0.14
 */

'use strict';

import Node from '../models/node.js'

const __SERVICES = new Map();

export default class NodeService {

	/**
	 * Creates a new NodeService that uses the specified storage for persistence.
	 */
	constructor(id, storage) {
		this._id = id;
		this._storage = storage;
		// @TODO: nothing is cached just yet.
		this._cache = new Map();
	}

	/**
	 * Retrieves a named instance of the service if it exists.
	 */
	static instance(id) {
		if(!__SERVICES.has(id))
			throw new Error(`No service instance '${id}'.`);

		return __SERVICES.get(id);
	}

	/**
	 * Creates a named instance of the service backed by the specified storage.
	 */
	static createInstance(id, storage) {
		if(__SERVICES.has(id))
			throw new Error(`There already exists a service instance named ${id}.`);

		const instance = new NodeService(id, storage);
		__SERVICES.set(id, instance);

		console.log(__SERVICES);
		return instance;
	}

	/**
	 * Retrieves all existing nodes.
	 * @TODO: Should accept filtering options.
	 */
	async all() {
		const descriptions = await this._storage.all('node');
		return descriptions.map(this._createModel.bind(this));
	}

	/**
	 * Retrieves the node model for the specified ID.
	 */
	async get(id) {
		const description = await this._storage.get('node', id);

		if (description === undefined) return null;

		return this._createModel(description);
	}

	/**
	 * Check for existence of the specified ID.
	 */
	async has(id) {
		return await this._storage.has('node', id);
	}

	/**
	 * Creates a new node with the specified model. This uses the ID property supplied in the model.
	 */
	async create(model) {
		// Service instance creating a model become implicitly responsible for handling updates to that model.
		// Multiple instances can be attached to a single model instance.
		// @TODO: attach listeners
		const description = model.toJSON();

		await this._storage.create('node', description.id, description);
	}

	/**
	 * Updates an existing model with the specified content.
	 * @TODO: Identify if we want to allow partial updates. For now the whole model will be overwritten with the supplied data.
	 */
	update(model) {
		const description = model.toJSON();
		this._storage.update('node', description.id, description);
	}

	/**
	 * Creates a model from a json description, stores it in cache and attaches the necessary listeners.
	 */
	_createModel(description) {
		const model = Node.fromJSON(description);
		// @TODO: attach listeners to model

		// @TODO: store model in cache
		return model;
	}

}
