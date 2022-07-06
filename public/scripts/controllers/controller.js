/**
 *
 * JAG - Authoring Tool
 *
 *
 * @author IHMC
 * @version 0.02
 */

'use strict';

import Activity from "../models/activity.js";
import NodeModel from "../models/node.js";
import StorageService from "../services/storage-service.js";
import InputValidator from "../utils/validation.js";
import CellModel from "../models/cell.js";

export default class Controller extends EventTarget {

    constructor() {
        super();
        this._activityMap = new Map();         // All Activitys - should be in sync with storage
        this._projectMap = new Map();        // All nodes - should be in sync with storage
        this._analysisMap = new Map();
        this._currentAnalysis = undefined;       // type: AnalysisModel

    }

    get activityMap() {
        return this._activityMap;
    }

    set activityMap(newActivityMap) {
        this._activityMap = newActivityMap;
    }

    uncacheActivity(activityId) {
        this._activityMap.delete(activityId)
    }

    cacheActivity(activity) {
        this._activityMap.set(activity.urn, activity)
    }

    fetchActivity(activityId) {
        return this._activityMap.get(activityId)
    }

    get projectMap() {
        return this._projectMap;
    }

    set projectMap(newProjectMap) {
        this._projectMap = newProjectMap;
    }

    uncacheProject(projectId) {
        this._projectMap.delete(projectId)
    }

    cacheProject(project) {
        this._projectMap.set(project.id, project)
    }

    fetchProject(projectId) {
        return this._projectMap.get(projectId)
    }


    get analysisMap() {
        return this._analysisMap;
    }

    set analysisMap(newAnalysisMap) {
        this._analysisMap = newAnalysisMap;
    }

    uncacheAnalysis(analysisId) {
        this._analysisMap.delete(analysisId)
    }

    cacheAnalysis(analysis) {
        this._analysisMap.set(analysis.id, analysis)
    }

    fetchAnalysis(analysisId) {
        return this._analysisMap(analysisId)
    }

    get currentAnalysis() {
        return this._currentAnalysis;
    }

    set currentAnalysis(value) {
        this._currentAnalysis = value;
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
 *  These Handlers were identical across multiple tabs
 *   eventActivityCreatedHandler       (C)  - popup create Activity (original event in menu starts playground popup)
 *   eventActivityUpdatedHandler       (C)  - structure change
 *   eventUrnChangedHandler            (C)  - URN field is changed
 */


async eventActivityCreatedHandler(event) {
    console.log("Local>> (local activity created) ")
    let activityConstruct = event.detail.activityConstruct;
    if (!this.activityMap.has(activityConstruct.urn)) {
        const newActivity = new Activity(event.detail.activityConstruct);
        newActivity.createdDate = Date.now();
        if (InputValidator.isValidUrn(newActivity.urn)) {
            await StorageService.create(newActivity, 'activity');
        } else {
            window.alert("Invalid URN");
        }
    } else {
        window.alert("That URN already exists")
    }
    console.log("Local<< (local activity created) \n")
}

    async eventActivityUpdatedHandler(event) {                                       // Store and notify 'Updated JAG'
        console.log("Local>> (local activity updated) ")
        const updatedActivity = event.detail.activity;               // Locally updated Activity - uncached.
        updatedActivity.modifiedDate = Date.now();
        console.log("Here...")
        console.log(updatedActivity)
        await StorageService.update(updatedActivity, 'activity');
        console.log("Local<< (local activity updated) \n")
    }

    async eventUrnChangedHandler(event) {
        const originalUrn = event.detail.originalUrn;
        const newUrn = event.detail.newUrn;

        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newUrn + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newUrn + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isLocked' tag.
        // URN changes are renames until the Activity is marked as 'isLocked'.
        // After 'isLocked', URN changes are copies.

        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(newUrn);
        if (isValid) {
            let originalActivity = await StorageService.get(originalUrn, 'activity');  // needed to check if 'isLocked'
            let urnAlreadyBeingUsed = await StorageService.has(newUrn, 'activity');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isLocked ?? ? idk
                    let newActivity = await StorageService.get(originalUrn, 'activity');

                    // is the target Activity locked?
                    if (newActivity.isLocked) {
                        // FAIL  - CANT OVERWRITE LOCKED Activity
                    } else // target Activity is NOT locked

                    { // is the original Activity locked?
                        if (originalActivity.isLocked) {
                            await StorageService.clone(originalUrn, newUrn, 'activity');
                        } else { /// the original Activity is not locked
                            await StorageService.replace(originalUrn, newUrn, 'activity')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING Activity
                }
            } else {  // urn not already being used
                // is the original Activity locked?
                if (originalActivity.isLocked) {
                    await this.cloneActivity(originalActivity, newUrn)
                } else {/// the original Activity is not locked
                    await StorageService.replace(originalUrn, newUrn, 'activity');
                }
            }
        }
        console.log("Local<< (url renamed) \n")
    }


    /**
     *
     *                Support Methods
     */

   // changedActivity, projectNode
    updateTreeWithActivityChange(changedActivity, projectNode) {
        console.log(changedActivity)
        console.log(projectNode)
        const nodeStack = [];
        const orphanedRootStack = [];
        nodeStack.push(projectNode);
        while (nodeStack.length > 0) {
            let currentNode = nodeStack.pop();
            if ((changedActivity.urn == undefined) || (currentNode.urn == changedActivity.urn)) {
                if (changedActivity.urn == undefined) {
                    console.log("Not  bad - this happens when the precide URN of change is not know.  For example, a rebuild from an archive or fresh pull")
                }
                let existingNodeChildren = currentNode.children.map(child => {
                  return {urn: child.urn, id: child.childId}
                })
                let validNodeChildren = changedActivity.children;
                let kidsToAdd = this.getChildrenToAdd(existingNodeChildren, validNodeChildren);
                console.log(kidsToAdd)
                let kidsToRemove = this.getChildrenToRemove(existingNodeChildren, validNodeChildren);
                console.log(kidsToRemove)
                kidsToAdd.forEach(child => {
                    // 1) get newly created activity from map. 2) Create Node
                    const childActivity = this.fetchActivity(child.urn);
                    const childNodeModel = new NodeModel({urn: childActivity.urn, is_root: false});
                    childNodeModel.activity = childActivity
                    childNodeModel.childId = child.id;  // Give the child the 'childId' that was listed in the Parent's Jag children.  (separated them from other children of same urn)
                    childNodeModel.parent = currentNode
                    this.repopulateProject(childNodeModel, projectNode.project)
                    currentNode.addChild(childNodeModel);
                })

                kidsToRemove.forEach(child => {
                    let childNodeModel = this.searchTreeForChildId(projectNode, child.id)    //currentNode.getChildById(child.id)
                    currentNode.removeChild(childNodeModel);
                    orphanedRootStack.push(childNodeModel);


                })

            }
            for (const child of currentNode.children) {
                nodeStack.push(child);
            }
        }
        for (let orphanedRootNode of orphanedRootStack) {
            // Assigning orphans to a separate tree.
            // Save the tree to keep it, or don't to have it disappear.
            console.log("orphan")
            console.log(orphanedRootNode)
            orphanedRootNode.parent = orphanedRootNode.id;
            orphanedRootNode.childId = null;
            this.repopulateProject(orphanedRootNode, orphanedRootNode.id)
        }
        return projectNode;
        console.log("Local<< (new node affects project) \n")

    }

    buildCellTreeFromActivityUrn(newRootActivityUrn) {
        const nodeStack = [];
        const resultStack = [];
        const rootActivity = this.fetchActivity(newRootActivityUrn);
        const rootCellModel = new CellModel({urn: rootActivity.urn, is_root: true});
        rootCellModel.activity = rootActivity
        rootCellModel.parentUrn = null;
        rootCellModel.rootUrn = newRootActivityUrn;
        nodeStack.push(rootCellModel);
        while (nodeStack.length > 0) {
            let currentNode = nodeStack.pop();
            for (const child of currentNode.activity.children) {
                let childActivity = this.fetchActivity(child.urn);
                // @TODO - add try/catch in case not in cache/storage (new Activity)
                const childCellModel = new CellModel({urn: childActivity.urn, is_root: false});
                childCellModel.activity = childActivity
                childCellModel.childId = child.id;
                childCellModel.parentUrn = currentNode.urn
                childCellModel.rootUrn = newRootActivityUrn;
                currentNode.addChild(childCellModel, true);
                nodeStack.push(childCellModel);
            }
            resultStack.push(currentNode);
        }
        const returnNode = resultStack.shift();
        return returnNode;
    }

    buildNodeTreeFromActivity(rootActivity, expanded) {

        const nodeStack = [];
        const resultStack = [];
      //  const rootActivity = this.fetchActivity(newRootActivityUrn); /// I could have just passed in the Model...instead of switching to urn and back.
        const rootNodeModel = new NodeModel({urn: rootActivity.urn});
        rootNodeModel.activity = rootActivity;
        rootNodeModel.parentUrn = null;
        rootNodeModel.project = rootNodeModel.id;
        rootNodeModel.expanded = expanded;
        nodeStack.push(rootNodeModel);
        while (nodeStack.length > 0) {
            let currentNode = nodeStack.pop();
            for (const child of currentNode.activity.children) {
                let childActivity = this.fetchActivity(child.urn);
                // @TODO - add try/catch in case not in cache/storage (new Activity)
                const childNodeModel = new NodeModel({urn: child.urn, childId: child.id});
                childNodeModel.activity = childActivity
                childNodeModel.childId = child.id;
                childNodeModel.parentId = currentNode.id;
                childNodeModel.project = currentNode.project
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        const returnNode = resultStack.shift();
        return returnNode;
    }

    getChildrenToAdd(existingKids, validKids) {                               //originalActivity, updatedActivity) {
        const returnValue = validKids.filter(validKid => !existingKids.find(existingKid => JSON.stringify(validKid) === JSON.stringify(existingKid)))
        return returnValue
    }

    getChildrenToRemove(existingKids, validKids) {                               //originalActivity, updatedActivity) {
        const returnValue = existingKids.filter(existingKid => !validKids.find(validKid => JSON.stringify(existingKid) === JSON.stringify(validKid)))
        return returnValue
    }


    searchTreeForId(treeNode,id) {
        let workStack = []
        console.log("LOGGY")
        console.log(treeNode)
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

    removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }


    repopulateActivity(currentNode) {
        currentNode.activity = this.fetchActivity(currentNode.urn)
        for (let child of currentNode.children) {
            this.repopulateActivity(child)
        }
    }

    repopulateParent(currentNode) {
        for (let child of currentNode.children) {
            child.parent = currentNode;
            child.parentId = currentNode.id
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


    relocateProject(currentNode, deltaX, deltaY){
        currentNode.x = currentNode.x + deltaX
        currentNode.y = currentNode.y + deltaY
            for (let child of currentNode.children) {
                this.relocateProject(child, deltaX, deltaY)
            }
        }


}