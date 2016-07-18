'use strict';

export default class Listenable {

	constructor() {
		this._listeners = new Map();
	}

	addListener(type, listener) {
		if(!this._listeners.has(type))
			this._listeners.set(type, new Set());

		this._listeners.get(type).add(listener);
	}

	removeListener(type, listener) {
		this._listeners.get(type).delete(listener);
	}

	notify(type, data) {
		if(!this._listeners.has(type))
			return;

		this._listeners.get(type).forEach((l) => l(data));
	}
}

