/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.43
 */

import JagModel from '../models/jag.js';
import StorageService from '../services/storage-service.js';
import LibraryControls from "../ui/library-controls.js";

customElements.define('jag-library', class extends HTMLElement {

	constructor() {
		super();
		this._libraryList = [];                         // <li> elements holding jagModel.name & description + (search context) + jagModel
		this._existingURNS = new Set();                // Set of URNs in _libraryList
        // Build outer structure inside <jag-library> (search input & ol for nodes)
		this._initUI();
		this._initListeners();
		this.clearLibraryList();
	};

	clearLibraryList() {
		for (let item of this._libraryList) {
			this._$list.removeChild(item.element);
		}
		this._existingURNS.clear();
	}

	removeLibraryListItem(urn) {
		for (let item of this._libraryList) {
			if (item.element.id == urn) {
				this._$list.removeChild(item.element);
			}
		}
		this._libraryList = this._libraryList.filter(function (item) {
			return item.element.id != urn;
		});
		this._existingURNS.delete(urn);

	}

	updateItem(updatedJAGModel) {
		for (let idx in this._libraryList) {
			console.log("lirary - updated jag model")
			if (this._libraryList[idx].jagModel.urn == updatedJAGModel.urn) {

				this._libraryList[idx].jagModel = updatedJAGModel;
				this._libraryList[idx].element.id=updatedJAGModel.urn;
				this._libraryList[idx].element.querySelectorAll("h3").item(0).innerHTML = updatedJAGModel.name;
				this._libraryList[idx].element.querySelectorAll("p").item(0).innerHTML = updatedJAGModel.description;
				let search_params =[];
				search_params.push(updatedJAGModel.urn.toLowerCase());
				search_params.push(updatedJAGModel.name.toLowerCase());
				search_params.push(updatedJAGModel.description.toLowerCase());
				this._libraryList[idx].search_content = search_params.join(" ");
				this.refreshItem(updatedJAGModel);
			}
		}
	}

	// Adding an item in library:
	//     1)   Build <li> element for list (also holds search content and JAG model[why?])
	//     2)   Attach 'update' and 'refresh' and 'copy' listeners
	//     3)   Attach 'click' to <li> to dispatch 'library-lineItem-selected'
	// Add the <li id='urn'>
	//           <h3> 'name' </h3>
	//           <p> 'description'
	//         </li>

	addItem(newJAGModel) {
		if (!this._existingURNS.has(newJAGModel.urn)) {
			if (newJAGModel instanceof JagModel) {
				const urn = newJAGModel.urn || '';
				const name = newJAGModel.name;
				const description = newJAGModel.description || '';

				const li = document.createElement('li');
				li.id = urn;
				const h3 = document.createElement('h3');
				h3.innerHTML = name;
				const p = document.createElement('p');
				p.innerHTML = description;

				li.appendChild(h3);
				li.appendChild(p);


				let search_params = [];
				search_params.push(urn.toLowerCase());
				search_params.push(name.toLowerCase());
				search_params.push(description.toLowerCase());
				this._libraryList.push({
					element: li,
					search_content: search_params.join(" "),
					jagModel: newJAGModel
				});

				// Unsure what this listener is for.
				// newJAGModel.addEventListener('update', (e) => {
				// 	const {property} = e.detail;
				// 	if (property == 'name') {
				// 		h3.innerHTML = newJAGModel.name;
				// 	} else if (property == 'description') {
				// 		p.innerHTML = newJAGModel.description;
				// 	} else if (property == 'children') {
				// 		this.refreshItem(newJAGModel);
				// 	}
				// });

				newJAGModel.addEventListener('refresh', () => {
					this.refreshItem(newJAGModel);
				});


				// Send the newJAGModel and all its children through the dispatch
				li.addEventListener('click', (event) => {
					this._getChildModels(newJAGModel, new Map()).then(function (childrenMap) {
						console.log("___________________")
						console.log(newJAGModel)
						console.log(childrenMap)
						console.log(event.shiftKey)
						this.dispatchEvent(new CustomEvent('library-lineItem-selected', {
							detail: {
								jagModel: newJAGModel,
								jagModel_set: childrenMap,
								expanded: event.shiftKey
							}
						}))
					}.bind(this));
				});

				this._$list.appendChild(li);
				this._existingURNS.add(newJAGModel.urn);
				//	jagModel.addEventListener('copy', this._createItem.bind(this));         // temp out - what does this do? looks obs.
			} else {
				console.log("ERROR -- unexpected type for newJAGModel [library-addItem]")
			}
		} else {
			console.log("ERROR -- URN already exists [library-addItem]")
		}
	}

	replaceItem(newJAGModel, replacedUrn) {
		this.removeLibraryListItem(replacedUrn);
		this.addItem(newJAGModel);
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

	addListItems(jagModelArray) {
		jagModelArray.forEach(jagModel => this.addItem(jagModel));
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
		this._libraryList.forEach((item) => {
			if (item.element) {
				item.element.style.display = 'block';
				if(!item.search_content.includes(search_text))
					item.element.style.display = 'none';
			}
		});
	}

	// why is this here -- why not a master list of JAG models with functions like this so
	// everyone can use.
	// UPDATE - they now want the graph to be permanent.  This means a tree of nodes which will become permanent.

	async _getChildModels(parentJAGModel, childrenJAGMap) {
		if(!parentJAGModel.children)              // @TODO or.. if (parentJAGModel.children) then for loop...  return childrenJAGMap
			return childrenJAGMap;
		for (let childDetails of parentJAGModel.children) {
			const childJAGModel = await this._lazyGet(childDetails.urn);
			childrenJAGMap.set(childDetails.urn, childJAGModel);
			childrenJAGMap = await this._getChildModels(childJAGModel, childrenJAGMap);
		}
		return childrenJAGMap;
	}

//  @TODO Some kind of order to the cached data

	async _lazyGet(targetURN) {
		for (const lineItem of this._libraryList) {
			if (lineItem.jagModel.urn == targetURN) {
				return lineItem.jagModel;
			}
		}
		const foundJAGModel = await StorageService.get(targetURN, 'jag');
		this.addItem(foundJAGModel);
		return foundJAGModel;
	}

	// @TODO  understand this guy
	async refreshItem(newJAGModel, refreshedSet = new Set()) {
		this._getChildModels(newJAGModel, new Map()).then(function (all_jagModels) {
			this.dispatchEvent(new CustomEvent('refresh', {
				detail: {
					jagModel: newJAGModel,
					jagModel_set: all_jagModels,
					refreshed: refreshedSet
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
