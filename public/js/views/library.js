/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.21
 */

 import JAG from '../models/jag.js';
 import JAGService from '../services/jag.js';
 import UndefinedJAG from '../models/undefined.js';

customElements.define('jag-library', class extends HTMLElement {

	constructor() {
		super();

		this._items = [];
		this._defined = new Set();

		this._initUI();
		this._initListeners();

		this.addItem(new JAG({ name: 'New', description: 'Empty node that can be used to create new behaviors.' }));
		this._default = this._items[0];

		this.loadFromDB();
	}

	clearItems() {
		for (let item of this._items) {
			this._$list.removeChild(item.element);
		}

		this._$list.appendChild(this._default.element);
		this._items = [this._default];
		this._defined.clear();
		this._defined.add(this._default.urn);
	}

	addItem(model, idx = -1) {
		if (!this._defined.has(model.urn)) {
			if (model instanceof JAG) {
				const id = model.urn || '';
				const name = model.name;
				const description = model.description || '';

				const li = document.createElement('li');
				li.id = id;
				const h3 = document.createElement('h3');
				h3.innerHTML = name;
				const p = document.createElement('p');
				p.innerHTML = description;

				li.appendChild(h3);
				li.appendChild(p);

				this._items.push({
					element: li,
					search_content: `${id.toLowerCase()} ${name.toLowerCase()} ${description.toLowerCase()}`,
					model: model
				});

				model.addEventListener('update', (event) => {
					if (event.detail.property == 'name') {
						h3.innerHTML = model.name;
					} else if (event.detail.property == 'description') {
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

				this._defined.add(model.urn);

				model.addEventListener('copy', this._createItem.bind(this));
			} else if (model instanceof UndefinedJAG) {
				this._items.push({
					model: model
				});

				model.addEventListener('define', this._defineItem.bind(this));
			}
		}
	}

	handleResourceUpdate(message) {
		message.data.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});

		message.data.forEach((resource) => {
			this.addItem(resource);
		});
	}

	async loadFromDB() {
		this.clearItems();

		let allAvailable = await JAGService.getAllAvailable();

		for (let key of allAvailable) {
			let model = await JAGService.get(key);
			this.addItem(model);
		}
	}

	_initUI() {
		const $header = document.createElement('header');
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

	async _getDefinitionForURN(urn) {
		// Attempt to retrieve JAG for this URN from locally available items.
		for (const item of this._items) {
			if (item.model.urn == urn) {
				return item.model;
			}
		}

		// Not found; update available JAGs in the library to pull newly defined (and Undefined) JAGs.
		await this.loadFromDB();

		// Call this function again for this URN. There will be a defined or undefined JAG available for this URN.
		return this._getDefinitionForURN(urn);
	}

	async _createItem(e) {
		this.addItem(await JAGService.get(e.detail.urn));
	}

	async _defineItem(e) {
		for (let idx in this._items) {
			if (this._items[idx].model.urn == e.detail.urn) {
				this._items.splice(idx, 1);
				break;
			}
		}

		this.addItem(e.detail.model);
	}
});

export default customElements.get('jag-library');

