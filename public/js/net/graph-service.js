'use strict';

import Listenable from '../listenable.js';

export default class GraphService extends Listenable {

	constructor() {
		super();
	}

	connect() {
		this._ch = new WebSocket('ws://localhost:8887');
		this._ch.addEventListener('open', this._handleConnection.bind(this));
		this._ch.addEventListener('message', this._handleMessage.bind(this));
	}

	_handleConnection(e) {
		this.notify('connection-opened');
	}

	_handleMessage(e) {
		const data = JSON.parse(e.data);
		console.log(data);
		this.notify(data.type, data);
	}

	runGraph(urn, provider) {
		const payload = {
			type: 'run',
			data: {
				urn: urn,
				provider: provider
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

