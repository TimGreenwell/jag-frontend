/**
 * @file Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.43
 */

import Activity from '../models/activity.js';

customElements.define(`jag-library`, class extends HTMLElement {

    constructor() {
        super();
        this._libraryList = [];                         // <li> elements holding activity.name & description + (search context) + activity
        this._initUI();
        this.clearLibraryList();
    };

    clearLibraryList() {
        for (let item of this._libraryList) {
            this._$list.removeChild(item.element);
        }
        this._libraryList = [];
    }

    _initUI() {
        const $header = document.createElement(`header`);
        const $search = document.createElement(`input`);
        const $list = document.createElement(`ol`);

        $search.classList.add(`library-search`);
        $search.placeholder = `Activities`;
        $list.classList.add(`library-list`);

        this.appendChild($search);
        this.appendChild($list);

        this._$list = $list;

        $search.addEventListener(`keyup`, this._filterFromSearchInput.bind(this));
    }


    // ////////////////////////////////////////////////////////////////////////////////
    // ////////  Supporting controllerAT //////////////////////////////////////////////
    // ////////////////////////////////////////////////////////////////////////////////

    updateItem(updatedActivity) {
        let listItemElement = this.createListItemCollection(updatedActivity);
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


    createListItemCollection(newActivity) {
        // handleJagStorageCreated (@controllerAT)
        let existingUrns = this._libraryList.filter((entry) => {
            return entry.urn;
        });
        if (!existingUrns.includes(newActivity.urn)) {
            if (newActivity instanceof Activity) {
                const urn = newActivity.urn;
                const name = newActivity.name || ``;
                const description = newActivity.description || ``;

                const li = document.createElement(`li`);
                li.className = `list-item`;

                let deleteIconClickedHandler = function (event) {
                    event.stopPropagation();
                    this.dispatchEvent(new CustomEvent(`event-activity-deleted`, {
                        detail: {activityUrn: newActivity.urn}
                    }));
                };

                let lockIconClickedHandler = function (event) {
                    event.stopPropagation();
                    this.dispatchEvent(new CustomEvent(`event-activity-locked`, {
                        detail: {activity: newActivity}
                    }));
                };

                const $topHalfWrapper = document.createElement(`div`);
                $topHalfWrapper.className = `top-half item-line`;
                const $nameEntry = document.createElement(`span`);
                $nameEntry.classList.add(`name-entry`);
                $nameEntry.innerText = newActivity.name;

                const toggleLock = document.createElement(`div`);
                toggleLock.classList.add(`library-button`, `lock-button`);
                toggleLock.addEventListener(`click`, lockIconClickedHandler.bind(this));

                $topHalfWrapper.appendChild(toggleLock);
                $topHalfWrapper.appendChild($nameEntry);

                const $bottomHalfWrapper = document.createElement(`div`);
                $bottomHalfWrapper.className = `bottom-half item-line`;
                const $descriptionEntry = document.createElement(`span`);
                $descriptionEntry.classList.add(`description-entry`);
                $descriptionEntry.innerText = newActivity.description;

                const deleteJag = document.createElement(`div`);
                if (!newActivity.isLocked) {
                    deleteJag.classList.add(`library-button`, `delete-button`);
                    deleteJag.addEventListener(`click`, deleteIconClickedHandler.bind(this));
                }

                $bottomHalfWrapper.appendChild(deleteJag);
                $bottomHalfWrapper.appendChild($descriptionEntry);

                li.appendChild($topHalfWrapper);
                li.appendChild($bottomHalfWrapper);

                let search_params = [];
                search_params.push(urn.toLowerCase());
                search_params.push(name.toLowerCase());
                search_params.push(description.toLowerCase());

                // Send the newActivity and all its children through the dispatch
                $bottomHalfWrapper.addEventListener(`click`, (event) => {
                    this.dispatchEvent(new CustomEvent(`event-activity-selected`, {
                        detail: {
                            activity: newActivity,
                            isExpanded: false
                        }
                    }));
                });

                $topHalfWrapper.addEventListener(`click`, (event) => {
                    this.dispatchEvent(new CustomEvent(`event-activity-selected`, {
                        detail: {
                            activity: newActivity,
                            isExpanded: false
                        }
                    }));
                });

                let newItem = {
                    element: li,
                    search_content: search_params.join(` `),
                    activity: newActivity
                };

                return newItem;

                //    activity.addEventListener('copy', this._createItem.bind(this));         // temp out - what does this do? looks obs.
            } else {
                console.log(`ERROR -- unexpected type for newActivity [library-addItem]`);
            }
        } else {
            console.log(`ERROR -- URN already exists [library-addItem]`);
        }
    }

    addListItem(newActivity) {
        // handleNodeStorageCreated (@controllerAT)
        let listItemElement = this.createListItemCollection(newActivity);
        this._libraryList.push(listItemElement);
        this._$list.appendChild(listItemElement.element);
    }

    addListItems(activityArray) {
        // initializePanels (@controllerAT)
        activityArray.forEach((activity) => {
            this.addListItem(activity);
        });
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
        this._libraryList = this._libraryList.filter((entry) => {
            return entry.activity.urn != deletedUrn;
        });
        for (let item of this._libraryList) {
            this._$list.appendChild(item.element);
        }
    }

    _filterFromSearchInput(e) {
        const search_text = e.srcElement.value.toLowerCase();
        this._libraryList.forEach((item) => {
            if (item.element) {
                item.element.style.display = `block`;
                if (!item.search_content.includes(search_text)) {
                    item.element.style.display = `none`;
                }
            }
        });
    }

});

export default customElements.get(`jag-library`);

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


// Seems pretty useless..(holding since 6 Jul)
// // @TODO  understand this guy
// async refreshItem(newActivity, refreshedSet = new Set()) {
//     this._getChildModels(newActivity, new Map()).then(function (all_activitys) {
//         this.dispatchEvent(new CustomEvent('refresh', {
//             detail: {
//                 activity: newActivity,
//                 activity_set: all_activitys,
//                 refreshed: refreshedSet
//             }
//         }))
//     }.bind(this));
// }
//  called by jag-at when listener on graph-service hears 'resources'
// //////////////////////////////////////////////////////////////////////////////////
// handleResourceUpdate(message) {
//     message.data.sort((a, b) => {
//         return a.name.localeCompare(b.name);
//     });
//
//     message.data.forEach((resource) => {
//         this.addItem(resource);
//     });
// }
// ////////////////////////////////////
// updateItem(updatedActivity) {
//     for (let idx in this._libraryList) {
//         if (this._libraryList[idx].model.urn == updatedActivity.urn) {
//         this._libraryList[idx].model = updatedActivity;
// this._libraryList[idx].element.id=updatedActivity.urn;
// this._libraryList[idx].element.querySelectorAll("h3").item(0).innerHTML = updatedActivity.name;
// this._libraryList[idx].element.querySelectorAll("p").item(0).innerHTML = updatedActivity.description;
// let search_params =[];
// search_params.push(updatedActivity.urn.toLowerCase());
// search_params.push(updatedActivity.name.toLowerCase());
// search_params.push(updatedActivity.description.toLowerCase());
// this._libraryList[idx].search_content = search_params.join(" ");
// this.refreshItem(updatedActivity);
// }
// }
// }
// /////////////////////////////////////////
//
