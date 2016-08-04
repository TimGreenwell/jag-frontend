'use strict';

const SNAP_SIZE = 5.0;

import Listenable from '../listenable.js';
import GraphNode from '../graph/node.js';

export default class NodeElement extends Listenable {

	constructor(node) {
		super();
		this._model = node;
		this._translation = {x: 0, y:0};
		this._outs = new Set();
		this._ins = new Set();

		this.init();
		this._addDragHandlers();
	}

	init() {
		this._root_el = document.createElement('div');
		this._root_el.className = 'node';
		this._root_el.setAttribute('tabindex', '-1');

		this._header_el = document.createElement('header');
		this._root_el.appendChild(this._header_el);

		this._header_name = document.createElement('h1');
		this._header_name.className = 'node-name';
		this._header_el.appendChild(this._header_name);

		this._connector_el = document.createElement('div');
		this._connector_el.className = 'connector';
		this._root_el.appendChild(this._connector_el);

		this.setTranslation(100, 100);
		this._applyName();
		this._applyOperator();
	}

	get element() {
		return this._root_el;
	}

	get model() {
		return this._model;
	}

	set urn(urn) {
		this._model.urn = urn;
	}
	
	set name(name) {
		this._model.name = name;
		this._applyName();
		this._refresh();
	}

	set execution(type) {
		this._model.execution = type;
	}

	set operator(type) {
		this._model.operator = type;
		this._applyOperator();
	}

	_applyName() {
		this._header_name.innerHTML = this._model.name;
	}

	_applyOperator() {
		let op = '';
		if(this._model.operator == GraphNode.OPERATOR.AND)
			op = 'and';
		else if(this._model.operator == GraphNode.OPERATOR.OR)
			op = 'or';

		this._connector_el.innerHTML = op;
		if(op == '')
			this._connector_el.style.display = 'none';
		else
			this._connector_el.style.display = 'block';
	}

	addInEdge(edge) {
		let [h_center_x, h_center_y] = this._computeNodeInputAttachment();
		edge.setEnd(h_center_x, h_center_y);
		this._ins.add(edge);
	}

	removeInEdge(edge) {
		this._ins.delete(edge);
	}

	removeAllEdges() {
		this._ins.forEach(edge => edge.remove());
		this._outs.forEach(edge => edge.remove());
	}

	addOnEdgeInitializedListener(listener) {
		this._connector_el.addEventListener('mousedown', e => {
			listener(e, this);
		});
	}

	addOnEdgeFinalizedListener(listener) {
		this._root_el.addEventListener('mouseup', e => {
			listener(e, this);
		});
	}

	addOutEdge(edge) {
		let [c_center_x, c_center_y] = this._computeNodeOutputAttachment();
		edge.setOrigin(c_center_x, c_center_y);
		this._outs.add(edge);
	}

	removeOutEdge(edge) {
		this._outs.delete(edge);
	}

	setSelected(is_selected) {
		if(is_selected != this._is_selected)
			this._animationRefresh();

		this._is_selected = is_selected;

		if(is_selected)
			this._root_el.classList.add('selected-node');
		else
			this._root_el.classList.remove('selected-node');
	}

	_addDragHandlers() {
		const drag = (e => {
			if(!this._is_moving)
				return;

			const playground = e.currentTarget;

			const mx = e.clientX - playground.offsetLeft;
			const my = e.clientY - playground.offsetTop;

			let center_x = mx + this._center_offset.x;
			let center_y = my + this._center_offset.y;

			// [center_x, center_y] = this._adjustPosition(center_x, center_y);

			this.setTranslation(center_x, center_y);
		}).bind(this);

		this._header_el.addEventListener('mousedown', (e) => {
			this._center_offset = {
				x: this._header_el.clientWidth / 2.0 - e.offsetX,
				y: this._header_el.clientHeight / 2.0 - e.offsetY
			};

			this._is_moving = true;
			this._header_el.className = 'moving';
			this._root_el.parentNode.addEventListener('mousemove', drag);
		});

		this._header_el.addEventListener('mouseup', (e) => {
			this._is_moving = false;
			this._header_el.className = '';
			this._snap();
			this._root_el.parentNode.removeEventListener('mousemove', drag);
		});

		this._header_name.addEventListener('transitionend', () => {
			console.log(`Canceling animation ${this._animation_frame_id}`);
			window.cancelAnimationFrame(this._animation_frame_id);
		});
	}

	_animationRefresh() {
		console.log(`Animation ${this._animation_frame_id}`);
		this._refresh();

		this._animation_frame_id = window.requestAnimationFrame(this._animationRefresh.bind(this));
	}

	_refresh() {
		this.setTranslation(this._translation.x, this._translation.y);
	}

	setTranslation(x, y) {
		this._translation.x = x;
		this._translation.y = y;

		if(!this._root_el.parentNode)
			return;

		const [left, top] = this._computeTrueTopLeft();

		this._root_el.style.transform = `translate(${left}px,${top}px)`;

		const [h_center_x, h_center_y] = this._computeNodeInputAttachment();

		if(this._ins != undefined) {
			this._ins.forEach((edge) => {
				edge.setEnd(h_center_x, h_center_y);
			});
		}

		const [c_center_x, c_center_y] = this._computeNodeOutputAttachment();

		if(this._outs != undefined) {
			this._outs.forEach((edge) => {
				edge.setOrigin(c_center_x, c_center_y);
			});
		}
	}

	_adjustPosition(x,y) {
		const pw = this._root_el.parentNode.clientWidth;
		const ph = this._root_el.parentNode.clientHeight;
		const nw = this._root_el.clientWidth / 2.0;
		const nh = this._root_el.clientHeight / 2.0;

		const adjusted_x = Math.min(Math.max(x, nw), pw - nw);
		const adjusted_y = Math.min(Math.max(y, nh), ph - nh);
		return [adjusted_x, adjusted_y];
	}

	_snap() {
		// const adj_x = Math.round( this._translation.x / SNAP_SIZE ) * SNAP_SIZE;
		// const adj_y = Math.round( this._translation.y / SNAP_SIZE ) * SNAP_SIZE;

		// return [adj_x, adj_y];
	}

	_computeTrueTopLeft() {
		const left = this._translation.x - this._root_el.clientWidth / 2.0;
		const top = this._translation.y - this._root_el.clientHeight / 2.0;

		const snapped_top = Math.round(top / SNAP_SIZE) * SNAP_SIZE;
		const snapped_left = Math.round(left / SNAP_SIZE) * SNAP_SIZE;

		return this._adjustPosition(snapped_left, snapped_top);
	}

	_computeNodeInputAttachment() {
		const x = this._translation.x;
		const y = this._translation.y + this._root_el.clientHeight / 2.0;

		return [x, y];
	}

	_computeNodeOutputAttachment() {
		const x = this._translation.x + this._root_el.clientWidth;
		const y = this._translation.y + this._root_el.clientHeight / 2.0;

		return [x, y];
	}
}
