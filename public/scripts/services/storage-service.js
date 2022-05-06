/**
 * @file JAG Model services
 *
 * @author IHMC-tg
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.01
 */

import JAG from "../models/jag.js";
import Node from  "../models/node.js";
import Observable from "../utils/observable.js";
import SchemaManager from '../storages/schemas.js';
import SharedService from "./shared-service.js";


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
     * @TODO : Please convert to descriptions.map...
     */
    static async all(schema = this._schema) {
        const descriptions = await this.__SERVICES.get(this._preferredStorage).all(schema);
        const models = [];
        const promisedModels = descriptions.map(async description => {
            const newModel = await SchemaManager.deserialize(schema,description);
            return newModel;
        })
        const newModels = await Promise.all(promisedModels);
        return newModels;
    }

    /**
     * Retrieves the jag model for the specified urn.
     */
    static async get(id, schema = this._schema) {
        const description = await this.__SERVICES.get(this._preferredStorage).get(schema, id);
        const model = await SchemaManager.deserialize(schema,description);
        return model;

        if(description === undefined) return null;
        //return this._createModel(description);
        console.log("You are missing //return this._createModel(description);");
        return description;
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
    static async create(createdModel, schema = this._schema) {
        // Service instance creating a model become implicitly responsible for handling updates to that model.
        // Multiple instances can be attached to a single model instance.
        // @TODO if sync - update all storages
        const description = createdModel.toJSON();
        await this.__SERVICES.get(this._preferredStorage).create(schema, SchemaManager.getKeyValue(schema,description),description);
        this.confirmStorageChange({topic:`${schema}-storage-created`,schema: schema, description: description});
    }

    /**
     * Updates an existing model with the specified content.
     * @TODO: Identify if we want to allow partial updates. For now the whole model will be overwritten with the supplied data.
     */
    static update(updatedModel, schema = this._schema) {
        console.log("in storageservice")
        console.log(updatedModel);
        //@TODO if sync - update all storages
        const description = updatedModel.toJSON();
        console.log(description);
        console.log("sending it to indexed db services");
        this.__SERVICES.get(this._preferredStorage).update(schema, SchemaManager.getKeyValue(schema,description),description);
        console.log("done sending it");
        this.confirmStorageChange({topic:`${schema}-storage-updated`,schema: schema, description: description});
    }





    /**
     * Removes the model with the existing urn from storage.
     */
    static delete(id, schema = this._schema) {
        //SchemaManager.getKey(schema)
        this.__SERVICES.get(this._preferredStorage).delete(id,schema);
        this.confirmStorageChange({topic:`${schema}-storage-deleted`,schema: schema, description: id});
    }
}

