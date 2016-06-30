'use strict';

export default class Library {
	constructor(library_container) {
		this._container = library_container;
		this._items = [];
		this._list = library_container.querySelector('.library-list');
		this._search = library_container.querySelector('.library-search');

		this._initListeners();
	}

	addItem({id, name, desc, idx = -1} = {}) {
		const li = document.createElement('li');
		li.id = id;
		const h3 = document.createElement('h3');
		h3.innerHTML = name;
		const p = document.createElement('p');
		p.innerHTML = desc;

		li.appendChild(h3);
		li.appendChild(p);

		this._items.push({
			element: li,
			search_content: `${id.toLowerCase()} ${name.toLowerCase()} ${desc.toLowerCase()}`
		});

		this._list.appendChild(li);
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

