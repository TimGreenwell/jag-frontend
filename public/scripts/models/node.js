/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import { UUIDv4 }  from '../utils/uuid.js';
import Validation from '../utils/validation.js';
import UserPrefs from "../utils/user-prefs.js";
import Activity from "./activity.js"


// node (with view/jag)  = at's jag-node       -- both syn with JAG model
export default class Node extends EventTarget {

	constructor({ id = UUIDv4(),
					childId,
					urn,
					color,
					project = id,
					link_status = true,
					collapsed = false,
					isLocked = false,
					is_root = false,
					x, y ,
					contextualName = '-',
					contextualDescription = '--',
					children = new Array()} = {}) {
		super();
		this._id = id;                       // An assigned unique ID given at construction
		this._childId = childId;                       // child differentiating id
		this._activity = undefined;
		this._project = project;

        this._urn = urn;
		this._children = children;            // Links to actual children [objects]

		this._link_status = link_status;     // dont know what this is.
		this._color = color;                 // Derived color
		this._collapsed = collapsed;         // Collapsed (table) or folded in (graph)

		this._x = x;
		this._y = y;

		this._leafCount = 1;
		this._treeDepth = 0;
		this._contextualName = contextualName;
		this._contextualDescription = contextualDescription
		this._isLocked = isLocked;


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
	get jag() {
		console.log("NNNNNNNNNNNNNNNNNOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO!");
	}
	set jag(value) {
		console.log("NNNNNNNNNNNNNNNNNOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO!");
		this._activity = value;
	}

	get activity() {
		return this._activity;
	}
	set activity(value) {
		this._activity = value;
	}
	
	

	get project() {
		return this._project;
	}

	set project(value) {
		this._project = value;
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
	}
	get linkStatus() {
		return this._link_status;
	}
	set linkStatus(value) {
		this._link_status = value;
	}

	get isLocked() {
		return this._isLocked;
	}

	set isLocked(value) {
		this._isLocked = value;
	}

	get color() {
		return this._color;
	}
	set color(value) {
		this._color = value;
	}
	get collapsed() {
		return this._collapsed;
	}
	set collapsed(collapsed) {
		this._collapsed = collapsed;
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
	setPosition(x,y){
		this._x = x;
		this._y = y;
	}
	getPosition(){
		return [this._x,this._y]
	}
	get treeDepth() {
		return this._treeDepth;
	}
	get leafCount() {
		return this._leafCount;
	}

	get contextualName() {
		return this._contextualName;
	}
	set contextualName(value) {
		this._contextualName = value;
	}
	get contextualDescription() {
		return this._contextualDescription;
	}
	set contextualDescription(value) {
		this._contextualDescription = value;
	}

///////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////// Inner Jag Assignments  ////////////////////////////////
	/////////////////////   ( This will go away once extending JAG Model )    /////////////////
	///////////////////////////////////////////////////////////////////////////////////////////
	get name() {
		return (this.activity === undefined) ? '' : this.activity.name;
	}
	set name(name) {
		if (this.activity !== undefined) {
			this.activity.name = name;
		}
	}
	// get urn() {
	// 	return (this.activity === undefined) ? UserPrefs.getDefaultUrn(this.name) : this.activity.urn;
	// }
	// set urn(urn) {
	// 		if (this.activity !== undefined) {
	// 		this.activity.urn = urn                    // Remember - can't update if urn is valid. (enforced at activity)
	// 	}
	// }
	get description() {
		return (this.activity === undefined) ? '' : this.activity.description;
	}
	set description(name) {
		if (this.activity !== undefined) {
			this.activity.name = name;
		}
	}
	///////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////// Supporting Functions  ////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////


	///////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////// Supporting Functions  ////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////


	activitiesInProject(urn){    // return array of nodes matching urn
		let matchStack = [];
		let workStack = [];

		workStack.push(this);
		while (workStack.length > 0 ){
			let nodeModel = workStack.pop();

			if (nodeModel.activity.urn == urn) {
				matchStack.push(nodeModel);
			}
			nodeModel.children.forEach(kid => {workStack.push(kid)})
		}
      return matchStack;
	}

	isActivityInProject(urn) {
		return (this.activitiesInProject(urn).length > 0)
	}

	incrementDepth(depthCount){
		if (depthCount > this._treeDepth) {
			this._treeDepth = depthCount;
			if (this.parent){
				this.parent.incrementDepth(depthCount + 1);
			}
		}
	}
	incrementLeafCount() {
		this._leafCount = this._leafCount + 1;
		if (this.parent){
			this.parent.incrementLeafCount();
		}
	}

	// parentize(currentNode = this.getAncestor()){
	// 	if (currentNode.hasChildren()){
	// 		for (let child of this.children) {
	// 			child.parent = currentNode;
	// 			this.parentize(child);
	// 		}
	// 	}
	// }

	hasChildren() {
		return (this.children.length !== 0);
	}

	getChildById(id) {
		if (id == this.is) {
			return this
		} else {
			this.children.forEach(child => {
				child.getChildById(id)
			})

		}}





	addChild(node){                              // moved to controller
		if (this.canHaveChildren) {
			const child = new Node();
			this._children.push(node);
			node.parent = this;
			this.incrementDepth(1);
			if (this.childCount>1){
				this.incrementLeafCount();
			}
		} else {
			alert("Node must first be assigned a valid URN")
		}
	}
	removeChild(child){
		let filtered = this.children.filter(entry => {
			if (entry.id != child.id) {
				return entry
			}})
		this.children = filtered;
	}


	replaceChild(newChild){
		let workStack = [];
		if (this.id == newChild.id){
			return newChild
		}
		else {
			workStack.push(this)
			while (workStack.length > 0) {
				let workingNode = workStack.pop();
				workingNode.children.forEach(child => {
					if (child.id == newChild.id) {
						workingNode.removeChild(child)
						workingNode.addChild(newChild)
						return this;
					}
					else {
						workingNode.push(child)
					}
				})
			}
		}
	}

	removeChildById(id){
		this.children.forEach(child => {
			if (child.id == id) {
				this.removeChild(child);
			}
		})
	}
	getLastChild(){
		return this._children[this.children.length - 1]
	}
	get canHaveChildren() {  // already pushed to activity model
		return ((this.activity !== undefined) && (Validation.isValidUrn(this.activity.urn)));
	}
	get childCount() {
		return this._children.length;
	}

	toggleCollapse() {
		this.collapsed = !this.collapsed;
		// 2 dispatches here - 1 listener in views/Analysis
		this.dispatchEvent(new CustomEvent('layout'));
	}

	isRoot() {
		return this._id == this._project;
	}         // is determined by lack of parent.

    getAncestor() {
		let topAncestor = this;
		while(!topAncestor.isRoot()) {
			topAncestor = topAncestor.parent
		}
		return topAncestor;
		}



	toJSON() {
		const json = {
			id: this._id,
			urn: this._urn,
			childId: this._childId,
			project: this._project,
			color: this._color,
			link_status: this._link_status,
			collapsed: this._collapsed,
			isLocked: this._isLocked,
			x: this._x,
			y: this._y,
			contextualName: this._contextualName,
			contextualDescription: this._contextualDescription
		};
		let childStack = [];
		for (let child of this._children) {
			childStack.push(child.toJSON())
		}
		json.children = childStack
		return json;
	}

	static async fromJSON(json) {
		let childStack = [];
		for (let child of json.children) {
			childStack.push(await Node.fromJSON(child))
		}
		json.children = childStack;
		const node = new Node(json);
		return node;
	}



	// static async fromJSON(json) {
	// 	const activity = await StorageService.get(json.activity,'activity');
	// 	if (activity instanceof Activity) {
	// 		json.activity = activity;
	// 	}
	// 	else {
	// 		json.activity = undefined;
	// 	}
	// 	//json.activity = (activity != null) ? activity : undefined;
	//
	// 	const node = new Node(json);
	//
	// 	return node;
	// }


}


