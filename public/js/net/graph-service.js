'use strict';

export default class GraphService {

	constructor() {
		this._ch = new WebSocket('ws://localhost:8887');
		this._ch.addEventListener('open', this._handleConnection.bind(this));
		this._ch.addEventListener('message', this._handleMessage.bind(this));
	}

	_handleConnection(e) {
		console.log('New connection.');
	}

	_handleMessage(e) {
		const data = JSON.parse(e.data);
		if(data.type == "inputs")
			this._displayInputs(data.inputs);
		else if(data.type == "resources")
			this._displayInputs(data.resources);
	}

	_displayInputs(inputs) {
		inputs.forEach(input => console.log(input));
	}
}

