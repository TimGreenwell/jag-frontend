/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.43
 */

import JagModel from '../models/jag.js';

customElements.define('jag-library', class extends HTMLElement {

	constructor() {
		super();
		this._libraryList = [];                         // <li> elements holding jagModel.name & description + (search context) + jagModel
		this._existingURNS = new Set();                // Set of URNs in _libraryList
		this._initUI();
		this._initListeners();
		this.clearLibraryList();
	};

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

	clearLibraryList() {
		for (let item of this._libraryList) {
			this._$list.removeChild(item.element);
		}
		this._existingURNS.clear();
	}

	//////////////////////////////////////////////////////////////////////////////////
	//////////  Supporting controllerAT //////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////
	// initializePanels (@controllerAT)
	addListItems(jagModelArray) {
		jagModelArray.forEach(jagModel => this.addItem(jagModel));
	}

	// handleJagStorageCreated (@controllerAT)
	addItem(newJAGModel) {
		if (!this._existingURNS.has(newJAGModel.urn)) {
			if (newJAGModel instanceof JagModel) {
				const urn = newJAGModel.urn || '';
				const name = newJAGModel.name;
				const description = newJAGModel.description || '';

				const li = document.createElement('li');
				li.id = urn;

				const toggleLock = document.createElement('div');
				toggleLock.classList.add('jag-button', 'lock-button');
				const deleteJag = document.createElement('div');
				deleteJag.classList.add('jag-button', 'delete-button');


				//const $header = document.createElement('header');
				const $topHalfWrapper = document.createElement('h3');
				const $nameEntry = document.createElement('span')
				$nameEntry.classList.add('name-entry')
				$nameEntry.innerText = newJAGModel.name;

				$topHalfWrapper.appendChild(toggleLock);
				$topHalfWrapper.appendChild($nameEntry);

				const $bottomHalfWrapper = document.createElement('h3');
				const $descriptionEntry = document.createElement('span')
				$descriptionEntry.classList.add('description-entry')
				$descriptionEntry.innerText = newJAGModel.description;

				$bottomHalfWrapper.appendChild(deleteJag);
				$bottomHalfWrapper.appendChild($descriptionEntry);

				li.appendChild($topHalfWrapper);
				li.appendChild($bottomHalfWrapper);

				let search_params = [];
				search_params.push(urn.toLowerCase());
				search_params.push(name.toLowerCase());
				search_params.push(description.toLowerCase());
				this._libraryList.push({
					element: li,
					search_content: search_params.join(" "),
					jagModel: newJAGModel
				});

				newJAGModel.addEventListener('refresh', () => {
					this.refreshItem(newJAGModel);
				});


				// Send the newJAGModel and all its children through the dispatch
				$bottomHalfWrapper.addEventListener('click', (event) => {
					this.dispatchEvent(new CustomEvent('library-lineItem-selected', {
						detail: {
							jagModel: newJAGModel,
							expanded: event.shiftKey
						}
					}))});

				$topHalfWrapper.addEventListener('click', (event) => {
					this.dispatchEvent(new CustomEvent('library-lineItem-selected', {
						detail: {
							jagModel: newJAGModel,
							expanded: event.shiftKey
						}
					}))});

				deleteJag.addEventListener('click', (event) => {
					event.stopPropagation();
					this.dispatchEvent(new CustomEvent('local-jag-deleted', {
						detail: {
							jagModelUrn: newJAGModel.urn,
						}
					}))
				})

				toggleLock.addEventListener('click', (event) => {
					event.stopPropagation();
					this.dispatchEvent(new CustomEvent('local-jag-locked', {
						detail: {
							jagModelUrn: newJAGModel.urn,
						}
					}))
				})

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

	// handleJagStorageUpdated (@controllerAT)
	updateItem(updatedJAGModel) {
		for (let idx in this._libraryList) {
			if (this._libraryList[idx].jagModel.urn == updatedJAGModel.urn) {
				this._libraryList[idx].jagModel = updatedJAGModel;
				this._libraryList[idx].element.id=updatedJAGModel.urn;
				this._libraryList[idx].element.querySelectorAll(".name-entry").item(0).innerHTML = updatedJAGModel.name;
				this._libraryList[idx].element.querySelectorAll(".description-entry").item(0).innerHTML = updatedJAGModel.description;
				let search_params =[];
				search_params.push(updatedJAGModel.urn.toLowerCase());
				search_params.push(updatedJAGModel.name.toLowerCase());
				search_params.push(updatedJAGModel.description.toLowerCase());
				this._libraryList[idx].search_content = search_params.join(" ");
				if (updatedJAGModel.isLocked) {

				}
				//			this.refreshItem(updatedJAGModel);
			}
		}
	}

	// handleJagStorageDeleted (@controllerAT)
	removeLibraryListItem(deletedUrn) {
		for (let item of this._libraryList) {
			if (item.element.id == deletedUrn) {
				this._$list.removeChild(item.element);
			}
		}
		this._libraryList = this._libraryList.filter(function (item) {
			return item.element.id != deletedUrn;
		});
		this._existingURNS.delete(deletedUrn);

	}

	// handleJagStorageReplaced (@controllerAT)
	replaceItem(newJAGModel, replacedUrn) {
		this.removeLibraryListItem(replacedUrn);
		this.addItem(newJAGModel);
	}


	//////////////////////////////////////////////////////////////////////////////////
	//////////  Supporting ///////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////


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


	//  called by jag-at when listener on graph-service hears 'resources'

	handleResourceUpdate(message) {
		message.data.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});

		message.data.forEach((resource) => {
			this.addItem(resource);
		});
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


//         <li id='urn'>
//           <h3> 'name' </h3>
//           <p> 'description'
//         </li>
