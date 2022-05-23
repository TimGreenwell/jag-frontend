/**
 * @file Observable object that notifies subscribers.
 *
 * @author mvignati
 * @copyright Copyright © 2018 IHMC, all rights reserved.
 * @version 0.10
 *
 */

'use strict';

import SharedService from "../services/shared-service.js";
import SchemaManager from "../storages/schemas.js";

export default class SharedObservable extends SharedService {

    static {
        this._subscribers = new Map();
        this.sharedWorker = new SharedWorker('scripts/services/shared-worker.js');
        this.sharedWorker.port.onmessage = this.handleReceiveMessage.bind(this);
    }

    static get subscribers() {
        return this._subscribers;
    }

    /**
     * Interested listeners register an activity-type (topic) and
     * a subscriber-bound callback (subscriber)
     */
    static subscribe(topic, subscriber) {
        if (!this._subscribers.has(topic))
            this._subscribers.set(topic, new Set());
        this._subscribers.get(topic).add(subscriber);
    }

    /**
     * Listener to remove itself from further notifications
     * @TODO unused, untested
     */
    static unsubscribe(topic, subscriber) {
        this._subscribers.get(topic).delete(subscriber);
    }

    /**
     * Local action to be propagated across SharedWorker for remote listeners.
     */
    static confirmStorageChange({topic, schema, id, description}) {
        console.log("{} - - Database change confirmed, (" + id + "/" + topic + ") -- posting message across shared web worker")
        this.sharedWorker.port.postMessage({topic: topic, schema: schema, id: id, description: description});
    }

    /**
     * Remote action received from SharedWorker. Any included object-descriptions will
     * be deserialized here before further propagation.
     */
    static async handleReceiveMessage(message) {
        console.log("{} - - - Message received from web worker, (" + message.data.id + ") / (" + message.data.topic + ") posting to all subscribers");
        let schema = message.data.schema;
        let topic = message.data.topic;
        let description = message.data.description;
        let id = message.data.id;
        let dataModel = null;
       // let descriptorObj = JSON.parse(description);                 // only for rest :(
        console.log("{} - - - " + JSON.stringify(description))
        if (description) {
            dataModel = await SchemaManager.deserialize(schema, description);
        }
        console.log("notifying subscribers of a node delete")
        this.notifySubscribers(topic, dataModel, id);
    }

    /**
     * Final distribution of processed remote/local event messages
     * Callback functions were provided at initial subscription.
     */
    static notifySubscribers(topic, dataModel, id) {
        if (this._subscribers.has(topic)) {
            this._subscribers.get(topic).forEach((callBack) => {
                callBack(dataModel, id);
            });
        }
        else
        {console.log("No subscribers to : " + topic)}
    }
}

