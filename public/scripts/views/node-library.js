/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.43
 */

import NodeModel from '../models/node.js';

customElements.define('node-library', class extends HTMLElement {

	constructor() {
		super();
		this._libraryList = [];                         // <li> elements holding nodeModel's head Node name & description + (search context) + nodeModel
		this._existingIds = new Set();                // Set of Ids in _libraryList
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
		this._existingIds.clear();
	}

	//////////////////////////////////////////////////////////////////////////////////
	//////////  Supporting controllerAT //////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////
	// initializePanels (@controllerAT)
	addListItems(nodeModelArray) {
		nodeModelArray.forEach(nodeModel => this.addItem(nodeModel));
	}

	// handleNodeStorageCreated (@controllerAT)
	addItem(newNodeModel) {
		if (!this._existingIds.has(newNodeModel.id)) {
			if (newNodeModel instanceof NodeModel) {
				const id = newNodeModel.id || '';
				const urn = newNodeModel.jag.urn;
				const name = newNodeModel.jag.name;
				const description = newNodeModel.jag.description || '';

				const li = document.createElement('li');
				li.id = id;

				const toggleLock = document.createElement('div');
				toggleLock.classList.add('node-button', 'lock-button');
				const deleteNode = document.createElement('div');
				deleteNode.classList.add('node-button', 'delete-button');


				//const $header = document.createElement('header');
				const $topHalfWrapper = document.createElement('h3');
				const $nameEntry = document.createElement('span')
				$nameEntry.classList.add('name-entry')
				$nameEntry.innerText = newNodeModel.name;

				$topHalfWrapper.appendChild(toggleLock);
				$topHalfWrapper.appendChild($nameEntry);

				const $bottomHalfWrapper = document.createElement('h3');
				const $descriptionEntry = document.createElement('span')
				$descriptionEntry.classList.add('description-entry')
				$descriptionEntry.innerText = newNodeModel.description;

				$bottomHalfWrapper.appendChild(deleteNode);
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
					nodeModel: newNodeModel
				});

				newNodeModel.addEventListener('refresh', () => {
					console.log(("Refresh event heard in Library"))
					this.refreshItem(newNodeModel);
				});


				// Send the newNodeModel and all its children through the dispatch
				$bottomHalfWrapper.addEventListener('click', (event) => {
					this.dispatchEvent(new CustomEvent('project-lineItem-selected', {
						detail: {
							projectModel: newNodeModel,
							expanded: event.shiftKey
						}
					}))});

				$topHalfWrapper.addEventListener('click', (event) => {
					this.dispatchEvent(new CustomEvent('project-lineItem-selected', {
						detail: {
							projectModel: newNodeModel,
							expanded: event.shiftKey
						}
					}))});

				deleteNode.addEventListener('click', (event) => {
					event.stopPropagation();
					this.dispatchEvent(new CustomEvent('local-node-deleted', {
						detail: {
							nodeModelId: newNodeModel.id,
						}
					}))
				})

				toggleLock.addEventListener('click', (event) => {
					event.stopPropagation();
					this.dispatchEvent(new CustomEvent('local-node-locked', {
						detail: {
							nodeModelUrn: newNodeModel.urn,
						}
					}))
				})

				this._$list.appendChild(li);
				this._existingIds.add(newNodeModel.urn);
				//	nodeModel.addEventListener('copy', this._createItem.bind(this));         // temp out - what does this do? looks obs.
			} else {
				console.log("ERROR -- unexpected type for newNodeModel [library-addItem]")
			}
		} else {
			console.log("ERROR -- URN already exists [library-addItem]")
		}
	}


	// handleNodeStorageUpdated (@controllerAT)
	updateItem(updatedNodeModel) {
		for (let idx in this._libraryList) {
			if (this._libraryList[idx].nodeModel.id == updatedNodeModel.id) {
				this._libraryList[idx].nodeModel = updatedNodeModel;
				this._libraryList[idx].element.id=updatedNodeModel.id;
				this._libraryList[idx].element.querySelectorAll(".name-entry").item(0).innerHTML = updatedNodeModel.jag.urn;
				this._libraryList[idx].element.querySelectorAll(".description-entry").item(0).innerHTML = updatedNodeModel.jag.description;
				let search_params =[];
				search_params.push(updatedNodeModel.jag.urn.toLowerCase());
				search_params.push(updatedNodeModel.jag.name.toLowerCase());
				search_params.push(updatedNodeModel.jag.description.toLowerCase());
				this._libraryList[idx].search_content = search_params.join(" ");
				if (updatedNodeModel.isLocked) {

				}
				//			this.refreshItem(updatednodeModel);
			}
		}
	}

	// handleNodeStorageDeleted (@controllerAT)
		removeNodeLibraryListItem(id) {
		for (let item of this._libraryList) {
			if (item.element.id == id) {
				this._$list.removeChild(item.element);
			}
		}
		this._libraryList = this._libraryList.filter(function (item) {
			return item.element.id != id;
		});
		this._existingIds.delete(id);
	}







	// handleJagStorageReplaced (@controllerAT)
	replaceItem(newNodeModel, replacedUrn) {
		this.removeLibraryListItem(replacedUrn);
		this.addItem(newNodeModel);
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
	async refreshItem(newNodeModel, refreshedSet = new Set()) {
		this._getChildModels(newNodeModel, new Map()).then(function (all_nodeModels) {
			this.dispatchEvent(new CustomEvent('refresh', {
				detail: {
					nodeModel: newNodeModel,
					nodeModel_set: all_nodeModels,
					refreshed: refreshedSet
				}
			}))
		}.bind(this));
	}

});

export default customElements.get('node-library');

// <node-library> (this)
//   <input class='library-search'></input>
//   <ol class='library-list'>
//      ( Line items added later by addItems )
//   </ol>
// </node-library>


// Add the <li id='urn'>
//           <h3> 'name' </h3>
//           <p> 'description'
//         </li>
