/**
 * @file Analysis library for IA editor.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.09
 */

import AnalysisService from '../services/analysis.js';

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
			const {property} = e.detail;

			if (property == 'name') {
				h3.innerHTML = model.name;
			} else if (property == 'root') {
				pre.innerHTML = model.root;
			} else if (property == 'description') {
				p.innerHTML = model.description;
			}
		});

		li.addEventListener('click', (event) => {
			this._getChildModels(model, new Map()).then(function (all_models) {
				this.dispatchEvent(new CustomEvent('item-selected', {
					detail: {
						model: model,
						model_set: all_models,
						expanded: event.shiftKey
					}
				}))
			}.bind(this));
		});

		this._$list.appendChild(li);

		this._defined.add(model.id);

		model.addEventListener('copy', this._createItem.bind(this));
	}

	async loadFromDB() {
		const idb_service = AnalysisService.instance('idb-service');
		const analyses = await idb_service.all();
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

