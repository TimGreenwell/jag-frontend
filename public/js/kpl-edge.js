const XMLNS = 'http://www.w3.org/2000/svg';

class KPLEdgeElement extends SVGGElement {

	createdCallback() {
		console.log('Creating new KPLEdge');
		this.init();
	}

	init() {
		this._origin = {x : 0, y : 0};
		this._end = {x : 0, y : 0};
		this._edge_el = document.createElementNS(XMLNS, 'path');
		this._edge_el.setAttributeNS(null, 'stroke', 'white');
		this._edge_el.setAttributeNS(null, 'fill', 'transparent');
		this.appendChild(this._edge_el);
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

		let x1 = this._origin.x + 0,
			y1 = this._origin.y + 50,
			x2 = this._end.x + 0,
			y2 = this._end.y - 50;

		this._data = `M ${this._origin.x} ${this._origin.y} C ${x1} ${y1}, ${x2} ${y2}, ${this._end.x} ${this._end.y}`;

		this._edge_el.setAttributeNS(null, 'd', this._data);
	}

	setGreyedOut(is_greyed_out) {
		this._is_greyed_out = is_greyed_out;

		if(is_greyed_out)
			this.className = 'greyed-out-node';
		else
			this.className = '';
	}

	setSelected(is_selected) {
		this._is_selected = is_selected;

		if(is_selected)
			this.className = 'selected-node';
		else
			this.className = '';
	}
}

export default document.registerElement('kpl-edge', {
	prototype: KPLEdgeElement.prototype,
	extends: 'g'
});