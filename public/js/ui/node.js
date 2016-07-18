'use strict';

const SNAP_SIZE = 20.0;

import Listenable from '../listenable.js';

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
	}

	get element() {
		return this._root_el;
	}

	get model() {
		return this._model;
	}

	set name(name) {
		this._model.name = name;
		this._applyName();
	}

	 _applyName() {
		this._header_name.innerHTML = this._model.name;
	}

	addInEdge(edge) {
		let [h_center_x, h_center_y] = this._computeHeaderCenter();
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
		let [c_center_x, c_center_y] = this._computeConnectorCenter();
		edge.setOrigin(c_center_x, c_center_y);
		this._outs.add(edge);
	}

	removeOutEdge(edge) {
		this._outs.delete(edge);
	}

	setSelected(is_selected) {
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

			let new_left = mx - this._initial_x;
			let new_top =  my - this._initial_y;

			[new_left, new_top] = this._adjustPosition(new_left, new_top);

			this.setTranslation(new_left, new_top);
		}).bind(this);

		this._header_el.addEventListener('mousedown', (e) => {
			this._initial_x = e.offsetX;
			this._initial_y = e.offsetY;
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
	}

	setTranslation(x, y) {
		const cx = x;
		const cy = y;
		let h_center_x, h_center_y, c_center_x, c_center_y;

		this._root_el.clientWidth
		this._translation.x = x;
		this._translation.y = y;

		this._root_el.style.transform = `translate(${cx}px,${cy}px)`;

		[h_center_x, h_center_y] = this._computeHeaderCenter();

		if(this._ins != undefined) {
			this._ins.forEach((edge) => {
				edge.setEnd(h_center_x, h_center_y);
			});
		}

		[c_center_x, c_center_y] = this._computeConnectorCenter();

		if(this._outs != undefined) {
			this._outs.forEach((edge) => {
				edge.setOrigin(c_center_x, c_center_y);
			});
		}
	}

	_adjustPosition(x,y) {
		const pw = this._root_el.parentNode.clientWidth;
		const ph = this._root_el.parentNode.clientHeight;
		const nw = this._root_el.clientWidth;
		const nh = this._root_el.clientHeight;

		const adjusted_x = Math.min(Math.max(x, 0), pw - nw);
		const adjusted_y = Math.min(Math.max(y, 0), ph - nh);
		return [adjusted_x, adjusted_y];
	}

	_snap() {
		let adj_x = Math.round( this._translation.x / SNAP_SIZE ) * SNAP_SIZE,
			adj_y = Math.round( this._translation.y / SNAP_SIZE ) * SNAP_SIZE;

		this.setTranslation(adj_x, adj_y);

	}

	_computeHeaderCenter() {
		let center_x = this._translation.x, 
			center_y = this._translation.y + this._root_el.clientHeight / 2.0;

		return [center_x, center_y];
	}

	_computeConnectorCenter() {
		let center_x = this._translation.x + this._root_el.clientWidth,
			center_y = this._translation.y + this._root_el.clientHeight / 2.0;

		return [center_x, center_y];
	}
}
