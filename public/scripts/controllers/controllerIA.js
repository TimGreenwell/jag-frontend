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
// should need JagModel once I can create Jag by giving valid URN

export default class ControllerIA {

    constructor() {
        this._analysisLibrary = null;           // HTMLElement
        this._editor = null;                    // HTML Element
        this._iaTable = null;                   // HTMLElement extending Popupable

        this._jagModelMap = new Map();          // All JAGs - should be in sync with storage
        this._analysisModelMap = new Map();     // All analyses - should be in sync with storage

        this._nodeModelMap = new Map();         // where used?
        this._currentAnalysis = undefined;      // type: AnalysisModel

        StorageService.subscribe("jag-storage-updated", this.handleJagStorageUpdated.bind(this));   // just blocking for now - troubleshooting
        StorageService.subscribe("jag-storage-created", this.handleJagStorageCreated.bind(this));
        //StorageService.subscribe("jag-storage-deleted", this.handleJagStorageDeleted.bind(this));
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

    get analysisModelMap() {
        return this._analysisModelMap;
    }
    set analysisModelMap(value) {
        this._analysisModelMap = value;
    }
    addAnalysisModel(newAnalysisModel) {
        this._analysisModelMap.set(newAnalysisModel.id, newAnalysisModel)
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
        JagModel.setDefaulturn = "us:ihmc:"
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache(){

        console.log("initialing cache");
        let allJags = await StorageService.all('jag')
        allJags.forEach(jag => this.addJagModel(jag))

        let allAnalyses = await StorageService.all('analysis')
        allAnalyses.forEach(analysis => this.addAnalysisModel(analysis))

        // do i need this?
        let allNodes = await StorageService.all('node')
        allNodes.forEach(node => this.addNodeModel(node))
    }

    initializePanels() {
        console.log("checking....");
        console.log(this._analysisModelMap.values())
        this._analysisLibrary.addListItems([...this._analysisModelMap.values()])
    }

    initializeHandlers(){
        this._iaTable.addEventListener('local-analysis-created', this.localAnalysisCreatedHandler.bind(this));  // popup create
        this._iaTable.addEventListener('local-analysis-updated', this.localAnalysisUpdatedHandler.bind(this));  // jag structure updates
        this._iaTable.addEventListener('local-node-addchild', this.localNodeAddChildHandler.bind(this));  // '+' clicked on jag cell (technically undefined jag)
        this._iaTable.addEventListener('local-node-prunechild', this.localNodePruneChildHandler.bind(this));
        this._iaTable.addEventListener('local-collapse-toggled', this.localCollapseToggledHandler.bind(this));
        this._iaTable.addEventListener('local-jag-created', this.localJagCreatedHandler.bind(this));
        this._iaTable.addEventListener('local-jag-updated', this.localJagUpdatedHandler.bind(this));
        this._iaTable.addEventListener('local-urn-updated', this.localUrnUpdatedHandler.bind(this));

        this._analysisLibrary.addEventListener('library-analysis-selected', this.libraryAnalysisSelected.bind(this));


    }


    async localUrnUpdatedHandler(event){
        let eventDetail = event.detail;
        console.log("JAG UPDATED")
        let originalUrn  = eventDetail.originalUrn;
        let newUrn  = eventDetail.newUrn;
        await updateURN(originalUrn, newUrn)

    }



    /**
     *                                   Local Handlers
     * localAnalysisCreatedHandler - requires createAnalysis, displayAnalysis
     * localAnalysisUpdatedHandler
     * localNodeAddChildHandler
     * localNodePruneChildHandler
     * localCollapseToggledHandler
     * libraryAnalysisSelected
     *
     * @param event
     * @returns {Promise<void>}
     */

    async localJagUpdatedHandler(event){
        let eventDetail = event.detail;
        console.log("JAG UPDATED")
        console.log(eventDetail);
        let jagModel  = eventDetail.jag;

        await StorageService.update(jagModel, 'jag');

    }

    async localJagCreatedHandler(event){
        let eventDetail = event.detail;
        console.log(eventDetail);
        let jagModel = new JagModel({urn: eventDetail.urn});
        jagModel.name = eventDetail.name;
        await StorageService.create(jagModel, 'jag');
    }

    async localAnalysisCreatedHandler(event){
        let eventDetail = event.detail;
        let name = eventDetail.name;
        let rootUrn = eventDetail.rootUrn;
        let id = await this.createAnalysis(name, rootUrn, "Popup")
    }
    async localAnalysisUpdatedHandler(event) {
        const eventDetail = event.detail;
        const updatedAnalysisModel = eventDetail.node;
        await StorageService.update(updatedAnalysisModel, 'analysis');
    }
    async localNodeAddChildHandler(event){
        // This will not be permanent until a valid URN is set.  Not-persistant.
        let eventDetail = event.detail;
        let node = eventDetail.node;
        if (node.canHaveChildren) {
            const child = new NodeModel();
            child.parent = node;
            node.addChild(child)
            this._iaTable.displayAnalysis();
        } else {
            alert("Node must first be assigned a valid URN")
        }
    }
    async localNodePruneChildHandler(event) {
        // A Prune (or any delete) is a potentially significant change.
        // Going to just update parent.  Actually prune node?
        // After a quick check we are not pruning the head.
        let eventDetail = event.detail;
        let node = eventDetail.node;
        let parentJag = eventDetail.node.parent.jag
        let childJag = eventDetail.node.jag
        let parentJagChildren = parentJag.children;

        let index = 0;
        let found = false;
        console.log("Parent Jag's children was: ")
        console.log(parentJagChildren)
        while ((index < parentJagChildren.length) && (!found)) {
            console.log("inwhile - index = " + index)
            console.log(parentJagChildren[index].urn)
            console.log(childJag.urn)
            if (parentJagChildren[index].urn === childJag.urn) {
                console.log(index)
                console.log(parentJagChildren.splice(index,1));
                found = true;
            }
            else{++index}
        }
        console.log(parentJagChildren)
        parentJag.children = parentJagChildren;
        console.log("Parent Jag's children now: ")
        console.log(parentJag.children)

        await StorageService.update(parentJag, "jag")
    }


    localCollapseToggledHandler(event) {
        console.log("see the toggle");

        let eventDetail = event.detail;
        console.log(event)
        let node = eventDetail.node;
        console.log(node)
        node.toggleCollapse();             //  -- think this is going to be moved to an Analysis array if we want it saved.
        // just initialize tree would be nice - but think it needs to start from scratch.
        // earlier version of this just call a 'layout'event - whats that?
        this._iaTable.analysisView.layout();

    }
    async libraryAnalysisSelected(event) {
        this._currentAnalysis = event.detail.model;
        this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromJagUrn(this._currentAnalysis.rootUrn);
        this._iaTable.analysisModel = this._currentAnalysis;
        this._iaTable.displayAnalysis();
        this._editor.team = event.detail.model.team;
    }

    /**
     *                                   Remote Handlers
     * @param event
     * @returns {Promise<void>}
     */

    async handleJagStorageUpdated(updatedJagModel, updatedJagUrn) {
        // 1) update the jag listing
        // 2) if urn is in current Analysis.nodeModel tree then a) redraw or b) surjury

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
            console.log("Children were added")
            this.handleJagStorageCreated(updatedJagModel, updatedJagUrn);
        }
        let kidsToRemove = oldKids.filter(oldKid => !newKids.find(newKid => oldKid === newKid))
        if (kidsToRemove.length != 0) {
            console.log("Children were deleted");
            this.handleJagStorageCreated(updatedJagModel, updatedJagUrn);
        }
        if  ((kidsToRemove.length == 0) && (kidsToAdd.length == 0)) {
            console.log("No structure change")
           // this._iaTable.analysisView.layout();
           // await this.displayAnalysis(this._currentAnalysis.id);  /// need more than this.. not redrawing..000
            this._iaTable.displayAnalysis();
        }
    }
    //  The surgical method for handling new Jag Updates
//     static handleJagStorageUpdated(updatedJagModel, updatedJagUrn) {
//         //  Update Jag Model has arrived.
//         this._nodeModelList.forEach(node => {
//             if (updatedJagModel.urn == node.jag.urn) {
//                 node.jag = updatedJagModel;defaultUrn
//             }
//             if (updatedJagModel.children.contains(node.id)){
//                 node.parent = updatedJagModel;
//                 node.isRoot = false;
//             }
//         })
//     }
    async handleJagStorageCreated(createdJagModel, createdJagUrn) {
        this.addJagModel(createdJagModel);
        // thought below is to surgically add it to the node tree - if its in the currentAnalysis
        // until then, just drawing the whole thing.
        if (this._currentAnalysis) {
            // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
            this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromJagUrn(this._currentAnalysis.rootUrn);
            this._iaTable.analysisModel = this._currentAnalysis;
            this._iaTable.displayAnalysis();
        }
    }



    async handleAnalysisStorageCreated(createdAnalysisModel, createdAnalysisId) {
        this.addAnalysisModel(createdAnalysisModel);

        if (this._iaTable.analysisModel){
            console.log("hhhhhhhhhhhhhhhhhhhhhhhHHH")
            console.log(this._iaTable.analysisModel)
        analysisModel.rootNodeModel = await this.buildNodeTreeFromJagUrn(createdAnalysisModel.rootUrn);
        this._iaTable.analysisModel = analysisModel;
        this._iaTable.displayAnalysis();
    }}



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





    /**
     *                              JAG PERFORMER SECTION - Outgoing DATA
     * @param newJagModel
     * @returns {Promise<void>}
     */

    async createJagModel(newJagModel) {
        console.log("I got moved to AT --- do I need to be in a ControllerCommon? ->              extends controller?")
    }

// This is an identical copy (hopefully) of the URN updater found in views/Properties
    // I can't decide on a common area for updates such as this.  Views arent shared.  A controller area?
    // Maybe just the model (stoage is data) but circular reference problem with schema.
    // Currently thinking a controller area if more can be found.

    async updateURN(origURN, newURN) {
        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newURN + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newURN + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isPublished' tag.
        // URN changes are renames until the JagModel is marked as 'isPublished'.
        // After 'isPublished', URN changes are copies.

        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(newURN);
        if (isValid) {
            let origJagModel = await StorageService.get(origURN, 'jag');  // needed to check if 'isPublished'
            let urnAlreadyBeingUsed = await StorageService.has(newURN, 'jag');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isPublished ?? ? idk
                    let newJagModel = await StorageService.get(origURN, 'jag');

                    // is the target JagModel published?
                    if (newJagModel.isPublished) {
                        // FAIL  - CANT OVERWRITE PUBLISHED JAG-MODEL
                    } else // target JagModel is NOT published

                    { // is the original JagModel published?
                        if (origJagModel.isPublished) {
                            await StorageService.clone(origURN, newURN, 'jag');
                        } else { /// the original JAGModel is not published
                            await StorageService.replace(origURN, newURN, 'jag')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING JAG-MODEL
                }
            } else {  // urn not already being used
                // is the original JagModel published?
                console.log("is published - " + origJagModel.isPublished);
                if (origJagModel.isPublished) {
                    await this.cloneJagModel(origJagModel, newURN)
                } else {/// the original JAGModel is not published
                    await StorageService.replace(origURN, newURN, 'jag');
                }
            }
        }

    }


    /**
     *                                    JAG Performer - Incoming DATA
     * @param updatedJagModel
     * @param updatedJagUrn
     */

// What generates a new node:
    //1) A new created Jag also creates a new root/childless node.
    //2) Clicking on the AT Library creates a new root node. (possible children)
    //3) Creating new activity in IA Table creates a new node and maybe new jag (if new urn)
    //   Creating things in IA Table is wierd. What if new urn? what if same urn but new name?
    //4) Cloning another node.  This also creates new Jag.
    //
    // Node extends Jag?
    // AT Node extends Node
    // IA Node extends Node
    //
    // What generates new jag
    //1)The popup jag creater.  This also generates node (playground listens to jag creation)
    //2)Cloning an existing node.
    //3) Creating new activity with new urn in IA Table
    //
    //bonus: renaming a node creates a new node and jag but only changes the urn.

    // Can a Jag update generate/remove a Node? Not directly - if a Jag adds (or removes a child)


    /**
     *   The Activity Cells shown in the IATable are represented in a Node Model Tree.
     *   Why? Need the id, like the parent/child object links
     *   @TODO
     *   1) We assume the representing node model tree is non-permanent
     *   - no data is particular to a certain node that cannot be derived again from the original JAG element
     *   list.  In fact, that might be the best way to handle any JAG changes (complete rebuild)
     *   - Possible to surgically alter the tree (slightly better performance vs code maintenance)
     *   - There is no requirement to save to database.
     *   2) We assume the node model tree contains info particular to this instantiation of
     *   the JAG vs other possible instantiations.
     *   - In this case we cannot rebuild from the JAG list, we need a permanent storage for the tree
     *     and must surgically alter the tree as JAG changes are presented.
     *   - Also need a way for the users to choose not only a URN but which instance of URN - maybe
     *     the entire path from root to target urn (or pick graphically)
     *
     *  Going with Option 1 - rebuild (with experimental surgical alternative, just in case they change their mind.)
     *
     * @param updatedJagModel
     * @param updatedJagUrn
     */

    // two sources: 1) user just created a analysis with popup
    //              2) user clicked analysis from analysis-library






    // The brute force rebuild  - put in URN and get back rootNode of a fully armed and operational NodeModelTree.
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
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        return resultStack.shift();
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


    /**
     *                                        Support Functions
     *
     * createAnalysis - required by 1) localAnalysisCreatedHandler
     * displayAnalysis - required by 1) localAnalysisCreatedHandler
     *
     *
     *
     * @param analysisName
     * @param rootUrn
     * @param source
     * @returns {Promise<string>}
     */



    async createAnalysis(analysisName, rootUrn, source) {
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






    // // Put in a URN - Get a NodeModel Tree back. - recursion method... needs modification for URN statt node.
    // async buildNodeTreeFromJagUrn(currentNode) { // this was newRootNodeModel
    //     //	let currentNode = newRootNodeModel;     // this was uncommented
    //     let children = currentNode.jag.children;// this was newRootNodeModel
    //     await Promise.all(
    //         children.map(async ({urn, id}) => {
    //             const childJagModel = await StorageService.get(urn, 'jag');  // can replace this once laziness is going
    //             const childNodeModel = new NodeModel({jag: childJagModel});
    //             currentNode.addChild(childNodeModel, true);
    //             await this.buildNodeTreeFromJagUrn(childNodeModel);
    //         }))
    //     this._nodeSet.add(currentNode);
    //     await StorageService.create(currentNode,'node');
    // }





    //     static async createNodeModel(newNodeModel) {
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

    }


    // async deleteLeafNode
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

    clip(node = this) {

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

    async _updateJAG(jag) {
        this._jag = jag;
        this.save();
        this.deleteAllChildren();
        await this._createChildren();
        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
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

    async saveJag() {
        if (await StorageService.has(this, 'jag')) {
            await StorageService.update(this, 'jag');
        } else {
            await StorageService.create(this, 'jag');
        }
    }


}