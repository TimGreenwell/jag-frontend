import KPLNodeElement from './goal-element.js';

export class KAoSPlannerLite {

	constructor() {
		console.log('Initializing KPL');
		this._playground = document.querySelector('div.playground');
		this._nodes = [];
		this._selected = new Set();

		this.initMenu();
		this.initGlobalEvents();
	}

	initMenu() {
		let add_node_button = document.querySelector('#new-node');
		add_node_button.addEventListener('click', this.addNode.bind(this));
		let del_node_button = document.querySelector('#del-node');
		del_node_button.addEventListener('click', this.deleteSelected.bind(this));
	}

	initGlobalEvents() {
		this._playground.addEventListener('mousedown', this.deselectAll.bind(this));
	}

	addNode() {
		let node = document.createElement('kpl-node-element');
		node.addEventListener('mousedown', (e) => {
			console.log('adding', node, 'to selected set');
			// If meta isn't pressed clear previous selection
			if(!e.metaKey) {
				this.deselectAll();
				this._selected.clear();
			}

			this._selected.add(node);
			node.setSelected(true);
			e.stopPropagation();
		});
		this._nodes.push(node);
		this._playground.appendChild(node);
	}

	deselectAll() {
		this._selected.forEach(n => n.setSelected(false));
	}

	deleteSelected() {
		for(let node of this._selected) {
			console.log('removing node', node);
			this._selected.delete(node);
			this._playground.removeChild(node);
		}
	}
}
