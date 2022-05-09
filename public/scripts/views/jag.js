/**
 * @fileOverview JAG view.
 *
 * @author mvignati
 * @version 2.47
 */

// These are the table JAG blocks - contains autocomplete,
// better name?  iaJagCell  1:1 based off atJagNodes

'use strict';

import StorageService from '../services/storage-service.js';
import AutoComplete from '../ui/auto-complete.js';
import JAGControls from '../ui/jag-controls.js';
import AnalysisCell from './analysis-cell.js';
import IaTable from "../ui/ia-table.js";

// A Cell based off (model/Node)
class JAGView extends AnalysisCell {

	constructor(nodeModel) {
		super();
		this._nodeModel = nodeModel;

		this._elements = {
			urn: undefined,
			name: undefined,
			suggestions: undefined
		};

		this._init();
	}

	get nodeModel() {
		return this._nodeModel;
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
		this.nodeModel.addEventListener('sync', this._sync.bind(this));
		this._createDocument();

		//JAGService.instance('idb-service').all()
		const allJagModels = await StorageService.all('jag');
		allJagModels.forEach(jagModel => this._elements.suggestions.suggestions = allJagModels.map(jagModel => jagModel.urn));

	}

	_createDocument() {
		const $controls = new JAGControls(this.nodeModel);
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
		$name.innerText = this.nodeModel.name;

		$urn.addEventListener('blur', this._handleURNChange.bind(this));
		$urn.addEventListener('keydown', this._handleURNEdit.bind(this));
		$urn.addEventListener('input', this._handleURNInput.bind(this));
		$urn.setAttribute('contenteditable', '');
		$urn.setAttribute('spellcheck', 'false');
		$urn.setAttribute('tabindex', '-1');

		if(this._nodeModel.jag !== undefined)// && this._nodeModel.jag.hasValidURN)
			$urn.innerText = this.nodeModel.urn;
		else
			this.classList.add('unsaved');

		$fold.addEventListener('click', () => this.nodeModel.toggleCollapse());
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
		this.urn = this.nodeModel.urn;                                   //   this = jagView
		this.name = this.nodeModel.name;
		this._setLeafStatus();
	}

	_handleURNChange(e) {
		if (this.urn === this.nodeModel.urn)
			return;

		this._elements.suggestions.hide();
		this.nodeModel.syncJAG(this);
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


	// This runs when the Name field of the IATABLE Jag node area loses focus.
	_handleNameChange() {
		if((this.jag) && this._elements.name.innerText !== this.jag.name) {
             // if url is empty or valid then url becomes mutation of the name:
			const dirtyUrl = IaTable.defaultUrn + this.jag.name;
			const possUrl = dirtyUrl.replace(' ','-').replace(/[^0-9a-zA-Z:-]+/g,"").toLowerCase();
			const urn = possUrl;
			this._elements.urn.innerText = urn;
			this._elements.urn.innerText.focus();

			this.nodeModel.commitNameChange(this);
		}
		else{console.log("NAME DID NOT CHANGE OR WE ARE UNDEFINED")}



	}

	async _handleNameEdit(e) {
		switch(e.key) {
			case 'Enter':
				// Enter adds a new sibling
				// Shift+Enter adds a new child
				e.preventDefault();
				this._elements.name.blur();

				if(e.shiftKey)
					this.nodeModel.newChild();
				if(e.ctrlKey) {
					if (this.nodeModel.parent !== undefined)
						this.nodeModel.parent.newChild();
					else
						console.log('Can\'t add siblings to root');
				}

				break;
			case 'Escape':
				this._elements.name.blur();
				break;
		}
	}

	// This updates as the user type in the names field of the IATABLE jag node area.
	_handleNameInput(e) {
			const name = e.target.innerText;
	}

	_setLeafStatus() {
		this.classList.toggle('leaf', this.nodeModel.childCount === 0);
	}


}

customElements.define('ia-jag', JAGView);
export default customElements.get('ia-jag');

