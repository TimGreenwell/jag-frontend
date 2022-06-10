/**
 * @fileOverview Jag ControllerIA.
 *
 * @author IHMC
 * @version 0.01
 */

'use strict';

import InputValidator from "../utils/validation.js";
import StorageService from "../services/storage-service.js";
import JAGATValidation from "../utils/validation.js";
import NodeModel from "../models/node.js";
import JagModel from "../models/jag.js";
import AnalysisModel from "../models/analysis-model.js";
import TeamModel from "../models/team.js";
import AgentModel from "../models/agent.js";
import UserPrefs from "../utils/user-prefs.js";
// should need JagModel once I can create Jag by giving valid URN

export default class ControllerIA {

    constructor() {
        this._analysisLibrary = null;           // HTMLElement
        this._editor = null;                    // HTML Element
        this._iaTable = null;                   // HTMLElement extending Popupable

        this._jagModelMap = new Map();          // All JAGs - should be in sync with storage
        this._nodeModelMap = new Map();         // where used?
        this._analysisModelMap = new Map();     // All analyses - should be in sync with storage
        this._currentAnalysis = undefined;      // type: AnalysisModel

        StorageService.subscribe("jag-storage-created", this.handleJagStorageCreated.bind(this));
        StorageService.subscribe("jag-storage-updated", this.handleJagStorageUpdated.bind(this));   // just blocking for now - troubleshooting
        StorageService.subscribe("jag-storage-deleted", this.handleJagStorageDeleted.bind(this));
        //StorageService.subscribe("jag-storage-cloned", this.handleJagStorageCloned.bind(this));
        //StorageService.subscribe("jag-storage-replaced", this.handleJagStorageReplaced.bind(this));
        StorageService.subscribe("analysis-storage-created", this.handleAnalysisStorageCreated.bind(this));
    }

    set analysisLibrary(value) {
        this._analysisLibrary = value;
    }
    set editor(value) {
        this._editor = value;
    }
    set iaTable(value) {
        this._iaTable = value;
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

    get analysisModelMap() {
        return this._analysisModelMap;
    }
    set analysisModelMap(value) {
        this._analysisModelMap = value;
    }
    addAnalysisModel(newAnalysisModel) {
        this._analysisModelMap.set(newAnalysisModel.id, newAnalysisModel)
    }

    get currentAnalysis() {
        return this._currentAnalysis;
    }
    set currentAnalysis(newAnalysisModel) {
        this._currentAnalysis = newAnalysisModel;
    }

    async initialize() {
        UserPrefs.setDefaultUrnPrefix("us:tim:")
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }
    async initializeCache(){

        let allJags = await StorageService.all('jag')
        allJags.forEach(jag => this.addJagModel(jag))

        // @TODO need this?
        let allNodes = await StorageService.all('node')
        allNodes.forEach(node => this.addNodeModel(node))

        let allAnalyses = await StorageService.all('analysis')
        allAnalyses.forEach(analysis => this.addAnalysisModel(analysis))
    }
    initializePanels() {
        this._analysisLibrary.addListItems([...this._analysisModelMap.values()])
    }

    initializeHandlers(){
        this._iaTable.addEventListener('local-analysis-created', this.localAnalysisCreatedHandler.bind(this));  // popup create
        this._iaTable.addEventListener('local-analysis-updated', this.localAnalysisUpdatedHandler.bind(this));  // jag structure updates
        //this._iaTable.addEventListener('local-analysis-deleted', this.localAnalysisDeletedHandler.bind(this));  // jag structure updates

        this._iaTable.addEventListener('local-node-addchild', this.localNodeAddChildHandler.bind(this));  // '+' clicked on jag cell (technically undefined jag)
        this._iaTable.addEventListener('local-node-prunechild', this.localNodePruneChildHandler.bind(this));
        this._iaTable.addEventListener('local-collapse-toggled', this.localCollapseToggledHandler.bind(this));

        this._iaTable.addEventListener('local-urn-changed', this.localUrnChangedHandler.bind(this));
        this._iaTable.addEventListener('local-jag-created', this.localJagCreatedHandler.bind(this));
        this._iaTable.addEventListener('local-jag-updated', this.localJagUpdatedHandler.bind(this));
       // this._iaTable.addEventListener('local-jag-deleted', this.localJagDeletedHandler.bind(this));

        this._analysisLibrary.addEventListener('library-analysis-selected', this.localLibraryAnalysisSelected.bind(this));

        //this.nodeModel.addEventListener('sync', this._syncViewToModel.bind(this));
    }
    //////////////////////////////////////////////////////////////////////////////////
    //////////  controllerIA - UPWARD Control  ///////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    /**
     *                                   Local Upward Handlers
     * localAnalysisCreatedHandler - requires createStandardAnalysis, displayAnalysis
     * localAnalysisUpdatedHandler
     * localNodeAddChildHandler
     * localNodePruneChildHandler
     * localCollapseToggledHandler
     * localLibraryAnalysisSelected
     * localUrnChangedHandler
     *
     * @param event
     * @returns {Promise<void>}
     */

    async localAnalysisCreatedHandler(event){
        let id = await this.createStandardAnalysis(event.detail.name, event.detail.rootUrn, "Popup")
    }

    async localAnalysisUpdatedHandler(event) {
        await StorageService.update(event.detail.analysis, 'analysis');
    }

    async localNodeAddChildHandler(event){
        // This will not be permanent until a valid URN is set.  Not-persistant.
        let node = event.detail.node;
        if (node.canHaveChildren) {
            const childJag = new JagModel({urn: UserPrefs.getDefaultUrnPrefix(), name: ''})
            const childNode = new NodeModel({jag: childJag});
            childNode.parent = node;
            node.addChild(childNode)
            this._iaTable.displayAnalysis();
        } else {
            alert("Node must first be assigned a valid URN")
        }
    }

    async localNodePruneChildHandler(event) {
        // A Prune (or any delete) is a potentially significant change.
        // Going to just update parent.  Actually prune node?
        // After a quick check we are not pruning the head.

        let parentJag = event.detail.node.parent.jag
        let childJag = event.detail.node.jag
        let parentJagChildren = parentJag.children;

        let index = 0;
        let found = false;
        while ((index < parentJagChildren.length) && (!found)) {
            if (parentJagChildren[index].urn === childJag.urn) {
                parentJagChildren.splice(index,1);
                found = true;
            }
            else{++index}
        }
        parentJag.children = parentJagChildren;
        await StorageService.update(parentJag, "jag")
    }

    localCollapseToggledHandler(event) {
        let eventDetail = event.detail;
        let node = eventDetail.node;
        node.toggleCollapse();             //  -- think this is going to be moved to an Analysis array if we want it saved.
        // just initialize tree would be nice - but think it needs to start from scratch.
        // earlier version of this just call a 'layout'event - whats that?
        this._iaTable.analysisView.layout();
    }

    async localLibraryAnalysisSelected(event) {
        this._currentAnalysis = event.detail.model;
        this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromJagUrn(this._currentAnalysis.rootUrn);
        this._iaTable.analysisModel = this._currentAnalysis;
        this._iaTable.displayAnalysis();
        this._editor.team = event.detail.model.team;
    }

    async localUrnChangedHandler(event){
        let eventDetail = event.detail;
        let originalUrn  = eventDetail.originalUrn;
        let newUrn  = eventDetail.newUrn;
        await this.updateURN(originalUrn, newUrn)

    }

    async localJagCreatedHandler(event){
        let jagModel = new JagModel(event.detail);
        await StorageService.create(jagModel, 'jag');
    }

    async localJagUpdatedHandler(event){
        await StorageService.update(event.detail.jagModel, 'jag');
    }

    //////////////////////////////////////////////////////////////////////////////////
    //////////  controllerIA - DOWNWARD Control  ///////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    /**
     * Remote Handlers - jagUpdate, jagCreate, jagDelete, jagCloned*, jagReplaced*
     *                   nodeUpdate, nodeCreate, nodeDelete, nodeCloned*, nodeReplaced*
     * @param updatedJagModel
     * @param updatedJagUrn
     */

    async handleJagStorageCreated(createdJagModel, createdJagUrn) {
        this.addJagModel(createdJagModel);
        UserPrefs.setDefaultUrnPrefixFromUrn(createdJagUrn)
        // thought below is to surgically add it to the node tree - if its in the currentAnalysis
        // until then, just drawing the whole thing.
        if (this._currentAnalysis) {
            // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
            this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromJagUrn(this._currentAnalysis.rootUrn);
            this._iaTable.analysisModel = this._currentAnalysis;
            this._iaTable.displayAnalysis();
        }
    }

    getChildrenToAdd(origJagModel, updatedJagModel) {
        let newKids = updatedJagModel.children.map(entry => {
            return entry
        })
        let oldKids = origJagModel.children.map(entry => {
            return entry
        });
        return newKids.filter(newKid => !oldKids.find(oldKid => newKid === oldKid))
    }

    getChildrenToRemove(origJagModel, updatedJagModel) {
        let newKids = updatedJagModel.children.map(entry => {
            return entry
        })
        let oldKids = origJagModel.children.map(entry => {
            return entry
        });
        return  oldKids.filter(oldKid => !newKids.find(newKid => oldKid === newKid))
    }





    async handleJagStorageUpdated(updatedJagModel, updatedJagUrn) {
        // 1) update the jag listing
        // 2) @todo if urn is in current Analysis.nodeModel tree
        //         then a) redraw or b) surjury
        let origJagModel = this.jagModelMap.get(updatedJagUrn);  // Get original data from cache
        this.addJagModel(updatedJagModel);                       // Update cache to current
        let newKids = updatedJagModel.children.map(entry => {
            return entry.urn
        })
        let oldKids = origJagModel.children.map(entry => {
            return entry.urn
        });
        let kidsToAdd = newKids.filter(newKid => !oldKids.find(oldKid => newKid === oldKid))
        if (kidsToAdd.length != 0) {
            console.log("An alternative way to handle and watch structural changes")
            console.log("new child to add")
            console.log(updatedJagModel)
            if (this._currentAnalysis) {
                // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
                this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromJagUrn(this._currentAnalysis.rootUrn);
                this._iaTable.analysisModel = this._currentAnalysis;
                this._iaTable.displayAnalysis();
            }
        }
        let kidsToRemove = oldKids.filter(oldKid => !newKids.find(newKid => oldKid === newKid))
        if (kidsToRemove.length != 0) {
            console.log("An alternative way to handle and watch structural changes")
            console.log("new child to remove")
            console.log(updatedJagModel)
            if (this._currentAnalysis) {
                // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
                this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromJagUrn(this._currentAnalysis.rootUrn);
                this._iaTable.analysisModel = this._currentAnalysis;
                this._iaTable.displayAnalysis();
            }
        }
        if  ((kidsToRemove.length == 0) && (kidsToAdd.length == 0)) {
            // console.log("Brute force change")
            this._iaTable.displayAnalysis();
        }
    }

    async handleJagStorageDeleted(deletedJagUrn) {
        if (this._iaTable.analysisModel){
            console.log("Check if deleted jag is in the analysis")
            console.log("if so - check if it is the head")
            console.log("   if so - delete the analysis")
            console.log("    if not --- prune that section and redraw")
        }
    }

    async handleAnalysisStorageCreated(createdAnalysisModel, createdAnalysisId) {
        this.addAnalysisModel(createdAnalysisModel);

        if (this._iaTable.analysisModel){
            createdAnalysisModel.rootNodeModel = await this.buildNodeTreeFromJagUrn(createdAnalysisModel.rootUrn);
            this._iaTable.analysisModel = createdAnalysisModel;
            this._iaTable.displayAnalysis();
        }}


    /**
     *                                        Support Functions
     *
     * createStandardAnalysis -  Builds generic Analysis with Team and 2 Agents during creation
     *                           required by 1) localAnalysisCreatedHandler
     * displayAnalysis -         redraws the analysis table
     *                           required by 1) localAnalysisCreatedHandler
     *
     * buildNodeTreeFromJagUrn   Build node tree given root URN
     *                           required by: localLibraryAnalysisSelected
     *                           @TODO same nodes as Project nodes? similar / non-permanent
     *
     */

    async createStandardAnalysis(analysisName, rootUrn, source) {
        // if (await StorageService.has(rootUrn, 'jag')) {
        let rootJagModel = await StorageService.get(rootUrn, 'jag');
        //     window.alert("There must be an initial Joint Activity Graph before an assessment can be made.")
        //tlg   const rootNodeModel = new NodeModel({jag: rootJagModel});
        const newAnalysisModel = new AnalysisModel({name: analysisName, rootUrn: rootUrn});///////////////////////////////////////////////////////new
        // currently buildAnalysis builds and stores the mapset.
        newAnalysisModel.team = new TeamModel();
        newAnalysisModel.team.addAgent(new AgentModel({name: 'Agent 1'}));
        newAnalysisModel.team.addAgent(new AgentModel({name: 'Agent 2'}));
        await Promise.all(newAnalysisModel.team.agents.map(async agent => await StorageService.create(agent, 'agent')));
        await StorageService.create(newAnalysisModel.team, 'team');
        await StorageService.create(newAnalysisModel, 'analysis');
        return newAnalysisModel.id;
    }

    async displayAnalysis(id) {
        let analysisModel = await StorageService.get(id, 'analysis');
        analysisModel.rootNodeModel = await this.buildNodeTreeFromJagUrn(analysisModel.rootUrn);
        this._iaTable.analysisModel = analysisModel;
        this._iaTable.displayAnalysis();
    }

    // UPDATE JAG --- Cycle through active Projects and rebuild.

   async  rebuildNodeTree(rootNodeModel) {
        const nodeStack = [];
        const resultStack = [];
        nodeStack.push(rootNodeModel);

        while (nodeStack.length != 0) {
            let currentNode = nodeStack.pop();
            let origJagModel = currentNode.jag;
            let updatedJagModel = this._jagModelMap.get(origJagModel.urn);
            let kidsToAdd = this.getChildrenToAdd(origJagModel, updatedJagModel);
            kidsToAdd.forEach(child => {
                const childJagModel = this._jagModelMap.get(child.urn);
                const childNodeModel = new NodeModel({jag: childJagModel, is_root: false});
                childNodeModel.childId = child.id;
                currentNode.addChild(childNodeModel, true);
                // not yet -- nodeStack.push(childNodeModel);
            })
            let kidsToRemove = this.getChildrenToRemove(origJagModel, updatedJagModel);
            kidsToRemove.forEach(child => {
                    let childNodeModel = currentNode.getChildById(child.id)
                    childNodeModel.is_root(true);
                    this._nodeModelMap.set(child.id, childNodeModel)
                    currentNode.removeChild();

            })


            for (const child of currentNode.jag.children) {
                const childJagModel = await StorageService.get(child.urn, 'jag');
                const childNodeModel = new NodeModel({jag: childJagModel, is_root: false});
                childNodeModel.childId = child.id;
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        return resultStack.shift();
    }    // possible common area contender

// blending these two together --- update the projectModel to the existing activityModels.

    async handleJagStorageUpdated2(updatedJagModel, updatedJagUrn) {
        let origJagModel = this.jagModelMap.get(updatedJagUrn);  // Get original data from cache
        this.addJagModel(updatedJagModel);                       // Update cache to current
        let kidsToAdd = this.getChildrenToAdd(origJagModel, updatedJagModel);
        if (kidsToAdd.length != 0) {


            // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
            this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromJagUrn(this._currentAnalysis.rootUrn);
            this._iaTable.analysisModel = this._currentAnalysis;
            this._iaTable.displayAnalysis();

        }

        let kidsToRemove = this.getChildrenToRemove(origJagModel, updatedJagModel);
        if (kidsToRemove.length != 0) {
            console.log("An alternative way to handle and watch structural changes")
            console.log("new child to remove")
            console.log(updatedJagModel)
            if (this._currentAnalysis) {
                // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
                this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromJagUrn(this._currentAnalysis.rootUrn);
                this._iaTable.analysisModel = this._currentAnalysis;
                this._iaTable.displayAnalysis();
            }
        }
        if ((kidsToRemove.length == 0) && (kidsToAdd.length == 0)) {
            // console.log("Brute force change")
            this._iaTable.displayAnalysis();
        }
    }




    async buildNodeTreeFromJagUrn(newRootJagUrn) {
        const nodeStack = [];
        const resultStack = [];
        const rootJagModel = await StorageService.get(newRootJagUrn, 'jag');
        const rootNodeModel = new NodeModel({jag: rootJagModel, is_root: true});
        nodeStack.push(rootNodeModel);
        while (nodeStack.length != 0) {
            let currentNode = nodeStack.pop();
            for (const child of currentNode.jag.children) {
                const childJagModel = await StorageService.get(child.urn, 'jag');
                const childNodeModel = new NodeModel({jag: childJagModel, is_root: false});
                childNodeModel.childId = child.id;
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        return resultStack.shift();
    }    // possible common area contender



    async updateURN(origURN, newURN) {
        // Currently thinking a controller area if more can be found.
        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newURN + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newURN + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isLocked' tag.
        // URN changes are renames until the JagModel is marked as 'isLocked'.
        // After 'isLocked', URN changes are copies.

        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(newURN);
        if (isValid) {
            let origJagModel = await StorageService.get(origURN, 'jag');  // needed to check if 'isLocked'
            let urnAlreadyBeingUsed = await StorageService.has(newURN, 'jag');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isLocked ?? ? idk
                    let newJagModel = await StorageService.get(origURN, 'jag');

                    // is the target JagModel locked?
                    if (newJagModel.isLocked) {
                        // FAIL  - CANT OVERWRITE LOCKED JAG-MODEL
                    } else // target JagModel is NOT locked

                    { // is the original JagModel locked?
                        if (origJagModel.isLocked) {
                            await StorageService.clone(origURN, newURN, 'jag');
                        } else { /// the original JAGModel is not locked
                            await StorageService.replace(origURN, newURN, 'jag')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING JAG-MODEL
                }
            } else {  // urn not already being used
                // is the original JagModel locked?
                if (origJagModel.isLocked) {
                    await this.cloneJagModel(origJagModel, newURN)
                } else {/// the original JAGModel is not locked
                    await StorageService.replace(origURN, newURN, 'jag');
                }
            }
        }

    }                // possible common area contender

    async saveNodeModel(newNodeModel) {
        if (await StorageService.has(newNodeModel, 'node')) {
            await StorageService.update(newNodeModel, 'node');
        } else {
            if (newNodeModel.isValid()) {
                await StorageService.create(newNodeModel, 'node');
            } else {
                window.alert("Invalid URN");
            }
        }
    }               // possible common area contender

    async saveJag() {
        if (await StorageService.has(this, 'jag')) {
            await StorageService.update(this, 'jag');
        } else {
            await StorageService.create(this, 'jag');
        }
    }

    async deleteLeafNode(leaf) {
        if (!leaf.isRootNode()) {
            const index = leaf.parent.children.indexOf(leaf);
            leaf.parent.children.splice(index, 1);
            await StorageService.update(leaf.parent, 'node');
        }

        if (JAGATValidation.isValidUrn(leaf.jag.urn)) {
            await StorageService.delete(leaf.id, 'node');
        } else {
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent('sync'));
        }
    }

    deleteAllChildren(childList) {
        childList.forEach(async child => {
            this.deleteAllChildren([...child.children]);
            // 2 Dispatchers here - only listener in views/Analysis
            this.dispatchEvent(new CustomEvent('detach', {
                detail: {
                    target: child,
                    layout: false
                }
            }));
            await this.deleteLeafNode(child)
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent('sync'));
        });
    }

    async _createChildren() {
        for (let child of this.jag.children) {
            //const jag = await JAGService.instance('idb-service').get(child.urn);
            const jag = await StorageService.get(child.urn, 'jag');
            const model = new Node({jag: jag});
            //await NodeService.instance('idb-service').create(model);
            await StorageService.create(model, 'node');
            this.addChild(model, true);
        }
    }

    addChild(child, layout = true) {
        child.parent = this;
        this._children.push(child);

        // Only Dispatcher & Only Listener in views/Analysis
        this.dispatchEvent(new CustomEvent('attach', {
            detail: {
                target: child,
                reference: this,
                layout: layout
            }
        }));

        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
    }

    // addChild(node){                          // from nodemodel --originall called when the +sign is clicked.
    //     if (this.canHaveChildren) {
    //         const child = new Node();
    //         this._children.push(node);
    //         node.parent = this;
    //     } else {
    //         alert("Node must first be assigned a valid URN")
    //     }
    // }

    async _updateJAG(jag) {
        this._jag = jag;
        this.save();
        this.deleteAllChildren();
        await this._createChildren();
        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
    }

    /// OBSOLETE but might be used later
    ///  The surgical method of deleting a node and all its children
    // Does not scour for other occurrences of other identical parent jags
    async prune(node) {
        this.deleteAllChildren([...node.children]);  // passing a copy because the node.children is going to be modified

        if (node.isRoot()) {
            await this.deleteLeafNode(node);
        }
        // 2 Dispatchers here - only listener in views/Analysis
        // this.dispatchEvent(new CustomEvent('detach', {
        //     detail: {
        //         target: this
        //     }
        // }));
        this._iaTable.analysisView.detach(node)
        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
    }

}