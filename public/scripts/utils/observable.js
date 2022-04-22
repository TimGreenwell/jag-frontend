/**
 * @file Observable object that notifies subscribers.
 *
 * @author mvignati
 * @copyright Copyright © 2018 IHMC, all rights reserved.
 * @version 0.09
 */

'use strict';

export default class Observable {

	static {
		this._subscribers = new Map();
	}

	static subscribe(topic, subscriber) {
		if(!this._subscribers.has(topic))
			this._subscribers.set(topic, new Set());

		this._subscribers.get(topic).add(subscriber);
	}

	static unsubscribe(topic, subscriber) {
		this._subscribers.get(topic).delete(subscriber);
	}

	static notify(topic, data) {
		if(!this._subscribers.has(topic))
			return;

		this._subscribers.get(topic).forEach((l) => l(data));
	}
}

