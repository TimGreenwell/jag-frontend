/**
 * @fileOverview Jag ControllerIA.
 *
 * @author IHMC
 * @version 0.01
 */

'use strict';

import StorageService from "../services/storage-service.js";
import JAG from "../models/jag.js";

export default class Controller {

    constructor() {

        this._menu = null;
        this._library = null;
        this._playground = null;
        this._properties = null;

        this._jagModelMap = new Map();         // All JAGs - should be in sync with storage
        this._nodeModelMap = new Map();        // All nodes - should be in sync with storage
        this._currentAnalysis = undefined;       // type: AnalysisModel


        //   StorageService.subscribe("jag-storage-updated", this.handleJagStorageUpdated.bind(this));   // just blocking for now - troubleshooting
        //   StorageService.subscribe("jag-storage-created", this.handleJagStorageCreated.bind(this));
    }

    set library(value) {
        this._library = value;
    }
    set menu(value) {
        this._menu = value;
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

    async initializeCache(){
        let allJags = await StorageService.all('jag')
        console.log(allJags);
    }

    initializeHandlers(){
        this._playground.addEventListener('local-jag-created', this.localJagCreatedHandler.bind(this));  // popup create
    }

    async localJagCreatedHandler(event) {
        const eventDetail = event.detail;
        const urn = eventDetail.urn;
        const description = eventDetail.description;
        const name = eventDetail.name;
        const newJAG = new JAG({urn: urn, name: name, description: description});
        await this.createJagModel(newJAG);
    }



    async createJagModel(newJagModel) {
        if (newJagModel.isValid()) {
            await StorageService.create(newJagModel, 'jag');
        } else {
            window.alert("Invalid URN");
        }
    }
}