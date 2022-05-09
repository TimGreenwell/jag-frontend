/**
 * @file Observable object that notifies subscribers.
 *
 * @author mvignati
 * @copyright Copyright © 2018 IHMC, all rights reserved.
 * @version 0.09
 */

'use strict';

import SharedService from "../services/shared-service.js";
import SchemaManager from "../storages/schemas.js";

export default class SharedObservable extends SharedService{

	static {
		this._subscribers = new Map();
		this.sharedWorker = new SharedWorker('scripts/services/shared-worker.js');
		this.sharedWorker.port.onmessage = this.handleReceiveMessage.bind(this);
	}

	static get subscribers() {
		return this._subscribers;
	}

	static subscribe(topic, subscriber) {
		if(!this._subscribers.has(topic))
			this._subscribers.set(topic, new Set());
		this._subscribers.get(topic).add(subscriber);
	}

	static unsubscribe(topic, subscriber) {
		this._subscribers.get(topic).delete(subscriber);
	}

	static confirmStorageChange({topic, schema, id, description}){
		this.sharedWorker.port.postMessage({topic: topic,schema: schema, id: id, description: description});
	}

	static async handleReceiveMessage(message) {
console.log("Receiving message:.....");
console.log(message.data.schema)
		console.log(message.data.topic)
		console.log(message.data.description)
		console.log(message.data.id)

		let schema = message.data.schema;
		let topic = message.data.topic;
		let description = message.data.description;
		let id = message.data.id;
		let dataModel = null;
		if (description) {
			dataModel = await SchemaManager.deserialize(schema, description);
		}
		this.notifySubscribers(topic, dataModel, id);
	}

	static notifySubscribers(topic, dataModel, id) {
		console.log("Notifying subscribers:.....");
		console.log(topic)
		if (this._subscribers.has(topic)){
//			console.log("no subs - just returning");
//		return;}
		this._subscribers.get(topic).forEach((l) => {
			console.log(topic + " to " + l.name);
			l(dataModel, id);
		});
	}}
}

