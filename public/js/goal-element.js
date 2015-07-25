const SNAP_SIZE = 10;
const DEFAULT_TITLE = 'Goal';
const DEFAULT_CONTENT = 'Best design selected';


class KPLNodeElement extends HTMLElement {

	createdCallback() {
		console.log('Creating new KPLNode');
		this._title = DEFAULT_TITLE;
		this._content = DEFAULT_CONTENT;

		this.init();
		this.addMouseHandlers();
	}

	init() {
		this._title_el = document.createElement('header');
		this.appendChild(this._title_el);

		this._content_el= document.createElement('div');
		this._content_el.className = 'content';
		this.appendChild(this._content_el);

		this._connector_el= document.createElement('div');
		this._connector_el.innerHTML = 'AND';
		this._connector_el.className = 'connector';
		this.appendChild(this._connector_el);

		this._applyTitle();
		this._applyContent();
	}

	setTitle(title) {
		this._title = title;
		this._applyTitle();
	}

	 _applyTitle() {
		this._title_el.innerHTML = this._title;
	}

	setContent(content) {
		this._content = content;
		this._applyContent();
	}

	 _applyContent() {
		this._content_el.innerHTML = this._content;
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

	addMouseHandlers() {
		console.log(this);
		let header = this.querySelector('header');
		header.addEventListener('mousedown', (e) => {
			console.log(this);
			this._initial_x = e.offsetX;
			this._initial_y = e.offsetY;
			this._is_moving = true;
			header.className = 'moving';
		});

		header.addEventListener('mouseup', (e) => {
			console.log(this);
			this._is_moving = false;
			header.className = '';

		// 	let new_top = this.offsetTop;
		// 	let new_left = this.offsetLeft;
		// 	new_top = Math.round(new_top/SNAP_SIZE)*SNAP_SIZE;
		// 	new_left = Math.round(new_left/SNAP_SIZE)*SNAP_SIZE;
		// 	this.setTranslation(new_left, new_top);
		});
	
		document.addEventListener('mousemove', (e) => {
			if(!this._is_moving)
				return;

			let new_top = ( e.clientY - this._initial_y ) + 'px';
			let new_left = ( e.clientX - this._initial_x ) + 'px';

			this.setTranslation(new_left, new_top);
		});
	}

	setTranslation(x, y) {
		this.style.transform = `translate(${x},${y})`;
	}
}

export default document.registerElement('kpl-node-element', KPLNodeElement);