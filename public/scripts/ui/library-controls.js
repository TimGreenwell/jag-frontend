/**
 * @fileOverview JAG controls component.
 *
 * @author mvignati
 * @version 0.08
 */

'use strict';

class LibraryControls extends HTMLElement {

	constructor(jagModel) {
		super();
		this._jagModel = jagModel;

		this._initUI();
		this._initListeners();
	}

	_initUI() {
		this._toggleLock = document.createElement('div');
		this._deleteJag = document.createElement('div');

		this._toggleLock.classList.add('jag-button', 'lock-button');
		this._deleteJag.classList.add('jag-button', 'delete-button');

		this.appendChild(this._toggleLock);
		this.appendChild(this._deleteJag);
	}

	_initListeners() {
		this._toggleLock.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('local-lock-toggle', {bubbles: true, composed: true, detail: {node: this._jagModel}}));
		});

		this._deleteJag.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('local-jag-delete', {bubbles: true, composed: true, detail: {node: this._jagModel}}));
		});
	}

}

customElements.define('library-controls', LibraryControls);
export default customElements.get('library-controls');

