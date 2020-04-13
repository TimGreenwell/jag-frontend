/**
 * @file Playground - Visual area for authoring JAGs.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.29
 */

import JAG from './models/jag.js';
import JAGNode from './views/jag-node.js';
import Edge from './views/edge.js';

customElements.define('jag-playground', class extends HTMLElement {

	constructor() {
		super();
		this._edges_container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this._edges_container.setAttribute('version', '1.1');
		this._edges_container.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

		this.appendChild(this._edges_container);

		this._nodes_container = document.createElement('div');
		this.appendChild(this._nodes_container);

		this._nodes = [];
		this._selected = new Set();
		this._is_edge_being_created = false;

		this._boundHandleEdgeSelected = this._handleEdgeSelected.bind(this);

		this.initGlobalEvents();
	}

	initGlobalEvents() {
		document.addEventListener('keydown', this.onKeyDown.bind(this));
		this.addEventListener('mousedown', (e) => {
			this.deselectAll();
			this.dispatchEvent(new CustomEvent('selection', { detail: this._selected }));
			this._edges_container.dispatchEvent(new MouseEvent('click', { clientX: e.clientX, clientY: e.clientY }));
		});

		this.addEventListener('mousemove', this.onEdgeUpdated.bind(this));
		this.addEventListener('mouseup', this.onEdgeCanceled.bind(this));
		this.addEventListener('dragenter', this.onPreImport.bind(this));
		this.addEventListener('dragover', this.cancelDefault.bind(this));
		this.addEventListener('drop', this.onImport.bind(this));
	}

	getSelectedAsJSON() {
		if(this._selected.size == 0)
			return undefined;

		return this._selected.values().next().value.model.toJSON();
	}

	getSelectedURN() {
		if(this._selected.size == 0)
			return undefined;

		return this._selected.values().next().value.model.urn;
	}

	addNode(node_definition, expanded) {
		const node_model = node_definition;
		const node = new JAGNode(node_model, expanded);

		node.addEventListener('mousedown', (e) => {
			// If meta isn't pressed clear previous selection
			if(!e.shiftKey) {
				this._selected.forEach(local_node => {
					if(local_node != node)
						local_node.setSelected(false);
				});
				this._selected.clear();
			}

			this._selected.add(node);
			node.setSelected(true);
			this.dispatchEvent(new CustomEvent('selection', { detail: this._selected }));
			e.stopPropagation();
		});

		node.addEventListener('keydown', this.onKeyDown.bind(this));

		this._nodes.push(node);
		this._nodes_container.appendChild(node);

		node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
		node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));
		return node;
	}

	deselectAll() {
		this._selected.forEach(n => n.setSelected(false));
		this._selected.clear();
	}

	deleteSelected() {
		for(let n of this._selected) {
			if (n instanceof JAGNode) {
				n.removeAllEdges();
				this._nodes_container.removeChild(n);
			} else if (n instanceof Edge) {
				n.delete();
			}

			this._selected.delete(n);
		}
	}

	clearPlayground() {
		for (let node of this._nodes) {
			node.removeAllEdges();

			if (this._nodes_container.contains(node))
				this._nodes_container.removeChild(node);
		}

		this._nodes = [];
	}

	fromClientToPlaygroundCoordinates(x, y) {
		const px = x - this.offsetLeft;
		const py = y - this.offsetTop;
		return [px, py];
	}

	handleItemSelected(item) {
		this._addNodeRecursive(item);

		// if(item.top) {
		// 	this._addNodeRecursive(item);
		// } else {
		// 	const ch = this.clientHeight;
		// 	const node = this.addNode(item);
		// 	node.setTranslation(10 + node.clientWidth / 2.0 ,ch/2);
		// }
	}

	_createEdge(origin, id = undefined) {
		const edge = new Edge(this._edges_container);
		edge.setNodeOrigin(origin);
		if (id) edge.setChildId(id);
		return edge;
	}

	onKeyDown(e) {
		if (e.key == 'Delete') {
			if (e.ctrlKey) {
				this.clearPlayground();
			} else {
				this.deleteSelected();
			}
		}
	}

	onEdgeInitialized(e, node) {
		this._created_edge = this._createEdge(node);
		this._is_edge_being_created = true;

		const [x, y] = this.fromClientToPlaygroundCoordinates(e.clientX, e.clientY);
		this._created_edge.setEnd(x, y);
	}

	onEdgeUpdated(e) {
		if(!this._is_edge_being_created)
			return;

		const [x, y] = this.fromClientToPlaygroundCoordinates(e.clientX, e.clientY);
		this._created_edge.setEnd(x, y);
	}

	onEdgeFinalized(e, node) {
		if(!this._is_edge_being_created)
			return;

		if (window.confirm("Are you sure you want to add this node as a child? (This will change all instances of the parent node to reflect this change.)")) {
			this._is_edge_being_created = false;
			this._created_edge.setNodeEnd(node);
			this._created_edge.addEventListener('selection', this._boundHandleEdgeSelected);
		} else {
			this.cancelEdge();
		}
	}

	cancelEdge() {
		if(!this._is_edge_being_created)
			return;
		this._created_edge.destroy();
		this._created_edge = undefined;
		this._is_edge_being_created = false;
	}

	onEdgeCanceled(e, node) {
		this.cancelEdge();
	}

	onPreImport(e) {
		console.log('pre imp');
	}

	onImport(e) {
		e.preventDefault();
		const files = e.dataTransfer.files;
		const reader = new FileReader();
		reader.addEventListener('load', function(content) {});
		reader.readAsText(files[0]);
	}

	cancelDefault(e) {
		e.preventDefault();
	}

	_addNodeRecursive(item) {
		const margin = 50;
		const model_set = item.model_set;

		const recursive_add = (sub_item, x, y) => {
			const node = this.addNode(sub_item, item.expanded);
			
			node.setTranslation(x + node.clientWidth / 2.0 ,y);

			if(!sub_item.children)
				return node;

			const preferred_size = this._getNodePreferredHeight(sub_item, model_set);

			// assume all children have same height as the parent.
			const node_height = node.clientHeight + margin;
			const preferred_height = preferred_size * node_height;

			const x_offset = x + node.clientWidth + margin;
			let y_offset = y - preferred_height / 2;

			sub_item.children.forEach((child) => {
				const def = model_set.get(child.urn);
				const local_preferred_size = this._getNodePreferredHeight(def, model_set);
				y_offset += (local_preferred_size * node_height) / 2;
				const sub_node = recursive_add(def, x_offset, y_offset);
				y_offset += (local_preferred_size * node_height) / 2;
				let edge = this._createEdge(node, child.id);
				edge.setNodeEnd(sub_node);
				edge.addEventListener('selection', this._boundHandleEdgeSelected);
			});

			return node;
		}

		const ch = this.clientHeight;
		recursive_add(item.model, 10, ch/2);
	}

	_getNodePreferredHeight(item, model_set) {
		if (!item.children || item.children.length === 0)
			return 1;

		return item.children.reduce((cut_set_size, child) => {
			const def = model_set.get(child.urn);
			return cut_set_size + (def ? this._getNodePreferredHeight(def, model_set) : 0);
		}, 0);
	}

	_generateActivityGraphFromJSON(json) {
		console.log(json);
		let root_goal = json.rootGoal;
		let root_node = this.addRootGoal(root_goal.name, root_goal.description);
		root_node.getConnector().setType(root_goal.connectorType);
		root_node.setTranslation(50, 50);
		this._generateSubGoals(root_node, root_goal);
	}

	_generateSubGoals(root_node, root) {
		let x_start = root_node._translation.x,
			y_offset = root_node._translation.y + 150;

		if(!root.subgoals)
			return;

		root.subgoals.forEach(subgoal => {
			let node;
			if(subgoal.type == 'GOAL') {
				node = this.addSubGoal(subgoal.item.name, subgoal.item.description);
				node.getConnector().setType(subgoal.item.connectorType);
			} else {
				node = this.addActivity(subgoal.item.name, subgoal.item.description);
			}

			node.setTranslation(x_start, y_offset);

			let edge = this._createEdge(root_node);
			edge.setNodeEnd(node);

			this._generateSubGoals(node, subgoal.item);

			x_start += 175;
		});
	}

	_handleEdgeSelected(e)  {
		if (e.detail.selected) {
			this._selected.add(e.target);
		} else {
			this._selected.delete(e.target);
		}
	}
});

export default customElements.get('jag-playground');
