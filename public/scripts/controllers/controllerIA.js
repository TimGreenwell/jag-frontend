/**
 * @fileOverview Jag ControllerIA.
 *
 * @author IHMC
 * @version 0.01
 */

'use strict';

import InputValidator from "../utils/validation.js";
import StorageService from "../services/storage-service.js";
import JAGATValidation from "../utils/validation.js";
import NodeModel from "../models/cell.js";
import Activity from "../models/activity.js";
import AnalysisModel from "../models/analysis-model.js";
import TeamModel from "../models/team.js";
import AgentModel from "../models/agent.js";
import UserPrefs from "../utils/user-prefs.js";

export default class ControllerIA {

    constructor() {
        this._analysisLibrary = null;           // HTMLElement
        this._editor = null;                    // HTML Element
        this._iaTable = null;                   // HTMLElement extending Popupable

        this._activityMap = new Map();          // All JAGs - should be in sync with storage
        this._analysisModelMap = new Map();     // All analyses - should be in sync with storage
        this._currentAnalysis = undefined;      // type: AnalysisModel

        StorageService.subscribe("command-activity-created", this.commandActivityCreatedHandler.bind(this));
        StorageService.subscribe("command-activity-updated", this.commandActivityUpdatedHandler.bind(this));   // just blocking for now - troubleshooting
        StorageService.subscribe("command-activity-deleted", this.commandActivityDeletedHandler.bind(this));
        //StorageService.subscribe("command-activity-cloned", this.commandActivityClonedHandler.bind(this));
        //StorageService.subscribe("command-activity-replaced", this.commandActivityReplacedHandler.bind(this));
        StorageService.subscribe("command-analysis-created", this.commandAnalysisCreatedHandler.bind(this));
    }

    set analysisLibrary(value) {
        this._analysisLibrary = value;
    }
    set editor(value) {
        this._editor = value;
    }
    set iaTable(value) {
        this._iaTable = value;
    }

    get activityMap() {
        return this._activityMap;
    }
    set activityMap(newActivityMap) {
        this._activityMap = newActivityMap;
    }
    addActivity(activity) {
        this._activityMap.set(activity.urn, activity)
    }

    get analysisModelMap() {
        return this._analysisModelMap;
    }
    set analysisModelMap(value) {
        this._analysisModelMap = value;
    }
    addAnalysisModel(newAnalysisModel) {
        this._analysisModelMap.set(newAnalysisModel.id, newAnalysisModel)
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
        allActivities.forEach(activity => this.addActivity(activity))

        // @TODO need this?
        let allNodes = await StorageService.all('node')
        allNodes.forEach(node => {
            this.repopulateActivity(node)
            this.repopulateParent(node)
        });

        let allAnalyses = await StorageService.all('analysis')
        allAnalyses.forEach(analysis => this.addAnalysisModel(analysis))
    }

    initializePanels() {
        this._analysisLibrary.addListItems([...this._analysisModelMap.values()])
    }

    initializeHandlers() {
        this._iaTable.addEventListener('event-analysis-created', this.eventAnalysisCreatedHandler.bind(this));  // popup create
        this._iaTable.addEventListener('event-analysis-updated', this.eventAnalysisUpdatedHandler.bind(this));  // jag structure updates
        //this._iaTable.addEventListener('event-analysis-deleted', this.eventAnalysisDeletedHandler.bind(this));  // jag structure updates
        this._iaTable.addEventListener('event-node-addchild', this.eventNodeAddChildHandler.bind(this));  // '+' clicked on jag cell (technically undefined jag)         // does that really need to come up this far?
        this._iaTable.addEventListener('event-node-prunechild', this.eventNodePruneChildHandler.bind(this));
        this._iaTable.addEventListener('event-collapse-toggled', this.eventCollapseToggledHandler.bind(this));
        this._iaTable.addEventListener('event-urn-changed', this.eventUrnChangedHandler.bind(this));
        this._iaTable.addEventListener('event-activity-created', this.eventActivityCreatedHandler.bind(this));
        this._iaTable.addEventListener('event-activity-updated', this.eventActivityUpdatedHandler.bind(this));
        // this._iaTable.addEventListener('event-activity-deleted', this.eventJagDeletedHandler.bind(this));
        this._analysisLibrary.addEventListener('event-analysis-selected', this.eventAnalysisSelected.bind(this));

        //this.nodeModel.addEventListener('sync', this._syncViewToModel.bind(this));
    }

    //////////////////////////////////////////////////////////////////////////////////
    //////////  controllerIA - UPWARD Control  ///////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    /**
     *
     *                                     Upward Event Handlers
     *      'Upward handlers' refer to the process that starts at the initial event and ends at the submission of
     *      the resulting data for storage and distribution.
     *
     *      'initial event' = some user interaction or detected remote change that requires initiates another local action
     *      Data processing in this phase is minimal - it is primarily concerned with translating the initial
     *      event into a standard command that is understood across the application.
     *
     *      example: a user changing an Agent name will produce a standardized command to 'update Agent' to be
     *      stored and distributed.
     *
     * eventAnalysisCreatedHandler - requires createStandardAnalysis, displayAnalysis
     * eventAnalysisUpdatedHandler
     * eventAnalysisDeletedHandler  *
     * eventNodeAddChildHandler
     * eventNodePruneChildHandler
     * eventCollapseToggledHandler
     * eventUrnChangedHandler
     * eventActivityCreatedHandler
     * eventActivityUpdatedHandler
     * eventJagDeletedHandler       *
     * eventAnalysisSelected
     *
     */

    async eventAnalysisCreatedHandler(event) {
        let id = await this.createStandardAnalysis(event.detail.name, event.detail.rootUrn, "Popup")
    }

    async eventAnalysisUpdatedHandler(event) {
        let analysis = event.detail.analysis;
        await StorageService.update(event.detail.analysis, 'analysis');
    }

    async eventNodeAddChildHandler(event) {
        // This will not be permanent until a valid URN is set.  Not-persistant.
        //@todo push this back down into iaTable (from there - to there)
        let parentCell = event.detail.cell;
        this._currentAnalysis = this._iaTable._analysisModel;
        if (parentCell.canHaveChildren) {
            const childActivity = new Activity({urn: UserPrefs.getDefaultUrnPrefix(), name: ''})
            // Normally, we would pass this new Jag up for storage and distribution - however it is only temporary since it does
            // not yet have a valid URN or name.
            const childCell = new NodeModel({urn: childActivity.urn});
            childCell.activity = childActivity;
            childCell.parentUrn = parentCell.urn
            childCell.rootUrn = parentCell.rootUrn
            parentCell.addChild(childCell)
            this._iaTable.displayAnalysis(this._currentAnalysis);
        } else {
            alert("Node must first be assigned a valid URN")
        }
    }

    async eventNodePruneChildHandler(event) {
        // A Prune (or any delete) is a potentially significant change.
        // Going to just update parent.  Actually prune node?
        // After a quick check we are not pruning the head.

        let parentActivityUrn = event.detail.node.parent.urn
        let childActivityUrn = event.detail.node.urn
        let parentActivity = this._activityMap.get(parentActivityUrn)
        let childActivity = this._activityMap.get(childActivityUrn)
        let parentActivityChildren = parentActivity.children;

        let index = 0;
        let found = false;
        while ((index < parentActivityChildren.length) && (!found)) {
            if (parentActivityChildren[index].urn === childActivity.urn) {
                parentActivityChildren.splice(index, 1);
                found = true;
            } else {
                ++index
            }
        }
        parentActivity.children = parentActivityChildren;
        await StorageService.update(parentActivity, "jag")
    }

    eventCollapseToggledHandler(event) {
        let eventDetail = event.detail;
        let node = eventDetail.node;
        node.toggleCollapse();             //  -- think this is going to be moved to an Analysis array if we want it saved.
        // just initialize tree would be nice - but think it needs to start from scratch.
        // earlier version of this just call a 'layout'event - whats that?
        this._iaTable.analysisView.layout();
    }

    async eventUrnChangedHandler(event) {
        let eventDetail = event.detail;
        let originalUrn = eventDetail.originalUrn;
        let newUrn = eventDetail.newUrn;
        await this.updateURN(originalUrn, newUrn)
    }

    async eventActivityCreatedHandler(event) {
        let activity = new Activity(event.detail.activity);
        await StorageService.create(activity, 'activity');
    }

    async eventActivityUpdatedHandler(event) {
        await StorageService.update(event.detail.activity, 'activity');
    }

    async eventAnalysisSelected(event) {
        this._currentAnalysis = event.detail.model;
        this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromActivityUrn(this._currentAnalysis.rootUrn);
        this._iaTable.displayAnalysis(this._currentAnalysis);
        this._editor.team = event.detail.model.team;
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
     * commandActivityClonedHandler   *
     * commandActivityReplacedHandler  *
     * commandAnalysisCreatedHandler
     *
     */

    async commandActivityCreatedHandler(createdActivity, createdActivityUrn) {
        this.addActivity(createdActivity);
        UserPrefs.setDefaultUrnPrefixFromUrn(createdActivityUrn)
        // thought below is to surgically add it to the node tree - if its in the currentAnalysis
        // until then, just drawing the whole thing.
        if (this._currentAnalysis) {
            // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
            this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromActivityUrn(this._currentAnalysis.rootUrn);
            this._iaTable.displayAnalysis(this._currentAnalysis);
        }
    }

    async commandActivityUpdatedHandler(updatedActivity, updatedActivityUrn) {
        // 1) update the jag listing
        // 2) @todo if urn is in current Analysis.nodeModel tree
        //         then a) redraw or b) surgery
        console.log("see new activity!")
        let origActivity = this._activityMap.get(updatedActivityUrn);  // Get original data from cache
        this.addActivity(updatedActivity);                       // Update cache to current
        let newKids = updatedActivity.children.map(entry => {
            return entry.urn
        })
        let oldKids = origActivity.children.map(entry => {
            return entry.urn
        });
        let kidsToAdd = newKids.filter(newKid => !oldKids.find(oldKid => newKid === oldKid))
        if (kidsToAdd.length != 0) {

            if (this._currentAnalysis) {
                // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
                this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromActivityUrn(this._currentAnalysis.rootUrn);
                this._iaTable.displayAnalysis(this._currentAnalysis);
            }
        }
        let kidsToRemove = oldKids.filter(oldKid => !newKids.find(newKid => oldKid === newKid))
        if (kidsToRemove.length != 0) {

            if (this._currentAnalysis) {
                // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
                this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromActivityUrn(this._currentAnalysis.rootUrn);
                this._iaTable.displayAnalysis(this._currentAnalysis);
            }
        }
        if ((kidsToRemove.length == 0) && (kidsToAdd.length == 0)) {
            this._iaTable.displayAnalysis(this._currentAnalysis);
        }
    }

    async commandActivityDeletedHandler(deletedActivityUrn) {
        if (this._iaTable.analysisModel) {
            console.log("Check if deleted jag is in the analysis")
            console.log("if so - check if it is the head")
            console.log("   if so - delete the analysis")
            console.log("    if not --- prune that section and redraw")
        }
    }

    async commandAnalysisCreatedHandler(createdAnalysisModel, createdAnalysisId) {

        console.log("see you")

        this.addAnalysisModel(createdAnalysisModel);


        if (this._iaTable.analysisModel) {
            createdAnalysisModel.rootNodeModel = await this.buildNodeTreeFromActivityUrn(createdAnalysisModel.rootUrn);
            this._iaTable.displayAnalysis(createdAnalysisModel);
        }

        this._analysisLibrary.addListItem(createdAnalysisModel)

    }


    /**
     *                                        Support Functions
     *
     * createStandardAnalysis -  Builds generic Analysis with Team and 2 Agents during creation
     *                           required by 1) eventAnalysisCreatedHandler
     * displayAnalysis -         redraws the analysis table
     *                           required by 1) eventAnalysisCreatedHandler
     *
     * buildNodeTreeFromActivityUrn   Build node tree given root URN
     *                           required by: eventAnalysisSelected
     *                           @TODO same nodes as Project nodes? similar / non-permanent
     *
     */



    replaceNodeById(rootNode, replacementItem) {
        let workStack = [];
        workStack.push(rootNode);
        while (workStack > 0) {
            let currentNode = workStack.pop();
            if (currentNode.id == replacementItem.id) {
                currentNode = replacementItem;
                return rootNode;
            } else {
                currentNode.children.forEach(child => workStack.push(child))
            }
        }
    }

    getChildrenToAdd(origActivity, updatedActivity) {
        let newKids = updatedActivity.children.map(entry => {
            return entry
        })
        let oldKids = origActivity.children.map(entry => {
            return entry
        });
        return newKids.filter(newKid => !oldKids.find(oldKid => newKid === oldKid))
    }

    getChildrenToRemove(origActivity, updatedActivity) {
        let newKids = updatedActivity.children.map(entry => {
            return entry
        })
        let oldKids = origActivity.children.map(entry => {
            return entry
        });
        return oldKids.filter(oldKid => !newKids.find(newKid => oldKid === newKid))
    }


    async createStandardAnalysis(analysisName, rootUrn, source) {
        // if (await StorageService.has(rootUrn, 'activity')) {
        let rootActivity = await StorageService.get(rootUrn, 'activity');
        //     window.alert("There must be an initial Joint Activity Graph before an assessment can be made.")
        //tlg   const rootNodeModel = new NodeModel({jag: rootActivity});
        const newAnalysisModel = new AnalysisModel({name: analysisName, rootUrn: rootUrn});///////////////////////////////////////////////////////new
        // currently buildAnalysis builds and stores the mapset.
        newAnalysisModel.team = new TeamModel();
        newAnalysisModel.team.addAgent(new AgentModel({name: 'Agent 1'}));
        newAnalysisModel.team.addAgent(new AgentModel({name: 'Agent 2'}));
        await Promise.all(newAnalysisModel.team.agents.map(async agent => await StorageService.create(agent, 'agent')));
        await StorageService.create(newAnalysisModel.team, 'team');
        await StorageService.create(newAnalysisModel, 'analysis');
        return newAnalysisModel.id;
    }

    async displayAnalysis(id) {
        let analysisModel = await StorageService.get(id, 'analysis');
        analysisModel.rootNodeModel = await this.buildNodeTreeFromActivityUrn(analysisModel.rootUrn);
        this._iaTable.displayAnalysis(analysisModel);
    }

    // UPDATE JAG --- Cycle through active Projects and rebuild.

    async rebuildNodeTree(rootNodeModel) {
        const nodeStack = [];
        const resultStack = [];
        nodeStack.push(rootNodeModel);

        while (nodeStack.length != 0) {
            let currentNode = nodeStack.pop();
            let origActivity = currentNode.activity;
            let updatedActivity = this._activityMap.get(origActivity.urn);
            currentNode.activity = updatedActivity;

            let kidsToAdd = this.getChildrenToAdd(origActivity, updatedActivity);
            kidsToAdd.forEach(child => {
                const childActivity = this._activityMap.get(child.urn);
                const childNodeModel = new NodeModel({urn: childActivity.urn, is_root: false});
                childNodeModel.activity = childActivity
                childNodeModel.childId = child.id;
                currentNode.addChild(childNodeModel, true);
                // not yet -- nodeStack.push(childNodeModel);
            })
            let kidsToRemove = this.getChildrenToRemove(origActivity, updatedActivity);
            kidsToRemove.forEach(child => {
                let childNodeModel = currentNode.getChildById(child.id)
                //   In AT, the following must be done  how: [sperate similar functions?, event call to add this? , parameter to split or delete?, or two functions same name in
                //  different places? -> seperateChild(child).[[one would remove it... the other save and projectize it]]
                //       ---childNodeModel.is_root(true);
                //       --- StorageServer.create(childNodeModel,"node");
                //            ----   ----   this._nodeModelMap.set(child.id, childNodeModel)
                currentNode.removeChild();
            })


            for (const child of currentNode.children) {
                // const childActivity = await StorageService.get(child.urn, 'activity');
                // const childNodeModel = new NodeModel({jag: childActivity, is_root: false});
                // childNodeModel.childId = child.id;
                // currentNode.addChild(childNodeModel, true);
                // nodeStack.push(childNodeModel);
                nodeStack.push(child);
            }
            resultStack.push(currentNode);
        }
        return resultStack.shift();
    }    // possible common area contender

// blending these two together --- update the projectModel to the existing activityModels.

    async commandActivityUpdatedHandler2(updatedActivity, updatedActivityUrn) {
        let origActivity = this.activityMap.get(updatedActivityUrn);  // Get original data from cache
        this.addActivity(updatedActivity);                       // Update cache to current
        let kidsToAdd = this.getChildrenToAdd(origActivity, updatedActivity);
        if (kidsToAdd.length != 0) {


            // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
            this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromActivityUrn(this._currentAnalysis.rootUrn);
            this._iaTable.displayAnalysis(this._currentAnalysis);

        }

        let kidsToRemove = this.getChildrenToRemove(origActivity, updatedActivity);
        if (kidsToRemove.length != 0) {
            if (this._currentAnalysis) {
                // @TODO CHECK IF THIS URN IS RELEVENT TO THE ANALYSIS
                this._currentAnalysis.rootNodeModel = await this.buildNodeTreeFromActivityUrn(this._currentAnalysis.rootUrn);
                this._iaTable.displayAnalysis(this._currentAnalysis);
            }
        }
        if ((kidsToRemove.length == 0) && (kidsToAdd.length == 0)) {
            this._iaTable.displayAnalysis(this._currentAnalysis);
        }
    }

    async buildNodeTreeFromActivityUrn(newRootActivityUrn) {
        const nodeStack = [];
        const resultStack = [];
        const rootActivity = await StorageService.get(newRootActivityUrn, 'activity');   //@todo use cache
        const rootNodeModel = new NodeModel({urn: rootActivity.urn, is_root: true});
        rootNodeModel.activity = rootActivity
        rootNodeModel.parentUrn = null;
        rootNodeModel.rootUrn = newRootActivityUrn;
        nodeStack.push(rootNodeModel);
        while (nodeStack.length != 0) {
            let currentNode = nodeStack.pop();
            for (const child of currentNode.activity.children) {
                let childActivity = null;
                if (await StorageService.get(child.urn, 'activity')) {
                    childActivity = await StorageService.get(child.urn, 'activity');    //@todo use cache
                } else {
                    childActivity = new Activity(child)
                }
                const childNodeModel = new NodeModel({urn: childActivity.urn, is_root: false});
                childNodeModel.activity = childActivity
                childNodeModel.childId = child.id;
                childNodeModel.parentUrn = currentNode.urn
                childNodeModel.rootUrn = newRootActivityUrn;
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        return resultStack.shift();
    }    // possible common area contender


    async updateURN(origURN, newURN) {
        // Currently thinking a controller area if more can be found.
        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newURN + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newURN + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isLocked' tag.
        // URN changes are renames until the Activity is marked as 'isLocked'.
        // After 'isLocked', URN changes are copies.

        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(newURN);
        if (isValid) {
            let origActivity = await StorageService.get(origURN, 'activity');  // needed to check if 'isLocked'
            let urnAlreadyBeingUsed = await StorageService.has(newURN, 'activity');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isLocked ?? ? idk
                    let newActivity = await StorageService.get(origURN, 'activity');

                    // is the target Activity locked?
                    if (newActivity.isLocked) {
                        // FAIL  - CANT OVERWRITE LOCKED JAG-MODEL
                    } else // target Activity is NOT locked

                    { // is the original Activity locked?
                        if (origActivity.isLocked) {
                            await StorageService.clone(origURN, newURN, 'activity');
                        } else { /// the original Activity is not locked
                            await StorageService.replace(origURN, newURN, 'activity')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING JAG-MODEL
                }
            } else {  // urn not already being used
                // is the original Activity locked?
                if (origActivity.isLocked) {
                    await this.cloneActivity(origActivity, newURN)
                } else {/// the original Activity is not locked
                    await StorageService.replace(origURN, newURN, 'activity');
                }
            }
        }

    }                // possible common area contender

    async saveNodeModel(newNodeModel) {
        if (await StorageService.has(newNodeModel, 'node')) {
            await StorageService.update(newNodeModel, 'node');
        } else {
            if (newNodeModel.isValid()) {
                await StorageService.create(newNodeModel, 'node');
            } else {
                window.alert("Invalid URN");
            }
        }
    }               // possible common area contender

    async saveJag() {
        if (await StorageService.has(this, 'activity')) {
            await StorageService.update(this, 'activity');
        } else {
            await StorageService.create(this, 'activity');
        }
    }

    async deleteLeafNode(leaf) {
        if (!leaf.isRootNode()) {
            const index = leaf.parent.children.indexOf(leaf);
            leaf.parent.children.splice(index, 1);
            await StorageService.update(leaf.parent, 'node');
        }

        if (JAGATValidation.isValidUrn(leaf.activity.urn)) {
            await StorageService.delete(leaf.id, 'node');
        } else {
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent('sync'));
        }
    }

    deleteAllChildren(childList) {
        childList.forEach(async child => {
            this.deleteAllChildren([...child.children]);
            // 2 Dispatchers here - only listener in views/Analysis
            this.dispatchEvent(new CustomEvent('detach', {
                detail: {
                    target: child,
                    layout: false
                }
            }));
            await this.deleteLeafNode(child)
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent('sync'));
        });
    }

    async _createChildren() {
        for (let child of this.jag.children) {
            //const jag = await JAGService.instance('idb-service').get(child.urn);
            const jag = await StorageService.get(child.urn, 'activity');
            const model = new Node({jag: jag});
            //await NodeService.instance('idb-service').create(model);
            await StorageService.create(model, 'node');
            this.addChild(model, true);
        }
    }

    addChild(child, layout = true) {
        child.parent = this;
        this._children.push(child);

        // Only Dispatcher & Only Listener in views/Analysis
        this.dispatchEvent(new CustomEvent('attach', {
            detail: {
                target: child,
                reference: this,
                layout: layout
            }
        }));

        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
    }

    // addChild(node){                          // from nodemodel --originall called when the +sign is clicked.
    //     if (this.canHaveChildren) {
    //         const child = new Node();
    //         this._children.push(node);
    //         node.parent = this;
    //     } else {
    //         alert("Node must first be assigned a valid URN")
    //     }
    // }

    async _updateJAG(jag) {
        this._jag = jag;
        this.save();
        this.deleteAllChildren();
        await this._createChildren();
        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
    }

    /// OBSOLETE but might be used later
    ///  The surgical method of deleting a node and all its children
    // Does not scour for other occurrences of other identical parent jags
    async prune(node) {
        this.deleteAllChildren([...node.children]);  // passing a copy because the node.children is going to be modified

        if (node.isRoot()) {
            await this.deleteLeafNode(node);
        }
        // 2 Dispatchers here - only listener in views/Analysis
        // this.dispatchEvent(new CustomEvent('detach', {
        //     detail: {
        //         target: this
        //     }
        // }));
        this._iaTable.analysisView.detach(node)
        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
    }

    repopulateActivity(currentNode) {
        currentNode.activity = this._activityMap.get(currentNode.urn)
        for (let child of currentNode.children) {
            this.repopulateActivity(child)
        }
    }

    repopulateParent(currentNode) {
        for (let child of currentNode.children) {
            child.parent = currentNode;
            this.repopulateParent(child)
        }
    }

}