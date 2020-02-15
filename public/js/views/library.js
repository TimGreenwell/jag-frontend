/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.21
 */

 import JAG from '../models/jag.js';
 import JAGService from '../services/jag.js';

customElements.define('jag-library', class extends HTMLElement {

	constructor() {
		super();

		this._items = [];

		this._initUI();
		this._initListeners();

		this.addItem(new JAG({ name: 'New', description: 'Empty node that can be used to create new behaviors.' }));
	}

	addItem(model, idx = -1) {
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

		li.addEventListener('click', (event) => {
			if(event.shiftKey) {
				const all_models = this._getChildModels(model, new Map());
				this.dispatchEvent(new CustomEvent('item-selected', {
					detail: {
						top: model,
						model_set: all_models
					}
				}));
			}
			else
			{
				this.dispatchEvent(new CustomEvent('item-selected', { detail: model }));
			}
		});

		this._$list.appendChild(li);

		model.addEventListener('copy', this._createItem.bind(this));
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
			item.element.style.display = 'block';
			if(!item.search_content.includes(search_text))
				item.element.style.display = 'none';
		});
	}

	_getChildModels(model, map) {
		if(!model.children)
			return map;

		model.children.forEach((child_details) => {
			const child = this._getDefinitionForURN(child_details.urn);
			map.set(child_details.urn, child);
			if (child) map = this._getChildModels(child, map);
		});

		return map;
	}

	_getDefinitionForURN(urn) {
		for (const item of this._items) {
			if (item.model.urn == urn) {
				return item.model;
			}
		}

		return undefined;
	}

	async _createItem(e) {
		this.addItem(await JAGService.get(e.detail.urn));
	}
});

export default customElements.get('jag-library');

