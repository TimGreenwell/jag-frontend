/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.43
 */

import Activity from '../models/activity.js';

customElements.define('def-events', class extends HTMLElement {

	constructor() {
		super();
		this._libraryList = [];                         // <li> elements holding activity.name & description + activity
		this._initUI();
		this._initListeners();
		this.clearLibraryList();
	};

	_initUI() {

		const $header = document.createElement('header');
		const $list = document.createElement('ol');

		$list.classList.add('library-list');

		this.appendChild($list);

		this._$list = $list;
	}

	_initListeners() {

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
	createListItem(newActivity) {
		let existingUrns = this._libraryList.filter(entry => {
			return entry.urn;
		})
		if (!existingUrns.includes(newActivity.urn)) {
			if (newActivity instanceof Activity) {
				const urn = newActivity.urn;
				const name = newActivity.name || '';
				const description = newActivity.description || '';

				const li = document.createElement('li');

				let deleteIconClickedHandler = function (event) {
					event.stopPropagation();

					this.dispatchEvent(new CustomEvent('event-activity-deleted', {
						detail: {
							activityUrn: newActivity.urn
						}
					}))
				}

				let lockIconClickedHandler = function (event) {
					event.stopPropagation();
						this.dispatchEvent(new CustomEvent('event-activity-locked', {
						detail: {
							activity: newActivity
						}
					}))
				}



				//const $header = document.createElement('header');
				const $topHalfWrapper = document.createElement('h3');
				const $nameEntry = document.createElement('span')
				$nameEntry.classList.add('name-entry')
				$nameEntry.innerText = newActivity.name;

				const toggleLock = document.createElement('div');
				toggleLock.classList.add('jag-button', 'lock-button');
				toggleLock.addEventListener('click', lockIconClickedHandler.bind(this))

				$topHalfWrapper.appendChild(toggleLock);
				$topHalfWrapper.appendChild($nameEntry);

				const $bottomHalfWrapper = document.createElement('h3');
				const $descriptionEntry = document.createElement('span')
				$descriptionEntry.classList.add('description-entry')
				$descriptionEntry.innerText = newActivity.description;

				const deleteJag = document.createElement('div');
				if (!newActivity.isLocked) {
					deleteJag.classList.add('jag-button', 'delete-button');
					deleteJag.addEventListener('click',  deleteIconClickedHandler.bind(this))
				}

				$bottomHalfWrapper.appendChild(deleteJag);
				$bottomHalfWrapper.appendChild($descriptionEntry);

				li.appendChild($topHalfWrapper);
				li.appendChild($bottomHalfWrapper);


				newActivity.addEventListener('refresh', () => {
					this.refreshItem(newActivity);
				});


				// Send the newActivity and all its children through the dispatch
				$bottomHalfWrapper.addEventListener('click', (event) => {
					newActivity.collapsed = !event.shiftKey
					this.dispatchEvent(new CustomEvent('event-project-created', {
						detail: {
							activity: newActivity
						}
					}))});

				$topHalfWrapper.addEventListener('click', (event) => {
					newActivity.collapsed = !event.shiftKey
					this.dispatchEvent(new CustomEvent('event-project-created', {
						detail: {
							activity: newActivity
						}
					}))
				});


				let newItem = {
					element: li,
					activity: newActivity
				};

				return newItem;

				//	activity.addEventListener('copy', this._createItem.bind(this));         // temp out - what does this do? looks obs.
			} else {
				console.log("ERROR -- unexpected type for newActivity [library-addItem]")
			}
		} else {
			console.log("ERROR -- URN already exists [library-addItem]")
		}
	}

	addListItem(newActivity) {
		// handleNodeStorageCreated (@controllerAT)
		let listItemElement = this.createListItem(newActivity)
		this._libraryList.push(listItemElement);
		this._$list.appendChild(listItemElement.element);
	}


	addListItems(activityArray) {
		// initializePanels (@controllerAT)
		activityArray.forEach(activity => {
			this.addListItem(activity)
		});
	}


	updateItem(updatedActivity) {
		let listItemElement = this.createListItem(updatedActivity)
		for (let item of this._libraryList) {
			this._$list.removeChild(item.element);
		}
		for (let idx in this._libraryList) {
			if (this._libraryList[idx].activity.urn == updatedActivity.urn) {
				this._libraryList[idx] = listItemElement;
			}
		}
		for (let item of this._libraryList) {
			this._$list.appendChild(item.element);
		}
	}


	// @TODO are updateItem and replaceItem functionally equivalent? Do I need both?

	replaceItem(newActivity, replacedUrn) {
		// handleJagStorageReplaced (@controllerAT)
		this.removeLibraryListItem(replacedUrn);
		this.appendChild(newActivity);
	}



	removeLibraryListItem(deletedUrn) {
		// handleJagStorageDeleted (@controllerAT)
		for (let item of this._libraryList) {
			this._$list.removeChild(item.element);
		}
		this._libraryList = this._libraryList.filter(entry => {
			return entry.activity.urn != deletedUrn
		})
		for (let item of this._libraryList) {
			this._$list.appendChild(item.element);
		}
	}

	//??
	// handleJagStorageReplaced (@controllerAT)
	replaceItem(newActivity, replacedUrn) {
		this.removeLibraryListItem(replacedUrn);
		this.addListItem(newActivity);
	}


	//////////////////////////////////////////////////////////////////////////////////
	//////////  Supporting ///////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////



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
	async refreshItem(newActivity, refreshedSet = new Set()) {
		this._getChildModels(newActivity, new Map()).then(function (all_activitys) {
			this.dispatchEvent(new CustomEvent('refresh', {
				detail: {
					activity: newActivity,
					activity_set: all_activitys,
					refreshed: refreshedSet
				}
			}))
		}.bind(this));
	}

});

export default customElements.get('def-events');

// <jag-library> (this)
//   <ol class='library-list'>
//      ( Line items added later by addItems )
//   </ol>
// </jag-library>


//         <li id='urn'>
//           <h3> 'name' </h3>
//           <p> 'description'
//         </li>
