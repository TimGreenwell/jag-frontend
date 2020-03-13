/**
 * @file Graphical node representation of a JAG.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.45
 */


const SNAP_SIZE = 5.0;

import JAG from '../models/jag.js';
import JAGService from '../services/jag.js';

customElements.define('jag-node', class extends HTMLElement {

	constructor(node) {
		super();
		this._model = node;
		this._translation = {x: 0, y:0};
		this._outs = new Set();
		this._in = undefined;

		this._boundUpdateHandler = this._updateHandler.bind(this);

		this._initUI();
		this._initHandlers();
	}

	// TODO: Find a better way to deal with changing URN so model is a private property
	set model(node) {
		this._model.removeEventListener('update', this._boundUpdateHandler);
		this._model = node;
		this._model.addEventListener('update', this._boundUpdateHandler);

		this._applyName();
		this._applyOperator();
	}

	get model() {
		return this._model;
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
		return this._model.addChild(edge.getNodeEnd().model, id);
	}

	removeOutEdge(edge, id) {
		this._outs.delete(edge);
	}

	removeChild(edge, id) {
		if (edge.getNodeEnd()) {
			this._model.removeChild({ id: id, model: edge.getNodeEnd().model });
		}
	}

	setSelected(is_selected) {
		if(is_selected != this._is_selected)
			this._animationRefresh();

		this._is_selected = is_selected;

		if(is_selected)
			this.classList.add('selected-node');
		else
			this.classList.remove('selected-node');
	}

	_initUI() {
		this.setAttribute('tabindex', '-1');

		this._$header = document.createElement('header');
		this._$header_name = document.createElement('h1');
		this._$header_name.className = 'node-name';
		this._$header.appendChild(this._$header_name);

		this._$connector = document.createElement('div');
		this._$connector.className = 'connector';

		this.appendChild(this._$header);
		this.appendChild(this._$connector);

		this.setTranslation(100, 100);

		this._applyName();
		this._applyOperator();
	}

	_initHandlers() {
		const drag = (e => {
			if(!this._is_moving)
				return;

			const playground = e.currentTarget;

			const mx = e.clientX - playground.offsetLeft;
			const my = e.clientY - playground.offsetTop;

			let center_x = mx + this._center_offset.x;
			let center_y = my + this._center_offset.y;

			this.translate(e.movementX, e.movementY, e.shiftKey);
		}).bind(this);

		this._$header.addEventListener('mousedown', (e) => {
			this._center_offset = {
				x: this._$header.clientWidth / 2.0 - e.offsetX,
				y: this._$header.clientHeight / 2.0 - e.offsetY
			};

			this._is_moving = true;
			this._$header.className = 'moving';
			this.parentNode.addEventListener('mousemove', drag);
		});

		this._$header.addEventListener('mouseup', (e) => {
			this._is_moving = false;
			this._$header.className = '';
			this._snap();
			this.parentNode.removeEventListener('mousemove', drag);
		});

		this._$header.addEventListener('transitionend', () => {
			window.cancelAnimationFrame(this._animation_frame_id);
		});

		this._model.addEventListener('update', this._boundUpdateHandler);
	}

	_updateHandler(e) {
		const property = e.detail.property;

		if (property == "operator") {
			this._applyOperator();
		} else if (property == "name") {
			this._applyName();
		} else if (property == "urn") {

		}
	}

	translate(dx, dy, recursive = false) {
		this.setTranslation(this._translation.x + dx, this._translation.y + dy);

		if(this._outs != undefined && recursive) {
			this._outs.forEach((edge) => {
				edge._node_end.translate(dx, dy, recursive);
			});
		}
	}

	setTranslation(x, y) {
		this._translation.x = x;
		this._translation.y = y;

		if(!this.parentNode) return;

		const [left, top] = this._computeTrueTopLeft();

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
		const pw = this.parentNode.clientWidth;
		const ph = this.parentNode.clientHeight;
		const nw = this.clientWidth;
		const nh = this.clientHeight;

		const adjusted_x = Math.min(Math.max(x, 0), pw - nw);
		const adjusted_y = Math.min(Math.max(y, 0), ph - nh);
		return [adjusted_x, adjusted_y];
	}

	_snap() {
		this._translation.z = Math.round( this._translation.x / SNAP_SIZE ) * SNAP_SIZE;
		this._translation.y = Math.round( this._translation.y / SNAP_SIZE ) * SNAP_SIZE;
		this._refresh();
		// return [adj_x, adj_y];
	}

	_computeTrueTopLeft() {
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

