/**
 * @fileOverview Jag Controller.
 *
 * @author IHMC
 * @version 0.01
 */

'use strict';


import InputValidator from "../utils/validation.js";
import StorageService from "../services/storage-service.js";
import JagModel from "../models/jag.js";
import JAGATValidation from "../utils/validation.js";
import NodeModel from "../models/node.js";

export default class Controller {


    static _jagModelList = new Set();
    static _nodeModelList = new Set();
    static currentAnalysis = undefined;

    static {

    }


    get jagModelList() {
        return this._jagModelList;
    }
    set jagModelList(jagModel) {
        this._jagModelList = jagModel;
    }
    static addJagModel(jagModel) {
        this._jagModelList.add(jagModel)
    }
    static get nodeModelList() {
        return this.nodeModelList;
    }
    static set nodeModelList(nodeModel) {
        this.nodeModelList = nodeModel;
    }
    static addNodeModel(nodeModel) {
        this._nodeModelList.add(nodeModel)
    }

    static initializeSubscriptions() {
        StorageService.subscribe("jag-storage-updated", this.handleJagStorageUpdated.bind(this));
        StorageService.subscribe("jag-storage-created", this.handleJagStorageCreated.bind(this));
    }


    /**
     *                              JAG PERFORMER SECTION - Outgoing DATA
     * @param newJagModel
     * @returns {Promise<void>}
     */

    static async createJagModel(newJagModel) {
        if (newJagModel.isValid()) {
            await StorageService.create(newJagModel, 'jag');
        } else {
            window.alert("Invalid URN");
        }
    }

// This is an identical copy (hopefully) of the URN updater found in views/Properties
    // I can't decide on a common area for updates such as this.  Views arent shared.  A controller area?
    // Maybe just the model (stoage is data) but circular reference problem with schema.
    // Currently thinking a controller area if more can be found.

    static async updateURN(origURN, newURN) {
        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newURN + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newURN + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isPublished' tag.
        // URN changes are renames until the JagModel is marked as 'isPublished'.
        // After 'isPublished', URN changes are copies.

        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(newURN);
        if (isValid) {
            let origJagModel = await StorageService.get(origURN, 'jag');  // needed to check if 'isPublished'
            let urnAlreadyBeingUsed = await StorageService.has(newURN, 'jag');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isPublished ?? ? idk
                    let newJagModel = await StorageService.get(origURN, 'jag');

                    // is the target JagModel published?
                    if (newJagModel.isPublished) {
                        // FAIL  - CANT OVERWRITE PUBLISHED JAG-MODEL
                    } else // target JagModel is NOT published

                    { // is the original JagModel published?
                        if (origJagModel.isPublished) {
                            await StorageService.clone(origURN, newURN, 'jag');
                        } else { /// the original JAGModel is not published
                            await StorageService.replace(origURN, newURN, 'jag')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING JAG-MODEL
                }
            } else {  // urn not already being used
                // is the original JagModel published?
                console.log("is published - " + origJagModel.isPublished);
                if (origJagModel.isPublished) {
                    await this.cloneJagModel(origJagModel, newURN)
                } else {/// the original JAGModel is not published
                    await StorageService.replace(origURN, newURN, 'jag');
                }
            }
        }

    }


    /**
     *                                    JAG Performer - Incoming DATA
     * @param updatedJagModel
     * @param updatedJagUrn
     */

    static handleJagStorageCreated(updatedJagModel, updatedJagUrn) {
        //  Update Jag Model has arrived.
    }
// What generates a new node:
    //1) A new created Jag also creates a new root/childless node.
    //2) Clicking on the AT Library creates a new root node. (possible children)
    //3) Creating new activity in IA Table creates a new node and maybe new jag (if new urn)
    //   Creating things in IA Table is wierd. What if new urn? what if same urn but new name?
    //4) Cloning another node.  This also creates new Jag.
    //
    // Node extends Jag?
    // AT Node extends Node
    // IA Node extends Node
    //
    // What generates new jag
    //1)The popup jag creater.  This also generates node (playground listens to jag creation)
    //2)Cloning an existing node.
    //3) Creating new activity with new urn in IA Table
    //
    //bonus: renaming a node creates a new node and jag but only changes the urn.

    // Can a Jag update generate/remove a Node? Not directly - if a Jag adds (or removes a child)


    /**
     *   The Activity Cells shown in the IATable are represented in a Node Model Tree.
     *   Why? Need the id, like the parent/child object links
     *   @TODO
     *   1) We assume the representing node model tree is non-permanent
     *   - no data is particular to a certain node that cannot be derived again from the original JAG element
     *   list.  In fact, that might be the best way to handle any JAG changes (complete rebuild)
     *   - Possible to surgically alter the tree (slightly better performance vs code maintenance)
     *   - There is no requirement to save to database.
     *   2) We assume the node model tree contains info particular to this instantiation of
     *   the JAG vs other possible instantiations.
     *   - In this case we cannot rebuild from the JAG list, we need a permanent storage for the tree
     *     and must surgically alter the tree as JAG changes are presented.
     *   - Also need a way for the users to choose not only a URN but which instance of URN - maybe
     *     the entire path from root to target urn (or pick graphically)
     *
     *  Going with Option 1 - rebuild (with experimental surgical alternative, just in case they change their mind.)
     *
     * @param updatedJagModel
     * @param updatedJagUrn
     */

    static handleJagStorageUpdated(updatedJagModel, updatedJagUrn) {
        // update the jag listing
        if (this.currentAnalysis) {
            this._jagModelList.forEach(jagModel => {
                if (jagModel.urn == updatedJagUrn) {
                    jagModel = updatedJagModel
                }
            })
            // get refreshed nodeModelList
            this._nodeModelList = this.buildAnalysisJagNodes(this.currentAnalysis.rootUrn);
        }
    }

    static handleJagStorageCreated(createdJagModel, updatedJagUrn) {
        if (this.currentAnalysis) {
            this._jagModelList.add(createdJagModel);

            this._nodeModelList = this.buildAnalysisJagNodes(this.currentAnalysis.rootUrn)
        }
    }

    // The brute force rebuild  - put in URN and get back rootNode of a fully armed and operational NodeModelTree.
    static async buildAnalysisJagNodes(newRootJagUrn) {
        const nodeStack = [];
        const resultStack = [];
        const rootJagModel = await StorageService.get(newRootJagUrn, 'jag');
        const rootNodeModel = new NodeModel({jag: rootJagModel, is_root: true});
       // returnedNodeSet.clear();
        nodeStack.push(rootNodeModel);
        while (nodeStack.length != 0) {
            let currentNode = nodeStack.pop();
            for (const child of currentNode.jag.children) {
                const childJagModel = await StorageService.get(child.urn, 'jag');
                const childNodeModel = new NodeModel({jag: childJagModel, is_root: false});
                currentNode.addChild(childNodeModel, true);
                nodeStack.push(childNodeModel);
            }
            resultStack.push(currentNode);
        }
        return resultStack.shift();
    }

    // // Put in a URN - Get a NodeModel Tree back. - recursion method... needs modification for URN statt node.
    // async buildAnalysisJagNodes(currentNode) { // this was newRootNodeModel
    //     //	let currentNode = newRootNodeModel;     // this was uncommented
    //     let children = currentNode.jag.children;// this was newRootNodeModel
    //     await Promise.all(
    //         children.map(async ({urn, id}) => {
    //             const childJagModel = await StorageService.get(urn, 'jag');  // can replace this once laziness is going
    //             const childNodeModel = new NodeModel({jag: childJagModel});
    //             currentNode.addChild(childNodeModel, true);
    //             await this.buildAnalysisJagNodes(childNodeModel);
    //         }))
    //     this._nodeSet.add(currentNode);
    //     await StorageService.create(currentNode,'node');
    // }


//  The surgical method for handling new Jag Updates
//     static handleJagStorageUpdated(updatedJagModel, updatedJagUrn) {
//         //  Update Jag Model has arrived.
//         this._nodeModelList.forEach(node => {
//             // if updated Jag is already represented by current node(s)
//             // find each node that matches -->
//             // --> add updated Jag to node's jag placeholder
//             // --> add or remove node children to match updated Jag
//             if (updatedJagModel.urn == node.jag.urn) {
//                 node.jag = updatedJagModel;
//                 let jagKids = updatedJagModel.children;
//                 let nodeKids = node.children;
//                 let kidsToAdd = jagKids.filter(jagKid => !nodeKids.find(nodeKid => jagKid["id"] === nodeKid["id"]))
//                 console.log(kidsToAdd)
//                 let kidsToRemove = nodeKids.filter(nodeKid => !jagKids.find(jagKid => nodeKid["id"] === jagKid["id"]))
//                 console.log(kidsToRemove)
//             }
//             if (updatedJagModel.children.contains(node.id)){
//                 node.parent = updatedJagModel;
//                 node.isRoot = false;
//             }
//         })
//     }


    //     static async createNodeModel(newNodeModel) {
    static async saveNodeModel(newNodeModel) {
        if (await StorageService.has(newNodeModel, 'node')) {
            await StorageService.update(newNodeModel, 'node');
        } else {
            if (newNodeModel.isValid()) {
                await StorageService.create(newNodeModel, 'node');
            } else {
                window.alert("Invalid URN");
            }
        }

    }





    // async deleteLeafNode
    static async deleteLeafNode(leaf) {
        console.log("Has entered the deathroom")
        if (!leaf.isRootNode()) {
            const index = leaf.parent.children.indexOf(leaf);
            leaf.parent.children.splice(index, 1);
            await StorageService.update(leaf.parent, 'node');
        }

        if (JAGATValidation.isValidUrn(leaf.jag.urn)) {
            await StorageService.delete(leaf.id, 'node');
        } else {
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent('sync'));
        }
    }

    static deleteAllChildren(childList) {
        childList.forEach(async child => {
            this.deleteAllChildren([...child.children]);
            // 2 Dispatchers here - only listener in views/Analysis
            this.dispatchEvent(new CustomEvent('detach', { detail: {
                    target: child,
                    layout: false
                }}));
            await this.deleteLeafNode(child)
            // 6 dispatchers here - Only Listener in views/Jag
            this.dispatchEvent(new CustomEvent('sync'));
        });
    }

    clip(node = this) {

    }

    static async prune(node = this) {
        this.deleteAllChildren([...node.children]);  // passing a copy because the node.children is going to be modified

        if (node.isRootNode()) {
            await this.deleteLeafNode(node);
        }
        // 2 Dispatchers here - only listener in views/Analysis
        this.dispatchEvent(new CustomEvent('detach', { detail: {
                target: this
            }}));
        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
    }



    async _createChildren() {
        for (let child of this.jag.children) {
            //const jag = await JAGService.instance('idb-service').get(child.urn);
            const jag = await StorageService.get(child.urn,'jag');
            const model = new Node({jag: jag});
            //await NodeService.instance('idb-service').create(model);
            await StorageService.create(model,'node');
            this.addChild(model, true);
        }
    }

    async _updateJAG(jag) {
        this._jag = jag;
        this.save();
        this.deleteAllChildren();
        await this._createChildren();
        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
    }



    addChild(child, layout = true) {
        child.parent = this;
        this._children.push(child);

        // Only Dispatcher & Only Listener in views/Analysis
        this.dispatchEvent(new CustomEvent('attach', { detail: {
                target: child,
                reference: this,
                layout: layout
            }}));

        // 6 dispatchers here - Only Listener in views/Jag
        this.dispatchEvent(new CustomEvent('sync'));
    }

    static async saveJag() {
        if (await StorageService.has(this, 'jag')){
            await StorageService.update(this,'jag');
        }
        else {
            await StorageService.create(this,'jag');}
    }






}