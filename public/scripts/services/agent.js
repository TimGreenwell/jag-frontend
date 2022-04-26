// /**
//  * @file Agent model service.
//  *
//  * @author cwilber
//  * @copyright Copyright © 2020 IHMC, all rights reserved.
//  * @version 0.08
//  */
//
// import AgentModel from '../models/agent.js';
//
// const __SERVICES = new Map();
//
// export default class AgentService {
//
// 	/**
// 	 * Creates a new AgentService that uses the specified storage for persistence.
// 	 */
// 	constructor(id, storage) {
// 		this._id = id;
// 		this._storage = storage;
// 		// @TODO: nothing is cached just yet.
// 		this._cache = new Map();
// 	}
//
// 	/**
// 	 * Retrieves a named instance of the service if it exists.
// 	 */
// 	static instance(id) {
// 		if(!__SERVICES.has(id))
// 			throw new Error(`No service instance '${id}'.`);
//
// 		return __SERVICES.get(id);
// 	}
//
// 	/**
// 	 * Creates a named instance of the service backed by the specified storage.
// 	 */
// 	static createInstance(id, storage) {
// 		if(__SERVICES.has(id))
// 			throw new Error(`There already exists a service instance named ${id}.`);
//
// 		const instance = new AgentService(id, storage);
// 		__SERVICES.set(id, instance);
//
// 		console.log(__SERVICES);
// 		return instance;
// 	}
//
// 	/**
// 	 * Retrieves all existing agents.
// 	 * @TODO: Should accept filtering options.
// 	 */
// 	async all() {
// 		const descriptions = await this._storage.all('agent');
// 		return descriptions.map(this._createModel.bind(this));
// 	}
//
// 	/**
// 	 * Retrieves the agent model for the specified id.
// 	 */
// 	async get(id) {
// 		const description = await this._storage.get('agent', id);
//
// 		if (description === undefined) return null;
//
// 		return this._createModel(description);
// 	}
//
// 	/**
// 	 * Check for existence of the specified id.
// 	 */
// 	async has(id) {
// 		return await this._storage.has('agent', id);
// 	}
//
// 	/**
// 	 * Creates a new agent with the specified model. This uses the id property supplied in the model.
// 	 */
// 	async create(model) {
// 		// Service instance creating a model become implicitly responsible for handling updates to that model.
// 		// Multiple instances can be attached to a single model instance.
// 		model.addEventListener('update', this._handleUpdate.bind(this));
// 		const description = model.toJSON();
//
// 		await this._storage.create('agent', description.id, description);
// 	}
//
// 	/**
// 	 * Updates an existing model with the specified content.
// 	 * @TODO: Identify if we want to allow partial updates. For now the whole model will be overwritten with the supplied data.
// 	 */
// 	update(model) {
// 		const description = model.toJSON();
// 		this._storage.update('agent', description.id, description);
// 	}
//
// 	/**
// 	 * Removes the model with the existing id from storage.
// 	 */
// 	remove(id) {
//
// 	}
//
// 	/**
// 	 * Creates a model from a json description, stores it in cache and attaches the necessary listeners.
// 	 */
// 	_createModel(description) {
// 		const model = AgentModel.fromJSON(description);
// 		// Listen to update events to commit the change in storage.
// 		model.addEventListener('update', this._handleUpdate.bind(this));
//
// 		// @TODO: store model in cache
// 		return model;
// 	}
//
// 	/**
// 	 * Handles model update.
// 	 */
// 	_handleUpdate(e) {
// 		const model = e.target;
//
// 		// @TODO: check that we are responsible for this model.
// 		this.update(model);
// 	}
//
// }
//
