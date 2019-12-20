'use strict';

import {SelectionEvent} from './events.js';

export default class Library extends EventTarget {
	constructor(library_container) {
		super();
		this._container = library_container;
		this._items = [];
		this._list = library_container.querySelector('.library-list');
		this._search = library_container.querySelector('.library-search');

		this._initListeners();
	}

	addItem(definition, idx = -1) {
		const id = definition.urn;
		const name = definition.name;
		const description = definition.description || '';

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
			definition: definition
		});

		li.addEventListener('click', (event) => {
			if(event.shiftKey) {
				const all_definitions = this._getChildDefinitions(definition, new Set());
				this.dispatchEvent(new SelectionEvent('item-selected', {
					top: definition,
					definition_set: all_definitions
				}));
			}
			else
			{
				this.dispatchEvent(new SelectionEvent('item-selected', definition));
			}
		});

		this._list.appendChild(li);
	}

	handleResourceUpdate(message) {
		message.data.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});

		message.data.forEach((resource) => {
			this.addItem(resource);
		});
	}

	_initListeners() {
		this._search.addEventListener('keyup', this._filterFromSearchInput.bind(this));
	}

	_filterFromSearchInput(e) {
		const search_text = e.srcElement.value.toLowerCase();

		this._items.forEach((item) => {
			item.element.style.display = 'block';
			if(!item.search_content.includes(search_text))
				item.element.style.display = 'none';
		});
	}

	_getChildDefinitions(definition, set) {
		if(!definition.children)
			return set;


		definition.children.forEach((child_urn) => {
			const child = this._getDefinitionForURN(child_urn);

			set.add(child);
			set = this._getChildDefinitions(child, set);
		});

		return set;
	}

	_getDefinitionForURN(urn) {
		for(const item of this._items)
		{
			if(item.definition.urn == urn)
				return item.definition;
		}

		return undefined;
	}
}

