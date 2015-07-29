import KPLNode from './kpl-node.js';

export default class KPLNodePropertiesUI {
		
		constructor() {
			this._title_el = document.querySelector('#title-property');
			this._content_el = document.querySelector('#content-property');
			this._connector_el = document.querySelector('#connector-property');
			this._node = undefined;
			this._initHandlers();
		}

		setNode(node) {
			this._node = node;
			this._applyNodeProperties();
		}

		_initHandlers() {
			this._title_el.addEventListener('keyup', e => {
				if(!this._node)
					return;

				this._node.setTitle(this._title_el.value);
			});

			this._content_el.addEventListener('keyup', e => {
				if(!this._node)
					return;

				this._node.setContent(this._content_el.value);
			});

			this._connector_el.addEventListener('change', e => {
				if(!this._node)
					return;
				this._node.getConnector().setType(this._connector_el.value);
			})
		}

		_applyNodeProperties() {
			let title = '',
				content = '',
				connector = undefined;

			if(this._node) {
				title = this._node._title;
				content = this._node._content;
				if(this._node.__proto__.getConnector)
					connector = this._node.getConnector().getType();
			}

			this._title_el.value = title;
			this._content_el.value = content;
			this._connector_el.value = connector;
		}
}