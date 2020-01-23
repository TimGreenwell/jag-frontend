/**
 * @file Observable object that notifies subscribers.
 *
 * @author mvignati
 * @copyright Copyright © 2018 IHMC, all rights reserved.
 * @version 0.09
 */

'use strict';

export default class Observable {

	constructor() {
		this._subscribers = new Map();
	}

	subscribe(topic, subscriber) {
		if(!this._subscribers.has(topic))
			this._subscribers.set(topic, new Set());

		this._subscribers.get(topic).add(subscriber);
	}

	unsubscribe(topic, subscriber) {
		this._subscribers.get(topic).delete(subscriber);
	}

	notify(topic, data) {
		if(!this._subscribers.has(topic))
			return;

		this._subscribers.get(topic).forEach((l) => l(data));
	}
}

