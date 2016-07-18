'use strict';

import Listenable from './listenable.js';

export default class Library extends Listenable {
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
			this.notify('item-selected', definition);
		});

		this._list.appendChild(li);
	}

	handleResourceUpdate(event) {
		event.resources.forEach((resource) => {
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
}

