/**
 *
 * JAG - Authoring Tool
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

    constructor () {
        super();
        this._menu = null;
        this._activityLibrary = null;
        this._projectLibrary = null;
        this._playground = null;
        this._properties = null;

        StorageService.subscribe(`command-activity-created`, this.commandActivityCreatedHandler.bind(this));   //    }
        StorageService.subscribe(`command-activity-updated`, this.commandActivityUpdatedHandler.bind(this));   // (a)}
        StorageService.subscribe(`command-activity-deleted`, this.commandActivityDeletedHandler.bind(this));   // (a)} All from observable
        StorageService.subscribe(`command-activity-cloned`, this.commandActivityClonedHandler.bind(this));     //    } Cross-tab communications
        StorageService.subscribe(`command-activity-replaced`, this.commandActivityReplacedHandler.bind(this)); //    }
        StorageService.subscribe(`command-node-created`, this.commandNodeCreatedHandler.bind(this)); // }
        StorageService.subscribe(`command-node-updated`, this.commandNodeUpdatedHandler.bind(this)); // }
        StorageService.subscribe(`command-node-deleted`, this.commandNodeDeletedHandler.bind(this)); // }
    }

    set menu (value) {
        this._menu = value;
    }
    set activityLibrary (value) {
        this._activityLibrary = value;
    }
    set projectLibrary (value) {
        this._projectLibrary = value;
    }
    set playground (value) {
        this._playground = value;
    }
    set properties (value) {
        this._properties = value;
    }

    async initialize () {
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache () {
        let allActivities = await StorageService.all(`activity`);
        allActivities.forEach(activity => {
            this.cacheActivity(activity);
        });

        let allNodes = await StorageService.all(`node`);
        allNodes.forEach(node => {
            this.repopulateActivity(node);
            this.repopulateParent(node);
            this.cacheProject(node);
        });

        window.onblur = function (ev) {
            console.log(`window.onblur`);
        };
    }

    initializePanels () {
        this._activityLibrary.addListItems([...this._activityMap.values()]);
        let rootOnly = [...this.projectMap.values()].filter(node => {
            return node.isRoot();
        });
        this._projectLibrary.addListItems(rootOnly);
    }

    initializeHandlers () {
        this._playground.addEventListener(`event-activity-created`, this.eventActivityCreatedHandler.bind(this));           // 'Create Activity' Popup initiated by Menu
        this._playground.addEventListener(`event-activity-updated`, this.eventActivityUpdatedHandler.bind(this));           // Any structural change to nodes affects Activities
        this._playground.addEventListener(`event-node-updated`, this.eventNodeUpdatedHandler.bind(this));                   // Node isExpanded property changed
        this._playground.addEventListener(`event-nodes-selected`, this.eventNodesSelectedHandler.bind(this));               // mouse clicks on nodes
        this._playground.addEventListener(`event-node-repositioned`, this.eventNodeRepositionedHandler.bind(this));         // mouse movement event
        this._playground.addEventListener(`event-nodes-connected`, this.eventNodesConnectedHandler.bind(this));             // onEdgeFinalized between nodes (user connects)
        this._playground.addEventListener(`event-playground-clicked`, this.eventPlaygroundClickedHandler.bind(this));       // user deselects by clicking background
        this._playground.addEventListener(`event-import-jag`, this.eventImportJagHandler.bind(this));                       // popup to import JAG JSON

        this._properties.addEventListener(`event-activity-updated`, this.eventActivityUpdatedHandler.bind(this));           // Activity property updates
        this._properties.addEventListener(`event-node-updated`, this.eventNodeUpdatedHandler.bind(this));                   // Node property updates (contextual)
        this._properties.addEventListener(`event-export-jag`, this.eventExportJagHandler.bind(this));                       // button to export JAG and Activities to file
        this._properties.addEventListener(`event-promote-project`, this.eventPromoteProjectHandler.bind(this));             // button to promote node to Jag (root)
        this._properties.addEventListener(`event-urn-changed`, this.eventUrnChangedHandler.bind(this));                     // URN changed - rename or clone actions

        this._menu.addEventListener(`event-add-activity`, this.eventAddActivityHandler.bind(this));                         // menu item: call 'Create Activity' popup
        this._menu.addEventListener(`event-clear-playground`, this.eventClearPlaygroundHandler.bind(this));                 // menu item: clear nodes from playground
        this._menu.addEventListener(`event-define-node`, this.eventDefineNodeHandler.bind(this));                           // menu item: open Define Node tab(s) using selected node(s)
        this._menu.addEventListener(`event-redraw-nodes`, this.eventRedrawNodesHandler.bind(this));                         // menu item: auto-place nodes @todo still not pretty
        this._menu.addEventListener(`event-popup-importer`, this.eventPopupImporterHandler.bind(this));                     // menu item: call 'Import Jag' popup

        this._activityLibrary.addEventListener(`event-activity-selected`, this.eventActivitySelectedHandler.bind(this));    // Clicking Activity instantiates Node in playground
        this._activityLibrary.addEventListener(`event-activity-deleted`, this.eventActivityDeletedHandler.bind(this));      // Permanently delete Activity
        this._activityLibrary.addEventListener(`event-activity-locked`, this.eventActivityLockedHandler.bind(this));        // 'Lock' Activity (restrict deletes and renames)

        this._projectLibrary.addEventListener(`event-project-selected`, this.eventProjectSelectedHandler.bind(this));       // Project chosen for playground
        this._projectLibrary.addEventListener(`event-project-deleted`, this.eventProjectDeletedHandler.bind(this));         // Permanently delete a project
        this._projectLibrary.addEventListener(`event-project-locked`, this.eventProjectLockedHandler.bind(this));           // 'Lock' Project (restrict deletes and updates)
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
     *
     *    -- playground --
     * eventActivityCreatedHandler    (a) (C) - popup create Activity (original event in menu starts playground popup)
     * eventActivityUpdatedHandler    (a) (C) - structure change
     * eventNodeUpdatedHandler            (a) - Node isExpanded property changed
     * eventNodesSelectedHandler              - user selects Node in graph
     * eventNodeRepositionedHandler           - user repositioned Node
     * eventNodesConnectedHandler        (a)  - user connects two Nodes with an edge
     * eventPlaygroundClickedHandler     (a)  - user selects node
     * eventImportJagHandler             (a)  - popup import JAG JSON
     *
     *    -- properties --
     * eventUrnChangedHandler            (C)  - URN field is changed
     * eventActivityUpdatedHandler       (C)  - user updates an Activity related field
     * eventNodeUpdatedHandler   (Playground) - user updates a Node related field
     * eventExportJagHandler                  - button to export JAG and Activities to file
     * eventPromoteProjectHandler        (a)  - button to promote node to Jag (root)
     * eventUrnChangedHandler         (a)(C)  - URN field is changed
     *
     *       -- menu --
     * eventAddActivityHandler                - menu item: call 'Create Activity' popup
     * eventClearPlaygroundHandler            - menu item: clear nodes from playground
     * eventDefineNodeHandler                 - menu item: open Define Node tab(s) using selected node(s)
     * eventRedrawNodesHandler                - menu item: auto-place nodes @todo still not pretty
     * eventPopupImporterHandler              - menu item: call 'Import Jag' popup
     *
     *  -- activity library --
     * eventActivitySelectedHandler       (a) - user selects Activity for playground (creates Graph)
     * eventActivityDeletedHandler        (a) - user permanently deletes Activity
     * eventActivityLockedHandler         (a) - user locks Activity against delete/updates
     *
     *   -- project library --
     * eventProjectSelectedHandler        (a) - user selects Graph for playground (recovers Graph)
     * eventProjectDeletedHandler         (a) - user permanently deletes Graph
     * eventProjectLockedHandler          (a) - user locks Graph against delete/updates
     *
     */

    /**   -- Playground --  */

    // eventActivityCreatedHandler --- hosted by common controller.

    // eventActivityUpdatedHandler --- hosted by common controller.

    async eventNodeUpdatedHandler (event) {
        let projectNode = null;
        const updatedNodeModel = event.detail.nodeModel;
        console.log(`-->`);
        console.log(updatedNodeModel);
        console.log(updatedNodeModel.parentId);
     //   if (updatedNodeModel.id == updatedNodeModel.projectId) {
        if (!updatedNodeModel.parentId) {  // Not same as root... this handles the root node of tree that has just been claimed by another project.  (parent comes next step)
            projectNode = updatedNodeModel;
        } else {


            projectNode = this.fetchProject(updatedNodeModel.projectId);
            console.log(`Starting JSON`);
            console.log(JSON.stringify(projectNode));
            projectNode.replaceChild(updatedNodeModel);
            console.log(`Ending JSON`);
            console.log(JSON.stringify(projectNode));
        }
        await StorageService.update(projectNode, `node`);
    }


    eventNodesSelectedHandler (event) {
        this._properties.handleSelectionUpdate(event.detail.selectedNodeArray);
        //ide.handleSelectionUpdate(e.detail);
    }

    eventNodeRepositionedHandler (event) {
        event.stopPropagation();
        let nodeModel = event.detail.nodeModel;
        nodeModel.x = event.detail.x;
        nodeModel.y = event.detail.y;
        //    await StorageService.update(movedItem,"node");                 // Is this worth the trouble - only cosmetic.
    }

    async eventNodesConnectedHandler (event) {            // only needed id's
        let projectNodeId = event.detail.projectNodeId;
        let parentNodeId = event.detail.parentNodeId;
        let childNodeId = event.detail.childNodeId;

        let projectModel = this.fetchProject(projectNodeId);
        let parentNodeModel = this.searchTreeForId(projectModel, parentNodeId);
        parentNodeModel.isExpanded = true;

        console.log(`{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{`);
        console.log(parentNodeId);
        console.log(parentNodeModel);

        let childNodeModel = this.fetchProject(childNodeId);
        console.log(`Local>> (Adopting - Project ${projectModel.name} assimilating node ${childNodeModel.name}) `);
        if (this.loopDetection(projectModel, parentNodeModel, childNodeModel)) {
            alert(`That node join results in an infinite loop problem - please consider an alternative design`);
            this._playground._rebuildNodeView(projectModel);
        } else {

//conn

            let childId = parentNodeModel.activity.addChild(childNodeModel.urn);
            parentNodeModel.addChild(childNodeModel);
            childNodeModel.parent = null;
            childNodeModel.parentId = null;  ///         This changed because of the extra revesre step in AddChild. Change that then fix this.

            this.repopulateProject(parentNodeModel, projectNodeId);
            childNodeModel.childId = childId;  // this could also be done later.. ok here

            event.detail.nodeModel = childNodeModel;      // update the child - this will set up this node as a non-root.
            console.log(childNodeModel + `--`);
            await this.eventNodeUpdatedHandler(event);

            event.detail.activity = parentNodeModel.activity;
            await this.eventActivityUpdatedHandler(event);

        }
    }



    async eventPlaygroundClickedHandler (event) {
        if (event.detail.unselectedNodeArray) {
            for (let node of event.detail.unselectedNodeArray) {
                await StorageService.update(node, `node`);
            }
        }

        this._properties.handleSelectionUnselected();
    }

    async eventImportJagHandler (event) {
        console.log(`Importing as JSON - `);
        let json = event.detail.result;
        let jsonDescriptor = JSON.parse(json);
        let activities = jsonDescriptor.activities;
        let jags = jsonDescriptor.jags;
        for (let activity of activities) {
            let activityModel = Activity.fromJSON(activity);
            let fullActivityModel = new Activity(activityModel);
            await StorageService.create(fullActivityModel, `activity`);
        }
        for (let jag of jags) {
            let jagModel = await NodeModel.fromJSON(jag);
            let fullJagModel = new NodeModel(jagModel);
            await StorageService.create(fullJagModel, `node`);
        }
    }



    /**   -- Properties --  */

    // eventUrnChangedHandler --- hosted by common controller.
    // eventActivityUpdatedHandler --- hosted by common controller.
    // eventNodeUpdatedHandler --- common with 'playground' handler

    eventExportJagHandler (event) {
        let node = event.detail.node;
        let descendantUrns = this.gatherDescendentUrns(node);
        let neededActivities = descendantUrns.map(urn => {
            let activityModel = this.fetchActivity(urn);
            let activityJson = JSON.stringify(activityModel.toJSON(), null, 4);
            return activityJson;
        });
        const jagJson = JSON.stringify(node.toJSON(), null, 4);
        let fileData = `{"activities" : [${neededActivities}], "jags" : [${jagJson}]}`;

        const a = document.createElement(`a`);
        const data = `data:application/json,${encodeURI(fileData)}`;
        a.href = data;
        a.download = `${node.activity.name}.json`;
        a.click();
    }

    async eventPromoteProjectHandler (event) {
        let newProject = event.detail.node;
        let newNode = new NodeModel(newProject);
        this.relocateProject(newNode, 0, 200);
        this.repopulateProject(newNode, newProject.id);
        this.repopulateParent(newNode);
        await StorageService.create(newNode, `node`);
    }

    /**   -- Menu --  */

    eventAddActivityHandler () {
        this._playground._handleNewActivityActivityPopup();         //@todo consider moving popupable to menu as well  ( double agree) iaMenu as well
    }

    eventClearPlaygroundHandler () {
        this._playground.clearPlayground();
    }

    eventDefineNodeHandler () {
        //  let origin = window.location.origin
        function openInNewTab (href) {
            Object.assign(document.createElement(`a`), {
                target: `_blank`,
                rel: `noopener noreferrer`,
                href: href,
            }).click();
        }

        let selectedNodes = this._playground.selectedNodes;

        selectedNodes.forEach(selectedNode => {
            let projectId = selectedNode.projectId;
            let nodeId = selectedNode.id;
            openInNewTab(`./node.html?project=` + projectId + `&node=` + nodeId);
        });
    }

    eventRedrawNodesHandler () {
        this._playground.redrawSelectedNodes();
    }

    eventPopupImporterHandler () {
        // This just calls the popup to get the data.  That result calls:eventImportJagHandler
        this._playground._eventImportJagHandler();
    }

    /**   -- Activity Library --  */


    async eventActivityDeletedHandler (event) {
        // Scan every activity to see if it contains a child which matches the deleted activity.
        // If match found, remove that child from the parent and signal update on the parent.
        console.log(`Local>> (jag deleted) `);
        const deadActivityUrn = event.detail.activityUrn;
        for (let [activityId, activity] of this._activityMap) {
            //      if (activity.urn != deadActivityUrn) {
            let remainingChildren = activity.children.filter(kid => {
                if (kid.urn != deadActivityUrn) {
                    return kid;
                }
            });
            if (remainingChildren.length < activity.children.length) {
                activity.children = remainingChildren;
                await StorageService.update(activity, `activity`);
            }
            //  }
        }
        await StorageService.delete(deadActivityUrn, `activity`);
    }

    async eventActivityLockedHandler (event) {
        console.log(`Local>> (jag locked) `);
        const lockedActivity = event.detail.activity;
        lockedActivity.isLocked = !lockedActivity.isLocked;
        await StorageService.update(lockedActivity, `activity`);
    }


    async eventActivitySelectedHandler (event) {
        console.log(`Local>> (Activity selected / Activity list item selected) `);
        const activitySelected = event.detail.activity;
        const isExpanded = event.detail.isExpanded;
        let newProjectRootNode = this.buildNodeTreeFromActivity(activitySelected, isExpanded);

        this.repopulateParent(newProjectRootNode);
        this.repopulateActivity(newProjectRootNode);
        this.repopulateProject(newProjectRootNode, newProjectRootNode.id);
        newProjectRootNode.leafCount = newProjectRootNode.leafcounter();

        await StorageService.create(newProjectRootNode, `node`);
       // this._playground._buildNodeViewFromNodeModel(newProjectRootNode)
        this._playground._rebuildNodeView(newProjectRootNode);
    }


    /**   -- Project Library --  */

    async eventProjectSelectedHandler (event) {
        console.log(`Local>> (project line item selected) `);
        const projectSelected = event.detail.projectModel;
        const expandRequested = event.detail.isExpanded;
        projectSelected.isExpanded = expandRequested;
        this._playground._rebuildNodeView(projectSelected);
        //  let childrenMap = this._getChildModels(activitySelected, new Map());  // @todo consider getChildArray (returns array/map) (one in parameter)
        //    let newProjectRootNode = this.buildNodeTreeFromActivity(projectSelected);
        //    await StorageService.create(newProjectRootNode, "node");
    }

    async eventProjectDeletedHandler (event) {
        console.log(`Local>> (node deleted) `);
        const deadNodeModelId = event.detail.nodeModelId;
        await StorageService.delete(deadNodeModelId, `node`);

    }

    async eventProjectLockedHandler (event) {
        console.log(`Local>> (node locked) `);
        const lockedNodeModel = event.detail.nodeModel;
        lockedNodeModel.isLocked = !lockedNodeModel.isLocked;
        await StorageService.update(lockedNodeModel, `node`);
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

    commandActivityCreatedHandler (createdActivity, createdActivityUrn) {
        this.cacheActivity(createdActivity);
        UserPrefs.setDefaultUrnPrefixFromUrn(createdActivityUrn);
        this._activityLibrary.addListItem(createdActivity);
        this.cacheActivity(createdActivity);
    }

    // async commandActivityUpdatedHandler(updatedActivity, updatedActivityUrn) {
    //     this.cacheActivity(updatedActivity)
    //     for (let viewedProject of this._playground.viewedProjects) {
    //         if (viewedProject.isActivityInProject(updatedActivityUrn)) {
    //             let updatedProject = this.updateTreeWithActivityChange(updatedActivity, viewedProject);
    //             await StorageService.update(updatedProject, 'node');
    //         }
    //     }
    //     this._properties.handleStorageUpdate(updatedActivity, updatedActivityUrn);   // change property window values if that one is changed in IA
    //     this._activityLibrary.updateItem(updatedActivity);
    // }

    async commandActivityDeletedHandler (deletedActivityUrn) {
        // If the deleted Activity is the Project's root, then the Project is deleted.
        // @TODO is this a good rule?  Deleting a project for Activity delete is severe.
        console.log(`((COMMAND INCOMING)) >> Activity Deleted`);
        let deletedActivity = this.fetchActivity(deletedActivityUrn);
        this.uncacheActivity(deletedActivityUrn);
        for (let viewedProject of this._playground.viewedProjects) {
            if (viewedProject.id == deletedActivityUrn) {
                await StorageService.delete(viewedProject, `node`);
            }
        }
        this._activityLibrary.removeLibraryListItem(deletedActivityUrn);
    }

    commandActivityClonedHandler (clonedActivity, clonedActivityUrn) {
        UserPrefs.setDefaultUrnPrefixFromUrn(clonedActivityUrn);
        this._playground._addActivityNodeTree(clonedActivity, clonedActivityUrn);
    }

    commandActivityReplacedHandler (newActivity, replacedActivityUrn) {
        //  UserPrefs.setDefaultUrnPrefixFromUrn(newActivity.urn)
        this._playground.replaceActivityNode(newActivity, replacedActivityUrn);
        this._activityLibrary.replaceItem(newActivity, replacedActivityUrn);                   // Replace Activity list item in activityLibrary
    }

    commandNodeCreatedHandler (createdNodeModel, createdNodeId) { /// this coming in is no good
        console.log(`((COMMAND INCOMING) >>  Node Created`);
        this.repopulateParent(createdNodeModel);
        this.repopulateActivity(createdNodeModel);
        this.repopulateProject(createdNodeModel, createdNodeModel.id);
        createdNodeModel.leafCount = createdNodeModel.leafcounter();
        this.cacheProject(createdNodeModel);
        this._projectLibrary.addListItem(createdNodeModel);                                        // Add Activity list item to Library
     //   this._playground.addNodeModel(createdNodeModel)
    }

    async commandActivityUpdatedHandler (updatedActivity, updatedActivityUrn) {
        this.cacheActivity(updatedActivity);
        for (let viewedProject of this._playground.viewedProjects) {
            if (viewedProject.isActivityInProject(updatedActivityUrn)) {
                let updatedProject = this.updateTreeWithActivityChange(updatedActivity, viewedProject);
                await StorageService.update(updatedProject, `node`);
            }
        }
        this._properties.handleStorageUpdate(updatedActivity, updatedActivityUrn);   // change property window values if that one is changed in IA
        this._activityLibrary.updateItem(updatedActivity);
    }
//au


    commandNodeUpdatedHandler (updatedNodeModel, updatedNodeId) {
        console.log(`((COMMAND INCOMING) >>  Node Updated ` + updatedNodeModel.urn + ` / ` + updatedNodeId);

        this.repopulateParent(updatedNodeModel);
        this.repopulateActivity(updatedNodeModel);
        this.repopulateProject(updatedNodeModel, updatedNodeModel.projectId);
        updatedNodeModel.leafCount = updatedNodeModel.leafcounter();
        this.cacheProject(updatedNodeModel);

        this._playground._rebuildNodeView(updatedNodeModel);
        this._projectLibrary.updateItem(updatedNodeModel);
     //   this._projectLibrary.updateStructureChange(Array.from(this.projectMap.values()))
        // update playground
    }
    //nu

    commandNodeDeletedHandler (deletedNodeId) {
        this.uncacheProject(deletedNodeId);
        this._playground.deleteNodeModel(deletedNodeId);
        this._projectLibrary.removeNodeLibraryListItem(deletedNodeId);
    }

    /**
     *                                  Support Functions
     *
     * buildNodeTreeFromActivity   (c)   Build node tree given root activity
     * gatherDescendentUrns              Build set of all child urns
     * gatherAncestorUrns                Build set of direct ancestor urns
     * loopDetection                     -> No URN exists as both descendant and ancestor (feedback detection)
     *
     */

    gatherDescendentUrns (childNodeModel, workStack = []) {   // need this in nodes
        workStack.push(childNodeModel.urn);
        childNodeModel.children.forEach(child => {
            this.gatherDescendentUrns(child, workStack);
        });
        return workStack;
    }

    gatherAncestorUrns (projectModelId, parentModelId) {
        let urnStack = [];
        let projectNode = this.fetchProject(projectModelId);
        do {
            let checkNode = projectNode.findChildById(parentModelId);
            urnStack.push(checkNode.urn);
            parentModelId = checkNode.parentId;
        } while (parentModelId != undefined);
        return urnStack;
    }

    loopDetection (projectModel, parentNodeModel, childNodeModel) {
        let descendentStack = this.gatherDescendentUrns(childNodeModel);
        let ancestorStack = this.gatherAncestorUrns(projectModel.id, parentNodeModel.id);
        let intersection = descendentStack.filter(x => ancestorStack.includes(x));
        return (intersection.length > 0);
    }

}