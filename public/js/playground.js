'use strict';

import GraphNode from './graph/node.js';
import NodeElement from './ui/node.js';
import KPLEdge from './kpl-edge.js';
import Listenable from './listenable.js';

export default class Playground extends Listenable {

	constructor(playground_container) {
		super();
		this._container = playground_container;
		this._edges_container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this._edges_container.setAttribute('version', '1.1');
		this._edges_container.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		this._container.appendChild(this._edges_container);

		this._nodes_container = document.createElement('div');
		this._container.appendChild(this._nodes_container);

		this._nodes = [];
		this._selected = new Set();
		this._is_edge_being_created = false;

		this.initGlobalEvents();
	}

	initGlobalEvents() {
		document.addEventListener('keydown', this.onKeyDown.bind(this));
		this._container.addEventListener('mousedown', (e) => {
			this.deselectAll();
			this.notify('selection', this._selected);
		});

		this._container.addEventListener('mousemove', this.onEdgeUpdated.bind(this));
		this._container.addEventListener('mouseup', this.onEdgeCanceled.bind(this));
		this._container.addEventListener('dragenter', this.onPreImport.bind(this));
		this._container.addEventListener('dragover', this.cancelDefault.bind(this));
		this._container.addEventListener('drop', this.onImport.bind(this));
	}

	getSelectedAsJSON() {
		if(this._selected.size != 1)
			return undefined;

		return this._selected.values().next().value.model.toJSON();
	}

	getSelectedURN() {
		return this._selected.values().next().value.model.urn;
	}

	addNode(node_definition) {
		const node_model = GraphNode.fromJSON(node_definition);
		const node = new NodeElement(node_model);

		node.element.addEventListener('mousedown', (e) => {
			// If meta isn't pressed clear previous selection
			if(!e.metaKey) {
				this.deselectAll();
			}

			this._selected.add(node);
			node.setSelected(true);
			this.notify('selection', this._selected);
			e.stopPropagation();
		});
		node.element.addEventListener('keydown', this.onKeyDown.bind(this));
		node.setTranslation(50, 50);

		this._nodes.push(node);
		this._nodes_container.appendChild(node.element);

		node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
		node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));
		return node;
	}

	deselectAll() {
		this._selected.forEach(n => n.setSelected(false));
		this._selected.clear();
	}

	deleteSelected() {
		for(let node of this._selected) {
			console.log('removing node', node);
			node.removeAllEdges();
			this._selected.delete(node);
			this._nodes_container.removeChild(node.element);
		}
	}

	fromClientToPlaygroundCoordinates(x, y) {
		const playground = this._container;
		const px = x - playground.offsetLeft;
		const py = y - playground.offsetTop;
		return [px, py];
	}

	handleItemSelected(item) {
		this.addNode(item);
	}

	_createEdge(origin) {
		const edge = new KPLEdge();

		edge.setNodeOrigin(origin);
		this._edges_container.appendChild(edge);
		return edge;
	}

	onKeyDown(e) {
		if(e.key == 'Delete')
			this.deleteSelected();
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

		this._is_edge_being_created = false;
		this._created_edge.setNodeEnd(node);

		// TEMPORARY QUICK HACK ! VERY BAD ! DO NOT DO ! PLEASE FIX !
		this._created_edge._node_origin.model.addChild(node.model);
	}

	onEdgeCanceled(e, node) {
		if(!this._is_edge_being_created)
			return;
		this._created_edge.remove();
		this._created_edge = undefined;
		this._is_edge_being_created = false;
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
}

