// /**
//  * @file JAG service.
//  *
//  * JAGService listen to update events from the model to commit change to storage.
//  *
//  * @author mvignati
//  * @copyright Copyright © 2020 IHMC, all rights reserved.
//  * @version 3.65
//  */
//
// import JAG from '../models/jag.js';
// import UndefinedJAG from '../models/undefined.js';
//
// const __SERVICES = new Map();
//
// export default class JAGService {
//
// 	/**
// 	 * Creates a new JAGService that uses the specified storage for persistence.
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
// 		const instance = new JAGService(id, storage);
// 		__SERVICES.set(id, instance);
//
// 		console.log(__SERVICES);
// 		return instance;
// 	}
//
// 	/**
// 	 * Retrieves all existing jags.
// 	 * @TODO: Should accept filtering options.
// 	 */
// 	async all() {
// 		const descriptions = await this._storage.all('jag');
// 		return descriptions.map(this._createModel.bind(this));
// 	}
//
// 	/**
// 	 * Retrieves the jag model for the specified urn.
// 	 */
// 	async get(urn) {
// 		const description = await this._storage.get('jag', urn);
//
// 		if (description === undefined) return null;
//
// 		return this._createModel(description);
// 	}
//
// 	/**
// 	 * Check for existence of the specified urn.
// 	 */
// 	async has(urn) {
// 		return await this._storage.has('jag', urn);
// 	}
//
// 	/**
// 	 * Creates a new jag with the specified model. This uses the urn property supplied in the model.
// 	 */
// 	async create(model) {
// 		// Service instance creating a model become implicitly responsible for handling updates to that model.
// 		// Multiple instances can be attached to a single model instance.
// 		model.addEventListener('update', this._handleUpdate.bind(this));
// 		const description = model.toJSON();
//
// 		await this._storage.create('jag', description.urn, description);
// 	}
//
// 	/**
// 	 * Updates an existing model with the specified content.
// 	 * @TODO: Identify if we want to allow partial updates. For now the whole model will be overwritten with the supplied data.
// 	 */
// 	update(model) {
// 		const description = model.toJSON();
// 		this._storage.update('jag', description.urn, description);
// 	}
//
// 	/**
// 	 * Removes the model with the existing urn from storage.
// 	 */
// 	remove(urn) {
//
// 	}
//
// 	/**
// 	 * Creates a model from a json description, stores it in cache and attaches the necessary listeners.
// 	 */
// 	_createModel(description) {
// 		const model = JAG.fromJSON(description);
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
