/**
 *
 * JAG - Authoring Tool
 *
 *
 * @author IHMC
 * @version 0.02
 */

'use strict';

import JagModel from "../models/jag.js";
import NodeModel from "../models/node.js";
import StorageService from "../services/storage-service.js";
import InputValidator from "../utils/validation.js";
import UserPrefs from "../utils/user-prefs.js";

export default class ControllerAT extends EventTarget {

    constructor() {
        super();
        this._menu = null;
        this._activityLibrary = null;
        this._projectLibrary = null;
        this._playground = null;
        this._properties = null;
        this._activityMap = new Map();         // All JagModels - should be in sync with storage
        this._projectMap = new Map();        // All nodes - should be in sync with storage
        this._currentAnalysis = undefined;       // type: AnalysisModel

        StorageService.subscribe("command-activity-created", this.commandActivityCreatedHandler.bind(this));   // }
        StorageService.subscribe("command-activity-updated", this.commandActivityUpdatedHandler.bind(this));   // }
        StorageService.subscribe("command-activity-deleted", this.commandActivityDeletedHandler.bind(this));   // } All from observable
        StorageService.subscribe("command-activity-cloned", this.commandActivityClonedHandler.bind(this));     // } Cross-tab communications
        StorageService.subscribe("command-activity-replaced", this.commandActivityReplacedHandler.bind(this)); // }
        StorageService.subscribe("command-node-created", this.commandNodeCreatedHandler.bind(this)); // }
        StorageService.subscribe("command-node-updated", this.commandNodeUpdatedHandler.bind(this)); // }
        StorageService.subscribe("command-node-deleted", this.commandNodeDeletedHandler.bind(this)); // }
    }

    set menu(value) {
        this._menu = value;
    }
    set activityLibrary(value) {
        this._activityLibrary = value;
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

    get activityMap() {
        return this._activityMap;
    }
    set activityMap(newJagModelMap) {
        this._activityMap = newJagModelMap;
    }
    addActivity(jagModel) {
        this._activityMap.set(jagModel.urn, jagModel)
    }

    get projectMap() {
        return this._projectMap;
    }
    set projectMap(newNodeModelMap) {
        this._projectMap = newNodeModelMap;
    }
    addProject(newNodeModel) {
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
        let allActivities = await StorageService.all('activity')
        allActivities.forEach(activity => this.addActivity(activity));

        let allNodes = await StorageService.all('node')
        allNodes.forEach(node => {
            this.repopulateJag(node)
            this.repopulateParent(node)
            this.addProject(node);
        });

        window.onblur = function (ev) {
            console.log("window.onblur");
        };
    }

    initializePanels() {
        this._activityLibrary.addListItems([...this._activityMap.values()])
        this._projectLibrary.addListItems([...this._projectMap.values()])
    }

    initializeHandlers() {
        this._playground.addEventListener('event-activity-created', this.eventActivityCreatedHandler.bind(this));
        this._playground.addEventListener('event-activity-updated', this.eventActivityUpdatedHandler.bind(this));                        // Any structural or property change at Activity level
        this._playground.addEventListener('response-activity-created', this.responseActivityCreatedHandler.bind(this));   // is changed activity in active viewing
        this._playground.addEventListener('response-activity-deleted', this.responseActivityDeletedHandler.bind(this));   // is changed activity in active viewing
        this._playground.addEventListener('event-nodes-selected', this.eventNodesSelectedHandler.bind(this));        // mouse click event
        this._playground.addEventListener('event-node-repositioned', this.eventNodeRepositionedHandler.bind(this));               // mouse movement event
        this._playground.addEventListener('event-nodes-connected', this.eventNodesConnectedHandler.bind(this));                      // onEdgeFinalized between nodes
        // this._playground.addEventListener('event-project-removed', this.eventProjectRemovedHandler.bind(this));
        // this._playground.addEventListener('event-node-disconnected', this.eventNodeDisconnectedHandler.bind(this));

        this._properties.addEventListener('event-urn-changed', this.eventUrnChangedHandler.bind(this));
        this._properties.addEventListener('event-activity-updated', this.eventActivityUpdatedHandler.bind(this));  // activity property updates
        this._properties.addEventListener('event-node-updated', this.eventNodeUpdatedHandler.bind(this));  // activity property updates
        //    this._properties.addEventListener('event-activity-deleted', this.eventActivityDeletedHandler.bind(this));  // @todo - button to add
        //    this._properties.addEventListener('event-activity-locked', this.eventActivityLockedHandler.bind(this));  // @todo - button to add

        this._menu.addEventListener('event-add-activity', this.eventAddActivityHandler.bind(this));
        this._menu.addEventListener('event-clear-playground', this.eventClearPlaygroundHandler.bind(this));  // Event: 'event-clear-playground' - menu item selected to clear nodes from playground

        this._activityLibrary.addEventListener('event-activity-selected', this.eventActivitySelectedHandler.bind(this));
        this._activityLibrary.addEventListener('event-activity-deleted', this.eventActivityDeletedHandler.bind(this));
        this._activityLibrary.addEventListener('event-activity-locked', this.eventActivityLockedHandler.bind(this));

        this._projectLibrary.addEventListener('event-project-selected', this.eventProjectSelectedHandler.bind(this));   // list item chosen
        this._projectLibrary.addEventListener('event-project-deleted', this.eventProjectDeletedHandler.bind(this));             // delete icon
        this._projectLibrary.addEventListener('event-project-locked', this.eventProjectLockedHandler.bind(this));             // lock icon
    }

    /**
     *                                   Upward Event Handlers
     * 'Upward handlers' refer to the process that starts at the initial event and ends at the submission of
     * the resulting data for storage and distribution.
     *
     *  'initial event' = some user interaction or detected remote change that requires initiates another local action
     *  Data processing in this phase is minimal - it is primarily concerned with translating the initial
     *  event into a standard command that is understood across the application.
     *
     *  example: a user changing an Activity name will produce a standardized command to 'update Activity' to be
     *  stored and distributed.
     *
     *    -- playground --
     * eventActivityCreatedHandler            - popup create Activity (original event in menu starts playground popup)
     * eventActivityUpdatedHandler            - structure change
     * responseActivityCreatedHandler         - does command to change particular Activity change our Playground view
     * responseActivityDeletedHandler         - does command to delete particular Activity change our Playground view
     * eventNodesSelectedHandler              - user selects Node in graph
     * eventNodeRepositionedHandler           - user repositioned Node
     * eventNodesConnectedHandler             - user connects two Nodes with an edge
     * eventProjectRemovedHandler  *          - user selected Root and hit 'delete'
     * eventNodeDisconnectedHandler  *        - user selected Node and hit 'delete'
     * 
     *    -- properties --
     * eventUrnChangedHandler                 - URN field is changed
     * eventActivityUpdatedHandler            - user updates an Activity related field
     * eventNodeUpdatedHandler                - user updates a Node related field
     * eventActivityDeletedHandler  *         - user permanently deletes Activity
     * eventActivityLockedHandler   *         - user locks Activity against delete/updates
     * 
     *       -- menu --
     * eventAddActivityHandler                - user triggers Activity data entry
     * eventClearPlaygroundHandler            - user Clears Playground
     * 
     *  -- activity library --
     * eventActivitySelectedHandler           - user selects Activity for playground (creates Graph)
     * eventActivityDeletedHandler            - user permanently deletes Activity
     * eventActivityLockedHandler             - user locks Activity against delete/updates
     * 
     *   -- project library --
     * eventProjectSelectedHandler           - user selects Graph for playground (recovers Graph)
     * eventProjectDeletedHandler            - user permanently deletes Graph
     * eventProjectLockedHandler             - user locks Graph against delete/updates
     *
     */

    /**   -- Playground --  */
    
    async eventActivityCreatedHandler(event) {
        console.log("Local>> (local activity created) ")
        const urn = event.detail.urn;
        const description = event.detail.description;
        const name = event.detail.name;
        const newJagModel = new JagModel({urn: urn, name: name, description: description});
        if (InputValidator.isValidUrn(newJagModel.urn)) {
            await StorageService.create(newJagModel, 'activity');
            //   this._playground._addJagNodeTree(newJagModel, newJagModel.urn);
        } else {
            window.alert("Invalid URN");
        }
        console.log("Local<< (local activity created) \n")
    }

    async eventActivityUpdatedHandler(event) {                                       // Store and notify 'Updated JAG'
        console.log("Local>> (local activity updated) ")
        const updatedJagModel = event.detail.jagModel;
        await StorageService.update(updatedJagModel, 'activity');
        console.log("Local<< (local activity updated) \n")
    }

    async responseActivityCreatedHandler(event) {
        // The Event: Playground just alerted that the updated JAG we recieved is used by the showing Projects.
        // Need to update and save the adjusted Projects
        console.log("Local>> (new node affects project) ")
        console.log(event)
        let incomingProjectNode = event.detail.projectModel; // could have used id

        console.log("======")
        console.log(incomingProjectNode)

        let projectNode = this._projectMap.get(incomingProjectNode.id)
        let changedActivityUrn = event.detail.activityUrn;
        console.log("DETECTED CHANGE IN PROJECT (from recent JAG [" + changedActivityUrn + "] update)")
        console.log(projectNode)

        const nodeStack = [];
        const orphanedRootStack = [];
        nodeStack.push(projectNode);
        while (nodeStack.length > 0) {
            let currentNode = nodeStack.pop();
            console.log("popped")
            console.log(currentNode)
            if ((changedActivityUrn == undefined) || (currentNode.urn == changedActivityUrn)) {
                if (changedActivityUrn == undefined) {
                    console.log("Not  bad - this happens when the precide URN of change is not know.  For example, a rebuild from an archive or fresh pull")
                }
                let existingKids = currentNode.children.map(node => {
                    return {urn: node.urn, id: node.childId}
                })
                let validJag = (this._activityMap.has(currentNode.urn)) ? this._activityMap.get(currentNode.urn) : [];
                let validKids = validJag.children
                currentNode.jag = validJag;
                let kidsToAdd = this.getChildrenToAdd(existingKids, validKids);
                let kidsToRemove = this.getChildrenToRemove(existingKids, validKids);

                kidsToAdd.forEach(child => {
                    const childJagModel = this._activityMap.get(child.urn);
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
        console.log("Local<< (new node affects project) \n")
    }

    async responseActivityDeletedHandler(event) {
        // The Event: Playground just alerted that an activity JAG has been deleted.
        // This can have a major impact on other JAGs and thus significantly affect the drawn nodes.
        // Need to update and save the adjusted Projects
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
                    let validJag = (this._activityMap.has(currentNode.urn)) ? this._activityMap.get(currentNode.urn) : [];
                    let validKids = validJag.children
                    currentNode.jag = validJag;
                    let kidsToAdd = this.getChildrenToAdd(existingKids, validKids);
                    let kidsToRemove = this.getChildrenToRemove(existingKids, validKids);

                    kidsToAdd.forEach(child => {

                        const childJagModel = this._activityMap.get(child.urn);
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
            console.log("Local<< (new node affects project) \n")
        }
    }

    eventNodesSelectedHandler(event) {
        this._properties.handleSelectionUpdate(event.detail.selectedNodeArray);
        //ide.handleSelectionUpdate(e.detail);
    }

    eventNodeRepositionedHandler(event) {
        event.stopPropagation();
        let nodeModel = event.detail.nodeModel
        let projectNode = this._projectMap.get(nodeModel.project);
        let movedItem = this.searchTreeForId(projectNode, nodeModel.id)

        movedItem.x = event.detail.x;
        movedItem.y = event.detail.y;

        //    await StorageService.update(movedItem,"node");                 // Is this worth the trouble - only cosmetic.
    }

    async eventNodesConnectedHandler(event) {            // only needed id's
        console.log("Local>> (local nodes joined) ")

        let projectNodeId = event.detail.projectNodeId
        let parentNodeId = event.detail.parentNodeId
        let childNodeId = event.detail.childNodeId
        let projectModel = this._projectMap.get(projectNodeId)
        let parentNodeModel =  this.searchTreeForId(projectModel,parentNodeId)
        let childNodeModel =  this._projectMap.get(childNodeId)


        console.log("PRE")
        console.log("projectModel")
        console.log(projectModel)
        console.log("parentNodeModel")
        console.log(parentNodeModel)
        console.log("childNodeModel")
        console.log(childNodeModel)

        // <-note to me--- here somewhere -- looks like projectId isnt spreading down.  try joining children 2 or three deep.

        // 1) CORRECT THE JAG ACTIVITY
        parentNodeModel.addChild(childNodeModel)
        this.repopulateParent(parentNodeModel)                                       // give node's children reference to parent
        this.repopulateProject(childNodeModel, parentNodeModel.project)             // change project id for all new children
        let newChildId = parentNodeModel.jag.addChild(childNodeModel.urn)   // Add child to parent's JAG and return child.id
        childNodeModel.childId = newChildId                                         // set childId to distinguish child relationship
        this._activityMap.set(parentNodeModel.urn, parentNodeModel.jag)  // prob not necessary - first thing that jagupdatehandler does

        // 2) CONNECT CHILD TO PARENT
        // Parent node adds child node
        console.log("DOUBLE THIS -------------->")
        console.log(parentNodeModel)




        // 3) UPDATE PARENT IN PROJECT (is this necessary?)


        // 3) REMOVE ABSORBED PROJECT FROM PROJECT MAP
        this._projectMap.delete(childNodeModel.id) //// prob not necessary - first thing that nodeupdatehandler does

        // This particular node changed (to preserve that node) otherwise it gets recreated as new

        // event.detail.nodeModel = projectModel;
        // await this.eventNodeUpdatedHandler(event)
        //
        // event.detail.jagModel = parentNodeModel.jag;                                // localJagUpdateHandler wants the new Parent JAG
        // await this.eventActivityUpdatedHandler(event)
        //

        console.log("BEFORE")
        console.log("projectModel")
        console.log(projectModel)
        console.log("parentNodeModel")
        console.log(parentNodeModel)
        console.log("childNodeModel")
        console.log(childNodeModel)


        event.detail.jagModel = parentNodeModel.jag;                                // localJagUpdateHandler wants the new Parent JAG
        await this.eventActivityUpdatedHandler(event)

        console.log("AFTER PARENT JAG UPDATE")
        console.log("projectModel")
        console.log(projectModel)
        console.log("parentNodeModel")
        console.log(parentNodeModel)
        console.log("childNodeModel")
        console.log(childNodeModel)



        // event.detail.jagModel = childNodeModel.jag;
        // await this.eventActivityUpdatedHandler(event)


        console.log("AFTER CHILD JAG UPDATE")
        console.log("projectModel")
        console.log(projectModel)
        console.log("parentNodeModel")
        console.log(parentNodeModel)
        console.log("childNodeModel")
        console.log(childNodeModel)



        event.detail.nodeModelId = childNodeModel.id;              // delete currently turns children into trees - i cant do that with a join
        await this.eventProjectDeletedHandler(event)


        console.log("AFTER CHILD DELETE")
        console.log("projectModel")
        console.log(projectModel)
        console.log("parentNodeModel")
        console.log(parentNodeModel)
        console.log("childNodeModel")
        console.log(childNodeModel)
        console.log("Local<< (local nodes joined) \n")
    }
    
    /**   -- Properties --  */

    async eventUrnChangedHandler(event) {
        // This is an identical copy (hopefully) of the URN updater found in views/Properties
        // I can't decide on a common area for updates such as this.  Views arent shared.  A controller area?
        // Maybe just the model (storage is data) but circular reference problem with schema.
        // Currently thinking a controller area if more can be found.
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
            let origJagModel = await StorageService.get(originalUrn, 'activity');  // needed to check if 'isLocked'
            let urnAlreadyBeingUsed = await StorageService.has(newUrn, 'activity');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isLocked ?? ? idk
                    let newJagModel = await StorageService.get(originalUrn, 'activity');

                    // is the target JagModel locked?
                    if (newJagModel.isLocked) {
                        // FAIL  - CANT OVERWRITE LOCKED JagModel
                    } else // target JagModel is NOT locked

                    { // is the original JagModel locked?
                        if (origJagModel.isLocked) {
                            await StorageService.clone(originalUrn, newUrn, 'activity');
                        } else { /// the original JagModel is not locked
                            await StorageService.replace(originalUrn, newUrn, 'activity')
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
                    await StorageService.replace(originalUrn, newUrn, 'activity');
                }
            }
        }
        console.log("Local<< (url renamed) \n")
    }

    async eventNodeUpdatedHandler(event) {
        let projectNode = null;
        const updatedNodeModel = event.detail.nodeModel;
        console.log("iiiiiiiiiiiiii")
        console.log(updatedNodeModel)
        // This migth not be necessarily the projectNode that is needed by Storage.
        // If its not the root, it needs to be inserted at the right place in the Project
        if (updatedNodeModel.id == updatedNodeModel.project) {
            projectNode = updatedNodeModel
        }
        else {
            projectNode = this.projectMap.get(updatedNodeModel.project)
            projectNode.replaceChild(updatedNodeModel)
            console.log("a")
            console.log(projectNode)
        }
        console.log("b")
        console.log(projectNode)
        console.log("c")
        await StorageService.update(projectNode, 'node');
        console.log("Local<< (local node updated) \n")
    }

    async eventActivityDeletedHandler(event) {
        console.log("Local>> (jag deleted) ")
        const deadJagModelUrn = event.detail.jagModelUrn;
        for (let [activityId, activity] of this._activityMap) {
            if (activity.urn != deadJagModelUrn) {
                let remainingChildren = activity.children.filter(kid => {
                    if (kid.urn != deadJagModelUrn) {
                        return kid
                    }
                })
                if (remainingChildren.length < activity.children.length){
                    activity.children = remainingChildren;
                    await StorageService.update(activity, 'activity');
                }
            }
        }
        await StorageService.delete(deadJagModelUrn, 'activity');
        console.log("Local<< (jag deleted) \n")
    }

    async eventActivityLockedHandler(event) {
        console.log("Local>> (jag locked) ")
        const lockedJagModel = event.detail.jagModel;
        lockedJagModel.isLocked = !lockedJagModel.isLocked;
        await StorageService.update(lockedJagModel, 'activity');
        console.log("Local<< (jag locked) \n")
    }

    /**   -- Menu --  */

    eventAddActivityHandler() {
        this._playground._handleNewJagActivityPopup();         //@todo consider moving popupable to menu as well
    }

    eventClearPlaygroundHandler() {
        console.log("Local>> (clear playground) ")
        this._playground.clearPlayground();
        console.log("Local<< (clear playground) \n")
    }

    /**   -- Activity Library --  */

    async eventActivitySelectedHandler(event) {
        console.log("Local>> (line item selected) ")
        const jagModelSelected = event.detail.jagModel;
        const expandRequested = event.detail.expanded;
        //  let childrenMap = this._getChildModels(jagModelSelected, new Map());  // @todo consider getChildArray (returns array/map) (one in parameter)
        let newProjectRootNode = this.buildNodeTreeFromJagUrn(jagModelSelected.urn);
        await StorageService.create(newProjectRootNode, "node");
        console.log("Local<< (line item selected) \n")
    }
    
    /**   -- Project Library --  */

    async eventProjectSelectedHandler(event) {
        console.log("Local>> (project line item selected) ")
        const projectSelected = event.detail.projectModel;
        const expandRequested = event.detail.expanded;

        this._playground._rebuildNodeView(projectSelected)
        //  let childrenMap = this._getChildModels(jagModelSelected, new Map());  // @todo consider getChildArray (returns array/map) (one in parameter)
        //    let newProjectRootNode = this.buildNodeTreeFromJagUrn(projectSelected.urn);
        //    await StorageService.create(newProjectRootNode, "node");
        console.log("Local<< (project line item selected) \n")
    }

    async eventProjectDeletedHandler(event) {
        console.log("Local>> (node deleted) ")
        const deadNodeModelId = event.detail.nodeModelId;
        // 3) Removes the project
        await StorageService.delete(deadNodeModelId, 'node');
        console.log("Local<< (node deleted) \n")
    }

    async eventProjectLockedHandler(event) {
        console.log("Local>> (node locked) ")
        const lockedNodeModel = event.detail.nodeModel;
        lockedNodeModel.isLocked = !lockedNodeModel.isLocked;
        await StorageService.update(lockedNodeModel, 'node');
        console.log("Local<< (node locked) \n")
    }



    /**
     *                                   Downward Command Handlers
     * 'Command handlers' refer to the process that starts when our Subscribers are notified and continues until
     * the appropriate changes are made to the views.  Its entirely possible (and common) that the events were
     * initiated locally but that is transparent to the logic.  The origin of commands is irrelevant to the logic.
     *
     * commandActivityCreatedHandler
     * commandActivityUpdatedHandler
     * commandActivityDeletedHandler
     * commandActivityClonedHandler
     * commandActivityReplacedHandler
     * commandNodeCreatedHandler
     * commandNodeUpdatedHandler
     * commandNodeDeletedHandler
     *
     */

    commandActivityCreatedHandler(createdJagModel, createdJagUrn) {
        console.log("                          ((OBSERVER IN) >>  Jag Created - Jag Created - Jag Created - Jag Created - Jag Created")
        this._activityMap.set(createdJagUrn, createdJagModel)
        UserPrefs.setDefaultUrnPrefixFromUrn(createdJagUrn)
        this._activityLibrary.addListItem(createdJagModel);                                   // Add JagModel list item to Library
        console.log("                          ((OBSERVER OUT) <<  Jag Created - Jag Created - Jag Created - Jag Created - Jag Created")
    }

    commandActivityUpdatedHandler(updatedJagModel, updatedJagUrn) {
        console.log("                          ((OBSERVER IN) >>  Jag Updated - Jag Updated - Jag Updated - Jag Updated - Jag Updated")
        this._activityMap.set(updatedJagUrn, updatedJagModel)
        this._playground.affectProjectView(updatedJagUrn);         // Determine if JAG change affects our graph
        this._properties.handleStorageUpdate(updatedJagModel, updatedJagUrn);   // change property window values if that one is changed in IA
        this._activityLibrary.updateItem(updatedJagModel);
        console.log("                          ((OBSERVER OUT) <<  Jag Updated - Jag Updated - Jag Updated - Jag Updated - Jag Updated")
    }

    commandActivityDeletedHandler(deletedJagUrn) {
        console.log("                          ((OBSERVER IN) >>  Jag Deleted - Jag Deleted - Jag Deleted - Jag Deleted - Jag Deleted")
        this._activityMap.delete(deletedJagUrn)
        this._playground.deleteJagModel(deletedJagUrn)
        this._activityLibrary.removeLibraryListItem(deletedJagUrn)
        console.log("                          ((OBSERVER OUT) <<  Jag Deleted - Jag Deleted - Jag Deleted - Jag Deleted - Jag Deleted")
    }

    commandActivityClonedHandler(clonedJagModel, clonedJagUrn) {
        UserPrefs.setDefaultUrnPrefixFromUrn(clonedJagUrn)
        this._playground._addJagNodeTree(clonedJagModel, clonedJagUrn)
    }

    commandActivityReplacedHandler(newJagModel, replacedJagUrn) {
        //  UserPrefs.setDefaultUrnPrefixFromUrn(newJagModel.urn)
        this._playground.replaceJagNode(newJagModel, replacedJagUrn)
        this._activityLibrary.replaceItem(newJagModel, replacedJagUrn)                   // Replace JagModel list item in activityLibrary
    }

    commandNodeCreatedHandler(createdNodeModel, createdNodeId) { /// this coming in is no good
        console.log("                          ((OBSERVER IN) >>  Node Created - Node Created - Node Created - Node Created - Node Created")
        this.repopulateParent(createdNodeModel)
        this.repopulateJag(createdNodeModel);
        this.repopulateProject(createdNodeModel, createdNodeModel.id)
        this._projectMap.set(createdNodeId, createdNodeModel)
        this._projectLibrary.addListItem(createdNodeModel);                                        // Add JagModel list item to Library
        this._playground.addNodeModel(createdNodeModel)
        //   this._playground.createJagNode(createdNodeModel, true);                        // default expand tree = true
        console.log("                          ((OBSERVER OUT) <<  Node Created - Node Created - Node Created - Node Created - Node Created")
    }

    commandNodeUpdatedHandler(updatedNodeModel, updatedNodeId) {
        console.log("                          ((OBSERVER IN) >>  Node Updated - Node Updated - Node Updated - Node Updated - Node Updated")
        console.log(updatedNodeModel)
        let projectNode = this._projectMap.get(updatedNodeModel.project)
        console.log(projectNode)
        this.repopulateParent(projectNode)
        this.repopulateJag(updatedNodeModel)
        this.repopulateProject(updatedNodeModel,projectNode.id)

        this.projectMap.set(projectNode.id, projectNode)
        console.log("-- Just redrawing view ---")
        this._playground._rebuildNodeView(updatedNodeModel)
        console.log("-- Fini redrawing view ---")

        //  this._projectLibrary.updateItem(updatedNodeModel);
        this._projectLibrary.updateItem(updatedNodeModel)
        this._projectLibrary.updateStructureChange(Array.from(this._projectMap.values()))
        // update playground
        console.log("                          ((OBSERVER OUT) <<  Node Updated - Node Updated - Node Updated - Node Updated - Node Updated")
    }

    commandNodeDeletedHandler(deletedNodeId) {
        console.log("                          ((OBSERVER IN) >>  Node Deleted - Node Deleted - Node Deleted - Node Deleted - Node Deleted")
        this._projectMap.delete(deletedNodeId)
        this._playground.deleteNodeModel(deletedNodeId)
        this._projectLibrary.removeNodeLibraryListItem(deletedNodeId)
        console.log("                          ((OBSERVER OUT) <<  Node Deleted - Node Deleted - Node Deleted - Node Deleted - Node Deleted")
    }




    /**
     *                                  Support Functions
     * buildNodeTreeFromJagUrn   Build node tree given root URN
     *
     *
     *
     */

    buildNodeTreeFromJagUrn(newRootJagUrn) {
        const nodeStack = [];
        const resultStack = [];
        const rootJagModel = this.activityMap.get(newRootJagUrn); /// I could have just passed in the Model...instead of switching to urn and back.
        const rootNodeModel = new NodeModel({urn: newRootJagUrn, is_root: true});
        rootNodeModel.jag = rootJagModel;
        rootNodeModel.project = rootNodeModel.id;
        nodeStack.push(rootNodeModel);
        while (nodeStack.length != 0) {
            let currentNode = nodeStack.pop();
            for (const child of currentNode.jag.children) {
                const childJagModel = this.activityMap.get(child.urn);
                const childNodeModel = new NodeModel({urn: child.urn, childId: child.id, is_root: false});
                childNodeModel.jag = this.activityMap.get(child.urn)
                childNodeModel.parent = currentNode;
                childNodeModel.project = currentNode.project
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        const returnNode = resultStack.shift();
        return returnNode;
    }




    updateProject(currentNode, projectId) {
        currentNode.project = projectId
        currentNode.children.forEach(child => this.updateProject(child))
    }



    restructureProject(currentNode) {                                         ///  This should be replaced
        let existingKids = currentNode.children.map(node => {
            return {urn: node.urn, id: node.childId}
        })
        let validKids = this._activityMap.get(currentNode.urn)
        let kidsToAdd = this.getChildrenToAdd(newKids, oldKids);
        let kidsToRemove = this.getChildrenToRemove(newKids, oldKids);
        kidsToAdd.forEach(child => {
            const childJagModel = this._activityMap.get(child.urn);
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


    clearSelectedHandler(event) {
        console.log("Local>> (clear selected) ")
        this._playground.handleClearSelected(event);
        console.log("Local<< (clear selected) \n")
    }


    async localJagDisconnectedHandler(event){              //localActivityNodeCleared?
        console.log("Local>> (local nodes disjoined) ")
        let changingJagModel = event.detail.jagUrn
        let leavingJagChild = event.detail.jagChild

        let projectRoot = this._projectMap.get(leavingNodeModel.project)
        this.repopulateParent(projectRoot)
        let losingParents = leavingNodeModel.parent;
        let losingParentsJag = this._activityMap.get(losingParents.urn)
        let remainingChildren = losingParentsJag.children.filter(entry => {
            if (entry.id != leavingNodeModel.childId) {
                return entry;
            }
        })
        losingParentsJag.children = remainingChildren
        await StorageService.update(losingParentsJag, 'activity');
        console.log("Local<< (local nodes disjoined) \n")
    }



    repopulateJag(currentNode) {
        currentNode.jag = this._activityMap.get(currentNode.urn)
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



    // _getChildModels(parentJAGModel, childrenJAGMap) {
    //     if (!parentJAGModel.children)              // @TODO or.. if (parentJAGModel.children) then for loop...  return childrenJAGMap
    //         return childrenJAGMap;
    //     for (let childDetails of parentJAGModel.children) {
    //         const childJAGModel = this._activityMap.get(childDetails.urn)
    //         childrenJAGMap.set(childDetails.urn, childJAGModel);
    //         childrenJAGMap = this._getChildModels(childJAGModel, childrenJAGMap);
    //     }
    //     return childrenJAGMap;
    // }

    // The brute force rebuild  - put in URN and get back rootNode of a fully armed and operational NodeModelTree.



}