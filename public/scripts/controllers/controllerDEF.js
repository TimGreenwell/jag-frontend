/**
 *
 * JAG - Authoring Tool
 *
 *
 * @author IHMC
 * @version 0.02
 */

'use strict';

import StorageService from "../services/storage-service.js";
import Controller from "./controller.js";

export default class ControllerDEF extends Controller {

    constructor(startProjectId = null, startNodeId = null) {
        super();
        this._currentProjectId = startProjectId;
        this._currentNodeId = startNodeId;
        this._menu = null;
        this._definition = null;

        StorageService.subscribe(`command-node-updated`, this.commandNodeUpdatedHandler.bind(this)); // }
        StorageService.subscribe(`command-node-deleted`, this.commandNodeDeletedHandler.bind(this)); // }
    }

    // Panel Setters
    set menu(value) {
        this._menu = value;
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
        let allActivities = await StorageService.all(`activity`);
        allActivities.forEach((activity) => {
            this.cacheActivity(activity);
        });

        let allProjects = await StorageService.all(`node`);
        allProjects.forEach((project) => {
            if (this._currentProjectId == project.id) {
                this.repopulateParent(project);
                this.repopulateActivity(project);
                this.repopulateProject(project, project.id);
                this.cacheProject(project);
            }
        });

        window.onblur = function (ev) {
            console.log(`window.onblur`);
        };
    }

    initializePanels() {
        let project = this.fetchProject(this._currentProjectId);
        let node = this.searchTreeForId(project, this._currentNodeId);
        this._definition.definingNode = node;
        this._definition.buildTestBank();
    }

    initializeHandlers() {
        this._menu.addEventListener(`event-execution-updated`, this.eventExecutionUpdatedHandler.bind(this));
        this._menu.addEventListener(`event-returns-updated`, this.eventReturnsUpdatedHandler.bind(this));
        this._menu.addEventListener(`event-operator-updated`, this.eventOperatorUpdatedHandler.bind(this));
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
     *    -- dashboard --
     *
     *       -- menu --
     * eventExecutionUpdatedHandler                - user selects Execution from dropdown
     * eventReturnsUpdatedHandler                  - user selects Returns from dropdown
     * eventOperatorUpdatedHandler                 - user selects Operator from dropdown
     *
     */

    /**   -- Dashboard --  */

    /**   -- Menu --  */
    eventExecutionUpdatedHandler() {

    }

    eventReturnsUpdatedHandler() {

    }

    eventOperatorUpdatedHandler(event) {
        let returns = event.detail.returns;
        let operator = event.detail.operator;
        this._definition._templateFunction(returns, operator);
    }

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
     * commandNodeUpdatedHandler
     * commandNodeDeletedHandler
     *
     */

    commandNodeUpdatedHandler(updatedProject, updatedProjectIdId) {
        console.log(`((COMMAND INCOMING) >>  Node Updated`);
        if (this._currentProjectId == updatedProjectIdId) {
            this.repopulateParent(updatedProject);
            this.repopulateActivity(updatedProject);
            this.repopulateProject(updatedProject, updatedProjectIdId);
            this.cacheProject(updatedProject);
            let node = this.searchTreeForId(updatedProject, this._currentNodeId);
            this._definition.reset(node);
        }
    }

    commandNodeDeletedHandler(deletedNodeId) {
        console.log(`((COMMAND INCOMING) >>  Node Deleted`);
        this.uncacheProject(deletedNodeId);
    }

    /**
     *                                  Support Functions
     *
     * searchTreeForId
     *
     */

    searchTreeForId(treeNode, id) {
        let workStack = [];
        workStack.push(treeNode);
        while (workStack.length > 0) {
            let checkNode = workStack.pop();
            if (checkNode.id == id) {
                return checkNode;
            }
            checkNode.children.forEach((child) => workStack.push(child));
        }
        return null;
    }

    // marked for death
    // searchTreeForChildId(treeNode,childId) {
    //     let workStack = []
    //     workStack.push(treeNode)
    //     while(workStack.length>0){
    //         let checkNode = workStack.pop();
    //         if (checkNode.childId == childId) {return checkNode}
    //         checkNode.children.forEach(child => workStack.push(child))
    //     }
    //     return null
    // }


    // marked for death
    // async localJagDisconnectedHandler(event){              //localActivityNodeCleared?
    //     console.log("Local>> (local nodes disjoined) ")
    //     let changingActivity = event.detail.activityUrn
    //     let leavingJagChild = event.detail.activityChild
    //
    //     let projectRoot = this.fetchProject(leavingNodeModel.projectId)
    //     this.repopulateParent(projectRoot)
    //     let losingParents = leavingNodeModel.parent;
    //     let losingParentsJag = this.fetchActivity(losingParents.urn)
    //     let remainingChildren = losingParentsJag.children.filter(entry => {
    //         if (entry.id != leavingNodeModel.childId) {
    //             return entry;
    //         }
    //     })
    //     losingParentsJag.children = remainingChildren
    //     await StorageService.update(losingParentsJag, 'activity');
    // }

}
