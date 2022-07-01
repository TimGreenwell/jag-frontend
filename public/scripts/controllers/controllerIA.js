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
import CellModel from "../models/cell.js";
import Activity from "../models/activity.js";
import AnalysisModel from "../models/analysis-model.js";
import TeamModel from "../models/team.js";
import AgentModel from "../models/agent.js";
import UserPrefs from "../utils/user-prefs.js";
import Controller from "./controller.js";

export default class ControllerIA extends Controller{

    constructor() {
        super();
        this._analysisLibrary = null;           // HTMLElement
        this._editor = null;                    // HTML Element
        this._iaTable = null;                   // HTMLElement extending Popupable

        this._activityMap = new Map();          // All JAGs - should be in sync with storage
        this._analysisMap = new Map();     // All analyses - should be in sync with storage
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





    async initialize() {
        UserPrefs.setDefaultUrnPrefix("us:tim:")
        await this.initializeCache();
        this.initializePanels();
        this.initializeHandlers();
    }

    async initializeCache() {

        let allActivities = await StorageService.all('activity')
        allActivities.forEach(activity => this.cacheActivity(activity))

        // @TODO need this?
        let allNodes = await StorageService.all('node')
        allNodes.forEach(node => {
            this.repopulateActivity(node)
            this.repopulateParent(node)
        });

        let allAnalyses = await StorageService.all('analysis')
        allAnalyses.forEach(analysis => this.cacheAnalysis(analysis))
    }

    initializePanels() {
        this._analysisLibrary.addListItems([...this._analysisMap.values()])
    }

    initializeHandlers() {
        this._iaTable.addEventListener('event-analysis-created', this.eventAnalysisCreatedHandler.bind(this));  // popup create
        this._iaTable.addEventListener('event-analysis-updated', this.eventAnalysisUpdatedHandler.bind(this));  // jag structure updates
        //this._iaTable.addEventListener('event-analysis-deleted', this.eventAnalysisDeletedHandler.bind(this));  // jag structure updates
        this._iaTable.addEventListener('event-cell-addchild', this.eventNodeAddChildHandler.bind(this));  // '+' clicked on jag cell (technically undefined jag)         // does that really need to come up this far?
        this._iaTable.addEventListener('event-cell-prunechild', this.eventNodePruneChildHandler.bind(this));
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
     * eventNodePruneChildHandler  - this is a disconnect (not a delete) of a chilid activity from its parent
     * eventCollapseToggledHandler
     * eventUrnChangedHandler      (C)
     * eventActivityCreatedHandler (C)
     * eventActivityUpdatedHandler (C)
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
            const childCell = new CellModel({urn: childActivity.urn});
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

        let parentActivityUrn = event.detail.cell.parent.urn
        let childActivityUrn = event.detail.cell.urn
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
        await StorageService.update(parentActivity, "activity")
    }

    eventCollapseToggledHandler(event) {
        let node = event.detail.node;
        node.toggleCollapse();             //  -- think this is going to be moved to an Analysis array if we want it saved.
        // just initialize tree would be nice - but think it needs to start from scratch.
        // earlier version of this just call a 'layout'event - whats that?
        this._iaTable.analysisView.layout();
    }




    async eventAnalysisSelected(event) {
        this._currentAnalysis = event.detail.model;
        this._currentAnalysis.rootCellModel = await this.buildCellTreeFromActivityUrn(this._currentAnalysis.rootUrn);
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
        this.cacheActivity(createdActivity);
        UserPrefs.setDefaultUrnPrefixFromUrn(createdActivityUrn)
        // thought below is to surgically add it to the node tree - if its in the currentAnalysis
        // until then, just drawing the whole thing.
        if (this._currentAnalysis) {
            // @TODO CHECK IF THIS URN IS RELEVANT TO THE ANALYSIS
            this._currentAnalysis.rootCellModel = await this.buildCellTreeFromActivityUrn(this._currentAnalysis.rootUrn);
            this._iaTable.displayAnalysis(this._currentAnalysis);
        }
    }

    async commandActivityUpdatedHandler(updatedActivity, updatedActivityUrn) {
        // Be nicer to separate structure change (needing redraw) and property change (probably not needing redraw)
        // However - can't think of a way to infer what change was made without more effort than a redraw.
        this._currentAnalysis.rootCellModel = await this.buildCellTreeFromActivityUrn(this._currentAnalysis.rootUrn);
        this._iaTable.displayAnalysis(this._currentAnalysis);
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
        this.cacheAnalysis(createdAnalysisModel);
        if (this._iaTable.analysisModel) {
            createdAnalysisModel.rootCellModel = await this.buildCellTreeFromActivityUrn(createdAnalysisModel.rootUrn);
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
     * buildCellTreeFromActivityUrn   Build node tree given root URN
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

    async createStandardAnalysis(analysisName, rootUrn, source) {
        let rootActivity = await StorageService.get(rootUrn, 'activity');
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
        analysisModel.rootCellModel = await this.buildCellTreeFromActivityUrn(analysisModel.rootUrn);
        this._iaTable.displayAnalysis(analysisModel);
    }

// blending these two together --- update the projectModel to the existing activityModels.





           // possible common area contender

    async saveCellModel(newCellModel) {
        if (await StorageService.has(newCellModel, 'node')) {
            await StorageService.update(newCellModel, 'node');
        } else {
            if (newCellModel.isValid()) {
                await StorageService.create(newCellModel, 'node');
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