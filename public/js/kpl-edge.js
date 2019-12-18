const XMLNS = 'http://www.w3.org/2000/svg';

export default class KPLEdge {
	constructor() {
		console.log('Creating new KPLEdge');
		this.init();
	}

	init() {
		this._group = document.createElementNS(XMLNS, 'g');
		this._origin = {x : 0, y : 0};
		this._end = {x : 0, y : 0};
		this._node_origin = undefined;
		this._node_end = undefined;
		this._edge_el = document.createElementNS(XMLNS, 'path');
		this._edge_el.setAttributeNS(null, 'stroke', 'gray');
		this._edge_el.setAttributeNS(null, 'fill', 'transparent');
		this._group.appendChild(this._edge_el);

		this._edge_el.addEventListener('click', e => {
			this._edge_el.setAttributeNS(null, 'stroke', 'red');
		});
	}

	destroy() {
		this._group.ownerSVGElement.removeChild(this._group);

		if(this._node_origin != undefined)
			this._node_origin.removeOutEdge(this);
		if(this._node_end != undefined)
			this._node_end.removeInEdge(this);
	}

	setNodeOrigin(node) {
		this._node_origin = node;
		node.addOutEdge(this);
	}

	setNodeEnd(node) {
		this._node_end = node;
		node.addInEdge(this);
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

		this._data = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;

		this._edge_el.setAttributeNS(null, 'd', this._data);
	}

	setGreyedOut(is_greyed_out) {
		this._is_greyed_out = is_greyed_out;

		if(is_greyed_out)
			this._group.className = 'greyed-out-node';
		else
			this._group.className = '';
	}

	setSelected(is_selected) {
		this._is_selected = is_selected;

		if(is_selected)
			this._group.className = 'selected-node';
		else
			this._group.className = '';
	}
}