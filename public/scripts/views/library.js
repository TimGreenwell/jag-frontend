/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.43
 */

import JAG from '../models/jag.js';
import StorageService from '../services/storage-service.js';
//import UndefinedJAG from '../models/undefined.js';

customElements.define('jag-library', class extends HTMLElement {

	constructor() {
		super();
		this._items = [];                         // <li> elements holding model.name & description + (search context) + model
		this._defined = new Set();                // Set of URNs in _items
        // Build outer structure inside <jag-library> (search input & ol for nodes)
		this._initUI();
		this._initListeners();
		StorageService.setSchema('jag');
		StorageService.subscribe("storage-updated", this.updateItem.bind(this));
		StorageService.subscribe("storage-created", this.addItem.bind(this));

		this.clearItems();
		this.loadFromDB();
	};

	clearItems() {
		for (let item of this._items) {
			this._$list.removeChild(item.element);
		}
		this._defined.clear();
	}

	// Add the <li id='urn'>
	//           <h3> 'name' </h3>
	//           <p> 'description'
	//         </li>

	updateItem(updatedModel) {

		for (let idx in this._items) {
			if (this._items[idx].model.urn == updatedModel.urn) {
				this._items[idx].model = updatedModel;
				this._items[idx].element.id=updatedModel.urn;
				this._items[idx].element.querySelectorAll("h3").item(0).innerHTML = updatedModel.name;
				this._items[idx].element.querySelectorAll("p").item(0).innerHTML = updatedModel.description;
				let search_params =[];
				search_params.push(updatedModel.urn.toLowerCase());
				search_params.push(updatedModel.name.toLowerCase());
				search_params.push(updatedModel.description.toLowerCase());
				this._items[idx].search_content = search_params.join(" ");
			}
		}
	}

	// Adding an item in library:
	//     1)   Build <li> element for list (also holds searchcontent and JAG model[why?])
	//     2)   Attach 'update' and 'refresh' and 'copy' listeners to JAG model
	//     3)   Attach 'click' to <li> to dispatch 'item-selected'

	addItem(model, idx = -1) {                    // model here is type JAG
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

				// Unsure what this listener is for.  We do not need JAG model dispatching updates if we have observer going.
				model.addEventListener('update', (e) => {
					const {property} = e.detail;
					if (property == 'name') {
						h3.innerHTML = model.name;
					} else if (property == 'description') {
						p.innerHTML = model.description;
					} else if (property == 'children') {
						this.refreshItem(model);
					}
				});

				model.addEventListener('refresh', () => {
					this.refreshItem(model);
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
			//	model.addEventListener('copy', this._createItem.bind(this));         // temp out - what does this do? looks obs.
			}
			//  else if (model instanceof UndefinedJAG) {
			// 	this._items.push({
			// 		model: model
			// 	});
			//
			// 	model.addEventListener('define', this._defineItem.bind(this));
			// }
		}
	}


	//  called by jag-at when listener on graph-service hears 'resources'

	handleResourceUpdate(message) {
		message.data.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});

		message.data.forEach((resource) => {
			this.addItem(resource);
		});
	}

	async loadFromDB() {
		const jags = await StorageService.all('jag');
		jags.forEach(jag => this.addItem(jag));
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

	// why is this here -- why not a master list of JAG models with functions like this so
	// everyone can use.

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

    // (see above) same applies below.
	// Got some concerns about this one.  There is no '.getDirect' on any existing services.
	// I think its supposed to look at some cache obj.. seems like unnecessary redundancy
	// Whats the speed cost of IndexedDB. Does it matter?  @TODO write hashtbl for all nodes.

	async _getDefinitionForURN(urn) {
		// Attempt to retrieve JAG for this URN from locally available items.
		for (const item of this._items) {
			if (item.model.urn == urn) {
				return item.model;
			}
		}

		// Make an attempt to get a directly available model from JAGService (such as from cache or
		// undefined list), else creates a new UndefinedJAG in JAGService and awaits a new model
		// definition, which will be caught by global handler to update library. Adds the undefined
		// model to the library for access in above loop later.
		const model = StorageService.getDirect(urn, 'jag');
		this.addItem(model);
		return model;
	}

	async refreshItem(model, refreshed = new Set()) {
		this._getChildModels(model, new Map()).then(function (all_models) {
			this.dispatchEvent(new CustomEvent('refresh', {
				detail: {
					model: model,
					model_set: all_models,
					refreshed: refreshed
				}
			}))
		}.bind(this));
	}


});

export default customElements.get('jag-library');

// <jag-library> (this)
//   <input class='library-search'></input>
//   <ol class='library-list'>
//      ( Line items added later by addItems )
//   </ol>
// </jag-library>

////////////////////////////////////////////////

// async _createItem(e) {                       // ??
// 	this.addItem(e.detail.model);               //  part of the 'copy' listener.  has no dispatcher - looks obs
// }

// Not sure of the reason for this.
// Callback for listener on 'define'
// Listener attached during (addItem) when incoming JAG model is typeof undefinedJAG
// async _defineItem(e) {
// 	for (let idx in this._items) {
// 		if (this._items[idx].model.urn == e.detail.urn) {
// 			this._items.splice(idx, 1);
// 			break;
// 		}
// 	}
// 	const model = e.detail.model;
// 	this.addItem(model);
// 	await this.refreshItem(model);
// }


// async loadFromLocalhost() {
// 	const jags = await StorageService.all('jag');
// 	jags.forEach(jag => this.addItem(jag));
// }