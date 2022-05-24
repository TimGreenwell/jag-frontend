/**
 * @fileOverview Jag Controller.
 *
 * @author IHMC
 * @version 0.01
 */

'use strict';


import InputValidator from "../utils/validation.js";
import StorageService from "../services/storage-service.js";
import NodeModel from "../models/node.js";
import JAGATValidation from "../utils/validation.js";

export default class NodeController {


    static _nodeModelList = new Set();
    static {
        StorageService.subscribe("jag-storage-updated", this.handleJagStorageUpdated.bind(this));
        StorageService.subscribe("jag-storage-created", this.handleJagStorageCreated.bind(this));
    }


    static handleJagStorageUpdated(updatedJagModel, updatedJagUrn) {
        //  Update Jag Model has arrived.
}

    static get nodeModelList() {
        return this._jagModelList;
    }
    static set nodeModelList(value) {
        this._jagModelList = value;
    }
    static addNodeModel(nodeModel) {
        this._nodeModelList.add(nodeModel)
    }


    static async createNodeModel(newNodeModel) {
        if (newNodeModel.isValid()) {
            await StorageService.create(newNodeModel, 'node');
        } else {
            window.alert("Invalid URN");
        }
    }

    /**
     * Recursively get the left(?) most leaf from this node
     * tlg - Wht?  gets the last child's last child's lasts child... whatfer?
     */
    static lastLeaf(node) {
        if(node.children.length === 0)
            return this;
        return this.lastLeaf(node.children[node.children.length - 1]);
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


}