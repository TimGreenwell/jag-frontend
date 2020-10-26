/**
 * @fileOverview Analysis service.
 *
 * @author mvignati
 * @version 0.20
 */

'use strict';

import Analysis from '../models/analysis.js';

const __SERVICES = new Map();

export default class AnalysisService {

	/**
	 * Creates a new AnalysisService that uses the specified storage for persistence.
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

		const instance = new AnalysisService(id, storage);
		__SERVICES.set(id, instance);

		console.log(__SERVICES);
		return instance;
	}

	/**
	 * Retrieves all existing analyses.
	 * @TODO: Should accept filtering options.
	 */
	async all() {
		const descriptions = await this._storage.all('analysis');

		const models = [];
		for (let description of descriptions) {
			const model = await this._createModel(description);
			models.push(model);
		}

		return models;
	}

	/**
	 * Retrieves the analysis model for the specified ID.
	 */
	async get(id) {
		const description = await this._storage.get('analysis', id);

		if (description === undefined) return null;

		return await this._createModel(description);
	}

	/**
	 * Check for existence of the specified ID.
	 */
	async has(id) {
		return await this._storage.has('analysis', id);
	}

	/**
	 * Creates a new analysis with the specified model. This uses the ID property supplied in the model.
	 */
	async create(model) {
		// Service instance creating a model become implicitly responsible for handling updates to that model.
		// Multiple instances can be attached to a single model instance.
		model.addEventListener('update', this._handleUpdate.bind(this));
		const description = model.toJSON();

		await this._storage.create('analysis', description.id, description);
	}

	/**
	 * Updates an existing model with the specified content.
	 * @TODO: Identify if we want to allow partial updates. For now the whole model will be overwritten with the supplied data.
	 */
	update(model) {
		const description = model.toJSON();
		this._storage.update('analysis', description.id, description);
	}

	/**
	 * Creates a model from a json description, stores it in cache and attaches the necessary listeners.
	 */
	async _createModel(description) {
		const model = await Analysis.fromJSON(description);
		model.addEventListener('update', this._handleUpdate.bind(this));

		// @TODO: store model in cache
		return model;
	}

	/**
	 * Handles model update.
	 */
	_handleUpdate(e) {
		const model = e.target;

		// @TODO: check that we are responsible for this model.
		this.update(model);
	}

}
