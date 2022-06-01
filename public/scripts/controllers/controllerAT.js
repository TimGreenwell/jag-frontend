/**
 * @fileOverview Jag ControllerIA.
 *
 * @author IHMC
 * @version 0.01
 */

'use strict';

import InputValidator from "../utils/validation.js";
import StorageService from "../services/storage-service.js";
import JAG from "../models/jag.js";


export default class ControllerAT {

    constructor() {

        this._menu = null;
        this._library = null;
        this._playground = null;
        this._properties = null;

        this._jagModelMap = new Map();         // All JAGs - should be in sync with storage
        this._nodeModelMap = new Map();        // All nodes - should be in sync with storage
        this._currentAnalysis = undefined;       // type: AnalysisModel

        StorageService.subscribe("jag-storage-updated", this.handleJagStorageUpdated.bind(this));   // just blocking for now - troubleshooting
        StorageService.subscribe("jag-storage-created", this.handleJagStorageCreated.bind(this));
        StorageService.subscribe("jag-storage-deleted", this.handleJagStorageDeleted.bind(this));
        StorageService.subscribe("jag-storage-cloned", this.handleJagStorageCloned.bind(this));
        StorageService.subscribe("jag-storage-replaced", this.handleJagStorageReplaced.bind(this));
    }

    set menu(value) {
        this._menu = value;
    }
    set library(value) {
        this._library = value;
    }
    set playground(value) {
        this._playground = value;
    }
    set properties(value) {
        this._properties = value;
    }

    get jagModelMap() {
        return this._jagModelMap;
    }
    set jagModelMap(newJagModelMap) {
        this._jagModelMap = newJagModelMap;
    }
    addJagModel(jagModel) {
        this._jagModelMap.set(jagModel.urn, jagModel)
    }

    get nodeModelMap() {
        return this.nodeModelList;
    }
    set nodeModelMap(newNodeModelMap) {
        this.nodeModelList = newNodeModelList;
    }
    addNodeModel(newNodeModel) {
        this._nodeModelMap.set(newNodeModel.id, newNodeModel)
    }

    get currentAnalysis() {
        return this._currentAnalysis;
    }
    set currentAnalysis(newAnalysisModel) {
        this._currentAnalysis = newAnalysisModel;
    }

    async initialize() {
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache() {
        let allJags = await StorageService.all('jag')
        allJags.forEach(jag => this.addJagModel(jag));
        console.log(allJags);
    }

    initializePanels() {
        this._library.addListItems([...this._jagModelMap.values()])
    }

    initializeHandlers() {
        this._playground.addEventListener('local-jag-created', this.localJagCreatedHandler.bind(this));  // popup create
        this._playground.addEventListener('local-jag-deleted', this.localJagDeletedHandler.bind(this));  // not implemented (menu?)
        this._playground.addEventListener('local-jag-updated', this.localJagUpdatedHandler.bind(this));  // jag structure updates
        this._playground.addEventListener('playground-nodes-selected', this.playgroundNodesSelectedHandler.bind(this));

        this._properties.addEventListener('local-urn-renamed', this.localUrnRenamedHandler.bind(this));
        this._properties.addEventListener('local-jag-updated', this.localJagUpdatedHandler.bind(this));  // jag property updates

        this._menu.addEventListener('add-new-node', this.addNewNodeHandler.bind(this));
        this._menu.addEventListener('clear-playground', this.clearPlaygroundHandler.bind(this));  // Event: 'clear-playground' - menu item selected to clear nodes from playground
        this._menu.addEventListener('delete-selected', this.deleteSelectedHandler.bind(this));

        this._library.addEventListener('library-lineItem-selected', this.libraryLineItemSelectedHandler.bind(this));
    }

    libraryLineItemSelectedHandler(event) {
        const eventDetail = event.detail;
        this._playground.handleLibraryListItemSelected(eventDetail);
    }

    deleteSelectedHandler(event) {
        console.log(event)
        console.log("---- Delete Selected ---               ( I dont think we want a real pruning.")
        this._playground.handleDeleteSelected(event);
    }

    clearPlaygroundHandler() {
        this._playground.clearPlayground();
    }

    addNewNodeHandler() {
        this._playground._handleNewNodePopup();
    }


    playgroundNodesSelectedHandler(event) {
        const eventDetail = event.detail;
        this._properties.handleSelectionUpdate(eventDetail);
        //ide.handleSelectionUpdate(e.detail);
    }

    async localJagCreatedHandler(event) {
        const eventDetail = event.detail;
        const urn = eventDetail.urn;
        const description = eventDetail.description;
        const name = eventDetail.name;
        const newJAG = new JAG({urn: urn, name: name, description: description});
        if (newJAG.isValid()) {
            await StorageService.create(newJAG, 'jag');
        } else {
            window.alert("Invalid URN");
        }
    }

    async localJagUpdatedHandler(event) {
        console.log("-- updating --")
        const eventDetail = event.detail;
        const updatedJagModel = eventDetail.node;
        console.log(updatedJagModel)
        await StorageService.update(updatedJagModel, 'jag');
    }

    async localJagDeletedHandler(event) {
        const eventDetail = event.detail;
        const deadJagModelUrn = eventDetail.urn;
        await StorageService.delete(deadJagModelUrn, 'jag');
    }


// This is an identical copy (hopefully) of the URN updater found in views/Properties
    // I can't decide on a common area for updates such as this.  Views arent shared.  A controller area?
    // Maybe just the model (stoage is data) but circular reference problem with schema.
    // Currently thinking a controller area if more can be found.


    async localUrnRenamedHandler(event) {
        const eventDetail = event.detail;
        const newUrn = eventDetail.newUrn;
        const originalUrn = eventDetail.originalUrn;
        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newUrn + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newUrn + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isPublished' tag.
        // URN changes are renames until the JagModel is marked as 'isPublished'.
        // After 'isPublished', URN changes are copies.

        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(newUrn);
        if (isValid) {
            let origJagModel = await StorageService.get(originalUrn, 'jag');  // needed to check if 'isPublished'
            let urnAlreadyBeingUsed = await StorageService.has(newUrn, 'jag');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isPublished ?? ? idk
                    let newJagModel = await StorageService.get(originalUrn, 'jag');

                    // is the target JagModel published?
                    if (newJagModel.isPublished) {
                        // FAIL  - CANT OVERWRITE PUBLISHED JAG-MODEL
                    } else // target JagModel is NOT published

                    { // is the original JagModel published?
                        if (origJagModel.isPublished) {
                            await StorageService.clone(originalUrn, newUrn, 'jag');
                        } else { /// the original JAGModel is not published
                            await StorageService.replace(originalUrn, newUrn, 'jag')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING JAG-MODEL
                }
            } else {  // urn not already being used
                // is the original JagModel published?
                console.log("is published - " + origJagModel.isPublished);
                if (origJagModel.isPublished) {
                    await this.cloneJagModel(origJagModel, newUrn)
                } else {/// the original JAGModel is not published
                    await StorageService.replace(originalUrn, newUrn, 'jag');
                }
            }
        }

    }


    /**
     * Remote Handler - update, create, delete, cloned*, replaced*
     * @param updatedJagModel
     * @param updatedJagUrn
     */

    handleJagStorageUpdated(updatedJagModel, updatedJagUrn) {
        this._playground.updateJagNode(updatedJagModel, updatedJagUrn);         // update the graph node view on update
        this._properties.handleStorageUpdate(updatedJagModel, updatedJagUrn);   // change property window values if that one is changed in IA
        this._library.updateItem(updatedJagModel);
    }

    handleJagStorageCreated(createdJagModel, createdJagUrn) {
        this._playground._addJagNodeTree(createdJagModel, createdJagUrn);         // update the graph node view on update
        this._library.addItem(createdJagModel);                                   // Add JAG list item to Library
    }

    handleJagStorageDeleted(deletedJagUrn) {
        this._playground.deleteJagNode(deletedJagUrn)
    }

    handleJagStorageCloned(clonedJagModel, clonedJagUrn) {
        this._playground._addJagNodeTree(clonedJagModel, clonedJagUrn)
    }

    handleJagStorageReplaced(newJagModel, replacedJagUrn) {
        this._playground.replaceJagNode(newJagModel, replacedJagUrn)
        this._library.replaceItem(newJagModel, replacedJagUrn)                   // Replace JAG list item in library
    }





}