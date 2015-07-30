import KPLNodeElement from './kpl-node.js';
import KPLConnector from './kpl-connector.js';

class KPLGoal extends KPLNodeElement {

	createdCallback() {
		super.createdCallback();
		console.log('Goal node')
	}

	init() {
		super.init();
		console.log('Initializing subgoal.');
		this._connector_el = new KPLConnector();
		this.appendChild(this._connector_el);
	}

	getConnector() { 
		return this._connector_el;
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
		let center_x = this._translation.x,
			center_y = this._translation.y + this.clientHeight / 2.0;

		return [center_x, center_y];
	}
}

export default document.registerElement('kpl-node-goal', KPLGoal);