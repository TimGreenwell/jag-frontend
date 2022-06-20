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

	createListItem(newNodeModel) {
		if (newNodeModel instanceof NodeModel) {
			const urn = newNodeModel.urn;
			const name = newNodeModel.jag.name || '';
			const description = newNodeModel.jag.description || '';

			const li = document.createElement('li');

			let deleteIconClickedHandler = function (event) {
				event.stopPropagation();
				this.dispatchEvent(new CustomEvent('local-node-deleted', {
					detail: {
						nodeModelId: newNodeModel.id
					}
				}))
			}

			let lockIconClickedHandler = function (event) {
				event.stopPropagation();
				console.log("I see your lock click")
				this.dispatchEvent(new CustomEvent('local-node-locked', {
					detail: {
						nodeModel: newNodeModel
					}
				}))
			}


			//const $header = document.createElement('header');
			const $topHalfWrapper = document.createElement('h3');
			const $nameEntry = document.createElement('span')
			$nameEntry.classList.add('name-entry')
			$nameEntry.innerText = newNodeModel.name;

			const toggleLock = document.createElement('div');
			toggleLock.classList.add('node-button', 'lock-button');
			toggleLock.addEventListener('click', lockIconClickedHandler.bind(this))

			$topHalfWrapper.appendChild(toggleLock);
			$topHalfWrapper.appendChild($nameEntry);

			const $bottomHalfWrapper = document.createElement('h3');
			const $descriptionEntry = document.createElement('span')
			$descriptionEntry.classList.add('description-entry')
			$descriptionEntry.innerText = newNodeModel.description;


			const deleteNode = document.createElement('div');
			if (!newNodeModel.isLocked) {
				deleteNode.classList.add('node-button', 'delete-button');
				deleteNode.addEventListener('click', deleteIconClickedHandler.bind(this))
			}

			$bottomHalfWrapper.appendChild(deleteNode);
			$bottomHalfWrapper.appendChild($descriptionEntry);

			li.appendChild($topHalfWrapper);
			li.appendChild($bottomHalfWrapper);

			let search_params = [];
			search_params.push(urn.toLowerCase());
			search_params.push(name.toLowerCase());
			search_params.push(description.toLowerCase());


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
				}))
			});

			$topHalfWrapper.addEventListener('click', (event) => {
				this.dispatchEvent(new CustomEvent('project-lineItem-selected', {
					detail: {
						projectModel: newNodeModel,
						expanded: event.shiftKey
					}
				}))
			});

			let newItem = {
				element: li,
				search_content: search_params.join(" "),
				nodeModel: newNodeModel
			};

			return newItem;

			//	nodeModel.addEventListener('copy', this._createItem.bind(this));         // temp out - what does this do? looks obs.
		} else {
			console.log("ERROR -- unexpected type for newNodeModel [library-addItem]")
		}

	}


	addListItem(newNodeModel) {
		// handleNodeStorageCreated (@controllerAT)
		let listItemElement = this.createListItem(newNodeModel)
		this._libraryList.push(listItemElement);
		this._$list.appendChild(listItemElement.element);
		}



	addListItems(nodeModelArray) {
		// initializePanels (@controllerAT)
		nodeModelArray.forEach(nodeModel => {
			this.addListItem(nodeModel)
		});
	}

	updateStructureChange(projectNodes) {
		for (let item of this._libraryList) {
			this._$list.removeChild(item.element);
		}

projectNodes.forEach(project => this.createListItem(project))

		for (let item of this._libraryList) {
			this._$list.appendChild(item.element);
		}

	}


	updateItem(updatedNodeModel) {
		let listItemElement = this.createListItem(updatedNodeModel)
		for (let item of this._libraryList) {
			this._$list.removeChild(item.element);
		}
		for (let idx in this._libraryList) {
			if (this._libraryList[idx].nodeModel.id == updatedNodeModel.id) {
				this._libraryList[idx] = listItemElement;
			}
		}
		for (let item of this._libraryList) {
			this._$list.appendChild(item.element);
		}
	}

    // @TODO are updateItem and replaceItem functionally equivalent? Do I need both?

	replaceItem(newNodeModel, replacedUrn) {
		// handleJagStorageReplaced (@controllerAT)
		this.removeNodeLibraryListItem(replacedUrn);
		this.appendChild(newNodeModel);
	}

	removeNodeLibraryListItem(id) {
		// handleNodeStorageDeleted (@controllerAT)
		for (let item of this._libraryList) {
			this._$list.removeChild(item.element);
		}
		this._libraryList = this._libraryList.filter(entry => {
			return entry.nodeModel.id != id
		})
		for (let item of this._libraryList) {
			this._$list.appendChild(item.element);
		}

	}

	//??
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
