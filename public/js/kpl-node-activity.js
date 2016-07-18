import KPLNodeElement from './kpl-node.js';

class KPLActivity extends KPLNodeElement {

	createdCallback() {
		super.createdCallback();
		console.log('Activity node');
	}

	init() {
		super.init();
		console.log('Initializing activity.');
	}



}

export default document.registerElement('kpl-node-activity', KPLActivity);