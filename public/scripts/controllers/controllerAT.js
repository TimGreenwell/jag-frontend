/**
 *
 * @TODO
 * 1. Clear should remove from view .. if root, remove... else unexpand
 * 2. Delete key should disconnect child from parent (Activity-level)
 * 3. Shift=multi-select, Cntl=include children, Alt=select all activities with that urn
 *
 *
 *
 * @fileOverview Jag ControllerIA.
 *
 * @author IHMC
 * @version 0.02
 */


'use strict';

import InputValidator from "../utils/validation.js";
import UserPrefs from "../utils/user-prefs.js";
import JagModel from "../models/jag.js";
import NodeModel from "../models/node.js";
import StorageService from "../services/storage-service.js";

export default class ControllerAT extends EventTarget {

    constructor() {
        super();
        this._menu = null;
        this._library = null;
        this._projectLibrary = null;
        this._playground = null;
        this._properties = null;
        this._jagModelMap = new Map();         // All JagModels - should be in sync with storage
        this._projectMap = new Map();        // All nodes - should be in sync with storage
        this._currentAnalysis = undefined;       // type: AnalysisModel
        this._waitLock = null;

        StorageService.subscribe("jag-storage-created", this.handleJagStorageCreated.bind(this));   //
        StorageService.subscribe("jag-storage-updated", this.handleJagStorageUpdated.bind(this));   //
        StorageService.subscribe("jag-storage-deleted", this.handleJagStorageDeleted.bind(this));   // All from observable
        StorageService.subscribe("jag-storage-cloned", this.handleJagStorageCloned.bind(this));     // Cross-tab communications
        StorageService.subscribe("jag-storage-replaced", this.handleJagStorageReplaced.bind(this)); //
        StorageService.subscribe("node-storage-created", this.handleNodeStorageCreated.bind(this)); //
        StorageService.subscribe("node-storage-updated", this.handleNodeStorageUpdated.bind(this)); //
        StorageService.subscribe("node-storage-deleted", this.handleNodeStorageDeleted.bind(this)); //
    }

    set menu(value) {
        this._menu = value;
    }

    set library(value) {
        this._library = value;
    }

    set projectLibrary(value) {
        this._projectLibrary = value;
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

    get projectMap() {
        return this._projectMap;
    }

    set projectMap(newNodeModelMap) {
        this._projectMap = newNodeModelMap;
    }

    addNodeModel(newNodeModel) {
        this._projectMap.set(newNodeModel.id, newNodeModel)
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

    async initializeCache() {
        let allJags = await StorageService.all('jag')
        allJags.forEach(jag => this.addJagModel(jag));

        let allNodes = await StorageService.all('node')
        allNodes.forEach(node => {
            this.repopulateJag(node)
            this.repopulateParent(node)
            this.addNodeModel(node);
        });

        window.onblur = function (ev) {
            console.log("window.onblur");
        };
    }

    initializePanels() {
        this._library.addListItems([...this._jagModelMap.values()])
        this._projectLibrary.addListItems([...this._projectMap.values()])
    }


    initializeHandlers() {
        this._playground.addEventListener('local-nodes-joined', this.localNodesJoinedHandler.bind(this));                      // onEdgeFinalized between nodes
        this._playground.addEventListener('local-jag-created', this.localJagCreatedHandler.bind(this));                        // popup create
      //  this._playground.addEventListener('local-project-clear', this.localProjectClearHandler.bind(this));
        // this._playground.addEventListener('local-node-cleared', this.localNodeDisconnectedHandler.bind(this));
        // or
        this._playground.addEventListener('local-jag-updated', this.localJagUpdatedHandler.bind(this));

        this._playground.addEventListener('playground-nodes-selected', this.playgroundNodesSelectedHandler.bind(this));        // mouse click event
        this._playground.addEventListener('new-activity-affects-project', this.newActivityAffectsProjectHandler.bind(this));   // is changed activity in active viewing
        this._playground.addEventListener('deleted-activity-affects-project', this.deletedActivityAffectsProjectHandler.bind(this));   // is changed activity in active viewing
        this._playground.addEventListener('repositioning-stopped', this.repositioningStoppedHandler.bind(this));               // mouse movement event
        this._playground.addEventListener('local-node-deleted', this.localNodeDeletedHandler.bind(this));             // delete icon

        this._properties.addEventListener('local-urn-changed', this.localUrnRenamedHandler.bind(this));
        this._properties.addEventListener('local-jag-updated', this.localJagUpdatedHandler.bind(this));  // jag property updates
        this._properties.addEventListener('local-node-updated', this.localNodeUpdatedHandler.bind(this));  // jag property updates
        //    this._properties.addEventListener('local-jag-deleted', this.localJagDeletedHandler.bind(this));  // @todo - button to add
        //    this._properties.addEventListener('local-jag-locked', this.localJagLockedHandler.bind(this));  // @todo - button to add

        this._menu.addEventListener('add-new-jag-activity', this.addNewJagActivityHandler.bind(this));
        this._menu.addEventListener('clear-playground', this.clearPlaygroundHandler.bind(this));  // Event: 'clear-playground' - menu item selected to clear nodes from playground
        // this._menu.addEventListener('clear-selected', this.clearSelectedHandler.bind(this));

        this._library.addEventListener('library-lineItem-selected', this.libraryLineItemSelectedHandler.bind(this));
        this._library.addEventListener('local-jag-deleted', this.localJagDeletedHandler.bind(this));
        this._library.addEventListener('local-jag-locked', this.localJagLockedHandler.bind(this));
        // for now--  this._library.addEventListener('local-node-deleted', this.localNodeDeletedHandler.bind(this));  //? is it really?  reconsider msybe proj splits into fragment projs

        this._projectLibrary.addEventListener('local-node-deleted', this.localNodeDeletedHandler.bind(this));             // delete icon
        this._projectLibrary.addEventListener('project-lineItem-selected', this.libraryNodeSelectedHandler.bind(this));   // list item chosen
        this._projectLibrary.addEventListener('local-node-locked', this.localNodeLockedHandler.bind(this));             // lock icon
    }


    //////////////////////////////////////////////////////////////////////////////////
    //////////  controllerAT - UPWARD Control  ///////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    /**
     *                                   Local Upward Handlers
     * localAnalysisCreatedHandler - requires createStandardAnalysis, displayAnalysis
     * localAnalysisUpdatedHandler
     * localNodeAddChildHandler
     * localNodePruneChildHandler
     * localCollapseToggledHandler
     * localLibraryAnalysisSelected
     *
     * @param event
     * @returns {Promise<void>}
     */



    async libraryNodeSelectedHandler(event) {
        console.log("Local>> (project line item selected) ")
        const projectSelected = event.detail.projectModel;
        const expandRequested = event.detail.expanded;

        this._playground._rebuildNodeView(projectSelected)
        //  let childrenMap = this._getChildModels(jagModelSelected, new Map());  // @todo consider getChildArray (returns array/map) (one in parameter)
        //    let newProjectRootNode = this.buildNodeTreeFromJagUrn(projectSelected.urn);
        //    await StorageService.create(newProjectRootNode, "node");
        console.log("Local<< (project line item selected) ")
    }


    // This was a miserable answer to not being able to make the 3 calls from Playground.
    // When doing that, the async functions just returned promises and I couldnt figure out how to
    // make them run in turn.  @big TODO
    // Call localNodeDeletedHandler, localNodeUpdatedHandler, localJagUpdatedHandler from pground




    async localNodesJoinedHandler(event) {            // only needed id's
        console.log("Local>> (local nodes joined) ")

        let projectNodeId = event.detail.projectNodeId
        let parentNodeId = event.detail.parentNodeId
        let childNodeId = event.detail.childNodeId
        let projectModel = this._projectMap.get(projectNodeId)
         let parentNodeModel =  this.searchTreeForId(projectModel,parentNodeId)
        let childNodeModel =  this._projectMap.get(childNodeId)

         // <-note to me--- here somewhere -- looks like projectId isnt spreading down.  try joining children 2 or three deep.

        // 1) CORRECT THE JAG ACTIVITY
        let newChildId = parentNodeModel.jag.addChild(childNodeModel.urn)   // Add child to parent's JAG and return child.id
        this._jagModelMap.set(parentNodeModel.urn, parentNodeModel.jag)  // prob not necessary - first thing that jagupdatehandler does

        // 2) CONNECT CHILD TO PARENT
        parentNodeModel.addChild(childNodeModel)                                    // Parent node adds child node
        this.repopulateParent(parentNodeModel)                                       // give node's children reference to parent
        this.repopulateProject(childNodeModel, parentNodeModel.project)             // change project id for all new children
        childNodeModel.childId = newChildId                                         // set childId to distinguish child relationship

        // 3) UPDATE PARENT IN PROJECT (is this necessary?)


        // 3) REMOVE ABSORBED PROJECT FROM PROJECT MAP
        this._projectMap.delete(childNodeModel.id) //// prob not necessary - first thing that nodeupdatehandler does

        // This particular node changed (to preserve that node) otherwise it gets recreated as new

        // event.detail.nodeModel = projectModel;
        // await this.localNodeUpdatedHandler(event)
        //
        // event.detail.jagModel = parentNodeModel.jag;                                // localJagUpdateHandler wants the new Parent JAG
        // await this.localJagUpdatedHandler(event)
        //

        event.detail.jagModel = parentNodeModel.jag;                                // localJagUpdateHandler wants the new Parent JAG
        await this.localJagUpdatedHandler(event)

        event.detail.jagModel = childNodeModel.jag;
        await this.localJagUpdatedHandler(event)






        event.detail.nodeModelId = childNodeModel.id;              // delete currently turns children into trees - i cant do that with a join
        await this.localNodeDeletedHandler(event)

        console.log("Local<< (local nodes joined) ")
    }

    updateProject(currentNode, projectId) {
        currentNode.project = projectId
        currentNode.children.forEach(child => this.updateProject(child))
    }

    async localJagCreatedHandler(event) {
        console.log("Local>> (local jag created) ")
        const urn = event.detail.urn;
        const description = event.detail.description;
        const name = event.detail.name;
        const newJagModel = new JagModel({urn: urn, name: name, description: description});
        if (InputValidator.isValidUrn(newJagModel.urn)) {
            await StorageService.create(newJagModel, 'jag');
            //   this._playground._addJagNodeTree(newJagModel, newJagModel.urn);         // updates locally (only fresh new orphan leafs)
        } else {
            window.alert("Invalid URN");
        }
        console.log("Local<< (local jag created) ")
    }

    async localNodeUpdatedHandler(event) {

        const updatedNodeModel = event.detail.nodeModel;
        await StorageService.update(updatedNodeModel, 'node');
        console.log("Local<< (local node updated) ")
    }

    async localJagUpdatedHandler(event) {                                       // Store and notify 'Updated JAG'
        console.log("Local>> (local jag updated) ")
        const updatedJagModel = event.detail.jagModel;
        await StorageService.update(updatedJagModel, 'jag');
        console.log("Local<< (local jag updated) ")
    }

    playgroundNodesSelectedHandler(event) {
        this._properties.handleSelectionUpdate(event.detail.selectedNodeArray);
        //ide.handleSelectionUpdate(e.detail);
    }

// The Event: Playground just alerted that the updated JAG we recieved is used by the showing Projects.
    // Need to update and save the adjusted Projects
    async newActivityAffectsProjectHandler(event) {
        console.log("Local>> (new node affects project) ")
        let incomingProjectNode = event.detail.projectModel; // could have used id
        let projectNode = this._projectMap.get(incomingProjectNode.id)
        let changedActivityUrn = event.detail.activityUrn;
        const nodeStack = [];
        const orphanedRootStack = [];
        nodeStack.push(projectNode);
        while (nodeStack.length > 0) {
            let currentNode = nodeStack.pop();
            if ((changedActivityUrn == undefined) || (currentNode.urn == changedActivityUrn)) {
                if (changedActivityUrn == undefined) {
                    console.log("Not  bad - this happens when the precide URN of change is not know.  For example, a rebuild from an archive or fresh pull")
                }
                let existingKids = currentNode.children.map(node => {
                    return {urn: node.urn, id: node.childId}
                })
                let validJag = (this._jagModelMap.has(currentNode.urn)) ? this._jagModelMap.get(currentNode.urn) : [];
                let validKids = validJag.children
                currentNode.jag = validJag;
                let kidsToAdd = this.getChildrenToAdd(existingKids, validKids);
                let kidsToRemove = this.getChildrenToRemove(existingKids, validKids);

                kidsToAdd.forEach(child => {
console.log("Adding a kidzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz")
                    const childJagModel = this._jagModelMap.get(child.urn);
                    const childNodeModel = new NodeModel({urn: childJagModel.urn, is_root: false});
                    childNodeModel.jag = childJagModel
                    childNodeModel.childId = child.id;  // Give the child the 'childId' that was listed in the Parent's Jag children.  (separated them from other children of same urn)
                    currentNode.addChild(childNodeModel, true);
                    childNodeModel.parent = currentNode;
                    this.repopulateProject(childNodeModel, projectNode.project)
                })

                kidsToRemove.forEach(child => {
                    let childNodeModel =  this.searchTreeForChildId(currentNode,child.id)    //currentNode.getChildById(child.id)
                    currentNode.removeChild(childNodeModel);
                    childNodeModel.parent = null;
                    childNodeModel.childId = null;
                    this.repopulateProject(childNodeModel, childNodeModel.id)
                    orphanedRootStack.push(childNodeModel);
                })
            }
            for (const child of currentNode.children) {
                nodeStack.push(child);
            }
        }
        for (let rootNode of orphanedRootStack) {
            if (this.projectMap.has(rootNode.id)) {
               console.log("Orphaned (should not happen)")
            } else {
                console.log("Orphaned")
            }
        }
        await StorageService.update(projectNode, 'node');
        console.log("Local<< (new node affects project) ")
    }


    // The Event: Playground just alerted that an activity JAG has been deleted.
    // This can have a major impact on other JAGs and thus significantly affect the drawn nodes.
    // Need to update and save the adjusted Projects
    async deletedActivityAffectsProjectHandler(event) {
           let projectId = event.detail.projectModelId; // could have used id
        let projectNode = this._projectMap.get(projectId)
        let deletedActivityUrn = event.detail.activityUrn;

        if (projectNode.urn == deletedActivityUrn) {
            await StorageService.delete(projectNode.id, 'node');
        } else {

            const nodeStack = [];
            const orphanedRootStack = [];
            nodeStack.push(projectNode);
            while (nodeStack.length > 0) {
                let currentNode = nodeStack.pop();
                if ((deletedActivityUrn == undefined) || (currentNode.urn == deletedActivityUrn)) {
                    if (deletedActivityUrn == undefined) {
                        console.log("Not  bad - this happens when the precide URN of change is not know.  For example, a rebuild from an archive or fresh pull")
                    }
                    let existingKids = currentNode.children.map(node => {
                        return {urn: node.urn, id: node.childId}
                    })
                    let validJag = (this._jagModelMap.has(currentNode.urn)) ? this._jagModelMap.get(currentNode.urn) : [];
                    let validKids = validJag.children
                    currentNode.jag = validJag;
                    let kidsToAdd = this.getChildrenToAdd(existingKids, validKids);
                    let kidsToRemove = this.getChildrenToRemove(existingKids, validKids);

                    kidsToAdd.forEach(child => {

                        const childJagModel = this._jagModelMap.get(child.urn);
                        const childNodeModel = new NodeModel({urn: childJagModel.urn, is_root: false});
                        childNodeModel.jag = childJagModel
                        childNodeModel.childId = child.id;  // Give the child the 'childId' that was listed in the Parent's Jag children.  (separated them from other children of same urn)
                        currentNode.addChild(childNodeModel, true);
                        childNodeModel.parent = currentNode;
                        this.repopulateProject(childNodeModel, projectNode.project)
                    })

                    kidsToRemove.forEach(child => {
                        let childNodeModel = this.searchTreeForChildId(currentNode, child.id)    //currentNode.getChildById(child.id)
                        currentNode.removeChild(childNodeModel);
                        childNodeModel.parent = null;
                        childNodeModel.childId = null;
                        this.repopulateProject(childNodeModel, childNodeModel.id)
                        orphanedRootStack.push(childNodeModel);
                    })
                }
                for (const child of currentNode.children) {
                    nodeStack.push(child);
                }
            }
            for (let rootNode of orphanedRootStack) {
                if (this.projectMap.has(rootNode.id)) {
                    console.log("Orphans =(should not happen)")
                } else {
                    console.log("Orphans ")
                }
            }
            await StorageService.update(projectNode, 'node');
            console.log("Local<< (new node affects project) ")
        }
    }




    restructureProject(currentNode) {                                         ///  This should be replaced
        let existingKids = currentNode.children.map(node => {
            return {urn: node.urn, id: node.childId}
        })
        let validKids = this._jagModelMap.get(currentNode.urn)
        let kidsToAdd = this.getChildrenToAdd(newKids, oldKids);
        let kidsToRemove = this.getChildrenToRemove(newKids, oldKids);
        kidsToAdd.forEach(child => {
            const childJagModel = this._jagModelMap.get(child.urn);
            const childNodeModel = new NodeModel({urn: childJagModel.urn, is_root: false});
            currentNode.addChild(childNodeModel, true);
            childNodeModel.childId = child.id;    // Give the child the 'childId' that was listed in the Parent's Jag children.  (separated them from other children of same urn)
            this.repopulateJag(childNodeModel)
            this.repopulateParent(currentNode)
            this.repopulateProject(childNodeModel, currentNode.project)
        })

        kidsToRemove.forEach(child => {
            let childNodeModel = currentNode.getChildById(child.id)
            childNodeModel.isRoot(true);
            newlyFormedRootStack.push(childNodeModel);
            currentNode.removeChild();
            this.repopulateJag(childNodeModel)
            this.repopulateParent(childNodeModel)
            this.repopulateProject(childNodeModel, childNodeModel.id)   // 100% avoid race condition

        })

    }

    getChildrenToAdd(oldKids, newKids) {
        const returnValue = newKids.filter(newKid => !oldKids.find(oldKid => JSON.stringify(newKid) === JSON.stringify(oldKid)))
        return returnValue
    }

    getChildrenToRemove(oldKids, newKids) {
        return oldKids.filter(oldKid => !newKids.find(newKid => JSON.stringify(oldKid) === JSON.stringify(newKid)))
    }


    resultingProjectsFromActivityChange(rootNodeModel, changedActivityUrn = undefined) {         // Why would urn ever be undefined?       zzzzzz


        return newlyFormedRootStack;
    }    // possible common area contender


    searchTreeForId(treeNode,id) {
        let workStack = []
        workStack.push(treeNode)
        while(workStack.length>0){
            let checkNode = workStack.pop();
            if (checkNode.id == id) {return checkNode}
            checkNode.children.forEach(child => workStack.push(child))
        }
        return null
    }


    searchTreeForChildId(treeNode,childId) {
        let workStack = []
        workStack.push(treeNode)
        while(workStack.length>0){
            let checkNode = workStack.pop();
            if (checkNode.childId == childId) {return checkNode}
            checkNode.children.forEach(child => workStack.push(child))
        }
        return null
    }


    repositioningStoppedHandler(event) {
       event.stopPropagation();
       let nodeModel = event.detail.nodeModel
       let projectNode = this._projectMap.get(nodeModel.project);
       let movedItem = this.searchTreeForId(projectNode, nodeModel.id)

        movedItem.x = event.detail.x;
        movedItem.y = event.detail.y;

        //    await StorageService.update(movedItem,"node");                 // Is this worth the trouble - only cosmetic.
    }

    // This is an identical copy (hopefully) of the URN updater found in views/Properties
    // I can't decide on a common area for updates such as this.  Views arent shared.  A controller area?
    // Maybe just the model (storage is data) but circular reference problem with schema.
    // Currently thinking a controller area if more can be found.

    async localUrnRenamedHandler(event) {
        console.log("Local>> (url renamed) ")
        const eventDetail = event.detail;
        const newUrn = eventDetail.newUrn;
        const originalUrn = eventDetail.originalUrn;
        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newUrn + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newUrn + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isLocked' tag.
        // URN changes are renames until the JagModel is marked as 'isLocked'.
        // After 'isLocked', URN changes are copies.

        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(newUrn);
        if (isValid) {
            let origJagModel = await StorageService.get(originalUrn, 'jag');  // needed to check if 'isLocked'
            let urnAlreadyBeingUsed = await StorageService.has(newUrn, 'jag');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isLocked ?? ? idk
                    let newJagModel = await StorageService.get(originalUrn, 'jag');

                    // is the target JagModel locked?
                    if (newJagModel.isLocked) {
                        // FAIL  - CANT OVERWRITE LOCKED JagModel
                    } else // target JagModel is NOT locked

                    { // is the original JagModel locked?
                        if (origJagModel.isLocked) {
                            await StorageService.clone(originalUrn, newUrn, 'jag');
                        } else { /// the original JagModel is not locked
                            await StorageService.replace(originalUrn, newUrn, 'jag')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING JagModel
                }
            } else {  // urn not already being used
                // is the original JagModel locked?
                if (origJagModel.isLocked) {
                    await this.cloneJagModel(origJagModel, newUrn)
                } else {/// the original JagModel is not locked
                    await StorageService.replace(originalUrn, newUrn, 'jag');
                }
            }
        }
        console.log("Local<< (url renamed) ")
    }

    async localJagDeletedHandler(event) {
        console.log("Local>> (jag deleted) ")
        const deadJagModelUrn = event.detail.jagModelUrn;
        for (let [activityId, activity] of this._jagModelMap) {
            if (activity.urn != deadJagModelUrn) {
                let remainingChildren = activity.children.filter(kid => {
                    if (kid.urn != deadJagModelUrn) {
                        return kid
                    }
                })
                if (remainingChildren.length < activity.children.length){
                    activity.children = remainingChildren;
                    await StorageService.update(activity, 'jag');
                }
            }
        }
        await StorageService.delete(deadJagModelUrn, 'jag');
        console.log("Local<< (jag deleted) ")
    }

    async localJagLockedHandler(event) {
        console.log("Local>> (jag locked) ")
        const lockedJagModel = event.detail.jagModel;
        lockedJagModel.isLocked = !lockedJagModel.isLocked;
        await StorageService.update(lockedJagModel, 'jag');
        console.log("Local<< (jag locked) ")
    }

    async localNodeLockedHandler(event) {
        console.log("Local>> (node locked) ")
        const lockedNodeModel = event.detail.nodeModel;
        lockedNodeModel.isLocked = !lockedNodeModel.isLocked;
        await StorageService.update(lockedNodeModel, 'node');
        console.log("Local<< (node locked) ")
    }

    addNewJagActivityHandler() {
        this._playground._handleNewJagActivityPopup();         //@todo consider moving popupable to menu as well
    }

    clearPlaygroundHandler() {
        console.log("Local>> (clear playground) ")
        this._playground.clearPlayground();
        console.log("Local<< (clear playground) ")
    }

    clearSelectedHandler(event) {
        console.log("Local>> (clear selected) ")
        this._playground.handleClearSelected(event);
        console.log("Local<< (clear selected) ")
    }

    async libraryLineItemSelectedHandler(event) {
        console.log("Local>> (line item selected) ")
        const jagModelSelected = event.detail.jagModel;
        const expandRequested = event.detail.expanded;
        //  let childrenMap = this._getChildModels(jagModelSelected, new Map());  // @todo consider getChildArray (returns array/map) (one in parameter)
        let newProjectRootNode = this.buildNodeTreeFromJagUrn(jagModelSelected.urn);
        await StorageService.create(newProjectRootNode, "node");
        console.log("Local<< (line item selected) ")
    }


    async localJagDisconnectedHandler(event){              //localActivityNodeCleared?
        console.log("Local>> (local nodes disjoined) ")
        let changingJagModel = event.detail.jagUrn
        let leavingJagChild = event.detail.jagChild

        let projectRoot = this._projectMap.get(leavingNodeModel.project)
        this.repopulateParent(projectRoot)
        let losingParents = leavingNodeModel.parent;
        let losingParentsJag = this._jagModelMap.get(losingParents.urn)
        let remainingChildren = losingParentsJag.children.filter(entry => {
            if (entry.id != leavingNodeModel.childId) {
                return entry;
            }
        })
        losingParentsJag.children = remainingChildren
        await StorageService.update(losingParentsJag, 'jag');
        console.log("Local<< (local nodes disjoined) ")
    }


    async localNodeDeletedHandler(event) {
        console.log("Local>> (node deleted) ")
        const deadNodeModelId = event.detail.nodeModelId;
        // 3) Removes the project
         await StorageService.delete(deadNodeModelId, 'node');
        console.log("Local<< (node deleted) ")
    }






    //////////////////////////////////////////////////////////////////////////////////
    //////////  controllerAT - DOWNWARD Control  ///////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    /**
     * Remote Handlers - jagUpdate, jagCreate, jagDelete, jagCloned*, jagReplaced*
     *                   nodeUpdate, nodeCreate, nodeDelete, nodeCloned*, nodeReplaced*
     * @param updatedJagModel
     * @param updatedJagUrn
     */


    handleJagStorageCreated(createdJagModel, createdJagUrn) {
        console.log("                          ((OBSERVER IN) >>  Jag Created - Jag Created - Jag Created - Jag Created - Jag Created")
        this._jagModelMap.set(createdJagUrn, createdJagModel)
        UserPrefs.setDefaultUrnPrefixFromUrn(createdJagUrn)
        this._library.addListItem(createdJagModel);                                   // Add JagModel list item to Library
        console.log("                          ((OBSERVER OUT) <<  Jag Created - Jag Created - Jag Created - Jag Created - Jag Created")
    }


    // UPDATE JAG --- Cycle through active Projects and rebuild.


    handleJagStorageUpdated(updatedJagModel, updatedJagUrn) {
        console.log("                          ((OBSERVER IN) >>  Jag Updated - Jag Updated - Jag Updated - Jag Updated - Jag Updated")
        this._jagModelMap.set(updatedJagUrn, updatedJagModel)
        this._playground.updateJagModel(updatedJagUrn);         // Determine if JAG change affects our graph
        this._properties.handleStorageUpdate(updatedJagModel, updatedJagUrn);   // change property window values if that one is changed in IA
        this._library.updateItem(updatedJagModel);
        console.log("                          ((OBSERVER OUT) <<  Jag Updated - Jag Updated - Jag Updated - Jag Updated - Jag Updated")
    }

    handleJagStorageDeleted(deletedJagUrn) {
        console.log("                          ((OBSERVER IN) >>  Jag Deleted - Jag Deleted - Jag Deleted - Jag Deleted - Jag Deleted")
        this._jagModelMap.delete(deletedJagUrn)
        this._playground.deleteJagModel(deletedJagUrn)
        this._library.removeLibraryListItem(deletedJagUrn)
        console.log("                          ((OBSERVER OUT) <<  Jag Deleted - Jag Deleted - Jag Deleted - Jag Deleted - Jag Deleted")
    }

    handleJagStorageCloned(clonedJagModel, clonedJagUrn) {
        UserPrefs.setDefaultUrnPrefixFromUrn(clonedJagUrn)
        this._playground._addJagNodeTree(clonedJagModel, clonedJagUrn)
    }

    handleJagStorageReplaced(newJagModel, replacedJagUrn) {
        //  UserPrefs.setDefaultUrnPrefixFromUrn(newJagModel.urn)
        this._playground.replaceJagNode(newJagModel, replacedJagUrn)
        this._library.replaceItem(newJagModel, replacedJagUrn)                   // Replace JagModel list item in library
    }

    handleNodeStorageCreated(createdNodeModel, createdNodeId) { /// this coming in is no good
        console.log("                          ((OBSERVER IN) >>  Node Created - Node Created - Node Created - Node Created - Node Created")
        this.repopulateParent(createdNodeModel)
        this.repopulateJag(createdNodeModel);
        this.repopulateProject(createdNodeModel, createdNodeModel.id)
        this._projectMap.set(createdNodeId, createdNodeModel)
        this._projectLibrary.addListItem(createdNodeModel);                                        // Add JagModel list item to Library
        this._playground._buildNodeViewFromNodeModel(createdNodeModel)
        //   this._playground.createJagNode(createdNodeModel, true);                        // default expand tree = true
        console.log("                          ((OBSERVER OUT) <<  Node Created - Node Created - Node Created - Node Created - Node Created")
    }

    handleNodeStorageUpdated(updatedNodeModel, updatedNodeId) {
        console.log("                          ((OBSERVER IN) >>  Node Updated - Node Updated - Node Updated - Node Updated - Node Updated")
        let projectNode = this._projectMap.get(updatedNodeModel.project)
        this.repopulateParent(projectNode)
        this.repopulateJag(updatedNodeModel)
        this.repopulateProject(updatedNodeModel,projectNode.id)

        this.projectMap.set(projectNode.id, projectNode)
        console.log("handleNodeStorageUpdated1")
        this._playground._rebuildNodeView(updatedNodeModel)
        console.log("handleNodeStorageUpdated2")

      //  this._projectLibrary.updateItem(updatedNodeModel);
        this._projectLibrary.updateItem(updatedNodeModel)
        this._projectLibrary.updateStructureChange(Array.from(this._projectMap.values()))
        // update playground
        console.log("                          ((OBSERVER OUT) <<  Node Updated - Node Updated - Node Updated - Node Updated - Node Updated")
    }

    repopulateJag(currentNode) {
        currentNode.jag = this._jagModelMap.get(currentNode.urn)
        for (let child of currentNode.children) {
            this.repopulateJag(child)
        }
    }

    repopulateParent(currentNode) {
        for (let child of currentNode.children) {
            child.parent = currentNode;
            this.repopulateParent(child)
        }
    }

    repopulateProject(currentNode, projectId) {
        currentNode.project = projectId
        for (let child of currentNode.children) {
            child.project = projectId;
            this.repopulateParent(child, projectId)
        }
    }

    handleNodeStorageDeleted(deletedNodeId) {
        console.log("                          ((OBSERVER IN) >>  Node Deleted - Node Deleted - Node Deleted - Node Deleted - Node Deleted")
        this._projectMap.delete(deletedNodeId)
        this._playground.deleteNodeModel(deletedNodeId)
        this._projectLibrary.removeNodeLibraryListItem(deletedNodeId)
        console.log("                          ((OBSERVER OUT) <<  Node Deleted - Node Deleted - Node Deleted - Node Deleted - Node Deleted")
    }

    /**
     *                                        Support Functions
     * buildNodeTreeFromJagUrn   Build node tree given root URN
     *                           @TODO should this be shared with IA>?
     *
     */


    // _getChildModels(parentJAGModel, childrenJAGMap) {
    //     if (!parentJAGModel.children)              // @TODO or.. if (parentJAGModel.children) then for loop...  return childrenJAGMap
    //         return childrenJAGMap;
    //     for (let childDetails of parentJAGModel.children) {
    //         const childJAGModel = this._jagModelMap.get(childDetails.urn)
    //         childrenJAGMap.set(childDetails.urn, childJAGModel);
    //         childrenJAGMap = this._getChildModels(childJAGModel, childrenJAGMap);
    //     }
    //     return childrenJAGMap;
    // }

    // The brute force rebuild  - put in URN and get back rootNode of a fully armed and operational NodeModelTree.
    buildNodeTreeFromJagUrn(newRootJagUrn) {
        const nodeStack = [];
        const resultStack = [];
        const rootJagModel = this.jagModelMap.get(newRootJagUrn); /// I could have just passed in the Model...instead of switching to urn and back.
        const rootNodeModel = new NodeModel({urn: newRootJagUrn, is_root: true});
        rootNodeModel.jag = rootJagModel;
        nodeStack.push(rootNodeModel);
        while (nodeStack.length != 0) {
            let currentNode = nodeStack.pop();
            for (const child of currentNode.jag.children) {
                const childJagModel = this.jagModelMap.get(child.urn);
                const childNodeModel = new NodeModel({urn: child.urn, childId: child.id, is_root: false});
                childNodeModel.jag = this.jagModelMap.get(child.urn)
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        const returnNode = resultStack.shift();
        return returnNode;
    }


}