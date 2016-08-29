'use strict';

import Listenable from '../listenable.js';

export default class GraphService extends Listenable {

	constructor() {
		super();
	}

	connect() {
		const host = window.location.hostname;
		this._ch = new WebSocket(`ws://${host}:8887`);
		this._ch.addEventListener('open', this._handleConnection.bind(this));
		this._ch.addEventListener('message', this._handleMessage.bind(this));
		this._ch.addEventListener('error', this._handleConnection.bind(this));
	}

	_handleConnection(e) {
		this.notify('connection', {
			type: e.type,
			data: {
				timestamp: e.timestamp,
				websocket: e.target
			}
		});
	}

	_handleMessage(e) {
		const data = JSON.parse(e.data);
		this.notify(data.type, data);
	}

	runGraph(urn, data) {
		const payload = {
			type: 'run',
			data: {
				urn: urn,
				inputs: data.inputs,
				actor: data.actor
			}
		};
		this._ch.send(JSON.stringify(payload));
	}

	uploadGraph(graph) {
		const payload = {
			type: 'upload',
			data: graph
		};
		this._ch.send(JSON.stringify(payload));
	}
}

