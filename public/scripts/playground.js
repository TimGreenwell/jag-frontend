/**
 * @file Playground - Visual area for authoring JAGs.  Controls the general playground environment
 * including panning, zooming, adding and removing edges/nodes.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */

import JAGNode from './views/jag-node.js';
import Edge from './views/edge.js';
import Popupable from './utils/popupable.js';
import StorageService from "./services/storage-service.js";
import JAG from "./models/jag.js";
class Playground extends Popupable {

	constructor() {
		super();
		this._edges_container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this._edges_container.setAttribute('version', '1.1');
		this._edges_container.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		this._edges_container.id = "edges-container";
		this.appendChild(this._edges_container);

		this.$nodes_container = document.createElement('div');
		this.$nodes_container.id = "nodes-container";
		this.appendChild(this.$nodes_container);
		this.setPopupBounds(this.$nodes_container);

		this._activeNodesSet = new Set();
		this._selectedNodesSet = new Set();
		this._is_edge_being_created = false;

		this._cardinals = {
			left: this._createCardinal("left", 1, 0),
			right: this._createCardinal("right", -1, 0),
			up: this._createCardinal("up", 0, 1),
			down: this._createCardinal("down", 0, -1)
		};

		this._canMoveView = {
			left: false,
			right: false,
			up: false,
			down: false
		};

		this._showCardinals(this._canMoveView);

		this._zoomFactor = 1.00;

		this._boundHandleEdgeSelected = this._handleEdgeSelected.bind(this);
		this._boundOnEdgeUpdated = this.onEdgeUpdated.bind(this);
		this._boundOnEdgeCanceled = this.onEdgeCanceled.bind(this);
		this._boundDragView = this.dragView.bind(this);
		this._boundStopDragView = this.stopDragView.bind(this);

	   StorageService.subscribe("jag-storage-updated", this.updateJagNode.bind(this));
		StorageService.subscribe("jag-storage-created", this._addJagNodeTree.bind(this));
		StorageService.subscribe("jag-storage-deleted", this.deleteJagNode.bind(this));
		StorageService.subscribe("jag-storage-cloned", this._addJagNodeTree.bind(this));
		StorageService.subscribe("jag-storage-replaced", this.replaceJagNode.bind(this));
		this.initGlobalEvents();
	}


	_createCardinal(type, dx, dy) {
		const cardinal = document.createElement("div");
		cardinal.classList.add("cardinal");
		cardinal.classList.add(type);

		this.appendChild(cardinal);

		cardinal.addEventListener('mouseenter', () => {
			const hoverInterval = setInterval(function () {
				this._dragView(dx * Playground.DEFAULT_CARDINAL_MULTIPLIER, dy * Playground.DEFAULT_CARDINAL_MULTIPLIER);
			}.bind(this), 10);

			cardinal.addEventListener('mouseleave', () => {
				clearInterval(hoverInterval);
			});
		});

		return cardinal;
	}

	_checkBounds(nodes = this._activeNodesSet) {
		const bounds = this.getBoundingClientRect();
		let [minX, minY, maxX, maxY] = [bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height];
		let showLeft, showRight, showUp, showDown;

		for (const node of nodes) {
			if (node.visible) {
				const {x, y, width, height} = node.getBoundingClientRect();

				if (x < minX) showLeft = true;
				if (x + width > maxX) showRight = true;
				if (y < minY) showUp = true;
				if (y + height > maxY) showDown = true;
			}
		}

		if (nodes == this._activeNodesSet) {
			return this._showCardinals({
				left: showLeft || false,
				right: showRight || false,
				up: showUp || false,
				down: showDown || false
			});
		}

		return this._showCardinals({
			left: showLeft,
			right: showRight,
			up: showUp,
			down: showDown
		});
	}

	_showCardinals(toggle = {left, right, up, down}) {
		this._canMoveView = {
			left: toggle.left != undefined ? toggle.left : this._canMoveView.left,
			right: toggle.right != undefined ? toggle.right : this._canMoveView.right,
			up: toggle.up != undefined ? toggle.up : this._canMoveView.up,
			down: toggle.down != undefined ? toggle.down : this._canMoveView.down
		};

		for (const [key, value] of Object.entries(toggle)) {
			if (value == true || value == false) {
				this._cardinals[key].classList.toggle("visible", value);
			}
		}

		return this._canMoveView;
	}

	_zoomView(factor) {
		this._zoomFactor = factor;
		const transform = `scale(${factor})`;
		this._edges_container.style.transform = transform;
		this.$nodes_container.style.transform = transform;
		this._checkBounds();
	}

	_dragView(dx, dy) {
		for (let node of this._activeNodesSet) {
			node.translate(dx, dy, false);
		}

		this._checkBounds();
	}

	dragView(e) {
		const dx = e.clientX - this._initialMouse.x;
		const dy = e.clientY - this._initialMouse.y;

		this._dragView(dx, dy);

		this._initialMouse = { x: e.clientX, y: e.clientY };
	}

	stopDragView(e) {
		this.removeEventListener('mousemove', this._boundDragView);
	}

	fromClientToPlaygroundCoordinates(x, y) {
		const px = x - this.offsetLeft;
		const py = y - this.offsetTop;
		return [px, py];
	}

	initGlobalEvents() {
		// Turned this off temporarily.  Most keys have no function here.  They all work when
		// a node inside is selected
		// document.addEventListener('keydown', this.onKeyDown.bind(this));

		this.addEventListener('mousedown', (e) => {
			if (!e.shiftKey) this.deselectAll();
			this.dispatchEvent(new CustomEvent('playground-nodes-selected', { detail: this._selectedNodesSet }));
			this._edges_container.dispatchEvent(new MouseEvent('click', { clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey }));
			this._initialMouse = { x: e.clientX, y: e.clientY };
			this.addEventListener('mousemove', this._boundDragView);
			this.addEventListener('mouseup', this._boundStopDragView);
		});

		this.addEventListener('mousemove', (e) => {
			this._edges_container.dispatchEvent(new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY }));
		});

	//	this.addEventListener('dragenter', this.onPreImport.bind(this));     // what is this?
		this.addEventListener('dragover', this.cancelDefault.bind(this));
		this.addEventListener('drop', this.onImport.bind(this));
	}

	// getSelectedAsJSON() {
	// 	if(this._selectedNodesSet.size == 0)
	// 		return undefined;
	//
	// 	return this._selectedNodesSet.values().next().value.model.toJSON();
	// }

	// getSelectedURN() {
	// 	if(this._selectedNodesSet.size == 0)
	// 		return undefined;
	//
	// 	return this._selectedNodesSet.values().next().value.model.urn;
	// }

	deleteJagNode(deadUrn){
		console.log("Here in the delete zone");
		console.log(this._activeNodesSet);

		this._activeNodesSet.forEach((node) => {
			if (node.model.urn == deadUrn) {
			}
		})
	}

	replaceJagNode(newJagModel, deadUrn){
		this._activeNodesSet.forEach((node) => {
			if (node.model.urn == deadUrn) {
				node.model=newJagModel;
			}
		})
	}

	updateJagNode(updatedJagModel, updatedUrn) {
		// Going to be more complicated than originally thought.
		// 1) update activeNodeSet - replace existing node with this one.
		// 2) if change is just properties (name,urn,operator), update the node in $nodeContainer
		// 3.1) if change involes bindings or children, resync $nodeContainer with activeNodeSet?  <--- xxxx  no
		// 3.2) bindings can be handled with two normal property updates.  This leaves children..
		//   3.2.1) new child - one create then one update (new edge on update)
		//   3.2.1) remove child - (one destroy and one update) (edge removed on update)
		this._activeNodesSet.forEach((node) => {
			//	for (const node of this._activeNodesSet) {

			if (node.model.urn == updatedJagModel.urn) {
				const oldNode = node.model;

				node.model = updatedJagModel;
			}
		})
	}



	deselectAll() {
		this._selectedNodesSet.forEach(n => n.setSelected(false));
		this._selectedNodesSet.clear();
	}

	handleDeleteSelected() {
		console.log("handling the menu delete");
		console.log(this._selectedNodesSet);
		console.log("handling the menu delete");
	}


	clearPlayground(jagNodeSet = this._activeNodesSet) {                 // clearNodeSet
		console.log("[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]")
		console.log(jagNodeSet);
		for (let e of jagNodeSet) {
			if (e instanceof Edge) {
				const parent = e.getNodeOrigin();
				const child = e.getNodeEnd();

				if (!jagNodeSet.has(child)) {
					if (!jagNodeSet.has(parent)) {
						const child = e.getNodeEnd();

						this.popup({
							content: Playground.NOTICE_REMOVE_CHILD,
							trackEl: child,
							inputs: {node: child},
							highlights: [child]
						});
					} else {
						e.destroy();
					}
				}
			}
		}

		for (let n of jagNodeSet) {
			if (n instanceof JAGNode) {
				const parent = n.getParent();

				if (!parent || (parent && jagNodeSet.has(parent))) {
					n.removeAllEdges();
					n.detachHandlers();
					this._activeNodesSet.delete(n);
					this.$nodes_container.removeChild(n);
				} else {
					this.popup({
						content: Playground.NOTICE_REMOVE_CHILD,
						trackEl: n,
						inputs: {node: n},
						highlights: [n]
					});
				}

				n.setSelected(false);
			}
		}

		jagNodeSet.clear();

		this._checkBounds();
	}


xxx


	handleRefresh({ model, model_set, refreshed = new Set() }) {
		const margin = 50;

		for (let node of this._activeNodesSet) {
			if (!refreshed.has(node) && node.model === model) {
				const root = node.getRoot();

				if (root == node) {
					const [x, y] = node.getPosition();
					console.log("Handling a Refresh (?)");
					this._traverseJagNodeTree(model, model_set, true, margin, x, y, node);

					const tree = node.getTree();

					for (const node of tree) {
						refreshed.add(node);
					}
				} else {
					root.refresh(refreshed);
				}
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
				this.clearPlayground(this._selectedNodesSet);  //??
			} else {
				this.clearPlayground(this._selectedNodesSet);
			}
		} else if (e.key == 'ArrowLeft') {
			if (this._canMoveView.left) {
				this._dragView(1 * Playground.DEFAULT_ARROW_MULTIPLIER, 0);
			}
		} else if (e.key == 'ArrowRight') {
			if (this._canMoveView.right) {
				this._dragView(-1 * Playground.DEFAULT_ARROW_MULTIPLIER, 0);
			}
		} else if (e.key == 'ArrowUp') {
			if (this._canMoveView.up) {
				this._dragView(0, 1 * Playground.DEFAULT_ARROW_MULTIPLIER);
			}
		} else if (e.key == 'ArrowDown') {
			if (this._canMoveView.down) {
				this._dragView(0, -1 * Playground.DEFAULT_ARROW_MULTIPLIER);
			}
		} else if (e.key == 'PageUp') {
			this._zoomView(this._zoomFactor / Playground.DEFAULT_ZOOM_MULTIPLIER);
		} else if (e.key == 'PageDown') {
			this._zoomView(this._zoomFactor * Playground.DEFAULT_ZOOM_MULTIPLIER);
		}
	}

	onEdgeInitialized(e, node) {
		this.removeEventListener('mousemove', this._boundDragView);
		this.removeEventListener('mouseup', this._boundStopDragView);
		this.addEventListener('mousemove', this._boundOnEdgeUpdated);
		this.addEventListener('mouseup', this._boundOnEdgeCanceled);

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

	async onEdgeFinalized(e, node) {
		if(!this._is_edge_being_created)
			return;

		if (window.confirm("Are you sure you want to add this node as a child? (This will change all instances of the parent node to reflect this change.)")) {
			this._is_edge_being_created = false;
			this._created_edge.setNodeEnd(node);
			this._created_edge.addEventListener('playground-nodes-selected', this._boundHandleEdgeSelected);

			// JAG.AddChild happens way down when jag-node.completeOutEdge finishes.
			// @TODO consider bringing it up here (separation of functionality)
			 const parentJag = this._created_edge._node_origin.model;
			 const childJag = this._created_edge._node_end.model;
  			// parentJag.addChild(childJag);
console.log("LOOK HERE TO SEE IF KIDS ARE GETTING ADDED");
			await StorageService.update(parentJag, 'jag');

		} else {
			this.cancelEdge();
		}
	}

	cancelEdge() {
		if(!this._is_edge_being_created)
			return;

		this.removeEventListener('mousemove', this._boundOnEdgeUpdated);
		this.removeEventListener('mouseup', this._boundOnEdgeCanceled);

		this._created_edge.destroy();
		this._created_edge = undefined;
		this._is_edge_being_created = false;
	}

	onEdgeCanceled(e, node) {
		this.cancelEdge();
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

	createJagNode(jagModel, expanded) {
		const node = new JAGNode(jagModel, expanded);

		node.addEventListener('mousedown', (e) => {
			// If meta isn't pressed clear previous selection
			if(!e.shiftKey) {
				this._selectedNodesSet.forEach(local_node => {
					if(local_node != node)
						local_node.setSelected(false);
				});
				this._selectedNodesSet.clear();
			}

			this._selectedNodesSet.add(node);

			if (e.ctrlKey) {
				const all_selected = node.setSelected(true, new Set());   // @TODO looks like it wants two booleans.  not a set.
				for (const sub_node of all_selected)
					this._selectedNodesSet.add(sub_node);
			} else {
				node.setSelected(true);
			}

			this.dispatchEvent(new CustomEvent('playground-nodes-selected', { detail: this._selectedNodesSet }));
			e.stopPropagation();
		});

		node.addEventListener('keydown', this.onKeyDown.bind(this));

		node.addEventListener('drag', () => {
			this._checkBounds();
		});

		node.addEventListener('toggle-visible', (e) => {
			if (e.detail) {
				this._checkBounds(node.getTree());
			} else {
				this._checkBounds();
			}
		});

		////?? @TODO think about this.
		node.addEventListener('refresh', (e) => {
			this.dispatchEvent(new CustomEvent('refresh', { detail: e.detail }));
		});
		// Are these two below not the same info.  activeNodeSet needed?
		this._activeNodesSet.add(node);
		this.$nodes_container.appendChild(node);
		node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
		node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));
		return node;
	}

	_traverseJagNodeTree(currentParentJagNode, descendantJagNodeMap, isExpanded, margin, x, y, childURN = undefined, context = undefined) {
		// if no child...  addNode
		// else proceed with the current child
		const node = childURN || this.createJagNode(currentParentJagNode, isExpanded);

		if (context) {
			if (context.name) node.setContextualName(context.name);
			if (context.description) node.setContextualDescription(context.description);
		}

		node.setTranslation(x + node.clientWidth / 2.0, y + node.clientHeight / 2.0);

		if (!currentParentJagNode.children)
			return node;

		const preferred_size = this._getNodePreferredHeight(currentParentJagNode, descendantJagNodeMap);          // hhhh

		// assume all children have same height as the parent.
		const node_height = node.clientHeight + margin;
		const preferred_height = preferred_size * node_height;

		const x_offset = x + node.clientWidth + margin;
		let y_offset = y - preferred_height / 2;
		const childrenMap = new Map();
		for (const child_edge of node.getChildEdges()) {     //@TODO  what is this? -> getChildEdges.  Are edges stored or just node.chldren
			childrenMap.set(child_edge.getChildId(), child_edge.getNodeEnd());
		}

		currentParentJagNode.children.forEach((child) => {
			const currentChildJagNode = descendantJagNodeMap.get(child.urn);
			const local_preferred_size = this._getNodePreferredHeight(currentChildJagNode, descendantJagNodeMap);
			y_offset += (local_preferred_size * node_height) / 2;

			const sub_node = this._traverseJagNodeTree(currentChildJagNode, descendantJagNodeMap, true, margin, x_offset, y_offset, childrenMap.get(child.id), child);
			y_offset += (local_preferred_size * node_height) / 2;

			if (!childrenMap.has(child.id)) {
				let edge = this._createEdge(node, child.id);
				edge.setNodeEnd(sub_node);
				edge.addEventListener('playground-nodes-selected', this._boundHandleEdgeSelected);
			}

			if (child.name) sub_node.setContextualName(child.name);
			if (child.description) sub_node.setContextualDescription(child.description);
		});

		for (const [id, child] of childrenMap.entries()) {
			let actual = false;

			for (const actual_child of currentParentJagNode.children) {
				if (actual_child.id == id) {
					actual = true;
					break;
				}
			}

			if (!actual) {
				const tree = child.getTree();
				for (const node of tree) {
					node.removeAllEdges();
					node.detachHandlers();
					this._activeNodesSet.delete(node);
					this.$nodes_container.removeChild(node);
				}
			}
		}
		return node;
	}

      // add JagNodeTree ==
	_addJagNodeTree(selectedJag, selectedJagDescendants = new Map(), isExpanded = false) {
		//
		// Lets just look
		const margin = 50;
		const height = this.clientHeight;
		const node = this._traverseJagNodeTree(selectedJag, selectedJagDescendants, isExpanded, margin, 10, height/2);
		this._checkBounds(node.getTree());
	}

	handleLibraryListItemSelected({model: selectedJag, model_set: selectedJagDescendants = new Map(), expanded: isExpanded = false}) {
		this._addJagNodeTree(selectedJag, selectedJagDescendants, isExpanded);
	}

	_getNodePreferredHeight(jagNode, jagNodeMap) {
		if (!jagNode.children || jagNode.children.length === 0)
			return 1;

		return jagNode.children.reduce((cut_set_size, child) => {
			const def = jagNodeMap.get(child.urn);
			return cut_set_size + (def ? this._getNodePreferredHeight(def, jagNodeMap) : 0);
		}, 0);
	}

	_generateActivityGraphFromJSON(json) {
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
			this._selectedNodesSet.add(e.target);
		} else {
			this._selectedNodesSet.delete(e.target);
		}
	}

	_handleNewNodePopup(e) {
		const initiator = document.getElementById('menu-new');
		this.popup({
			content: Playground.NOTICE_CREATE_JAG,
			trackEl: this,
			inputs: {event: e},
			highlights: [initiator]
		});
	}


}

// END OF CLASS
// Initial UI builder creates
// <svg version="1.1" xmlns="http//www.w3.org/2000/svg"></svg>
//	  <div></div>
//	  <div class="popup-box" style="visablity

Playground.defaultUrn = "us:ihmc:";


Playground.POPUP_TYPES = {
	WARNING: 'popup-warning',
	NOTICE: 'popup-notice',
	INFO: 'popup-info'
};

// why cant this go inside scope.? Does anyone else need it?
Playground.NOTICE_CREATE_JAG = Popupable._createPopup({
	type: Playground.POPUP_TYPES.NOTICE,
	name: "Add New Node",
	description: "Be precise.  You can always edit this later.",
	properties: [
		{
			name: 'popname', label: 'Name', type: 'text', options: function () {
				let eventMap = new Map();
				eventMap.set('input', () => {
					const newName = Playground.defaultUrn + document.getElementById('popname').value;
					const convName = newName.replace(' ','-').replace(/[^0-9a-zA-Z:-]+/g,"").toLowerCase();
					document.getElementById('popurn').value = convName;
				});
				return eventMap;
			}
		},
		{
			name: 'popurn', label: 'URN', type: 'text', options: function () {
				let eventMap = new Map();
				eventMap.set('blur', () => {
					const newUrn = document.getElementById('popurn').value;
					Playground.defaultUrn = newUrn.split(':').slice(0, -1).join(':') + ":";
				});
				return eventMap;
			}
		},
		{
			name: 'popdescription', label: 'Description', type: 'textarea',
			options: async function () {
				let paramMap = new Map();
				paramMap.set('cols', 24);
				paramMap.set('rows', 4);
				return paramMap;
			}
		},
	],
	actions: [
		{
			text: "Create", color: "black", bgColor: "red",
			action: async function ({inputs: {}, outputs: {popname, popurn, popdescription}}) {
				const newJAG = new JAG({ urn: popurn, name: popname, description: popdescription });
				if (newJAG.isValid()){
	    			await StorageService.create(newJAG, 'jag');}
				else {
					window.alert("Invalid URN");
				}
			}
		},
		{text: "Cancel", color: "white", bgColor: "black"}
	]
	// display: ?
	// fallback: ?
	// skip: ?
});


Playground.NOTICE_REMOVE_CHILD = Popupable._createPopup({
	type: Playground.POPUP_TYPES.NOTICE,
	name: "Remove Child",
	description: "Remove this child from parent JAG?",
	actions: [
		{ text: "Yes", color: "black", bgColor: "red",
			action: function ({inputs: {node}}) {
				const edge = node.getParentEdge();
				const id = edge.getChildId();
				const parent = node.getParent();

				parent.removeChild(edge, id);

				const tree = node.getTree();

				for (const node of tree) {
					node.removeAllEdges();
					this._activeNodesSet.delete(node);
					this.$nodes_container.removeChild(node);
				}
			}
		},
		{ text: "No", color: "white", bgColor: "black" }
	]
});

Playground.DEFAULT_CARDINAL_MULTIPLIER = 10;

Playground.DEFAULT_ARROW_MULTIPLIER = 10;

Playground.DEFAULT_ZOOM_MULTIPLIER = 0.9;

customElements.define('jag-playground', Playground);

export default customElements.get('jag-playground');

