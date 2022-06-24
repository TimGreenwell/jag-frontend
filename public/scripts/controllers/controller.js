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
import UserPrefs from "../utils/user-prefs.js";

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
        return this._activityMap(activityId)
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
        return this._projectMap(projectId)
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


    async eventActivityCreatedHandler(event) {
        console.log("Local>> (local activity created) ")
        const newActivity = new Activity(event.detail.activityConstruct);
        if (InputValidator.isValidUrn(newActivity.urn)) {
            await StorageService.create(newActivity, 'activity');
        } else {
            window.alert("Invalid URN");
        }
        console.log("Local<< (local activity created) \n")
    }

    async eventActivityUpdatedHandler(event) {                                       // Store and notify 'Updated JAG'
        console.log("Local>> (local activity updated) ")
        const updatedActivity = event.detail.activity;
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

    updateTreeWithActivityChange(projectNode, activityUrn) {

        const nodeStack = [];
        const orphanedRootStack = [];
        nodeStack.push(projectNode);
        while (nodeStack.length > 0) {
            let currentNode = nodeStack.pop();
            if ((activityUrn == undefined) || (currentNode.urn == activityUrn)) {
                if (activityUrn == undefined) {
                    console.log("Not  bad - this happens when the precide URN of change is not know.  For example, a rebuild from an archive or fresh pull")
                }
                let existingKids = currentNode.children.map(node => {
                    return {urn: node.urn, id: node.childId}
                })
                let validActivity = (this._activityMap.has(currentNode.urn)) ? this._activityMap.get(currentNode.urn) : [];
                let validKids = validActivity.children
                currentNode.activity = validActivity;
                let kidsToAdd = this.getChildrenToAdd(existingKids, validKids);
                let kidsToRemove = this.getChildrenToRemove(existingKids, validKids);

                kidsToAdd.forEach(child => {
                    const childActivity = this._activityMap.get(child.urn);
                    const childNodeModel = new NodeModel({urn: childActivity.urn, is_root: false});
                    childNodeModel.activity = childActivity
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
        return projectNode;
        console.log("Local<< (new node affects project) \n")

    }





}