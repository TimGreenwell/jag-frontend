/**
 * @file JAG Model services
 *
 * @author IHMC-tg
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.01
 */

import JAG from "../models/jag.js";
import Observable from "../utils/observable.js";

export default class StorageService extends Observable{

    static {
        this.__SERVICES = new Map();         // mapping service name to service instance
        this._preferredStorage = undefined;  // service instance for reads
        this._storagesSynced = true;         // write to all storages or just preferredStorage
        this._schema = undefined;            // specific schema within Storage
    }

    /**
     * Retrieves a storage instance of the service if it exists.
     */

    static getStorageInstance(id) {

        if(!this.__SERVICES.has(id))
            throw new Error(`No service instance '${id}'.`);
        return this.__SERVICES.get(id);
    }

    static addStorageInstance(id, instance) {
        if ((typeof this.__SERVICES != 'undefined' ) && (this.__SERVICES.has(id))) {
            throw new Error(`There already exists a service instance named ${id}.`)
        };
        this.__SERVICES.set(id, instance);
        if (typeof this._preferredStorage == "undefined") {
            this._preferredStorage = id
        };
    }

    static areStoragesSynced(){
        return this._storagesSynced;
    }

    static setStoragesSynced(syncStorages){
        this._storagesSynced=syncStorages;
    }

    getPreferredStorage(){
        return this._preferredStorage;
    }

    static setPreferredStorage(preferredStorage){
        this._preferredStorage=preferredStorage;
    }

    getSchema(){
        return this._schema;
    }

    static setSchema(schema){
        this._schema=schema;
    }

    /**
     * Retrieves all existing jags.
     * @TODO: Should accept filtering options.
     */
    static async all(schema = this._schema) {
        const descriptions = await this.__SERVICES.get(this._preferredStorage).all(schema);
        return descriptions.map(this._createModel.bind(this));
    }

    /**
     * Retrieves the jag model for the specified urn.
     */
    static async get(urn, schema = this._schema) {
        const description = await this.__SERVICES.get(this._preferredStorage).get(schema, urn);
        if(description === undefined) return null;
        return this._createModel(description);
    }

    /**
     * Check for existence of the specified urn.
     */
    static async has(urn, schema = this._schema) {
        return await this.__SERVICES.get(this._preferredStorage).has(schema, urn);
    }

    /**
     * Creates a new jag with the specified model. This uses the urn property supplied in the model.
     */
    static async create(modelNode, schema = this._schema) {
        // Service instance creating a model become implicitly responsible for handling updates to that model.
        // Multiple instances can be attached to a single model instance.
        // @TODO if sync - update all storages
        modelNode.addEventListener('update', this._handleUpdate.bind(this));
        const description = modelNode.toJSON();
        await this.__SERVICES.get(this._preferredStorage).create(schema, description.urn, description);
        const temp = JAG.fromJSON(description);
        this.notify("storage-created",temp);
    }

    /**
     * Updates an existing model with the specified content.
     * @TODO: Identify if we want to allow partial updates. For now the whole model will be overwritten with the supplied data.
     */
    static update(modelNode, schema = this._schema) {
        //@TODO if sync - update all storages
        const description = modelNode.toJSON();
        this.__SERVICES.get(this._preferredStorage).update(schema, description.urn, description);
        this.notify("storage-updated",description);
    }

    /**
     * Removes the model with the existing urn from storage.
     */
    static remove(schema = this._schema, urn) {
        this.__SERVICES.get(this._preferredStorage).update(description);
        this.notify("storage-removed",urn);
    }

    /**
     * Creates a modelNode from a json description, stores it in cache and attaches the necessary listeners.
     */
    static _createModel(description) {
        const model = JAG.fromJSON(description);
        // Listen to update events to commit the change in storage.
        model.addEventListener('update', this._handleUpdate.bind(this));
        // @TODO: store model in cache
        return model;
    }

    /**
     * Handles model update.
     */
    static _handleUpdate(e) {
        const model = e.target;

        // @TODO: check that we are responsible for this model.
        this.update(model);
    }

}

