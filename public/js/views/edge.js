/**
 * @file Graphical edge representation of a JAG.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.07
 */

import JAG from '../models/jag.js';

const XMLNS = 'http://www.w3.org/2000/svg';

export default class Edge extends EventTarget {

	constructor(parent) {
		super();
		this.init(parent);
	}

	init(parent) {
		this._group = document.createElementNS(XMLNS, 'g');
		this._origin = {x : 0, y : 0};
		this._end = {x : 0, y : 0};
		this._node_origin = undefined;
		this._node_end = undefined;
		this._edge_el = document.createElementNS(XMLNS, 'path');
		this._edge_el.setAttributeNS(null, 'stroke', 'gray');
		this._edge_el.setAttributeNS(null, 'fill', 'transparent');
		this._text_el = document.createElementNS(XMLNS, 'text');
		this._text_el.setAttribute('class', 'sequential-label');
		this._anno_el = document.createElementNS(XMLNS, 'text');
		this._anno_el.setAttribute('class', 'annotation-label');
		this._anno_el.innerHTML = "@";
		this._anno_el.style.visibility = "hidden";
		this._list_el = document.createElementNS(XMLNS, 'text');
		this._list_el.setAttribute('class', 'annotations-list');
		this._group.appendChild(this._edge_el);
		this._group.appendChild(this._text_el);
		this._group.appendChild(this._anno_el);
		this._group.appendChild(this._list_el);

		this._parent = parent;
		parent.appendChild(this._group);

		this._childId = undefined;

		this._boundUpdateHandler = this._updateHandler.bind(this);
		this._boundHandleSelection = this._handleSelection.bind(this);
		this._boundHandleHover = this._handleHover.bind(this);
		parent.addEventListener('click', this._boundHandleSelection);
		parent.addEventListener('mousemove', this._boundHandleHover);
	}

	_updateHandler(e) {
		const property = e.detail.property;
		const data = e.detail.extra;

		if (property == "children") {
			this._updateOrder(data.children, data.execution);
		} else if (property == "execution") {
			this._updateOrder(data.children, data.execution);
		} else if (property == "operator") {
			this._updateStrokeDash(data.operator);
		} else if (property == "annotations") {
			this._updateAnnotations(data.id, data.annotations, data.iterable);
		}
	}

	_clearAnnotations() {
		while (this._list_el.firstChild) {
			this._list_el.removeChild(this._list_el.firstChild);
		}
	}

	_createAnnotation(key, value) {
		const _tspan_key = document.createElementNS(XMLNS, "tspan");
		_tspan_key.setAttribute('class', 'annotation-key');
		_tspan_key.setAttributeNS(null, 'x', this._list_el.getAttributeNS(null, 'x'));
		_tspan_key.setAttributeNS(null, 'dy', "1.1em");
		_tspan_key.innerHTML = `${key}`;
		this._list_el.appendChild(_tspan_key);

		const _tspan_value = document.createElementNS(XMLNS, "tspan");
		_tspan_value.setAttribute('class', 'annotation-value');
		_tspan_value.setAttributeNS(null, 'dx', _tspan_key.clientWidth);
		_tspan_value.setAttributeNS(null, 'dy', 0);
		_tspan_value.innerHTML = `: ${value}`;
		this._list_el.appendChild(_tspan_value);
	}

	_updateAnnotations(id, annotations, iterable) {
		if (this._childId == id) {
			this._clearAnnotations();

			if (iterable) {
				this._createAnnotation("iterable", true);
				this._anno_el.style.visibility = "visible";
			}

			if (annotations != undefined && annotations.size > 0) {
				if (!iterable) this._anno_el.style.visibility = "visible";

				for (let annotation of annotations.keys()) {
					this._createAnnotation(annotation, annotations.get(annotation));
				}
			} else if (!iterable) {
				this._anno_el.style.visibility = "hidden";
			}
		}
	}

	_updateStrokeDash(operator) {
		if (operator == JAG.OPERATOR.OR) {
			this._edge_el.setAttributeNS(null, 'stroke-dasharray', '4');
		} else {
			this._edge_el.removeAttributeNS(null, 'stroke-dasharray');
		}
	}

	_containsPoint(x, y) {
		let rect = this._group.getBoundingClientRect();

		return (x > rect.left && x < rect.right)
			&& (y > rect.top && y < rect.bottom);
	}

	_handleHover(e) {
		if (this._containsPoint(e.clientX, e.clientY)) {
			this._list_el.style.visibility = "visible";
		} else {
			this._list_el.style.visibility = "hidden";
		}
	}

	_handleSelection(e) {
		if (this._containsPoint(e.clientX, e.clientY)) {
			this._edge_el.setAttributeNS(null, 'stroke', 'red');
			this.dispatchEvent(new CustomEvent('selection', { detail: { selected: true }}));
		} else if (!e.shiftKey) {
			this._edge_el.setAttributeNS(null, 'stroke', 'gray');
			this.dispatchEvent(new CustomEvent('selection', { detail: { selected: false }}));
		}
	}

	set visible(visible) {
		this._visible = visible;

		if (visible) {
			this._edge_el.style.visibility = "visible";
			this._text_el.style.visibility = "visible";
		} else {
			this._edge_el.style.visibility = "hidden";
			this._text_el.style.visibility = "hidden";
		}
	}

	destroy() {
		this._parent.removeChild(this._group);
		this._parent.removeEventListener('click', this._boundHandleSelection);

		if (this._node_origin != undefined) {
			this._node_origin.model.removeEventListener('update', this._boundUpdateHandler);
			this._node_origin.removeOutEdge(this, this._childId);
		}

		if (this._node_end != undefined)
			this._node_end.removeInEdge(this);
	}

	getNodeOrigin() {
		return this._node_origin;
	}

	getNodeEnd() {
		return this._node_end;
	}

	setNodeOrigin(node) {
		this._node_origin = node;
		this._node_origin.prepareOutEdge(this); // Note: this only computes and sets graphical edge stroke origin; no change to model
	}

	setChildId(id) {
		this._childId = id;
	}

	getChildId() {
		return this._childId;
	}

	setNodeEnd(node) {
		this._node_end = node;
		this._node_end.addInEdge(this); // Note: this only computes and sets graphical edge stroke end and adds edge to graphical node's 'ins'; no change to model

		const origin_model = this._node_origin.model;

		origin_model.addEventListener('update', this._boundUpdateHandler);

		this._childId = this._node_origin.completeOutEdge(this, this._childId); // Note: this does multiple things:
		// - Adds edge to graphical node's 'outs'
		// - Invokes _node_origin#addChild(_node_end), which:
		//   - Adds _node_end model to _node_origin model's children
		//   - Sets _node_end model's parent to _node_origin model
		//   - Dispatches update event

		this._updateOrder(origin_model.children, origin_model.execution);
		this._updateStrokeDash(origin_model.operator);

		const child = origin_model.children.reduce((prev, curr) => {
			if (curr.id == this._childId) {
				return curr;
			}

			return prev;
		});

		this._updateAnnotations(this._childId, child.annotations, child.iterable);
	}

	setOrigin(x, y) {
		this._origin.x = x;
		this._origin.y = y;

		this._applyPath();
	}

	setEnd(x, y) {
		this._end.x = x;
		this._end.y = y;

		this._applyPath();
	}

	_applyPath() {
		const ox = Math.round(this._origin.x) + 0.5;
		const oy = Math.round(this._origin.y) + 0.5;
		const ex = Math.round(this._end.x) + 0.5;
		const ey = Math.round(this._end.y) + 0.5;
		const delta_x = (ex - ox) / 2.0;
		const x1 = ox + delta_x;
		const y1 = oy;
		const x2 = ex - delta_x;
		const y2 = ey;
		const mx = (ox + ex) / 2.0;
		const my = (oy + ey) / 2.0;

		this._data = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;

		this._edge_el.setAttributeNS(null, 'd', this._data);
		this._text_el.setAttributeNS(null, 'x', mx - 5);
		this._text_el.setAttributeNS(null, 'y', my - 5);
		this._anno_el.setAttributeNS(null, 'x', mx + 5);
		this._anno_el.setAttributeNS(null, 'y', my + 5);
		this._list_el.setAttributeNS(null, 'x', mx + 20);
		this._list_el.setAttributeNS(null, 'y', my - 8);

		for (let key in this._list_el.children) {
			if (key % 2 == 0) this._list_el.children[key].setAttributeNS(null, 'x', mx + 20);
		}
	}

	_updateOrder(children, execution) {
		let order = 0;

		if (execution == JAG.EXECUTION.SEQUENTIAL) {
			const ordered = children.map(child => child.id);
			order = ordered.indexOf(this._childId) + 1;
		}

		this._text_el.innerHTML = order == 0 ? '' : order;
	}

	setGreyedOut(is_greyed_out) {
		this._is_greyed_out = is_greyed_out;

		if(is_greyed_out)
			this._group.setAttribute('class', 'greyed-out-node');
		else
			this._group.setAttribute('class', '');
	}

	setSelected(is_selected) {
		this._is_selected = is_selected;

		if(is_selected)
			this._group.setAttribute('class', 'selected-node');
		else
			this._group.setAttribute('class', '');
	}
}
