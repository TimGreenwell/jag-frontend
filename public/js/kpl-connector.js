const CONNECTOR_TYPE = {
	AND: 'and',
	OR: 'or'
};


class KPLConnector extends HTMLElement {
	createdCallback() {
		this.className = 'connector';
		this._type = CONNECTOR_TYPE.AND;
		this._applyType();
	}

	setType(type) {
		this._type = type;
		this._applyType();
	}

	getType() {
		return this._type;
	}

	_applyType() {
		this.innerHTML = this._type;
	}

}

export default document.registerElement('kpl-connector', KPLConnector);