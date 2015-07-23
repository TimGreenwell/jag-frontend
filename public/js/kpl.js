import KPLNodeElement from './goal-element.js';

export class KAoSPlannerLite {

	constructor() {
		console.log('Initializing KPL');
		this.initMenu();
		this._playground = document.querySelector('div.playground');
		this._nodes = [];
	}

	initMenu() {
		let add_node_button = document.querySelector('#new-node');
		add_node_button.addEventListener('click', this.addNode.bind(this));
	}

	addNode() {
		let node = document.createElement('kpl-node-element');
		this._nodes.push(node);
		this._playground.appendChild(node);
	}
}
