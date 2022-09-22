/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import {uuidV4} from '../utils/uuid.js';
import Validation from '../utils/validation.js';

// noinspection JSUnusedGlobalSymbols
export default class Node extends EventTarget {

    constructor({
        id = uuidV4(),
        urn,
        childId,
        parentId,
        projectId = id,
        isExpanded = Boolean(true),
        isLocked = Boolean(false),
        contextualName = ``,
        contextualDescription = ``,
        x, y,
        subscriptions = [],        // still unknown implementation (hopefully observer)
        returnValue = null,
        returnState = null,
        testReturnValue = null,
        testReturnState = null,
        children = []
    } = {}) {
        super();
        this._id = id;                       // An assigned unique ID given at construction
        this._urn = urn;
        this._childId = childId;                       // child differentiating id
        this._parentId = parentId;
        this._projectId = projectId;
        this._isExpanded = isExpanded;         // Expanded (table) or folded in (graph)
        this._isLocked = isLocked;
        this._contextualName = contextualName;
        this._contextualDescription = contextualDescription;
        this._x = x;
        this._y = y;
        this._subscriptions = subscriptions;    // Array<Subscription>
        this._returnValue = returnValue;
        this._returnState = returnState;
        this._testReturnValue = testReturnValue;
        this._testReturnState = testReturnState;
        this._children = children;            // Links to actual children [objects]
        // Derived
        this._activity = undefined;
        this._leafCount = 1;
        this._treeDepth = 0;
        // Temp
        // @TODO this._hasNewStructure = false;
        // @TODO this._hasNewProperties = false;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get urn() {
        return this._urn;
    }

    set urn(value) {
        this._urn = value;
    }

    get childId() {
        return this._childId;
    }

    set childId(value) {
        this._childId = value;
    }

    get parentId() {
        return this._parentId;
    }

    set parentId(value) {
        this._parentId = value;
    }

    get activity() {
        return this._activity;
    }

    set activity(value) {
        this._activity = value;
    }

    get projectId() {
        return this._projectId;
    }

    set projectId(value) {
        this._projectId = value;
    }

    get children() {
        return this._children;
    }

    set children(value) {
        this._children = value;
    }

    get parent() {
        return this._parent;
    }

    set parent(parent) {
        this._parent = parent;
        this._parentId = parent ? parent.id : null;
    }


    get subscriptions() {
        return this._subscriptions;
    }

    set subscriptions(value) {
        this._subscriptions = value;
    }

    removeSubscription(subscriptionName) {
        for (const index in this._subscriptions) {
            if (this._subscriptions[index].name === subscriptionName) {
                this._subscriptions.splice(index, 1);
                break;
            }
        }
    }


    get isLocked() {
        return this._isLocked;
    }

    set isLocked(value) {
        this._isLocked = value;
    }


    get isExpanded() {
        return this._isExpanded;
    }

    set isExpanded(value) {
        this._isExpanded = value;
    }

    get x() {
        return this._x;
    }

    set x(x) {
        this._x = x;
    }

    get y() {
        return this._y;
    }

    set y(y) {
        this._y = y;
    }

    setPosition(x, y) {
        this._x = x;
        this._y = y;
    }

    getPosition() {
        return [this._x, this._y];
    }

    get treeDepth() {
        return this._treeDepth;
    }

    set treeDepth(depth) {
        this._treeDepth = depth;
    }

    get leafCount() {
        return this._leafCount;
    }

    set leafCount(value) {
        this._leafCount = value;
    }

    get contextualName() {
        if ((this._contextualName === ``) || (this._contextualName == undefined)) {
            return this._activity.name;
        } else {
            return this._contextualName;
        }
    }

    set contextualName(value) {
        this._contextualName = value;
    }

    get contextualDescription() {
        if ((this._contextualDescription === ``) || (this._contextualName == undefined)) {
            return this.activity.description;
        } else {
            return this._contextualDescription;
        }
    }

    set contextualDescription(value) {
        this._contextualDescription = value;
    }


    get returnValue() {
        return this._returnValue;
    }

    set returnValue(value) {
        this._returnValue = value;
    }


    get returnState() {
        return this._returnState;
    }

    set returnState(value) {
        this._returnState = value;
    }

    get testReturnValue() {
        return this._testReturnValue;
    }

    set testReturnValue(value) {
        this._testReturnValue = value;
    }

    get testReturnState() {
        return this._testReturnState;
    }

    set testReturnState(value) {
        this._testReturnState = value;
    }

    // /////////////////////////////////////////////////////////////////////////////////////////
    // ///////////////////////////////// Inner Jag Assignments  ////////////////////////////////
    // ///////////////////   ( This will go away once extending JAG Model )    /////////////////
    // /////////////////////////////////////////////////////////////////////////////////////////
    get name() {
        return (this.activity === undefined) ? `` : this.activity.name;
    }

    set name(name) {
        if (this.activity !== undefined) {
            this.activity.name = name;
        }
    }

    get description() {
        return (this.activity === undefined) ? `` : this.activity.description;
    }

    set description(name) {
        if (this.activity !== undefined) {
            this.activity.name = name;
        }
    }

    // /////////////////////////////////////////////////////////////////////////////////////////
    // ///////////////////////////////// Supporting Functions  ////////////////////////////////
    // /////////////////////////////////////////////////////////////////////////////////////////

    // calculateNodeHeights(node) {
    //     if (node.isLeaf(node)) {
    //         node.
    //     }
    // }


    isLeaf(node) {
        return !(node.hasChildren());
    }

    getShortUrn() {
        const parts = this.urn.split(`:`);
        const lastPart = parts.pop().trim();
        return lastPart;
    }

    gatherDescendentUrns(childNodeModel = this, workStack = []) {   // need this in nodes
        workStack.push(childNodeModel.urn);
        childNodeModel.children.forEach((child) => {
            this.gatherDescendentUrns(child, workStack);
        });
        return workStack;
    }

    activitiesInProject(urn) {    // return array of nodes matching urn
        const matchStack = [];
        const workStack = [];

        workStack.push(this);
        while (workStack.length > 0) {
            const nodeModel = workStack.pop();

            if (nodeModel.activity.urn === urn) {
                matchStack.push(nodeModel);
            }
            nodeModel.children.forEach((kid) => {
                workStack.push(kid);
            });
        }
        return matchStack;
    }

    isActivityInProject(urn) {
        return (this.activitiesInProject(urn).length > 0);
    }

    setDepth() {
        if (this.isRoot()) {
            this.treeDepth = 0;
        } else {
            console.log(this.name);
            this.treeDepth = this.parent.treeDepth + 1;
        }
        console.log(`${this.name} set to ${this.treeDepth}`)
    }


    incrementDepth(depthCount) {
        this._treeDepth = depthCount + 1;
        this._children.forEach((child) => {
            child.incrementDepth(this._treeDepth)
        });
    }

    incrementLeafCount(moreLeaves) {
        this._leafCount = this._leafCount + moreLeaves;
        if (this.parent) {
            this.parent.incrementLeafCount();
        }
    }

    hasChildren() {
        return (this.children.length !== 0);
    }

    addChild(node) {                              // moved to controller
        if (this.canHaveChildren) {
            this._children.push(node);
            node.parent = this;
            node.incrementDepth(this._treeDepth);
        } else {
            alert(`Node must first be assigned a valid URN`);
        }
    }

    leafcounter() {
        if (this.hasChildren()) {
            let sum = 0;
            this.children.forEach((child) => {
                child.leafCount = child.leafcounter();
                sum = sum + child.leafCount;
            });
            this.leafCount = sum;
            return sum;
        } else {
            this.leafCount = 1;
            return this.leafCount;
        }
    }


    removeChild(child) {
        const filtered = this.children.filter((entry) => {
            // if (entry.id !== child.id) {
            //     return entry;
            // }
            // xxxxx
            return entry.id !== child.id;
        });
        this.children = filtered;
    }


    replaceChild(newChild) {
        const workStack = [];
        if (this.id === newChild.id) {
            return newChild;
        } else {
            workStack.push(this);
            while (workStack.length > 0) {
                const workingNode = workStack.pop();
                workingNode.children.forEach((child) => {
                    if (child.id === newChild.id) {
                        workingNode.removeChild(child);
                        workingNode.addChild(newChild);
                        return this;
                    } else {
                        workStack.push(child);
                    }
                });
            }
        }
    }


    findChildById(id) {
        const workStack = [];
        workStack.push(this);
        while (workStack.length > 0) {
            const checkNode = workStack.pop();
            if (checkNode.id === id) {
                return checkNode;
            } else {
                checkNode.children.forEach((child) => {
                    workStack.push(child);
                });
            }
        }
        this.children.forEach((child) => {
            if (child.id === id) {
                return child;
            }
        });
    }

    getLastChild() {
        return this._children[this.children.length - 1];
    }

    get canHaveChildren() {  // already pushed to activity model
        return ((this.activity !== undefined) && (Validation.isValidUrn(this.activity.urn)));
    }

    get childCount() {
        return this._children.length;
    }


    isRoot() {
        return this._id === this._projectId;
    }         // is determined by lack of parent.


    toJSON() {
        const json = {
            id: this._id,
            urn: this._urn,
            childId: this._childId,
            parentId: this._parentId,
            projectId: this._projectId,
            isLocked: this._isLocked,
            isExpanded: this._isExpanded,
            x: this._x,
            y: this._y,
            contextualName: this._contextualName,
            contextualDescription: this._contextualDescription,
            subscriptions: [],
            returnValue: this._returnValue,
            returnState: this._returnState,
            testReturnValue: this._testReturnValue,
            testReturnState: this._testReturnState

        };
        const childStack = [];
        for (const child of this._children) {
            childStack.push(child.toJSON());
        }
        json.children = childStack;
        return json;
    }


    // static async fromJSON(json) {
    //     const childStack = [];
    //     for (const child of json.children) {
    //         childStack.push(await Node.fromJSON(child));
    //     }
    //     json.children = childStack;
    //     const node = new Node(json);
    //     return node;
    // }

    static fromJSON(json) {
        const childStack = [];
        for (const child of json.children) {
            childStack.push(Node.fromJSON(child));
        }
        json.children = childStack;
        const node = new Node(json);
        return node;
    }


}

// removeChildById(id) {  // this wont work - not recursing
//     this.children.forEach((child) => {
//         if (child.id === id) {
//             this.removeChild(child);
//         }
//     });
// }

// toggleExpanded() {
//     this._isExpanded = !this._isExpanded;
//     console.log(`---------------- Not Possible -------------------------------`);
//
//     // 2 dispatches here - 1 listener in views/Analysis
//     this.dispatchEvent(new CustomEvent(`layout`));
// }

// getAncestor() {
//     let topAncestor = this;
//     while (!topAncestor.isRoot()) {
//         topAncestor = topAncestor.parent;
//     }
//     return topAncestor;
// }
