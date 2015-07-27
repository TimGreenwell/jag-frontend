import KPLNodeElement from './kpl-node.js';

const DEFAULT_TITLE = 'Activity';

class KPLActivity extends KPLNodeElement {

	createdCallback() {
		super.createdCallback();
		this._title = DEFAULT_TITLE; 
	}

	init() {
		super.init();
		console.log('Initializing activity.');
	}

	addOnEdgeFinalizedListener(listener) {
		this.addEventListener('mouseup', e => {
			listener(e, this);
		});
	}

}

export default document.registerElement('kpl-node-activity', KPLActivity);