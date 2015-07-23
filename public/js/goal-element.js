class KPLNodeElement extends HTMLElement {
	createdCallback() {
		console.log('Creating new KPLNode');
		this.setInnerHTML();
		this.addMouseHandlers();
	}

	setInnerHTML() {
		this.innerHTML = '<header>Goal</header>' +
		'<div class=\'content\'>Best design selected</div>' +
		'<div class=\'connector\'>AND</div>';
	}

	addMouseHandlers() {
		console.log(this);
		let header = this.querySelector('header');
		header.addEventListener('mousedown', function(e) {
			console.log(this);
			this._initial_x = e.offsetX;
			this._initial_y = e.offsetY;
			this._is_moving = true;
		}.bind(this));

		header.addEventListener('mouseup', function(e) {
			console.log(this);
			this._is_moving = false;
		}.bind(this));
	
		document.addEventListener('mousemove', function(e) {
			if(!this._is_moving)
				return;

			let new_top = ( e.clientY - this._initial_y ) + 'px';
			let new_left = ( e.clientX - this._initial_x ) + 'px';

			this.style.top = new_top;
			this.style.left = new_left;
		}.bind(this));	
	}
}

export default document.registerElement('kpl-node-element', KPLNodeElement);