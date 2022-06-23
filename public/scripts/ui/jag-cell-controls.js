/**
 * @fileOverview JAG controls component.
 *
 * @author mvignati
 * @version 0.08
 */

'use strict';

class JagCellControls extends HTMLElement {

	constructor(node) {
		super();
		this._node = node;

		this._initUI();
		this._initListeners();
	}

	_initUI() {
		this._addButton = document.createElement('div');
		this._removeButton = document.createElement('div');

		this._addButton.classList.add('jag-button', 'add-child-button');
		this._removeButton.classList.add('jag-button', 'remove-button');

		this.appendChild(this._addButton);

		// Only show the remove icon if not root.
		if(!this._node.isRoot())
			this.appendChild(this._removeButton);
	}

	_initListeners() {
		this._addButton.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('event-node-addchild', {bubbles: true, composed: true, detail: {cell: this._node}}));
		});

		this._removeButton.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('event-node-prunechild', {bubbles: true, composed: true, detail: {cell: this._node}}));
		});
	}

}

customElements.define('jag-controls', JagCellControls);
export default customElements.get('jag-controls');

