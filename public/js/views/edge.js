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
		this._group.appendChild(this._edge_el);
		this._group.appendChild(this._text_el);

		this._parent = parent;
		parent.appendChild(this._group);

		this._boundUpdateOrder = this._updateOrder.bind(this);
		this._boundHandleSelection = this._handleSelection.bind(this);
		this._boundUpdateStrokeDash = this._updateStrokeDash.bind(this);
		parent.addEventListener('click', this._boundHandleSelection);
	}

	_updateStrokeDash(e) {
		if (this._node_origin) {
			if (this._node_origin.model.operator == JAG.OPERATOR.OR) {
				this._edge_el.setAttributeNS(null, 'stroke-dasharray', '4');
			} else {
				this._edge_el.removeAttributeNS(null, 'stroke-dasharray');
			}
		}
	}

	_handleSelection(e) {
		let rect = this._group.getBoundingClientRect();

		if ((e.clientX > rect.left && e.clientX < rect.right)
			&& (e.clientY > rect.top && e.clientY < rect.bottom)) {
			this._edge_el.setAttributeNS(null, 'stroke', 'red');
			this.dispatchEvent(new CustomEvent('selection', { detail: { selected: true }}));
		} else {
			this._edge_el.setAttributeNS(null, 'stroke', 'gray');
			this.dispatchEvent(new CustomEvent('selection', { detail: { selected: false }}));
		}
	}

	destroy() {
		this._parent.removeChild(this._group);
		this._parent.removeEventListener('click', this._boundHandleSelection);

		if(this._node_origin != undefined) {
			this._node_origin.model.removeEventListener('update-children', this._boundUpdateOrder);
			this._node_origin.model.removeEventListener('update-execution', this._boundUpdateOrder);
			this._node_origin.model.removeEventListener('update-operator', this._boundUpdateStrokeDash);
			this._node_origin.removeOutEdge(this);
		}
		if(this._node_end != undefined)
			this._node_end.removeInEdge(this);
	}

	getNodeOrigin(node) {
		return this._node_origin;
	}

	getNodeEnd(node) {
		return this._node_end;
	}

	setNodeOrigin(node) {
		this._node_origin = node;
		this._node_origin.prepareOutEdge(this); // Note: this only computes and sets graphical edge stroke origin; no change to model
		this._updateStrokeDash(null);
	}

	setNodeEnd(node) {
		this._node_end = node;
		this._node_end.addInEdge(this); // Note: this only computes and sets graphical edge stroke end and adds edge to graphical node's 'ins'; no change to model

		this._node_origin.model.addEventListener('update-children', this._boundUpdateOrder);
		this._node_origin.model.addEventListener('update-execution', this._boundUpdateOrder);
		this._node_origin.model.addEventListener('update-operator', this._boundUpdateStrokeDash);

		this._node_origin.completeOutEdge(this); // Note: this does multiple things:
		// - Adds edge to graphical node's 'outs'
		// - Invokes _node_origin#addChild(_node_end), which:
		//   - Adds _node_end model to _node_origin model's children
		//   - Sets _node_end model's parent to _node_origin model
		//   - Dispatches update event
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
		this._text_el.setAttributeNS(null, 'x', mx);
		this._text_el.setAttributeNS(null, 'y', my);
	}

	_updateOrder(e) {
		let order = this._node_origin.model.getOrderForId(this._node_end.model.id);
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
