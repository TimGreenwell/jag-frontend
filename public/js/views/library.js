/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.21
 */

customElements.define('jag-library', class extends HTMLElement {

	constructor() {
		super();

		this._items = [];

		this._initUI();
		this._initListeners();
	}

	addItem(definition, idx = -1) {
		const id = definition.urn || '';
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
				this.dispatchEvent(new CustomEvent('item-selected', {
					detail: {
						top: definition,
						definition_set: all_definitions
					}
				}));
			}
			else
			{
				this.dispatchEvent(new CustomEvent('item-selected', { detail: definition }));
			}
		});

		this._$list.appendChild(li);
	}

	handleResourceUpdate(message) {
		message.data.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});

		message.data.forEach((resource) => {
			this.addItem(resource);
		});
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
});

export default customElements.get('jag-library');

