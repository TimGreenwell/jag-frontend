/**
 * @fileOverview JAG view.
 *
 * @author mvignati
 * @version 2.47
 */

'use strict';

//import JAGService from '../services/jag.js';
import StorageService from '../services/storage-service.js';
import AutoComplete from '../ui/auto-complete.js';
import JAGControls from '../ui/jag-controls.js';
import AnalysisCell from './analysis-cell.js';
import JAG from "../models/jag.js";

class JAGView extends AnalysisCell {

	constructor(model) {
		super();
		this._model = model;

		this._elements = {
			urn: undefined,
			name: undefined,
			suggestions: undefined
		};

		this._init();
	}

	get model() {
		return this._model;
	}

	get urn() {
		return this._elements.urn.innerText;
	}

	set urn(urn) {
		this._elements.urn.innerText = urn;
	}

	get urnElement() {
		return this._elements.urn;
	}

	get name() {
		return this._elements.name.innerText.trim();
	}

	set name(name) {
		this._elements.name.innerText = name;
	}

	get nameElement() {
		return this._elements.name;
	}

	set valid(valid) {
		this.classList.toggle('unsaved', !valid);
	}

	hide() {
		this.classList.add('hidden');
	}

	show() {
		this.classList.remove('hidden');
	}

	async _init() {
		this.model.addEventListener('sync', this._sync.bind(this));
		this._createDocument();

		//JAGService.instance('idb-service').all()
		const resultJsonList = await StorageService.all('jag');
		const jags = resultJsonList.map(JAG.fromJSON);
		jags.forEach(jag => this._elements.suggestions.suggestions = jags.map(jag => jag.urn));

	}

	_createDocument() {
		const $controls = new JAGControls(this.model);
		const $header = document.createElement('header');
		const $name = document.createElement('h1');
		const $urn = document.createElement('h2');
		const $suggestions = new AutoComplete();
		const $fold = document.createElement('div');

		this._setLeafStatus();

		$name.addEventListener('blur', this._handleNameChange.bind(this));
		$name.addEventListener('keydown', this._handleNameEdit.bind(this));
		$name.addEventListener('input', this._handleNameInput.bind(this));
		$name.setAttribute('contenteditable', '');
		$name.setAttribute('spellcheck', 'false');
		$name.innerText = this.model.name;

		$urn.addEventListener('blur', this._handleURNChange.bind(this));
		$urn.addEventListener('keydown', this._handleURNEdit.bind(this));
		$urn.addEventListener('input', this._handleURNInput.bind(this));
		$urn.setAttribute('contenteditable', '');
		$urn.setAttribute('spellcheck', 'false');
		$urn.setAttribute('tabindex', '-1');

		if(this._model.jag !== undefined)// && this._model.jag.hasValidURN)
			$urn.innerText = this.model.urn;
		else
			this.classList.add('unsaved');

		$fold.addEventListener('click', () => this.model.toggleCollapse());
		$fold.classList.add('fold-button');

		$header.appendChild($name);
		$header.appendChild($controls);

		this.appendChild($header);
		this.appendChild($urn);
		this.appendChild($suggestions);
		this.appendChild($fold);

		this._elements.urn = $urn;
		this._elements.name = $name;
		this._elements.suggestions = $suggestions;
	}

	_sync() {
		this.urn = this.model.urn;
		this.name = this.model.name;
		this._setLeafStatus();
	}

	_handleURNChange(e) {
		if (this.urn === this.model.urn)
			return;

		this._elements.suggestions.hide();
		this.model.syncJAG(this);
	}

	_handleURNEdit(e) {
		switch(e.key) {
			case 'Enter':
				e.preventDefault();
				const selected = this._elements.suggestions.selected;
				if (selected !== undefined)
					this._elements.urn.innerText = selected
				this._elements.urn.blur();
				this._elements.suggestions.hide();
				break;
			case 'Escape':
				this._elements.urn.innerText = this.jag.urn;
				this._elements.urn.blur();
				break;
			case 'ArrowDown':
				e.preventDefault();
				this._elements.suggestions.select(1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				this._elements.suggestions.select(-1);
				break;
		}
	}

	_handleURNInput(e) {
		const $suggestions = this._elements.suggestions;
		$suggestions.filter(this._elements.urn.innerText);
	}

	_handleNameChange() {
		if(this.jag === undefined || this._elements.name.innerText !== this.jag.name)
			this.model.commitNameChange(this);
	}

	async _handleNameEdit(e) {
		switch(e.key) {
			case 'Enter':
				// Enter adds a new sibling
				// Shift+Enter adds a new child
				e.preventDefault();
				await this.model.commitNameChange(this);

				if(e.shiftKey)
					this.model.newChild();
				else if (this.model.parent !== undefined)
					this.model.parent.newChild();
				else
					console.log('Can\'t add siblings to root');
					// @TODO: Notify if trying to add a sibling to the root, instead of failing silently.

				break;
			case 'Escape':
				this._elements.name.blur();
				break;
		}
	}

	_handleNameInput(e) {
		if(this._model.linkStatus) {
			const name = e.target.innerText;
			const urnified_name = name.trim().toLowerCase().replace(/\s/g, '-');
			const urn = `urn:ihmc:${urnified_name}`;
			this._elements.urn.innerText = urn;
		}
	}

	_setLeafStatus() {
		this.classList.toggle('leaf', this.model.childCount === 0);
	}


}

customElements.define('ia-jag', JAGView);
export default customElements.get('ia-jag');

