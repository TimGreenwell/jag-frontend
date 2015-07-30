const SNAP_SIZE = 20.0;

export default class KPLNodeElement extends HTMLElement {

	createdCallback() {
		console.log('Creating new KPLNode');
		this._translation = {x: 0, y:0};
		this._outs = new Set();
		this._ins = new Set();
		
		this.init();
		this._addDragHandlers();
	}

	init() {
		this.setAttribute('is', 'kpl-node');

		this._header_el = document.createElement('header');
		this.appendChild(this._header_el);

		this._content_el= document.createElement('div');
		this._content_el.className = 'content';
		this.appendChild(this._content_el);

		this.setTranslation(100, 100);
		this._applyTitle();
		this._applyContent();
	}

	setTitle(title) {
		this._title = title;
		this._applyTitle();
	}

	 _applyTitle() {
		this._header_el.innerHTML = this._title;
	}

	setContent(content) {
		this._content = content;
		this._applyContent();
	}

	 _applyContent() {
		this._content_el.innerHTML = this._content;
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

	setSelected(is_selected) {
		this._is_selected = is_selected;

		if(is_selected)
			this.className += 'selected-node';
		else
			this.className = '';
	}

	_addDragHandlers() {
		this._header_el.addEventListener('mousedown', (e) => {
			this._initial_x = e.offsetX;
			this._initial_y = e.offsetY;
			this._is_moving = true;
			this._header_el.className = 'moving';
		});

		this._header_el.addEventListener('mouseup', (e) => {
			this._is_moving = false;
			this._header_el.className = '';
			this._snap();
		});
	
		document.addEventListener('mousemove', (e) => {
			if(!this._is_moving)
				return;

			let new_top = ( e.clientY - this._initial_y + this.clientHeight / 2.0);
			let new_left = ( e.clientX - this._initial_x + this.clientWidth / 2.0);

			this.setTranslation(new_left, new_top);
		});		
	}

	setTranslation(x, y) {
		let cx = x - this.clientWidth / 2.0,
			cy = y - this.clientHeight / 2.0,
			h_center_x, h_center_y;

		this._translation.x = x;
		this._translation.y = y;

		this.style.transform = `translate(${cx}px,${cy}px)`;

		[h_center_x, h_center_y] = this._computeHeaderCenter();

		if(this._ins != undefined) {
			this._ins.forEach((edge) => {
				edge.setEnd(h_center_x, h_center_y);
			});
		}
	}

	_snap() {
		let adj_x = Math.round( this._translation.x / SNAP_SIZE ) * SNAP_SIZE,
			adj_y = Math.round( this._translation.y / SNAP_SIZE ) * SNAP_SIZE;

		this.setTranslation(adj_x, adj_y);

	}

	_computeHeaderCenter() {
		let center_x = this._translation.x - this.clientWidth / 2.0, 
			center_y = this._translation.y;

		return [center_x, center_y];
	}
}
