import KPLGoal from './kpl-node-goal.js';
import KPLActivity from './kpl-node-activity.js';
import KPLEdge from './kpl-edge.js';


class PlaygroundElement extends HTMLElement {
	createdCallback() {
		console.log('Play ground created');
		this._nodes = [];
		this._selected = new Set();
		this._is_edge_being_created = false;
		this.initMenu();
		this.initGlobalEvents();
	}

	initMenu() {
		let add_root_goal = document.querySelector('#new-root');
		let add_subgoal = document.querySelector('#new-subgoal');
		let add_activity = document.querySelector('#new-activity');

		add_root_goal.addEventListener('click', this.addRootGoal.bind(this));
		add_subgoal.addEventListener('click', this.addSubGoal.bind(this));
		add_activity.addEventListener('click', this.addActivity.bind(this));
		let del_node_button = document.querySelector('#del-node');
		del_node_button.addEventListener('click', this.deleteSelected.bind(this));
	}

	initGlobalEvents() {
		this.addEventListener('mousedown', this.deselectAll.bind(this));
		this.addEventListener('mousemove', this.onEdgeUpdated.bind(this));
		this.addEventListener('mouseup', this.onEdgeCanceled.bind(this));
	}

	_initGenericNode(node) {
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
		this.appendChild(node);
		return node;
	}

	addRootGoal() {
		let node = new KPLGoal();
		node.setTitle('Root goal');
		node = this._initGenericNode(node);

		node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
	}

	addSubGoal() {
		let node = new KPLGoal();
		node.setTitle('Subgoal');
		node = this._initGenericNode(node);

		node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
		node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));
	}

	addActivity() {
		let node = new KPLActivity();
		node = this._initGenericNode(node);

		node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));
	}

	deselectAll() {
		this._selected.forEach(n => n.setSelected(false));
	}

	deleteSelected() {
		for(let node of this._selected) {
			console.log('removing node', node);
			node.removeAllEdges();
			this._selected.delete(node);
			this.removeChild(node);
		}
	}

	onEdgeInitialized(e, node) {

		let svg = document.querySelector('kpl-playground svg');
		this._created_edge = new KPLEdge();
		this._created_edge.setNodeOrigin(node);

		this._is_edge_being_created = true;
		this._created_edge.setEnd(e.clientX, e.clientY);

		svg.appendChild(this._created_edge);
	}

	onEdgeUpdated(e) {
		if(!this._is_edge_being_created)
			return;

		this._created_edge.setEnd(e.clientX, e.clientY);
	}

	onEdgeFinalized(e, node) {
		if(!this._is_edge_being_created)
			return;
		this._is_edge_being_created = false;
		this._created_edge.setNodeEnd(node);
	}

	onEdgeCanceled(e, node) {
		if(!this._is_edge_being_created)
			return;
		this._created_edge.remove();
		this._created_edge = undefined;
		this._is_edge_being_created = false;
	}
}

export default document.registerElement('kpl-playground', PlaygroundElement);