/**
 * @fileOverview JAG view.
 *
 * @author mvignati
 * @version 2.47
 */

// These are the JAG Blocks found in the IA Table  (contains autocomplete)
// Could use a better name => iaJagCell?  1:1 based off atJagNodes


'use strict';

import StorageService from '../services/storage-service.js';
import AutoComplete from '../ui/auto-complete.js';
import JagCellControls from '../ui/jag-cell-controls.js';
import AnalysisCell from './analysis-cell.js';
import IaTable from "../ui/ia-table.js";
import InputValidator from "../utils/validation.js";
import JAG from "../models/jag.js";
import Validator from "../utils/validation.js";
import ControllerIA from "../controllers/controllerIA.js";
import UserPrefs from "../utils/user-prefs.js";

// A Cell based off (model/Node)
class JagCell extends AnalysisCell {

	constructor(nodeModel) {
		super();
		this._nodeModel = nodeModel;

		this._htmlElements = {
			urnEntry: undefined,
			nameEntry: undefined,
			suggestions: undefined
		};
		this._initUI();
		this._initHandlers();
	}


	get nodeModel() {
		return this._nodeModel;
	}
	set nodeModel(value) {
		this._nodeModel = value;
	}

	//////  Elements and Element Values
	get urnElementEntry() {
		return this._htmlElements.urnEntry.innerText;
	}
	set urnElementEntry(urn) {
		this._htmlElements.urnEntry.innerText = urn;
	}
	get urnElement() {
		return this._htmlElements.urnEntry;
	}

	get nameElementEntry() {
		return this._htmlElements.nameEntry.innerText.trim();
	}
	set nameElementEntry(name) {
		this._htmlElements.nameEntry.innerText = name;
	}
	get nameElement() {
		return this._htmlElements.nameEntry;
	}

    //////  classList Properties
	set valid(valid) {
		this.classList.toggle('unsaved', !valid);
	}
	hide() {
		this.classList.add('hidden');
	}
	show() {
		this.classList.remove('hidden');
	}

	async _initHandlers() {

		// note: the icon controls in the JagCell are defined by JagCellControls

		this._htmlElements.nameEntry.addEventListener('blur', this._handleNameChange.bind(this));  // pass name and 'auto-urn' up to ControllerIA for Jag updating.
		this._htmlElements.nameEntry.addEventListener('keypress', this._handleNameEdit.bind(this)); // adds child or sibling depending on keypress
		this._htmlElements.nameEntry.addEventListener('input', this._handleNameInput.bind(this));  // no idea.. view thing.  needed?

		this._htmlElements.urnEntry.addEventListener('blur', this._handleURNChange.bind(this));  // pass urn change to ControllerIA.updateURN
		this._htmlElements.urnEntry.addEventListener('keydown', this._handleURNEdit.bind(this)); // poorly named -- handles the suggestions
		this._htmlElements.urnEntry.addEventListener('input', this._handleURNInput.bind(this));  // poorly named -- filters suggestions
	}


	// Handlers

	async _handleNameChange() {
		// This runs when the Name field of the IATABLE Jag node area loses focus - blurs
		if (this.nameElementEntry !== this.nodeModel.name) {
			this.nameElementEntry = this.nameElementEntry.split(':').slice(-1);

			this.nodeModel.name = this.nameElementEntry;
			if (Validator.isValidUrn(this.nodeModel.urn)) {
				this.dispatchEvent(new CustomEvent('local-jag-updated', {bubbles: true, composed: true, detail: {jagModel: this._nodeModel.jag}}));  //tlg changed from node to jagModel  - looks bad
			} else {
				this._nodeModel.urn = this.urnElementEntry;
				this.dispatchEvent(new CustomEvent('local-jag-created', {
					bubbles: true,
					composed: true,
					detail: this._nodeModel.jag
				}));
				parent = this.nodeModel.parent.jag;
				let id = parent.addChild(this.urnElementEntry);                    // <-- thinking we dont need ids in the jag child list.. does not seem used
				this.dispatchEvent(new CustomEvent('local-jag-updated', {
					bubbles: true,
					composed: true,
					detail: {jagModel: parent}
				}));
				//this._htmlElements.urnEntry.focus();   // @TODO -- started getting an error on this.. distraction.
	}
		}
	}

	async _handleNameEdit(e) {
		switch(e.key) {
			case 'Enter':
				// Enter adds a new sibling
				// Shift+Enter adds a new child
				e.preventDefault();
				this._htmlElements.nameEntry.blur();

				if(e.shiftKey)
					this.nodeModel.addChild(new NodeModel());   // shift to controller (ControllerIA.addNewNode(nodeModel))
				if(e.ctrlKey) {
					if (this.nodeModel.parent !== undefined)
						this.nodeModel.parent.addChild(new NodeModel());  // shift to controller (ControllerIA.addNewNode(nodeModel.parent))
					else
						console.log('Can\'t add siblings to root');
				}
				break;
			case 'Escape':
				this._htmlElements.nameEntry.blur();
				break;
		}
		const validCharacters = new RegExp('[A-Za-z0-9-:]')
		if ((!Validator.isValidUrn(this.nodeModel.urn))  && (e.key.length == 1) && (validCharacters.test(e.key))) {
			this.urnElementEntry = this.urnElementEntry + e.key.toLowerCase();

		}
	}

	_handleNameInput(e) {
		// This updates as the user type in the names field of the IATABLE jag node area.
		// No idea what this is doing.  (But looks internal to view).
		const name = e.target.innerText;
	}


	_handleURNChange(e) {
		if (this.urnElementEntry !== this.nodeModel.urn) {           // if urn was changed
			if (Validator.isValidUrn(this.urnElementEntry)) {        // && entered urn is valid...
			    this._htmlElements.suggestions.hide();
				// Is the current URN valid?  (A rename involves more than the initial create)
				if (Validator.isValidUrn(this.nodeModel.urn)) {
					this.dispatchEvent(new CustomEvent('local-urn-updated', {
						bubbles: true,
						composed: true,
						detail: {originalUrn: this.nodeModel.urn, newUrn: this.urnElementEntry}
					}));
					//ControllerIA.updateURN(this.urn, this.nodeModel.urn);  // orig, new
				} else {
					this.dispatchEvent(new CustomEvent('local-jag-created', {
						bubbles: true,
						composed: true,
						detail: {urn: this.urnElementEntry, name: this.nameElementEntry}
					}));
					parent = this.nodeModel.parent.jag;
					console.log(JSON.stringify(this))
					let id = parent.addChild(this.urnElementEntry);                    // <-- thinking we dont need ids in the jag child list.. does not seem used
					this.dispatchEvent(new CustomEvent('local-jag-updated', {
						bubbles: true,
						composed: true,
						detail: {jagModel: parent}
					}));
					console.log(JSON.stringify(this))
				}
			}
			//this.nodeModel.urn = this.urnElementEntry
		}
	}

	_handleURNEdit(e) {
		switch(e.key) {
			case 'Enter':
				e.preventDefault();
				const selected = this._htmlElements.suggestions.selected;
				if (selected !== undefined)
					this.urnElementEntry = selected
				this._htmlElements.urnEntry.blur();
				this._htmlElements.suggestions.hide();
				break;
			case 'Escape':
				this.urnElementEntry = this.nodeModel.urn;
				this._htmlElements.urnEntry.blur();
				break;
			case 'ArrowDown':
				e.preventDefault();
				this._htmlElements.suggestions.select(1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				this._htmlElements.suggestions.select(-1);
				break;
		}
		const validCharacters = /^[A-Za-z0-9\-\:]+/
		if ((this.nodeModel.name == '')  && (e.key.match(validCharacters))) {
			this.nameElementEntry = (this.nameElementEntry + e.key).split(':').slice(-1);
		}
	}


	_handleURNInput(e) {
		const $suggestions = this._htmlElements.suggestions;
		$suggestions.filter(this.urnElementEntry);
	}





	async deleteJagModel(deadJagModel) {
		this._jagModel = undefined;
		await StorageService.get(deadJagModel.urn, 'jag');


		await StorageService.delete(deadJagModel.urn, 'jag');
		this._urnInput.classList.toggle("edited", false);
		this._clearProperties();
	}

	async cloneJagModel(sourceJagModel, newURN) {
		const description = sourceJagModel.toJSON();
		description.urn = newURN;
		const newJagModel = JAG.fromJSON(description);
		// Update model references.
		this._node.model = newJagModel; //?
		this._jagModel = newJagModel;
		await StorageService.create(newJagModel, 'jag');
		// Remove unsaved box shadow on URN property input.
		this._urnInput.classList.toggle("edited", false);

		//  WHEN GOOD -->             this._jagModel.url = this._urnInput.value;
	}


	/**
	 * The two methods below came from the Node Model.  Wrong place for them.
	 * @param view
	 * @returns {Promise<void>}
	 */

	async commitNameChange(view) {
		if (this.linkStatus)
			await this.syncJAG(view, false);
		else
			this.jag.name = view.name;
		await StorageService.update(this,'node');
	}

	/**
	 * Synchronizes the display values with the underlying jag model.
	 * Actions could be, load a new jag model, create a new jag model or change the name of the current jag.
	 * tlg - if nodes are instances of a jag, why should their change affect the jag itself?
	 */
	async syncJAG(view, replace = true) {
		const urn = view.urn;
		const name = view.name;

		// If the urn is not valid just notify and revert to previous state
		// @TODO: Implement the notification.
		try {
			Validator.validateURN(urn);
		} catch (e) {
			// 6 dispatchers here - Only Listener in views/Jag
			this.dispatchEvent(new CustomEvent('sync'));
			return;
		}

		//let jag = await JAGService.instance('idb-service').get(urn);
		let jag = await StorageService.get(urn,'jag');

		// If the model does not exists create one from the view values.
		// if the model does exists, reset to previous state unless replace is true.
		if (!jag) {
			jag = new JAG({
				urn: urn,
				name: name
			});

			//await JAGService.instance('idb-service').create(jag);
			await StorageService.create(jag,'jag');
		} else if (!replace) {
			// If the jag already exists we want to abort unless replace is set to true.
			//@TODO: notify the user why this is prevented and how to go about doing it (edit the urn manually).
			// Potentially we could ask the user if s/he wants to load the existing jag.
			// 6 dispatchers here - Only Listener in views/Jag
			this.dispatchEvent(new CustomEvent('sync'));
			return;
		}

		this._updateJAG(jag);
		const valid = true;//this.jag.hasValidURN;
		view.valid = valid;
		if(valid)
			this.link_status = false;
		// 2 dispatches here - 1 listener in views/Analysis
		this.dispatchEvent(new CustomEvent('layout'));
	}


	async _initUI() {
		this.nodeModel.addEventListener('sync', this._syncViewToModel.bind(this));
		//@TODO should view listen to model (new way) or controller (older way)

		const $controls = new JagCellControls(this.nodeModel);
		const $header = document.createElement('header');
		const $nameEntry = document.createElement('h1');
		const $urnEntry = document.createElement('h2');
		const $suggestions = new AutoComplete();
		const $fold = document.createElement('div');

		this.classList.toggle('leaf', !this.nodeModel.hasChildren());  // Am I a leaf?


		$nameEntry.setAttribute('contenteditable', '');
		$nameEntry.setAttribute('spellcheck', 'false');
		$nameEntry.classList.add('nodename');
		$nameEntry.setAttribute('placeholder', 'Activity');


		$urnEntry.setAttribute('contenteditable', '');
		$urnEntry.setAttribute('spellcheck', 'false');
		$urnEntry.setAttribute('tabindex', '-1');

		if (this._nodeModel.jag !== undefined)  // && this._nodeModel.jag.hasValidURN) {
		{
			$urnEntry.innerText = this.nodeModel.urn;
			$nameEntry.innerText = this.nodeModel.name;
		} else {
			this.classList.add('unsaved');
		}

		$fold.addEventListener('click', () =>
			this.dispatchEvent(new CustomEvent('local-collapse-toggled', {bubbles: true, composed: true, detail: {node: this._nodeModel}})))
		$fold.classList.add('fold-button');

		// $nameEntry.appendChild($nameEntryInput)
		// $urnEntry.appendChild($urnEntryInput)
		$header.appendChild($nameEntry);
		$header.appendChild($controls);
		this.appendChild($header);
		this.appendChild($urnEntry);
		this.appendChild($suggestions);
		this.appendChild($fold);

		this._htmlElements.urnEntry = $urnEntry;
		this._htmlElements.nameEntry = $nameEntry;
		this._htmlElements.suggestions = $suggestions;

		//    tg - Both functions are equivalent but neither seem to be of any use.  this._htmlElements is set to auto-complete.
		//    tg - possibly the '.suggestions.suggestions' is a mistake.
		await StorageService.all('jag').then(jags => this._htmlElements.suggestions.suggestions = jags.map(jag => jag.urn));
       //	allJagModels.forEach(() => this._htmlElements.suggestions.suggestions = allJagModels.map(jagModel => jagModel.urn));
	}







    updateSuggestions(jagModelList) {
		//jagModelList.forEach(() => this._htmlElements.suggestions.suggestions = jagModelList.map(jagModel => jagModel.urn));
		this._htmlElements.suggestions.suggestions = jagModelList.map(jagModel => jagModel.urn)
	}

	// Sync view to existing model values.  --- Triggered on 'sync' event which is linked to nodeModel.
	_syncViewToModel() {
		console.log("SYNC HAS BEEN ACTIVATED.................................(surgical treatment of jag/model change)........................   (thought it was disabled) ..........")
		this.urnElementEntry = this.nodeModel.urn;
		this.nameElementEntry = this.nodeModel.name;
		this.classList.toggle('leaf', !this.nodeModel.hasChildren());
	}


}

customElements.define('ia-jag', JagCell);
export default customElements.get('ia-jag');

