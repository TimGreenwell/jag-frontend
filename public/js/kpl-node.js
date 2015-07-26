const SNAP_SIZE = 10;
const DEFAULT_TITLE = 'Goal';
const DEFAULT_CONTENT = 'Best design selected';


class KPLNodeElement extends HTMLElement {

	createdCallback() {
		console.log('Creating new KPLNode');
		this._title = DEFAULT_TITLE;
		this._content = DEFAULT_CONTENT;

		this.init();
		this._addDragHandlers();
	}

	init() {
		this._header_el = document.createElement('header');
		this.appendChild(this._header_el);

		this._content_el= document.createElement('div');
		this._content_el.className = 'content';
		this.appendChild(this._content_el);

		this._connector_el= document.createElement('div');
		this._connector_el.innerHTML = 'AND';
		this._connector_el.className = 'connector';
		this.appendChild(this._connector_el);

		this.setTranslation('100px', '100px');
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
		});
	
		document.addEventListener('mousemove', (e) => {
			if(!this._is_moving)
				return;

			let new_top = ( e.clientY - this._initial_y ) + 'px';
			let new_left = ( e.clientX - this._initial_x ) + 'px';

			this.setTranslation(new_left, new_top);
		});		
	}

	addOnEdgeInitializedListener(listener) {
		this._connector_el.addEventListener('mousedown', e => {
			listener(e, this);
		});
	}

	addOnEdgeFinalizedListener(listener) {
		this._header_el.addEventListener('mouseup', listener);
	}

	setTranslation(x, y) {
		this.style.transform = `translate(${x},${y})`;
	}
}

export default document.registerElement('kpl-node', KPLNodeElement);