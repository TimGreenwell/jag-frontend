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
		this._libraryList = [];
	}

	//////////////////////////////////////////////////////////////////////////////////
	//////////  Supporting controllerAT //////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////



	// handleJagStorageCreated (@controllerAT)
	createListItem(newJAGModel) {
		let existingUrns = this._libraryList.filter(entry => {
			return entry.urn;
		})
		if (!existingUrns.includes(newJAGModel.urn)) {
			if (newJAGModel instanceof JagModel) {
				const urn = newJAGModel.urn;
				const name = newJAGModel.name || '';
				const description = newJAGModel.description || '';

				const li = document.createElement('li');

				let deleteIconClickedHandler = function (event) {
					event.stopPropagation();

					this.dispatchEvent(new CustomEvent('local-jag-deleted', {
						detail: {
							jagModelUrn: newJAGModel.urn
						}
					}))
				}

				let lockIconClickedHandler = function (event) {
					event.stopPropagation();
						this.dispatchEvent(new CustomEvent('local-jag-locked', {
						detail: {
							jagModel: newJAGModel
						}
					}))
				}



				//const $header = document.createElement('header');
				const $topHalfWrapper = document.createElement('h3');
				const $nameEntry = document.createElement('span')
				$nameEntry.classList.add('name-entry')
				$nameEntry.innerText = newJAGModel.name;

				const toggleLock = document.createElement('div');
				toggleLock.classList.add('jag-button', 'lock-button');
				toggleLock.addEventListener('click', lockIconClickedHandler.bind(this))

				$topHalfWrapper.appendChild(toggleLock);
				$topHalfWrapper.appendChild($nameEntry);

				const $bottomHalfWrapper = document.createElement('h3');
				const $descriptionEntry = document.createElement('span')
				$descriptionEntry.classList.add('description-entry')
				$descriptionEntry.innerText = newJAGModel.description;

				const deleteJag = document.createElement('div');
				if (!newJAGModel.isLocked) {
					deleteJag.classList.add('jag-button', 'delete-button');
					deleteJag.addEventListener('click',  deleteIconClickedHandler.bind(this))
				}

				$bottomHalfWrapper.appendChild(deleteJag);
				$bottomHalfWrapper.appendChild($descriptionEntry);

				li.appendChild($topHalfWrapper);
				li.appendChild($bottomHalfWrapper);

				let search_params = [];
				search_params.push(urn.toLowerCase());
				search_params.push(name.toLowerCase());
				search_params.push(description.toLowerCase());

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
					}))
				});


				let newItem = {
					element: li,
					search_content: search_params.join(" "),
					jagModel: newJAGModel
				};

				return newItem;

				//	jagModel.addEventListener('copy', this._createItem.bind(this));         // temp out - what does this do? looks obs.
			} else {
				console.log("ERROR -- unexpected type for newJAGModel [library-addItem]")
			}
		} else {
			console.log("ERROR -- URN already exists [library-addItem]")
		}
	}

	addListItem(newJAGModel) {
		// handleNodeStorageCreated (@controllerAT)
		let listItemElement = this.createListItem(newJAGModel)
		this._libraryList.push(listItemElement);
		this._$list.appendChild(listItemElement.element);
	}


	addListItems(jagModelArray) {
		// initializePanels (@controllerAT)
		jagModelArray.forEach(jagModel => {
			this.addListItem(jagModel)
		});
	}


	updateItem(updatedJAGModel) {
		let listItemElement = this.createListItem(updatedJAGModel)
		for (let item of this._libraryList) {
			this._$list.removeChild(item.element);
		}
		for (let idx in this._libraryList) {
			if (this._libraryList[idx].jagModel.urn == updatedJAGModel.urn) {
				this._libraryList[idx] = listItemElement;
			}
		}
		for (let item of this._libraryList) {
			this._$list.appendChild(item.element);
		}
	}


	// @TODO are updateItem and replaceItem functionally equivalent? Do I need both?

	replaceItem(newJAGModel, replacedUrn) {
		// handleJagStorageReplaced (@controllerAT)
		this.removeLibraryListItem(replacedUrn);
		this.appendChild(newJAGModel);
	}



	removeLibraryListItem(deletedUrn) {
		// handleJagStorageDeleted (@controllerAT)
		for (let item of this._libraryList) {
			this._$list.removeChild(item.element);
		}
		this._libraryList = this._libraryList.filter(entry => {
			return entry.jagModel.urn != deletedUrn
		})
		for (let item of this._libraryList) {
			this._$list.appendChild(item.element);
		}
	}

	//??
	// handleJagStorageReplaced (@controllerAT)
	replaceItem(newJAGModel, replacedUrn) {
		this.removeLibraryListItem(replacedUrn);
		this.addListItem(newJAGModel);
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
