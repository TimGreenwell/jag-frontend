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

class Playground extends HTMLElement {

	constructor() {
		super();
		this._edges_container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this._edges_container.setAttribute('version', '1.1');
		this._edges_container.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

		this.appendChild(this._edges_container);

		this._nodes_container = document.createElement('div');
		this.appendChild(this._nodes_container);

		this._nodes = new Set();
		this._selected = new Set();
		this._is_edge_being_created = false;

		this._content = document.createElement('div');
		this._content.className = "popup-box";
		this._content.style.visibility = "hidden";
		this.appendChild(this._content);

		this._popups = [];
		this._popupHighlights = [];

		this._boundHandleEdgeSelected = this._handleEdgeSelected.bind(this);

		this.initGlobalEvents();
	}

	static _createPopup(type, name, description, actions) {
		const _p = document.createElement("p");
		_p.classList.add("popup-content");
		_p.classList.add(type);

		const _name = document.createElement("span");
		_name.className = "popup-name";
		_name.innerText = name;

		const _description = document.createElement("span");
		_description.className = "popup-description";
		_description.innerText = description;

		_p.append(_name, _description);

		_p.setAttributeNS(null, 'popup-type', type);

		return { type: type, display: _p, actions: actions };
	}

	initGlobalEvents() {
		document.addEventListener('keydown', this.onKeyDown.bind(this));

		this.addEventListener('mousedown', (e) => {
			this.deselectAll();
			this.dispatchEvent(new CustomEvent('selection', { detail: this._selected }));
			this._edges_container.dispatchEvent(new MouseEvent('click', { clientX: e.clientX, clientY: e.clientY }));
		});

		this.addEventListener('mousemove', (e) => {
			this._edges_container.dispatchEvent(new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY }));
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

		this._nodes.add(node);
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
		for (let e of this._selected) {
			if (e instanceof Edge) {
				const parent = e.getNodeOrigin();

				if (!this._selected.has(parent)) {
					const child = e.getNodeEnd();
					const {x, y, width} = child.getBoundingClientRect();
					this.popup(Playground.NOTICE_REMOVE_CHILD, x + (width / 2), y, function() { return child; }, [child]);
				} else {
					e.destroy();
				}
			}
		}

		for (let n of this._selected) {
			if (n instanceof JAGNode) {
				const parent = n.getParent();

				if (parent && !this._selected.has(parent)) {
					const {x, y, width} = n.getBoundingClientRect();
					this.popup(Playground.NOTICE_REMOVE_CHILD, x + (width / 2), y, function () { return n; }, [n]);
				} else {
					n.removeAllEdges();
					this._nodes.delete(n);
					this._nodes_container.removeChild(n);
				}

				n.setSelected(false);
			}
		}

		this._selected.clear();
	}

	clearPlayground() {
		for (let node of this._nodes) {
			node.removeAllEdges();
			this._nodes_container.removeChild(node);
		}

		this._nodes.clear();
	}

	fromClientToPlaygroundCoordinates(x, y) {
		const px = x - this.offsetLeft;
		const py = y - this.offsetTop;
		return [px, py];
	}

	handleItemSelected(item) {
		this._addNode(item);
	}

	_displayNextPopup() {
		if (this._popupCallback) {
			this._popupCallback();
		}

		for (let highlight of this._popupHighlights) {
			highlight.classList.remove(`${this._activePopup.content.type}-highlight`);
		}

		this._popupHighlights = [];

		if (this._popups.length > 0) {
			this._activePopup = this._popups.splice(0, 1)[0];

			if (!this._popups) this._popups = [];

			const {content, wx, wy, callback, highlights} = this._activePopup;

			this._content.innerHTML = "";
			this._content.appendChild(content.display);

			const {x, y} = this._nodes_container.getBoundingClientRect();
			this._content.style.left = (wx - x - 100) + "px";
			this._content.style.top = (wy - y - 160) + "px";

			this._popupHighlights = highlights;

			for (let highlight of highlights) {
				highlight.classList.add(`${content.type}-highlight`);
			}

			if (!this._popupInterval && !content.actions) {
				this._popupInterval = setInterval(this._displayNextPopup.bind(this), 4000);
			} else if (this._popupInterval && content.actions) {
				clearInterval(this._popupInterval);
				this._popupInterval = undefined;
			}

			if (content.actions) {
				for (const {text, color, bgColor, action} of content.actions) {
					const actionBtn = document.createElement('button');
					actionBtn.className = "popup-action";
					actionBtn.innerText = text;

					if (color) actionBtn.style.color = color;
					if (bgColor) actionBtn.style.backgroundColor = bgColor;

					actionBtn.onclick = function () {
						if (action) {
							if (callback) {
								action(callback());
							} else {
								action();
							}
						} else {
							callback();
						}

						this._displayNextPopup();
					}.bind(this);

					this._content.appendChild(actionBtn);
				}
			} else if (callback) {
				this._popupCallback = callback;
			}

			this._content.style.visibility = "visible";
		} else {
			if (this._popupInterval) {
				clearInterval(this._popupInterval);
				this._popupInterval = undefined;
			}

			this._popupCallback = undefined;

			this._activePopup = undefined;

			this._content.style.visibility = "hidden";
		}
	}

	popup(content, x, y, callback, highlights = []) {
		this._popups.push({
			content: content,
			wx: x,
			wy: y,
			callback: callback,
			highlights: highlights
		});

		if (!this._popupInterval && !this._activePopup) {
			this._displayNextPopup();
		}
	}

	handleRefresh(item) {
		const margin = 50;

		for (let node of this._nodes) {
			if (node.model === item.model) {
				let expanded = true;
				const parent = node.getParent();

				if (parent !== undefined) {
					expanded = parent.expanded;
				}

				const [x, y] = node.getPosition();

				this._addNodeRecursive(item.model, item.model_set, expanded, margin, x, y, node);
			}
		}
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

	_addNodeRecursive(sub_item, model_set, expanded, margin, x, y, parent = undefined) {
		const node = parent || this.addNode(sub_item, expanded);
		
		node.setTranslation(x + node.clientWidth / 2.0, y);

		if (!sub_item.children)
			return node;

		const preferred_size = this._getNodePreferredHeight(sub_item, model_set);

		// assume all children have same height as the parent.
		const node_height = node.clientHeight + margin;
		const preferred_height = preferred_size * node_height;

		const x_offset = x + node.clientWidth + margin;
		let y_offset = y - preferred_height / 2;

		const existing_children = new Map();
		for (const child_edge of node.getChildEdges()) {
			existing_children.set(child_edge.getChildId(), child_edge.getNodeEnd());
		}

		sub_item.children.forEach((child) => {
			const def = model_set.get(child.urn);
			const local_preferred_size = this._getNodePreferredHeight(def, model_set);
			y_offset += (local_preferred_size * node_height) / 2;

			const sub_node = this._addNodeRecursive(def, model_set, true, margin, x_offset, y_offset, existing_children.get(child.id));

			if (existing_children.has(child.id)) {
				existing_children.get(child.id).expanded = true;
			} else {
				y_offset += (local_preferred_size * node_height) / 2;
				let edge = this._createEdge(node, child.id);
				edge.setNodeEnd(sub_node);
				edge.addEventListener('selection', this._boundHandleEdgeSelected);
			}
		});

		for (const [id, child] of existing_children.entries()) {
			let actual = false;

			for (const actual_child of sub_item.children) {
				if (actual_child.id == id) {
					actual = true;
					break;
				}
			}

			if (!actual) {
				const tree = child.getTree();
				for (const node of tree) {
					node.removeAllEdges();
					this._nodes.delete(node);
					this._nodes_container.removeChild(node);
				}
			}
		}

		return node;
	}

	_addNode(item) {
		const margin = 50;
		const ch = this.clientHeight;
		this._addNodeRecursive(item.model, item.model_set, item.expanded, margin, 10, ch/2);
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
}

Playground.POPUP_TYPES = {
	WARNING: 'popup-warning',
	NOTICE: 'popup-notice',
	INFO: 'popup-info'
};

Playground.NOTICE_REMOVE_CHILD = Playground._createPopup(Playground.POPUP_TYPES.NOTICE, "Remove Child", "Remove this child from parent JAG?", [
	{ text: "Yes", color: "black", bgColor: "red", action: function (node) {
		const edge = node.getParentEdge();
		const id = edge.getChildId();
		const parent = node.getParent();

		parent.removeChild(edge, id);
	}},
	{ text: "No", color: "white", bgColor: "black" }
]);

customElements.define('jag-playground', Playground);

export default customElements.get('jag-playground');
