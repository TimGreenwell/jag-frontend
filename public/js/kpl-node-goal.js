import KPLNodeElement from './kpl-node.js';

const DEFAULT_TITLE = 'Subgoal';

class KPLGoal extends KPLNodeElement {

	createdCallback() {
		super.createdCallback();
		this._title = DEFAULT_TITLE;
	}

	init() {
		super.init();
		console.log('Initializing subgoal.');
		this._connector_el= document.createElement('div');
		this._connector_el.innerHTML = 'AND';
		this._connector_el.className = 'connector';
		this.appendChild(this._connector_el);
	}

	addOnEdgeInitializedListener(listener) {
		this._connector_el.addEventListener('mousedown', e => {
			listener(e, this);
		});
	}

	addOnEdgeFinalizedListener(listener) {
		this.addEventListener('mouseup', e => {
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

	setTranslation(x,y) {
		super.setTranslation(x,y);

		let [c_center_x, c_center_y] = this._computeConnectorCenter();

		this._outs.forEach((edge) => {
			edge.setOrigin(c_center_x, c_center_y);
		});

	}

	_computeConnectorCenter() {
		let center_x = this.clientWidth / 2.0 + this._translation.x,
			center_y = this.clientHeight + this._translation.y;

		return [center_x, center_y];
	}
}

export default document.registerElement('kpl-node-goal', KPLGoal);