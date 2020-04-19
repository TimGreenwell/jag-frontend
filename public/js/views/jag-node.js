/**
 * @file Graphical node representation of a JAG.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.45
 */


const SNAP_SIZE = 5.0;

import JAG from '../models/jag.js';
import UndefinedJAG from '../models/undefined.js';

customElements.define('jag-node', class extends HTMLElement {

	constructor(model, expanded) {
		super();
		this._translation = {x: 0, y:0};
		this._outs = new Set();
		this._in = undefined;

		this._boundUpdateHandler = this._updateHandler.bind(this);
		this._boundDefineModel = this._defineModel.bind(this);

		this._initUI();
		this._initHandlers();
		this.model = model;
		this.visible = true;
		this.expanded = expanded;
	}

	// TODO: Find a better way to deal with changing URN so model is a private property
	set model(model) {
		if (this._model) {
			if (this._model instanceof UndefinedJAG) {
				this._model.removeEventListener('define', this._boundDefineModel);
			} else {
				this._model.removeEventListener('update', this._boundUpdateHandler);
			}
		}

		this._model = model;

		if (this._model instanceof UndefinedJAG) {
			this._model.addEventListener('define', this._boundDefineModel);
		} else {
			this._model.addEventListener('update', this._boundUpdateHandler);
		}

		this._applyName();
		this._applyOperator();
	}

	get model() {
		return this._model;
	}

	set expanded(expanded) {
		this._expanded = expanded;

		for (const edge of this._outs) {
			const child = edge.getNodeEnd();
			edge.visible = expanded && this.visible;
			child.visible = expanded && this.visible;
		}

		if (expanded) {
			this._$expand.innerHTML = "<";
		} else {
			this._$expand.innerHTML = ">";
		}

		if (this._outs.size > 0 && this.visible) {
			this._$expand.style.visibility = "visible";
		} else {
			this._$expand.style.visibility = "hidden";
		}
	}

	get expanded() {
		return this._expanded;
	}

	set visible(visible) {
		this._visible = visible;

		for (const edge of this._outs) {
			const child = edge.getNodeEnd();
			edge.visible = visible;
			child.visible = visible;
		}

		if (visible) {
			this.style.visibility = "visible";
			this.expanded = this.expanded;
		} else {
			this.style.visibility = "hidden";
			this._$expand.style.visibility = "hidden";
		}

		this.dispatchEvent(new CustomEvent('toggle-visible', { detail: visible }));
	}

	get visible() {
		return this._visible;
	}

	addInEdge(edge) {
		if (this._in == undefined) {
			let [h_center_x, h_center_y] = this._computeNodeInputAttachment();
			edge.setEnd(h_center_x, h_center_y);
			this._in = edge;
		} else {
			throw new Error("Cannot have multiple edges in to a node!");
		}
	}

	removeInEdge(edge) {
		if (this._in == edge) {
			this._in = undefined;
		} else {
			throw new Error("Attempting to remove unknown in edge from node!");
		}
	}

	removeAllEdges() {
		if (this._in) {
			this._in.destroy();
		}

		this._outs.forEach(edge => edge.destroy());
	}

	addOnEdgeInitializedListener(listener) {
		this._$connector.addEventListener('mousedown', e => {
			listener(e, this);
		});
	}

	addOnEdgeFinalizedListener(listener) {
		this.addEventListener('mouseup', e => {
			listener(e, this);
		});
	}

	prepareOutEdge(edge) {
		let [c_center_x, c_center_y] = this._computeNodeOutputAttachment();
		edge.setOrigin(c_center_x, c_center_y);
	}

	completeOutEdge(edge, id = undefined) {
		this._outs.add(edge);

		// If this is a new child, expand this node;
		// Else refresh this node's expanded tree.
		if (id === undefined) this.expanded = true;
		else this.expanded = this.expanded;
		
		return this._model.addChild(edge.getNodeEnd().model, id);
	}

	removeOutEdge(edge, id) {
		this._outs.delete(edge);
	}

	removeChild(edge, id) {
		if (edge.getNodeEnd()) {
			this._model.removeChild({ id: id, model: edge.getNodeEnd().model });
			this._outs.delete(edge);
			edge.destroy();
		}
	}

	getParent() {
		if (this._in) {
			return this._in.getNodeOrigin();
		}

		return undefined;
	}

	getChildren() {
		const all_children = new Set();

		for (const out_edge of this._outs) {
			all_children.add(out_edge.getNodeEnd());
		}

		return all_children;
	}

	setSelected(is_selected, recursive = undefined) {
		if(is_selected != this._is_selected)
			this._animationRefresh();

		this._is_selected = is_selected;

		if (is_selected) {
			this.classList.add('selected-node');

			if (recursive) {
				for (const out_edge of this._outs) {
					const sub_node = out_edge.getNodeEnd();
					recursive.add(sub_node);
					recursive = sub_node.setSelected(true, recursive);
				}
			}
		} else {
			this.classList.remove('selected-node');
		}

		return recursive;
	}

	getParentEdge() {
		if (this._in !== undefined) {
			return this._in;
		}
	}

	getParent() {
		if (this._in !== undefined) {
			return this._in.getNodeOrigin();
		}
	}

	getChildEdges() {
		return this._outs;
	}

	getChildren() {
		const all_children = new Set();

		for (const out_edge of this._outs) {
			all_children.add(out_edge.getNodeEnd());
		}

		return all_children;
	}

	getTree(tree = new Set()) {
		tree.add(this);

		for (const out_edge of this._outs) {
			out_edge.getNodeEnd().getTree(tree);
		}

		return tree;
	}

	_initUI() {
		this.setAttribute('tabindex', '-1');

		this._$header = document.createElement('header');
		this._$header_name = document.createElement('h1');
		this._$header_name.className = 'node-name';
		this._$header.appendChild(this._$header_name);

		this._$connector = document.createElement('div');
		this._$connector.className = 'connector';

		this._$expand = document.createElement('div');
		this._$expand.className = 'expand';
		this._$expand.innerHTML = '>';

		this.appendChild(this._$header);
		this.appendChild(this._$connector);
		this.appendChild(this._$expand);

		this.setTranslation(100, 100);
	}

	_initHandlers() {
		const drag = (e => {
			if (!this._is_moving)
				return;

			const scaleFactor = this.offsetWidth / this.getBoundingClientRect().width;

			this.translate(e.movementX * scaleFactor, e.movementY * scaleFactor, e.shiftKey ? true : undefined);

			this.dispatchEvent(new CustomEvent('drag', { detail: { x: e.movementX, y: e.movementY, shiftKey: e.shiftKey }}));
		}).bind(this);

		this._$header.addEventListener('mousedown', (e) => {
			this._center_offset = {
				x: this._$header.clientWidth / 2.0 - e.offsetX,
				y: this._$header.clientHeight / 2.0 - e.offsetY
			};

			this._is_moving = true;
			this._$header.className = 'moving';
			this.addEventListener('mousemove', drag);
		});

		this._$header.addEventListener('mouseleave', () => {
			this.removeEventListener('mousemove', drag);
		});

		this._$header.addEventListener('mouseup', (e) => {
			this._is_moving = false;
			this._$header.className = '';
			this._snap();
			this.removeEventListener('mousemove', drag);
		});

		this._$header.addEventListener('transitionend', () => {
			window.cancelAnimationFrame(this._animation_frame_id);
		});

		this._$expand.addEventListener('click', () => {
			this.expanded = !this.expanded;
		});
	}

	_updateHandler(e) {
		const property = e.detail.property;

		if (property == "operator") {
			this._applyOperator();
		} else if (property == "name") {
			this._applyName();
		}
	}

	_defineModel(e) {
		this.model = e.detail.model;
	}

	translate(dx, dy, recursive = undefined) {
		this.setTranslation(this._translation.x + dx, this._translation.y + dy);

		if(this._outs != undefined && (recursive || (recursive == undefined && !this.expanded))) {
			this._outs.forEach((edge) => {
				edge._node_end.translate(dx, dy, recursive || !this.expanded);
			});
		}
	}

	setTranslation(x, y) {
		this._translation.x = x;
		this._translation.y = y;

		if(!this.parentNode) return;

		const [left, top] = this.getPosition();

		this.style.transform = `translate(${left}px,${top}px)`;

		const [h_center_x, h_center_y] = this._computeNodeInputAttachment();

		if (this._in != undefined) {
			this._in.setEnd(h_center_x, h_center_y);
		}

		const [c_center_x, c_center_y] = this._computeNodeOutputAttachment();

		if (this._outs != undefined) {
			this._outs.forEach((edge) => {
				edge.setOrigin(c_center_x, c_center_y);
			});
		}

		this.dispatchEvent(new CustomEvent('change-position', { detail: { x: x, y: y }}));
	}

	_applyName() {
		this._$header_name.innerHTML = this._model.name;
	}

	_applyOperator() {
		let op = '';
		if(this._model.operator == JAG.OPERATOR.AND)
			op = 'and';
		else if(this._model.operator == JAG.OPERATOR.OR)
			op = 'or';

		this._$connector.innerHTML = op;
		// @TODO: move this to styling;
		if(op == '')
			this._$connector.style.display = 'none';
		else
			this._$connector.style.display = 'block';

		this._snap();
	}

	_animationRefresh() {
		this._refresh();
		this._animation_frame_id = window.requestAnimationFrame(this._animationRefresh.bind(this));
	}

	_refresh() {
		this.setTranslation(this._translation.x, this._translation.y);
	}

	_adjustPosition(x,y) {
		return [x, y];
	}

	_snap() {
		this._translation.z = Math.round( this._translation.x / SNAP_SIZE ) * SNAP_SIZE;
		this._translation.y = Math.round( this._translation.y / SNAP_SIZE ) * SNAP_SIZE;
		this._refresh();
		// return [adj_x, adj_y];
	}

	getPosition() {
		const left = Math.round(this._translation.x - this.clientWidth / 2.0);
		const top = Math.round(this._translation.y - this.clientHeight / 2.0);

		return this._adjustPosition(left, top);
	}

	_computeNodeInputAttachment() {
		const x = this._translation.x - this._$header.clientWidth / 2.0;
		const y = this._translation.y;

		return [x, y];
	}

	_computeNodeOutputAttachment() {
		const x = this._translation.x + this.clientWidth / 2.0;
		const y = this._translation.y;

		return [x, y];
	}

});

export default customElements.get('jag-node');

