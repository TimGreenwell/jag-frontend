/**
 * @file AnalysisModel library for IA editor.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.16
 */

//import AnalysisService from '../services/analysis-model.js';
import StorageService from "../services/storage-service.js";
import AnalysisModel from "../models/analysis-model.js";
import JAG from "../models/jag.js";

customElements.define('analysis-library', class extends HTMLElement {

	constructor(controller) {
		super();
		this._controller = controller
		this._items = [];
		this._defined = new Set();

		this._initUI();
		this._initListeners();
		//StorageService.subscribe("jag-storage-updated", this.updateListItem.bind(this));  not needed until URN renames allowed
		StorageService.subscribe("analysis-storage-updated", this.updateListItem.bind(this));
		StorageService.subscribe("analysis-storage-created", this.addListItem.bind(this));

		this.clearItems();
		this.loadFromDB();
	}

	clearItems() {
		for (let item of this._items) {
			this._$list.removeChild(item.element);
		}
		this._items = [];
		this._defined.clear();
	}

	// updateItem(updatedJAGModel) {
	// 	for (let idx in this._libraryList) {
	// 		if (this._libraryList[idx].model.urn == updatedJAGModel.urn) {
	// 			console.log("nice!!");
	// 			this._libraryList[idx].model = updatedJAGModel;
	// 			this._libraryList[idx].element.id=updatedJAGModel.urn;
	// 			this._libraryList[idx].element.querySelectorAll("h3").item(0).innerHTML = updatedJAGModel.name;
	// 			this._libraryList[idx].element.querySelectorAll("p").item(0).innerHTML = updatedJAGModel.description;
	// 			let search_params =[];
	// 			search_params.push(updatedJAGModel.urn.toLowerCase());
	// 			search_params.push(updatedJAGModel.name.toLowerCase());
	// 			search_params.push(updatedJAGModel.description.toLowerCase());
	// 			this._libraryList[idx].search_content = search_params.join(" ");
	// 			this.refreshItem(updatedJAGModel);
	// 		}
	// 	}
	// }

	updateListItem(updatedAnalysisModel, idx = -1) {
		console.log("Analysis Library (updateListItem) received NOTIFICATION for analysis-storage-updated")

		for (let idx in this._items) {
			if (this._items[idx].model.id == updatedAnalysisModel.id) {

				const rootUrn = this._items[idx].element.querySelectorAll("pre").item(0).innerText;
				const name = updatedAnalysisModel.name;
				const description = updatedAnalysisModel.description;

				this._items[idx].element.querySelectorAll("h3").item(0).innerText = name;
				this._items[idx].element.querySelectorAll("p").item(0).innerText = description;

				const search_params =[];
				search_params.push(name.toLowerCase());
				search_params.push(rootUrn.toLowerCase());
				search_params.push(description.toLowerCase());
				this._items[idx].search_content = search_params.join(" ");
			}
		}
	}

	addListItem(model, idx = -1) {
		console.log("Analysis Library (addListItem) received NOTIFICATION for analysis-storage-created")
		const id = model.urn || '';
		const root = model.rootUrn;
		const name = model.name;
		const description = model.description || '';

		const li = document.createElement('li');
		li.id = id;
		const h3 = document.createElement('h3');
		h3.innerHTML = name;  // analysis name
		const pre = document.createElement('pre');
		pre.innerHTML = root; // root url
		const p = document.createElement('p');
		p.innerHTML = description;  // analysis description

		li.appendChild(h3);
		li.appendChild(pre);
		li.appendChild(p);

		const search_params = [];
		search_params.push(name.toLowerCase());
		search_params.push(root.toLowerCase());
		search_params.push(description.toLowerCase());

		this._items.push({
			element: li,
			search_content: search_params.join(" "),
			model: model
		});

		model.addEventListener('update', (e) => {
			const {property, extra} = e.detail;

			if (property == 'name') {
				h3.innerHTML = extra.name;
			} else if (property == 'description') {
				p.innerHTML = extra.description;
			}
		});

		li.addEventListener('click', (event) => {
			this.dispatchEvent(new CustomEvent('library-analysis-selected', {
				detail: {
					model: model
				}
			}));
		});

		this._$list.appendChild(li);

		this._defined.add(model.id);

		model.addEventListener('copy', this._createItem.bind(this));
	}

	async loadFromDB() {
		const analyses = await StorageService.all('analysis');
		analyses.forEach(analysis => this.addListItem(analysis));
	}

	_initUI() {
		//const $header = document.createElement('header');
		const $search = document.createElement('input');
		const $list = document.createElement('ol');

		$search.classList.add('library-search');
		$list.classList.add('library-list');

		this.appendChild($search);
		this.appendChild($list);

		this._$list = $list;
		this._$search = $search;
	}

	_initListeners() {
		this._$search.addEventListener('keyup', this._filterFromSearchInput.bind(this));
	}

	_filterFromSearchInput(e) {
		const search_text = e.srcElement.value.toLowerCase();

		this._items.forEach((item) => {
			if (item.element) {
				item.element.style.display = 'block';
				if(!item.search_content.includes(search_text))
					item.element.style.display = 'none';
			}
		});
	}

	async _getChildModels(model, map) {
		if(!model.children)
			return map;

		for (let child_details of model.children) {
			const child = await this._getDefinitionForURN(child_details.urn);
			map.set(child_details.urn, child);
			map = await this._getChildModels(child, map);
		}

		return map;
	}

	async _createItem(e) {
		this.addListItem(e.detail.model);
	}

});

export default customElements.get('analysis-library');

