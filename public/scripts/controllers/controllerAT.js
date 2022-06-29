/**
 *
 * JAG - Authoring Tool
 *
 *
 * @author IHMC
 * @version 0.02
 */

'use strict';

import NodeModel from "../models/node.js";
import StorageService from "../services/storage-service.js";
import UserPrefs from "../utils/user-prefs.js";
import Controller from "./controller.js";
import Activity from "../models/activity.js";

export default class ControllerAT extends Controller {

    constructor() {
        super();
        this._menu = null;
        this._activityLibrary = null;
        this._projectLibrary = null;
        this._playground = null;
        this._properties = null;


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


    async initialize() {
        UserPrefs.setDefaultUrnPrefix("us:tim:")
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache() {
        let allActivities = await StorageService.all('activity')
        allActivities.forEach(activity => this.cacheActivity(activity));

        let allNodes = await StorageService.all('node')
        allNodes.forEach(node => {
            this.repopulateActivity(node)
            this.repopulateParent(node)
            this.cacheProject(node);
        });

        window.onblur = function (ev) {
            console.log("window.onblur");
        };
    }

    initializePanels() {
        this._activityLibrary.addListItems([...this._activityMap.values()])
        this._projectLibrary.addListItems([...this.projectMap.values()])
    }

    initializeHandlers() {
        this._playground.addEventListener('event-activity-created', this.eventActivityCreatedHandler.bind(this));
        this._playground.addEventListener('event-activity-updated', this.eventActivityUpdatedHandler.bind(this));                        // Any structural or property change at Activity level
        this._playground.addEventListener('response-activity-updated', this.responseActivityUpdatedHandler.bind(this));   // is changed activity in active viewing
        this._playground.addEventListener('response-activity-deleted', this.responseActivityDeletedHandler.bind(this));   // is changed activity in active viewing
        this._playground.addEventListener('event-nodes-selected', this.eventNodesSelectedHandler.bind(this));        // mouse click event
        this._playground.addEventListener('event-node-repositioned', this.eventNodeRepositionedHandler.bind(this));               // mouse movement event
        this._playground.addEventListener('event-nodes-connected', this.eventNodesConnectedHandler.bind(this));                      // onEdgeFinalized between nodes (user connects)
        // this._playground.addEventListener('event-project-removed', this.eventProjectRemovedHandler.bind(this));
        // this._playground.addEventListener('event-node-disconnected', this.eventNodeDisconnectedHandler.bind(this));

        this._properties.addEventListener('event-urn-changed', this.eventUrnChangedHandler.bind(this));
        this._properties.addEventListener('event-activity-updated', this.eventActivityUpdatedHandler.bind(this));  // activity property updates
        this._properties.addEventListener('event-node-updated', this.eventNodeUpdatedHandler.bind(this));  // activity property updates
        //    this._properties.addEventListener('event-activity-deleted', this.eventActivityDeletedHandler.bind(this));  // @todo - button to add
        //    this._properties.addEventListener('event-activity-locked', this.eventActivityLockedHandler.bind(this));  // @todo - button to add

        this._menu.addEventListener('event-add-activity', this.eventAddActivityHandler.bind(this));
        this._menu.addEventListener('event-clear-playground', this.eventClearPlaygroundHandler.bind(this));  // Event: 'event-clear-playground' - menu item selected to clear nodes from playground
        this._menu.addEventListener('define-node', this.eventDefineNodeHandler.bind(this));

        this._activityLibrary.addEventListener('event-project-created', this.eventProjectCreatedHandler.bind(this));
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
     * (C) indicates common methods between controllers (share code)
     *    -- playground --
     * eventActivityCreatedHandler       (C)  - popup create Activity (original event in menu starts playground popup)
     * eventActivityUpdatedHandler       (C)  - structure change
     * responseActivityUpdatedHandler         - does command to change particular Activity change our Playground view
     * responseActivityDeletedHandler         - does command to delete particular Activity change our Playground view
     * eventNodesSelectedHandler              - user selects Node in graph
     * eventNodeRepositionedHandler           - user repositioned Node
     * eventNodesConnectedHandler             - user connects two Nodes with an edge
     * eventProjectRemovedHandler  *          - user selected Root and hit 'delete'
     * eventNodeDisconnectedHandler  *        - user selected Node and hit 'delete'
     * 
     *    -- properties --
     * eventUrnChangedHandler            (C)  - URN field is changed
     * eventActivityUpdatedHandler       (C)  - user updates an Activity related field
     * eventNodeUpdatedHandler                - user updates a Node related field
     * eventActivityDeletedHandler  *         - user permanently deletes Activity
     * eventActivityLockedHandler   *         - user locks Activity against delete/updates
     * 
     *       -- menu --
     * eventAddActivityHandler                - user triggers Activity data entry
     * eventClearPlaygroundHandler            - user Clears Playground
     * 
     *  -- activity library --
     * eventProjectCreatedHandler           - user selects Activity for playground (creates Graph)
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


    async responseActivityUpdatedHandler( updatedActivity, projectNode) {
        console.log("3")
        console.log(JSON.stringify(updatedActivity,null,2));
        // The Event: Playground just alerted that the updated JAG we recieved is used by the showing Projects.
        // Need to update and save the adjusted Projects
        console.log(updatedActivity)
        console.log(updatedActivity)
        console.log(projectNode)
        console.log(JSON.stringify(projectNode,null,5))                          //  here good --- kids in node but gone in activity
        projectNode = this.updateTreeWithActivityChange(    updatedActivity, projectNode);
        console.log("quil dTake")
        console.log(JSON.stringify(projectNode, null, 2))
        await StorageService.update(projectNode, 'node');
        console.log("Local<< (new node affects project) \n")
    }




    async responseActivityDeletedHandler(event) {
        // The Event: Playground just alerted that an activity JAG has been deleted.
        // This can have a major impact on other JAGs and thus significantly affect the drawn nodes.
        // Need to update and save the adjusted Projects
        console.log("here we go")
        let projectId = event.detail.projectModelId; // could have used id
        console.log(projectId)
        let projectNode = this.fetchProject(projectId)
        console.log(projectNode)
        let deletedActivityUrn = event.detail.activityUrn;
        console.log(deletedActivityUrn)
        if (projectNode.urn == deletedActivityUrn) {
            await StorageService.delete(projectNode.id, 'node');
        } else {
            projectNode = this.updateTreeWithActivityChange(      deletedActivityUrn, projectNode)        /  vvvvvvvvvvvvvvvvvvvvvvvvvv
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
        nodeModel.x = event.detail.x;
        nodeModel.y = event.detail.y;
        //    await StorageService.update(movedItem,"node");                 // Is this worth the trouble - only cosmetic.
    }

    async eventNodesConnectedHandler(event) {            // only needed id's
        console.log("Local>> (local nodes joined - eventNodesConnectedHandler) ")

        let projectNodeId = event.detail.projectNodeId
        let parentNodeId = event.detail.parentNodeId
        let childNodeId = event.detail.childNodeId

       console.log(projectNodeId)
        console.log(parentNodeId)
        console.log(childNodeId)
        let projectModel = this.fetchProject(projectNodeId)
        let parentNodeModel =  this.searchTreeForId(projectModel,parentNodeId)
        let childNodeModel =  this.fetchProject(childNodeId)

        let updatedActivity = new Activity(parentNodeModel.activity)
        updatedActivity.addChild(childNodeModel.urn)


            // 1) CORRECT THE JAG ACTIVITY
  //tlg      parentNodeModel.addChild(childNodeModel)
  //tlg      this.repopulateParent(parentNodeModel)                                       // give node's children reference to parent
   //tlg     this.repopulateProject(childNodeModel, parentNodeModel.project)             // change project id for all new children
    //tlg    let newChildId = parentNodeModel.activity.addChild(childNodeModel.urn)   // Add child to parent's JAG and return child.id
  //tlg      childNodeModel.childId = newChildId                                         // set childId to distinguish child relationship
//tlg        event.detail.activity = parentNodeModel.activity;                                // localJagUpdateHandler wants the new Parent JAG
        event.detail.activity = updatedActivity;
        console.log("controllerAT - connectorHandler = this should have new activity but nothing else ")
        console.log(updatedActivity)
        await this.eventActivityUpdatedHandler(event)

        event.detail.nodeModelId = childNodeModel.id;
        await this.eventProjectDeletedHandler(event)
    }
    
    /**   -- Properties --  */


    async eventNodeUpdatedHandler(event) {
        let projectNode = null;
        const updatedNodeModel = event.detail.nodeModel;
        // This might not be necessarily the projectNode that is needed by Storage.
        // If its not the root, it needs to be inserted at the right place in the Project
        if (updatedNodeModel.id == updatedNodeModel.project) {
            projectNode = updatedNodeModel
        }
        else {
            projectNode = this.fetchProject(updatedNodeModel.project)
            projectNode.replaceChild(updatedNodeModel)
        }
        await StorageService.update(projectNode, 'node');
    }

    async eventActivityDeletedHandler(event) {
        console.log("Local>> (jag deleted) ")
        const deadActivityUrn = event.detail.activityUrn;
        for (let [activityId, activity] of this._activityMap) {
            if (activity.urn != deadActivityUrn) {
                let remainingChildren = activity.children.filter(kid => {
                    if (kid.urn != deadActivityUrn) {
                        return kid
                    }
                })
                if (remainingChildren.length < activity.children.length){
                    activity.children = remainingChildren;
                    await StorageService.update(activity, 'activity');
                }
            }
        }
        await StorageService.delete(deadActivityUrn, 'activity');
        console.log("Local<< (jag deleted) \n")
    }

    async eventActivityLockedHandler(event) {
        console.log("Local>> (jag locked) ")
        const lockedActivity = event.detail.activity;
        lockedActivity.isLocked = !lockedActivity.isLocked;
        await StorageService.update(lockedActivity, 'activity');
        console.log("Local<< (jag locked) \n")
    }

    /**   -- Menu --  */

    eventAddActivityHandler() {
        this._playground._handleNewActivityActivityPopup();         //@todo consider moving popupable to menu as well
    }

    eventClearPlaygroundHandler() {
        this._playground.clearPlayground();
    }

    eventDefineNodeHandler() {
      //  let origin = window.location.origin
        function openInNewTab(href) {
            console.log(window.location)
            Object.assign(document.createElement('a'), {
                target: '_blank',
                rel: 'noopener noreferrer',
                href: href,
            }).click();
        }
        let selectedNodes = this._playground.selectedNodes

        selectedNodes.forEach(selectedNode => {
            let projectId = selectedNode.project;
            let nodeId = selectedNode.id;
            openInNewTab("./node.html?project=" + projectId + "&node=" + nodeId)
        })
    }

    /**   -- Activity Library --  */

    async eventProjectCreatedHandler(event) {
        console.log("Local>> (Project created / library selected) ")
        const activitySelected = event.detail.activity;
        let newProjectRootNode = this.buildNodeTreeFromActivity(activitySelected);
        await StorageService.create(newProjectRootNode, "node");
        console.log("Local<< (Project created / library selected) \n")
    }
    
    /**   -- Project Library --  */

    async eventProjectSelectedHandler(event) {
        console.log("Local>> (project line item selected) ")
        const projectSelected = event.detail.projectModel;
        const expandRequested = event.detail.expanded;

        this._playground._rebuildNodeView(projectSelected)
        //  let childrenMap = this._getChildModels(activitySelected, new Map());  // @todo consider getChildArray (returns array/map) (one in parameter)
        //    let newProjectRootNode = this.buildNodeTreeFromActivity(projectSelected);
        //    await StorageService.create(newProjectRootNode, "node");
        console.log("Local<< (project line item selected) \n")
    }

    async eventProjectDeletedHandler(event) {
        console.log("Local>> (node deleted) ")
        const deadNodeModelId = event.detail.nodeModelId;
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

    commandActivityCreatedHandler(createdActivity, createdActivityUrn) {
        this.cacheActivity(createdActivity)
        UserPrefs.setDefaultUrnPrefixFromUrn(createdActivityUrn)
        this._activityLibrary.addListItem(createdActivity);                                   // Add Activity list item to Library
    }

    async commandActivityUpdatedHandler(updatedActivity, updatedActivityUrn) {
        console.log("((COMMAND INCOMING)) >> Activity Updated")
    //    this._playground.affectProjectView(updatedActivityUrn);         // Determine if JAG change affects our graph
                                                                        // @TODO maybe use new playground.viewedNodes to skip a step. (things work - so low priority)
        console.log("just back in from stroage)  should have activity kids")
        console.log(JSON.stringify(updatedActivity))

   //     let originalActivity = this.fetchActivity(updatedActivity.urn)
        this.cacheActivity(updatedActivity)
        console.log("++++++++++++++++++++++++ updated vs not+++++++++++( this was good )+++++++++???++++++++++")
        console.log(JSON.stringify(updatedActivity))

        for (let viewedNode of this._playground.viewedNodes )  {
            if (viewedNode.isActivityInProject(updatedActivityUrn)) {
                console.log("2")
                console.log(JSON.stringify(updatedActivity))
                await this.responseActivityUpdatedHandler(updatedActivity, viewedNode)
            }
        }
        this._properties.handleStorageUpdate(updatedActivity, updatedActivityUrn);   // change property window values if that one is changed in IA
        this._activityLibrary.updateItem(updatedActivity);
    }

    commandActivityDeletedHandler(deletedActivityUrn) {
        console.log("((COMMAND INCOMING)) >> Activity Deleted")
        this.uncacheActivity(deletedActivityUrn)
        this._playground.deleteActivity(deletedActivityUrn)
        this._activityLibrary.removeLibraryListItem(deletedActivityUrn)
    }

    commandActivityClonedHandler(clonedActivity, clonedActivityUrn) {
        UserPrefs.setDefaultUrnPrefixFromUrn(clonedActivityUrn)
        this._playground._addActivityNodeTree(clonedActivity, clonedActivityUrn)
    }

    commandActivityReplacedHandler(newActivity, replacedActivityUrn) {
        //  UserPrefs.setDefaultUrnPrefixFromUrn(newActivity.urn)
        this._playground.replaceActivityNode(newActivity, replacedActivityUrn)
        this._activityLibrary.replaceItem(newActivity, replacedActivityUrn)                   // Replace Activity list item in activityLibrary
    }

    commandNodeCreatedHandler(createdNodeModel, createdNodeId) { /// this coming in is no good
        console.log("((COMMAND INCOMING) >>  Node Created")
        this.repopulateParent(createdNodeModel)
        this.repopulateActivity(createdNodeModel);
        this.repopulateProject(createdNodeModel, createdNodeModel.id)
        this.cacheProject(createdNodeModel)
        this._projectLibrary.addListItem(createdNodeModel);                                        // Add Activity list item to Library
        this._playground.addNodeModel(createdNodeModel)
        //   this._playground.createActivityNode(createdNodeModel, true);                        // default expand tree = true
    }

    commandNodeUpdatedHandler(updatedNodeModel, updatedNodeId) {
        console.log("((COMMAND INCOMING) >>  Node Updated " + updatedNodeModel.urn + " / " + updatedNodeId)

        //let projectNode = this.fetchProject(updatedNodeModel.project)
       // console.log(JSON.stringify(projectNode))
        this.repopulateParent(updatedNodeModel)
        this.repopulateActivity(updatedNodeModel)
        this.repopulateProject(updatedNodeModel,updatedNodeModel.project)
        console.log("THE FINAL AFTER ADDING --- THIS IS GOING TO CACHE AFTER REPOPULATES")
        console.log(JSON.stringify(updatedNodeModel))
        console.log(updatedNodeModel)
        this.cacheProject(updatedNodeModel)

        this._playground._rebuildNodeView(updatedNodeModel)
        this._projectLibrary.updateItem(updatedNodeModel)
        this._projectLibrary.updateStructureChange(Array.from(this.projectMap.values()))
        console.log("HALFWAY ---- ")
        console.log(JSON.stringify(updatedNodeModel,null,3))
            console.log(updatedNodeModel)
        console.log("Where is activity annd parent?")
        // update playground
    }

    commandNodeDeletedHandler(deletedNodeId) {
        console.log("((COMMAND INCOMING) >>  Node Deleted")
        this.uncacheProject(deletedNodeId)
        this._playground.deleteNodeModel(deletedNodeId)
        this._projectLibrary.removeNodeLibraryListItem(deletedNodeId)
    }

    /**
     *                                  Support Functions
     * buildNodeTreeFromActivity   Build node tree given root activity
     *
     *
     *
     */



    updateProject(currentNode, projectId) {
        currentNode.project = projectId
        currentNode.children.forEach(child => this.updateProject(child))
    }





    async localJagDisconnectedHandler(event){              //localActivityNodeCleared?
        console.log("Local>> (local nodes disjoined) ")
        let changingActivity = event.detail.activityUrn
        let leavingJagChild = event.detail.activityChild

        let projectRoot = this.fetchProject(leavingNodeModel.project)
        this.repopulateParent(projectRoot)
        let losingParents = leavingNodeModel.parent;
        let losingParentsJag = this.fetchActivity(losingParents.urn)
        let remainingChildren = losingParentsJag.children.filter(entry => {
            if (entry.id != leavingNodeModel.childId) {
                return entry;
            }
        })
        losingParentsJag.children = remainingChildren
        await StorageService.update(losingParentsJag, 'activity');
        console.log("Local<< (local nodes disjoined) \n")
    }





}