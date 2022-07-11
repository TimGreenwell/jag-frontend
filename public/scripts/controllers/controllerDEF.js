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
import Controller from "./controller.js";

export default class ControllerDEF extends Controller {

    constructor(startProjectId = null, startNodeId = null) {
        super();
        this._currentProjectId = startProjectId;
        this._currentNodeId = startNodeId;
        this._menu = null;
        this._events = null;
        this._subactivity = null;
        this._definition = null;

        // this._project = this.fetchProject(startProjectId)
        // this.node = this._project.findChildById(startNodeId)

        StorageService.subscribe("command-node-updated", this.commandNodeUpdatedHandler.bind(this)); // }
        StorageService.subscribe("command-node-deleted", this.commandNodeDeletedHandler.bind(this)); // }
    }

    set menu(value) {
        this._menu = value;
    }
    set subactivity(value) {
        this._subactivity = value;
    }
    set events(value) {
        this._events = value;
    }
    set definition(value) {
        this._definition = value;
    }


    async initialize() {
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache() {         //@TODO --- it might not be worth caching this -- might should just hit DB..

        let allActivities = await StorageService.all('activity')
        allActivities.forEach(activity => {
            this.cacheActivity(activity)
        });


        let allProjects = await StorageService.all('node')
        allProjects.forEach(project => {
            if (this._currentProjectId == project.id) {
                this.repopulateParent(project)
                this.repopulateActivity(project)
                this.repopulateProject(project, project.id)
                this.cacheProject(project)
            }
        });

        window.onblur = function (ev) {
            console.log("window.onblur");
        };
    }

    initializePanels() {

      let project = this.fetchProject(this._currentProjectId);

      let node = this.searchTreeForId(project,this._currentNodeId)
      this._definition.definingNode = node
      this._definition.buildTestBank()
    }

    initializeHandlers() {
        this._menu.addEventListener('event-execution-updated', this.eventExecutionUpdatedHandler.bind(this));
        this._menu.addEventListener('event-returns-updated', this.eventReturnsUpdatedHandler.bind(this));
        this._menu.addEventListener('event-operator-updated', this.eventOperatorUpdatedHandler.bind(this));
    }

    eventExecutionUpdatedHandler(){

    }
    eventReturnsUpdatedHandler(){

    }
    eventOperatorUpdatedHandler(event){
        let returns = event.detail.returns;
        let operator = event.detail.operator;
        this._definition._templateFunction(returns, operator)
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
    


    //
    // async responseActivityUpdatedHandler(event) {
    //     // The Event: Playground just alerted that the updated JAG we recieved is used by the showing Projects.
    //     // Need to update and save the adjusted Projects
    //     let projectId = event.detail.projectId; // could have used id
    //     let projectNode = this.fetchProject(projectId)
    //     let changedActivityUrn = event.detail.activityUrn;
    //     projectNode = this.updateTreeWithActivityChange(projectNode,changedActivityUrn);
    //     await StorageService.update(projectNode, 'node');
    //     console.log("Local<< (new node affects project) \n")
    // }


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


    commandNodeUpdatedHandler(updatedProject, updatedProjectIdId) {
        console.log("((COMMAND INCOMING) >>  Node Updated")
        if (this._currentProjectId == updatedProjectIdId) {
            this.repopulateParent(updatedProject)
            this.repopulateActivity(updatedProject)
            this.repopulateProject(updatedProject, updatedProjectIdId)
            this.cacheProject(updatedProject)
            let node = this.searchTreeForId(updatedProject,this._currentNodeId)
            this._definition.reset(node)
        }
    }

    commandNodeDeletedHandler(deletedNodeId) {
        console.log("((COMMAND INCOMING) >>  Node Deleted")
        this.uncacheProject(deletedNodeId)

    }

    /**
     *                                  Support Functions
     * buildNodeTreeFromActivity   Build node tree given root activity
     *
     *
     *
     */



    updateProject(currentNode, projectId) {
        currentNode.projectId = projectId
        currentNode.children.forEach(child => this.updateProject(child))
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

    async localJagDisconnectedHandler(event){              //localActivityNodeCleared?
        console.log("Local>> (local nodes disjoined) ")
        let changingActivity = event.detail.activityUrn
        let leavingJagChild = event.detail.activityChild

        let projectRoot = this.fetchProject(leavingNodeModel.projectId)
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