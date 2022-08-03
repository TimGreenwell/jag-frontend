/**
 *
 * JAG - Common Controller
 * The common controller contains the code that would normally be present in two or more of the other controllers.
 * This generally includes event-initiated handlers and a few support methods.
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
        this._activityMap = new Map();       // Activity cache
        this._projectMap = new Map();        // Node cache
        this._analysisMap = new Map();       // Analysis cache
        this._currentAnalysis = undefined;   // type: AnalysisModel
    }

    get activityMap() {
        return this._activityMap;
    }

    set activityMap(newActivityMap) {
        this._activityMap = newActivityMap;
    }

    uncacheActivity(activityId) {
        this._activityMap.delete(activityId);
    }

    cacheActivity(activity) {
        this._activityMap.set(activity.urn, activity);
    }

    fetchActivity(activityId) {
        return this._activityMap.get(activityId);
    }

    get projectMap() {
        return this._projectMap;
    }

    set projectMap(newProjectMap) {
        this._projectMap = newProjectMap;
    }

    uncacheProject(projectId) {
        this._projectMap.delete(projectId);
    }

    cacheProject(project) {
        this._projectMap.set(project.id, project);
        project.children.forEach((child) => {
            this.cacheProject(child);
        });
    }

    fetchProject(projectId) {
        const cachedProject = this._projectMap.get(projectId);
        if (!cachedProject) {
            console.log(`Could not find the node ${projectId}. Expect some issues.  We should be going to DB at this point`);
        }
        return cachedProject;
    }


    get analysisMap() {
        return this._analysisMap;
    }

    set analysisMap(newAnalysisMap) {
        this._analysisMap = newAnalysisMap;
    }

    uncacheAnalysis(analysisId) {
        this._analysisMap.delete(analysisId);
    }

    cacheAnalysis(analysis) {
        this._analysisMap.set(analysis.id, analysis);
    }

    fetchAnalysis(analysisId) {
        return this._analysisMap(analysisId);
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
        const activityConstruct = event.detail.activityConstruct;
        console.log(`\nLocal>> (Activity ${activityConstruct.urn} creating) `);
        if (this.activityMap.has(activityConstruct.urn)) {
            window.alert(`That URN already exists`);
        } else {
            const newActivity = new Activity(event.detail.activityConstruct);
            newActivity.createdDate = Date.now();
            if (InputValidator.isValidUrn(newActivity.urn)) {
                await StorageService.create(newActivity, `activity`);
            } else {
                window.alert(`Invalid URN`);
            }
        }
    }

    async eventActivityUpdatedHandler(event) {                                       // Store and notify 'Updated JAG'
        const updatedActivity = event.detail.activity;               // Locally updated Activity - uncached.
        console.log(`\nLocal>> (Activity ${updatedActivity.urn} updating) `);
        updatedActivity.modifiedDate = Date.now();
        await StorageService.update(updatedActivity, `activity`);
    }

    async eventUrnChangedHandler(event) {
        const originalUrn = event.detail.originalUrn;
        const newUrn = event.detail.newUrn;

        const URL_CHANGED_WARNING_POPUP = `The URN has changed. Would you like to save this model to the new URN (${newUrn})? (URN cannot be modified except to create a new model.)`;
        const URL_RENAME_WARNING_POPUP = `The new URN (${newUrn}) is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)`;
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isLocked' tag.
        // URN changes are renames until the Activity is marked as 'isLocked'.
        // After 'isLocked', URN changes are copies.

        //  Is it a valid URN?
        const isValid = InputValidator.isValidUrn(newUrn);
        if (isValid) {
            const originalActivity = await StorageService.get(originalUrn, `activity`);  // needed to check if 'isLocked'
            const urnAlreadyBeingUsed = await StorageService.has(newUrn, `activity`);
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isLocked ?? ? idk
                    const newActivity = await StorageService.get(originalUrn, `activity`);

                    // is the target Activity locked?
                    if (newActivity.isLocked) {
                        // FAIL  - CANT OVERWRITE LOCKED Activity
                    } else { // target Activity is NOT locked
                        // is the original Activity locked?
                        if (originalActivity.isLocked) {
                            await StorageService.clone(originalUrn, newUrn, `activity`);
                        } else { // / the original Activity is not locked
                            await StorageService.replace(originalUrn, newUrn, `activity`);
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING Activity
                }
            } else {  // urn not already being used
                // is the original Activity locked?
                if (originalActivity.isLocked) {
                    await this.cloneActivity(originalActivity, newUrn);
                } else { // / the original Activity is not locked
                    await StorageService.replace(originalUrn, newUrn, `activity`);
                }
            }
        }
    }


    /**
     *
     *                Support Methods
     *
     *      updateTreeWithActivityChange - update properties and look for updates/deletes to incorporate
     *      buildCellTreeFromActivityUrn - build activity tree from root node
     *      buildNodeTreeFromActivity    - build node tree from Activity Model & initial Expanded option.
     *      getChildrenToAdd             - compares activity children to node children to determine adds needed
     *      getChildrenToRemove          - compares activity children to node children to determine deletes needed
     *      searchTreeForId              - return node by id
     *      searchTreeForChildId         - return node by childID
     *
     *      removeAllChildNodes          - generic tree - remove children from parent (1 level deep)
     *      repopulateActivity           - attach Activity Object (@todo maybe better to just use repeated cache/storage access)
     *      repopulateParent             - re-parent nodes after structure change
     *      relocateProject              - re-assign projectId after structure change
     *
     */


    updateTreeWithActivityChange(changedActivity, projectNode) {
        const nodeStack = [];
        const orphanedRootStack = [];
        nodeStack.push(projectNode);
        while (nodeStack.length > 0) {
            const currentNode = nodeStack.pop();
            if ((changedActivity.urn == undefined) || (currentNode.urn == changedActivity.urn)) {
                if (changedActivity.urn == undefined) {
                    console.log(`Not  bad - this happens when the precide URN of change is not know.  For example, a rebuild from an archive or fresh pull`);
                }
                const existingNodeChildren = currentNode.children.map((child) => {
                    return {
                        urn: child.urn,
                        id: child.childId
                    };
                });
                const validNodeChildren = changedActivity.children;
                const kidsToAdd = this.getChildrenToAdd(existingNodeChildren, validNodeChildren);
                console.log(`Kids to add: ${kidsToAdd.length}`);
                const kidsToRemove = this.getChildrenToRemove(existingNodeChildren, validNodeChildren);
                console.log(`Kids to remove: ${kidsToRemove.length}`);

                kidsToAdd.forEach((child) => {
                    // 1) get newly created activity from map. 2) Create Node
                    const childActivity = this.fetchActivity(child.urn);
                    const childNodeModel = new NodeModel();
                    childNodeModel.urn = childActivity.urn;
                    childNodeModel.activity = childActivity;
                    childNodeModel.childId = child.id;  // Give the child the 'childId' that was listed in the Parent's Jag children.  (separated them from other children of same urn)
                    childNodeModel.parent = currentNode;
                    this.repopulateProject(childNodeModel, projectNode.projectId);
                    currentNode.addChild(childNodeModel);
                });

                kidsToRemove.forEach((child) => {
                    const childNodeModel = this.searchTreeForChildId(projectNode, child.id);    // currentNode.getChildById(child.id)
                    currentNode.removeChild(childNodeModel);
                    orphanedRootStack.push(childNodeModel);
                });
            }
            for (const child of currentNode.children) {
                nodeStack.push(child);
            }
        }
        for (const orphanedRootNode of orphanedRootStack) {
            // Assigning orphans to a separate tree.
            // Save the tree to keep it, or don't to have it disappear.
            orphanedRootNode.parent = orphanedRootNode.id;
            orphanedRootNode.childId = null;
            this.repopulateProject(orphanedRootNode, orphanedRootNode.id);
        }
        return projectNode;
    }

    buildCellTreeFromActivityUrn(newRootActivityUrn) {
        const nodeStack = [];
        const resultStack = [];
        const rootActivity = this.fetchActivity(newRootActivityUrn);
        const rootCellModel = new CellModel({
            urn: rootActivity.urn,
            jag: rootActivity,
            is_root: true
        });
        rootCellModel.activity = rootActivity;
        rootCellModel.parentUrn = null;
        rootCellModel.rootUrn = newRootActivityUrn;
        nodeStack.push(rootCellModel);
        while (nodeStack.length > 0) {
            const currentNode = nodeStack.pop();
            for (const child of currentNode.activity.children) {
                const childActivity = this.fetchActivity(child.urn);
                // @TODO - add try/catch in case not in cache/storage (new Activity)
                const childCellModel = new CellModel({
                    urn: childActivity.urn,
                    jag: childActivity,
                    is_root: false
                });
                childCellModel.activity = childActivity;
                childCellModel.childId = child.id;
                childCellModel.parentUrn = currentNode.urn;
                childCellModel.rootUrn = newRootActivityUrn;
                currentNode.addChild(childCellModel, true);
                nodeStack.push(childCellModel);
            }
            resultStack.push(currentNode);
        }
        const returnNode = resultStack.shift();
        return returnNode;
    }

    buildNodeTreeFromActivity(rootActivity, isExpanded) {
        const nodeStack = [];
        const resultStack = [];
        //  const rootActivity = this.fetchActivity(newRootActivityUrn); /// I could have just passed in the Model...instead of switching to urn and back.
        const rootNodeModel = new NodeModel();
        rootNodeModel.urn = rootActivity.urn;
        rootNodeModel.activity = rootActivity;
        rootNodeModel.parentUrn = null;
        rootNodeModel.projectId = rootNodeModel.id;
        rootNodeModel.isExpanded = isExpanded;
        nodeStack.push(rootNodeModel);
        while (nodeStack.length > 0) {
            const currentNode = nodeStack.pop();
            for (const child of currentNode.activity.children) {
                const childActivity = this.fetchActivity(child.urn);
                // @TODO - add try/catch in case not in cache/storage (new Activity)
                const childNodeModel = new NodeModel();

                childNodeModel.urn = child.urn;
                childNodeModel.childId = child.id;
                childNodeModel.activity = childActivity;
                childNodeModel.childId = child.id;
                childNodeModel.parentId = currentNode.id;
                childNodeModel.projectId = currentNode.projectId;
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        const returnNode = resultStack.shift();
        return returnNode;
    }

    getChildrenToAdd(existingKids, validKids) {                               // originalActivity, updatedActivity) {
        const returnValue = validKids.filter((validKid) => {
            return !existingKids.find((existingKid) => {
                return JSON.stringify(validKid) === JSON.stringify(existingKid);
            });
        });
        return returnValue;
    }

    getChildrenToRemove(existingKids, validKids) {                               // originalActivity, updatedActivity) {
        const returnValue = existingKids.filter((existingKid) => {
            return !validKids.find((validKid) => {
                return JSON.stringify(existingKid) === JSON.stringify(validKid);
            });
        });
        return returnValue;
    }

    searchTreeForId(treeNode, id) {
        const workStack = [];
        workStack.push(treeNode);
        while (workStack.length > 0) {
            const checkNode = workStack.pop();
            if (checkNode.id == id) {
                return checkNode;
            }
            checkNode.children.forEach((child) => {
                return workStack.push(child);
            });
        }
        return null;
    }

    searchTreeForChildId(treeNode, childId) {
        const workStack = [];
        workStack.push(treeNode);
        while (workStack.length > 0) {
            const checkNode = workStack.pop();
            if (checkNode.childId == childId) {
                return checkNode;
            }
            checkNode.children.forEach((child) => {
                return workStack.push(child);
            });
        }
        return null;
    }

    removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    repopulateActivity(currentNode) {
        currentNode.activity = this.fetchActivity(currentNode.urn);
        for (const child of currentNode.children) {
            this.repopulateActivity(child);
        }
    }

    repopulateParent(currentNode) {
        for (const child of currentNode.children) {
            child.parent = currentNode;
            child.parentId = currentNode.id;
            this.repopulateParent(child);
        }
    }

    repopulateProject(currentNode, projectId) {
        console.log(`setting ${currentNode.urn} from  ${currentNode.projectId} to ${projectId}`);
        currentNode.projectId = projectId;
        for (const child of currentNode.children) {
            this.repopulateProject(child, projectId);
        }
    }

    relocateProject(currentNode, deltaX, deltaY) {
        currentNode.x = currentNode.x + deltaX;
        currentNode.y = currentNode.y + deltaY;
        for (const child of currentNode.children) {
            this.relocateProject(child, deltaX, deltaY);
        }
    }

}
