/**
 * @file Analysis library for IA editor.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.16
 */

//import AnalysisService from '../services/analysis.js';
import StorageService from "../services/storage-service.js";
import Analysis from "../models/analysis.js";
import JAG from "../models/jag.js";

customElements.define('analysis-library', class extends HTMLElement {

	constructor() {
		super();

		this._items = [];
		this._defined = new Set();

		this._initUI();
		this._initListeners();

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

	addItem(model, idx = -1) {
		console.log("Here:");
		console.log(model);
		const id = model.urn || '';
		const root = model.root.urn;
		const name = model.name;
		const description = model.description || '';

		const li = document.createElement('li');
		li.id = id;
		const h3 = document.createElement('h3');
		h3.innerHTML = name;
		const pre = document.createElement('pre');
		pre.innerHTML = root;
		const p = document.createElement('p');
		p.innerHTML = description;

		li.appendChild(h3);
		li.appendChild(pre);
		li.appendChild(p);

		this._items.push({
			element: li,
			search_content: `${id.toLowerCase()} ${name.toLowerCase()} ${root.toLowerCase()} ${description.toLowerCase()}`,
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
			this.dispatchEvent(new CustomEvent('item-selected', {
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
		//const idb_service = AnalysisService.instance('idb-service');
		const analysesJsonList = await StorageService.all('analysis');
		const analyses = analysesJsonList.map(Analysis.fromJSON);
		console.log(analysesJsonList);
		console.log(analyses);
		analyses.forEach(analysis => this.addItem(analysis));
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
		this.addItem(e.detail.model);
	}

});

export default customElements.get('analysis-library');

