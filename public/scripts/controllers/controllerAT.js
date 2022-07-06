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
//const fs = require('fs')

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
        this._playground.addEventListener('event-activity-created', this.eventActivityCreatedHandler.bind(this));           // 'Create Activity' Popup initiated by Menu
        this._playground.addEventListener('event-activity-updated', this.eventActivityUpdatedHandler.bind(this));           // Any structural change to nodes affects Activities
        this._playground.addEventListener('event-nodes-selected', this.eventNodesSelectedHandler.bind(this));               // mouse clicks on nodes
        this._playground.addEventListener('event-node-repositioned', this.eventNodeRepositionedHandler.bind(this));         // mouse movement event
        this._playground.addEventListener('event-nodes-connected', this.eventNodesConnectedHandler.bind(this));             // onEdgeFinalized between nodes (user connects)
        this._playground.addEventListener('event-playground-clicked', this.eventPlaygroundClickedHandler.bind(this));
        this._playground.addEventListener('event-import-jag', this.eventImportJagHandler.bind(this));                       // onEdgeFinalized between nodes (user connects)
        this._playground.addEventListener('event-node-updated', this.eventNodeUpdatedHandler.bind(this));                   // Node expanded property changed

        // this._playground.addEventListener('event-project-removed', this.eventProjectRemovedHandler.bind(this));
        // this._playground.addEventListener('event-node-disconnected', this.eventNodeDisconnectedHandler.bind(this));

        this._properties.addEventListener('event-urn-changed', this.eventUrnChangedHandler.bind(this));
        this._properties.addEventListener('event-activity-updated', this.eventActivityUpdatedHandler.bind(this));           // Activity property updates
        this._properties.addEventListener('event-node-updated', this.eventNodeUpdatedHandler.bind(this));                   // Node property updates (contextual)
        this._properties.addEventListener('event-export-jag', this.eventExportJagHandler.bind(this));
        this._properties.addEventListener('event-promote-project', this.eventPromoteProjectHandler.bind(this));
        //    this._properties.addEventListener('event-activity-deleted', this.eventActivityDeletedHandler.bind(this));     // @todo - button to add
        //    this._properties.addEventListener('event-activity-locked', this.eventActivityLockedHandler.bind(this));       // @todo - button to add

        this._menu.addEventListener('event-add-activity', this.eventAddActivityHandler.bind(this));                         // menu item: call 'Create Activity' popup
        this._menu.addEventListener('event-clear-playground', this.eventClearPlaygroundHandler.bind(this));                 // menu item: clear nodes from playground
        this._menu.addEventListener('event-define-node', this.eventDefineNodeHandler.bind(this));                           // menu item: open Define Node tab(s) using selected node(s)
        this._menu.addEventListener('event-redraw-nodes', this.eventRedrawNodesHandler.bind(this));                          // menu item: auto-place nodes @todo still not pretty
        this._menu.addEventListener('event-popup-importer', this.eventPopupImporterHandler.bind(this));                          // menu item:

        this._activityLibrary.addEventListener('event-project-created', this.eventProjectCreatedHandler.bind(this));        // Clicking Activity instantiates Node in playground
        this._activityLibrary.addEventListener('event-activity-deleted', this.eventActivityDeletedHandler.bind(this));      // Permanently delete Activity
        this._activityLibrary.addEventListener('event-activity-locked', this.eventActivityLockedHandler.bind(this));        // 'Lock' Activity (restrict deletes and renames)

        this._projectLibrary.addEventListener('event-project-selected', this.eventProjectSelectedHandler.bind(this));      // Project chosen for playground
        this._projectLibrary.addEventListener('event-project-deleted', this.eventProjectDeletedHandler.bind(this));        // Permanently delete a project
        this._projectLibrary.addEventListener('event-project-locked', this.eventProjectLockedHandler.bind(this));          // 'Lock' Project (restrict deletes and updates)

    }

    eventPopupImporterHandler() {
        // This just calls the popup to get the data.  That result calls:eventImportJagHandler
        this._playground._eventImportJagHandler();
    }


    eventExportJagHandler(event) {
        let node = event.detail.node
        let descendantUrns = this.gatherDescendentUrns(node);
        let neededActivities = descendantUrns.map(urn => {
            let activityModel = this.fetchActivity(urn)
            let activityJson = JSON.stringify(activityModel.toJSON(), null, 4);
            return activityJson
        })
        const jagJson = JSON.stringify(node.toJSON(), null, 4);
        let fileData = `{"activities" : [${neededActivities}], "jag" : ${jagJson}}`

        const a = document.createElement('a');
        const data = `data:application/json,${encodeURI(fileData)}`;
        a.href = data;
        a.download = `${node.activity.name}.json`;
        a.click();
    }


    async eventPromoteProjectHandler(event) {
        let newProject = event.detail.node;
        this.relocateProject(newProject, 0, 200)
        this.repopulateProject(newProject, newProject.id)
        this.repopulateParent(newProject)
        await StorageService.create(newProject, "node")
    }

    async eventImportJagHandler(event) {
        let json = event.detail.result
        let jsonDescriptor = JSON.parse(json)

        let activities = jsonDescriptor.activities;
        let jag = jsonDescriptor.jag;

        for (let activity of activities) {
            //     console.log(activity)
            let activityModel = Activity.fromJSON(activity)
            //       console.log(activityModel)
            let fullActivityModel = new Activity(activityModel)
            //       console.log(fullActivityModel)
            await StorageService.create(fullActivityModel, "activity")
        }

        let projectNode = await NodeModel.fromJSON(jag)
        await StorageService.create(projectNode, "node")
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
     //* responseActivityUpdatedHandler         - does command to change particular Activity change our Playground view
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

    // eventActivityCreatedHandler --- hosted by common controller.

    // eventActivityUpdatedHandler --- hosted by common controller.


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

        let projectModel = this.fetchProject(projectNodeId)
        let parentNodeModel = this.searchTreeForId(projectModel, parentNodeId)
        let childNodeModel = this.fetchProject(childNodeId)

        if (this.loopDetection(projectModel, parentNodeModel, childNodeModel)) {
            alert("That node join results in an infinite loop problem - please consider an alternative design")
            this._playground._rebuildNodeView(projectModel)
        } else {
            let childId = parentNodeModel.activity.addChild(childNodeModel.urn)
            event.detail.activity = parentNodeModel.activity;

            // Note: Normally, adding a child to an activity invokes a new child creation.  However,
            // in this case, there is already a child to 'adopt'.
            // options: clone child, attach it to parent and delete the original (keeps others in sync)
            // option2: attach child, then delete project number and hope that doesnt affect the kid
            let losingProjectId = childNodeModel.project;

            parentNodeModel.addChild(childNodeModel);
            this.repopulateProject(parentNodeModel, projectNodeId)
            childNodeModel.parent = parentNodeModel;
            childNodeModel.childId = childId;

            await this.eventActivityUpdatedHandler(event)
            event.detail.nodeModelId = losingProjectId
            await this.eventProjectDeletedHandler(event)
        }
    }

    eventPlaygroundClickedHandler() {
        this._properties.handleSelectionUnselected()
    }


    /**   -- Properties --  */

    // eventUrnChangedHandler --- hosted by common controller.
    // eventActivityUpdatedHandler --- hosted by common controller.

    async eventNodeUpdatedHandler(event) {
        // If the updated node (in event) is the project root, then StorageService the node.
        // Otherwise, insert the node in the right place in the project and StorageService the project root.
        let projectNode = null;
        const updatedNodeModel = event.detail.nodeModel;
        if (updatedNodeModel.id == updatedNodeModel.project) {
            projectNode = updatedNodeModel
        } else {
            projectNode = this.fetchProject(updatedNodeModel.project)
            projectNode.replaceChild(updatedNodeModel)
        }
        await StorageService.update(projectNode, 'node');
    }

    async eventActivityDeletedHandler(event) {
        // Scan every activity to see if it contains a child which matches the deleted activity.
        // If match found, remove that child from the parent and signal update on the parent.
        console.log("Local>> (jag deleted) ")
        const deadActivityUrn = event.detail.activityUrn;
        for (let [activityId, activity] of this._activityMap) {
            //      if (activity.urn != deadActivityUrn) {
            let remainingChildren = activity.children.filter(kid => {
                if (kid.urn != deadActivityUrn) {
                    return kid
                }
            })
            if (remainingChildren.length < activity.children.length) {
                activity.children = remainingChildren;
                await StorageService.update(activity, 'activity');
            }
            //  }
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

    eventRedrawNodesHandler() {
        this._playground.redrawSelectedNodes();

    }


    /**   -- Activity Library --  */

    async eventProjectCreatedHandler(event) {
        console.log("Local>> (Project created / library selected) ")
        const activitySelected = event.detail.activity;
        const expanded = event.detail.expanded;
        let newProjectRootNode = this.buildNodeTreeFromActivity(activitySelected, expanded);
        await StorageService.create(newProjectRootNode, "node");
        console.log("Local<< (Project created / library selected) \n")
    }

    /**   -- Project Library --  */

    async eventProjectSelectedHandler(event) {
        console.log("Local>> (project line item selected) ")
        const projectSelected = event.detail.projectModel;
        const expandRequested = event.detail.expanded;
        projectSelected.expanded = expandRequested;
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
        this._activityLibrary.addListItem(createdActivity);
        this.cacheActivity(createdActivity)
    }

    async commandActivityUpdatedHandler(updatedActivity, updatedActivityUrn) {
        this.cacheActivity(updatedActivity)
        for (let viewedProject of this._playground.viewedProjects) {
            if (viewedProject.isActivityInProject(updatedActivityUrn)) {
                let updatedProject = this.updateTreeWithActivityChange(updatedActivity, viewedProject);
                await StorageService.update(updatedProject, 'node');
            }
        }
        this._properties.handleStorageUpdate(updatedActivity, updatedActivityUrn);   // change property window values if that one is changed in IA
        this._activityLibrary.updateItem(updatedActivity);
    }


    async commandActivityDeletedHandler(deletedActivityUrn) {
        // If the deleted Activity is the Project's root, then the Project is deleted.
        // @TODO is this a good rule?  Deleting a project for Activity delete is severe.
        console.log("((COMMAND INCOMING)) >> Activity Deleted")
        let deletedActivity = this.fetchActivity(deletedActivityUrn)
        this.uncacheActivity(deletedActivityUrn)
        for (let viewedProject of this._playground.viewedProjects) {
            if (viewedProject.id == deletedActivityUrn) {
                await StorageService.delete(viewedProject, 'node');
            } else {
                console.log(viewedProject.id)
                console.log(deletedActivityUrn)
                console.log("(((((((((((((((((())))))))))))))))))))))")
                console.log("(((((((((((((((((())))))))))))))))))))))")
                console.log("(((((((((((((((((())))))))))))))))))))))")
                console.log("(((((((((((((((((())))))))))))))))))))))")
                console.log('I dont think its possibel to get here')
                console.log("(((((((((((((((((())))))))))))))))))))))")
                console.log("(((((((((((((((((())))))))))))))))))))))")
                console.log("(((((((((((((((((())))))))))))))))))))))")
                console.log("(((((((((((((((((())))))))))))))))))))))")
            }
        }
        this._activityLibrary.removeLibraryListItem(deletedActivityUrn)
    }

    // async responseActivityDeletedHandler(event) {
    //     // The Event: Playground just alerted that an activity JAG has been deleted.
    //     // This can have a major impact on other JAGs and thus significantly affect the drawn nodes.
    //     // Need to update and save the adjusted Projects
    //     console.log("Local>> (deleted Activity affects Viewed Project) \n")
    //     let projectId = event.detail.projectModelId; // could have used id
    //     let projectNode = this.fetchProject(projectId)
    //     let deletedActivityUrn = event.detail.activityUrn;
    //     if (projectNode.urn == deletedActivityUrn) {
    //         await StorageService.delete(projectNode.id, 'node');
    //     } else {
    //         projectNode = this.updateTreeWithActivityChange(      deletedActivityUrn, projectNode)
    //         await StorageService.update(projectNode, 'node');
    //     }
    // }
    //
    //


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
        createdNodeModel.leafCount = createdNodeModel.leafcounter()
        this.cacheProject(createdNodeModel)
        this._projectLibrary.addListItem(createdNodeModel);                                        // Add Activity list item to Library
        this._playground.addNodeModel(createdNodeModel)
        //   this._playground.createActivityNode(createdNodeModel, true);                        // default expand tree = true
    }

    commandNodeUpdatedHandler(updatedNodeModel, updatedNodeId) {
        console.log("((COMMAND INCOMING) >>  Node Updated " + updatedNodeModel.urn + " / " + updatedNodeId)

        this.repopulateParent(updatedNodeModel)
        this.repopulateActivity(updatedNodeModel)
        this.repopulateProject(updatedNodeModel, updatedNodeModel.project)
        updatedNodeModel.leafCount = updatedNodeModel.leafcounter()
        this.cacheProject(updatedNodeModel)

        this._playground._rebuildNodeView(updatedNodeModel)
        this._projectLibrary.updateItem(updatedNodeModel)
        this._projectLibrary.updateStructureChange(Array.from(this.projectMap.values()))
        // update playground
    }

    commandNodeDeletedHandler(deletedNodeId) {
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


    gatherDescendentUrns(childNodeModel, workStack = []) {   // need this in nodes
        workStack.push(childNodeModel.urn);
        childNodeModel.children.forEach(child => {
            this.gatherDescendentUrns(child, workStack)
        })
        return workStack;
    }

    gatherAncestorUrns(projectModelId, parentModelId) {
        let urnStack = []
        let projectNode = this.fetchProject(projectModelId)
        do {
            let checkNode = projectNode.findChildById(parentModelId)
            urnStack.push(checkNode.urn)
            parentModelId = checkNode.parentId;
        } while (parentModelId != undefined);
        return urnStack;
    }


    loopDetection(projectModel, parentNodeModel, childNodeModel) {
        let descendentStack = this.gatherDescendentUrns(childNodeModel);
        let ancestorStack = this.gatherAncestorUrns(projectModel.id, parentNodeModel.id)
        let intersection = descendentStack.filter(x => ancestorStack.includes(x));
        if (intersection.length > 0) {
            return true
        } else {
            return false
        }
    }

    async localJagDisconnectedHandler(event) {              //localActivityNodeCleared?
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