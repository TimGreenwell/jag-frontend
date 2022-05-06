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

	static confirmStorageChange({topic, schema, description}){
		this.sharedWorker.port.postMessage({topic: topic,schema: schema, description: description});
	}

	static async handleReceiveMessage(message) {
		let schema = message.data.schema;
		let topic = message.data.topic;
		let description = message.data.description;
		const newModel = await SchemaManager.deserialize(schema, description);
		this.notifySubscribers(topic, newModel);
	}

	static notifySubscribers(topic, data) {
		if(!this._subscribers.has(topic))
			return;
		this._subscribers.get(topic).forEach((l) => l(data));
	}
}

