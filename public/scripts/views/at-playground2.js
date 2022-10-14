/**
 * @file AtPlayground - Visual area for authoring JAGs.  Controls the general playground environment
 * including panning, zooming, adding and removing edges/nodes.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */

import EdgeElement from './at-support/edge.js';
import Popupable from '../utils/popupable.js';
import UserPrefs from '../utils/user-prefs.js';
import Svg from '../utils/svg.js';
import Point from '../models/point.js';

class AtPlayground extends Popupable {

    constructor() {
        super();
        this.svgParameters = {
            id: `jag`,
            HUE: 200,
            SELECTED_HUE: 150,
            POSSIBLE_HUE: 50,
            HORIZONTAL_MARGIN: 10,
            VERTICAL_MARGIN: 10,
            LINE_WIDTH: 2,
            STANDARD_FONT_SIZE: 17,
            STEP_BRIGHTNESS: 5
        };
        this._playgroundWrapperDiv = document.createElement(`div`);
        this._playgroundWrapperDiv.id = `playground-wrapper`;
        this.setPopupBounds(this._playgroundWrapperDiv);
        this.appendChild(this._playgroundWrapperDiv);
        this.svg = new Svg(this.svgParameters);
        this._playgroundSvg = this.svg.buildSvg();

        this._background = this.svg.createBackground(`jag`);
        this._playgroundSvg.appendChild(this._background);
        this._playgroundSvg.addEventListener(`mousedown`, this.mousedownController.bind(this));
        this._playgroundWrapperDiv.appendChild(this._playgroundSvg);


        // SVG control (panning, zooming)
        this.windowSize = null;
        this.svgCursor = new Point();
        this.panPosition = new Point();
        this.svgLocation = new Point();
        this.svgSize = {height: 0,
            width: 0};
        this.zoomStep = 0;
        this._zoomFactor = 1.00;   //  PROB NOT NECESSARY

        // Data objects displayed by the SVG
        this._viewedProjectsMap = new Map();               // All active Jag root nodes - id,node
        this._activeActivityNodeElementSet = new Set();    // set of ActivityNodes (all)
        this._selectedActivityNodeMap = new Map();         // set of ActivityNodes (selected)
        this._selectedEdge;                                // single selected edge
        this._is_edge_being_created = false;
        this.currentNodeModel = null;                      // node in focus (selected or head of selected)  // needed?  - we have selectedActivityNodeMap
        this.hasColor = false;

        // EVENTS
        // SVG Events
        document.addEventListener(`keydown`, this.onKeyDown.bind(this));                        // ctrl for select children
        this._playgroundSvg.addEventListener(`mousedown`, this.svgMouseDownEvent.bind(this));   // background clicked (start svg panning)
        this._playgroundSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));       // mousewheel (zooming)
        // Bounded (events that require eventual removing)
        this._boundDragView = this.dragView.bind(this);                                              // pan svg
        this._boundStopDragView = this.stopDragView.bind(this);                                      // cease panning
        this._boundFinalizeEdge = this.finalizeEdge.bind(this);
        this._boundLinkNodes = this.linkNodes.bind(this);
        this._boundSignalPossibleChild = this.signalPossibleChild.bind(this);
        this._boundRestoreNormalColor = this.restoreNormalColor.bind(this);
        this._boundDragNode = this.dragNode.bind(this);
        this._boundStopDraggingNode = this.stopDraggingNode.bind(this);
        this._boundOnEdgeUpdated = this.onEdgeUpdated.bind(this);
        this._boundOnEdgeCanceled = this.onEdgeCanceled.bind(this);
    }

    /**
     *  Events
     *
     * ---mousedown events
     * mousedownController (all mousedowns)
     * addNode (clicking add button)
     * toggleExpand (clicking expand button)
     * eventNodeSelected (clicking node)
     * svgMouseDownEvent (clicking background)
     *
     *
     *
     *
     */
    mousedownController(e) {
        // e.stopPropagation();
        e.stopImmediatePropagation();
        const elementType = this.svg.fetchTargetElementType(e.target);

        if (elementType === `add`) {
            this.addNode(e);
        }
        if (elementType === `expand`) {
            this.toggleExpand(e);
        }
        if (elementType === `rect`) {
            this.eventNodeSelected(e);
        }
        if (elementType === `background`) {
            this.svgMouseDownEvent(e);
        }
        if (elementType === `edge`) {
            this.selectEdge(e);
        }
    }

    linkNodes(e) {
        e.stopPropagation();
        const edge = this.svg.fetchEdgeToCursor();
        const cursorPoint = this.screenToSVGCoords(e);
        this.svg.followCursor(edge, cursorPoint);
    }

    addNode(e) {
        e.stopPropagation();
        // 1. For every active Node - add Event listeners:
        // a) on mouse up == check if valid and add as child.
        // b) on mouse over == check if valid and light up some color

        const parentId = this.svg.fetchTargetId(e.target);
        const parentNodeModel = this.retrieveNodeModel(parentId);
        const parentProjectId = parentNodeModel.projectId;
        this.viewedProjects.forEach((project) => {
            if (project.id !== parentProjectId) {
                const nodeGroup = this.svg.fetchNodeGroup(project.id);
                nodeGroup.classList.add(`possibleChild`);   // the other way
                nodeGroup.addEventListener(`mouseenter`, this._boundSignalPossibleChild);
                nodeGroup.addEventListener(`mouseleave`, this._boundRestoreNormalColor);
            }
        });
        // 2 light up some color0
        this.svg.signalPossibleChild(this._playgroundSvg, parentNodeModel);
        // 3 start edge following mouse
        const rect = this.svg.fetchRectangle(parentNodeModel.id);
        const height = Number(rect.getAttributeNS(null, `height`));
        const width = Number(rect.getAttributeNS(null, `width`));
        const sourceBox = {x: parentNodeModel.x,
            y: parentNodeModel.y,
            height,
            width};
        const edge = this.svg.createEdgeToCursor(parentNodeModel.id, sourceBox);
        this._playgroundSvg.appendChild(edge);
        this.currentNodeModel = parentNodeModel;
        document.addEventListener(`mousemove`, this._boundLinkNodes);
        document.addEventListener(`mouseup`, this._boundFinalizeEdge);
    }

    toggleExpand(e) {
        e.stopPropagation();
        const id = this.svg.fetchTargetId(e.target);
        const nodeModel = this.retrieveNodeModel(id);
        nodeModel.isExpanded = !nodeModel.isExpanded;
        this.showExpand(nodeModel);
        this.dispatchEvent(new CustomEvent(`event-node-updated`, {
            detail: {nodeModel}
        }));
    }

    eventNodeSelected(e) {           // on mousedown  applied during jag-node create
        const nodeModelId = this.svg.fetchTargetId(e.target);
        const rectangle = this.svg.fetchRectangle(nodeModelId);
        rectangle.setAttributeNS(null, `cursor`, `grabbing`);
        this.unselectEverything();
        const selectedNodeModel = this.retrieveNodeModel(nodeModelId);
        if ((e.ctrlKey) || (!selectedNodeModel.isExpanded)) {
            selectedNodeModel.gatherDescendents().forEach((descendant) => {
                this._selectedActivityNodeMap.set(descendant.id, descendant);
                this.svg.selectNode(this._playgroundSvg, descendant);
            });
        }
        this._selectedActivityNodeMap.set(selectedNodeModel.id, selectedNodeModel);
        this.svg.selectNode(this._playgroundSvg, selectedNodeModel);
        this.svgCursor = this.screenToSVGCoords(e);   // transform screen to svg

        this.svgCursor.x = Math.round(e.x);
        this.svgCursor.y = Math.round(e.y);

        this.svgSelectedItems = {incomingEdges: [],
            outgoingEdges: [],
            nodes: new Map()};
        this._selectedActivityNodeMap.forEach((value, key) => {
            const incomingEdge = this.svg.fetchEdgeTo(key);
            const outgoingEdges = this.svg.fetchEdgesFrom(key);
            const node = this.svg.fetchNodeGroup(key);
            if (incomingEdge) {
                this.svgSelectedItems.incomingEdges.push(incomingEdge);
            }
            this.svgSelectedItems.outgoingEdges = [...this.svgSelectedItems.outgoingEdges, ...Array.from(outgoingEdges)];
            this.svgSelectedItems.nodes.set(key, node);
        });

        const selectedNodeArray = Array.from(this._selectedActivityNodeMap.values());
        this.dispatchEvent(new CustomEvent(`event-nodes-selected`, {
            detail: {selectedNodeArray}
        }));

        this._playgroundWrapperDiv.addEventListener(`mousemove`, this._boundDragNode);
        this._playgroundWrapperDiv.addEventListener(`mouseup`, this._boundStopDraggingNode);
        this._playgroundWrapperDiv.addEventListener(`mouseleave`, this._boundStopDraggingNode);
    }

    svgMouseDownEvent(e) {
        // When background is clicked - few things happen:
        // 1) Everything is unselected - let controller know.
        // 2) Prepare for panning

        const unselectedNodeArray = this.selectedNodes;
        this.unselectEverything();
        const selectedNodeArray = this.selectedNodes;
        this.dispatchEvent(new CustomEvent(`event-playground-clicked`, {
            detail: {
                // selectedNodeArray,
                // unselectedNodeArray
            }
        }));

        // The background clicker - AS SEEN IN TIMEVIEW
        this.windowSize = this.getBoundingClientRect();
        this._initialMouse = {
            x: e.clientX,
            y: e.clientY
        };

        this.addEventListener(`mousemove`, this._boundDragView);
        this.addEventListener(`mouseup`, this._boundStopDragView);
    }

    /**
     *    mousemove events
     */

    dragNode(e) {
        e.preventDefault();
        const diffX = this.applyZoom(Math.round(e.x - this.svgCursor.x));
        const diffY = this.applyZoom(Math.round(e.y - this.svgCursor.y)); // Diff between cursor start and now.

        this.svgSelectedItems.nodes.forEach((nodeGroup, key) => {
            // A static position can be found as x,y in the nodeModel in selectedItems map
            const id = this.svg.fetchTargetId(nodeGroup);
            const nodeModel = this._selectedActivityNodeMap.get(id);
            this.svg.modifyTransform(nodeGroup, nodeModel, diffX, diffY);
        });
        this.svgSelectedItems.incomingEdges.forEach((edge) => {
            this.svg.changeDestination(this.svgSelectedItems, edge);
        });
        this.svgSelectedItems.outgoingEdges.forEach((edge) => {
            this.svg.changeSource(this.svgSelectedItems, edge);
        });
    }

    signalPossibleChild(e) {
        e.stopPropagation();
        e.preventDefault();
        const id = this.svg.fetchTargetId(e.target);
        const nodeModel = this._viewedProjectsMap.get(id);
        this.svg.signalPossibleChild(this._playgroundSvg, nodeModel);
    }

    stopDraggingNode(e) {
        e.preventDefault();
        const nodeModelId = this.svg.fetchTargetId(e.target);
        console.log(`00`);
        console.log(nodeModelId);
        const nodeGroup = this.svg.fetchNodeGroup(nodeModelId);
        nodeGroup.setAttributeNS(null, `cursor`, `grab`);

        const movedNode = this.retrieveNodeModel(nodeModelId);
        const rootNode = this._viewedProjectsMap.get(movedNode.projectId);
        this.svgSelectedItems.nodes.forEach((nodeItem) => {
            const id = this.svg.fetchTargetId(nodeItem);

            const nodeModel = this._selectedActivityNodeMap.get(id);

            const transformString = nodeItem.getAttributeNS(null, `transform`);
            const transformComponents = this.svg.parse(transformString);
            const groupTransformX = Number(transformComponents.translate[0]);
            const groupTransformY = Number(transformComponents.translate[1]);
            const deltaX = groupTransformX - nodeModel.x;
            const deltaY = groupTransformY - nodeModel.y;
            if ((deltaX !== 0) || (deltaY !== 0)) {
                nodeModel.x = groupTransformX;
                nodeModel.y = groupTransformY;
            }
        });
        this.dispatchEvent(new CustomEvent(`event-node-updated`, {    // event-nodes-updated (or send an array of updates)
            detail: {nodeModel: rootNode}
        }));
        this._playgroundWrapperDiv.removeEventListener(`mousemove`, this._boundDragNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseup`, this._boundStopDraggingNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseleave`, this._boundStopDraggingNode);
    }


    screenToSVGCoords(e) {
        // Read the SVG's bounding rectangle...
        const canvasRect = this._playgroundSvg.getBoundingClientRect();
        // ...and transform clientX / clientY to be relative to that rectangle
        return {
            x: Math.round(e.clientX - canvasRect.x),
            y: Math.round(e.clientY - canvasRect.y)
        };
    }

    toggleColor() {
        this.hasColor = !this.hasColor;
        this._refreshPlayground();
    }

    /**
     *    -- mouseup
     */

    finalizeEdge(ev) {
        const edge = this.svg.fetchEdgeToCursor();
        const parentNodeId = this.svg.fetchEdgeSourceId(edge);
        const parentNodeModel = this.retrieveNodeModel(parentNodeId);
        const childNodeId = this.svg.fetchTargetId(ev.target);
        const childNodeModel = this._viewedProjectsMap.get(childNodeId);
        document.removeEventListener(`mousemove`, this._boundLinkNodes);
        document.removeEventListener(`mouseup`, this._boundFinalizeEdge);
        this.viewedProjects.forEach((project) => {
            if (project.id !== parentNodeModel.projectId) {
                const nodeGroup = this.svg.fetchNodeGroup(project.id);
                nodeGroup.classList.remove(`possibleChild`);   // the other way
                nodeGroup.removeEventListener(`mouseenter`, this._boundSignalPossibleChild);
                nodeGroup.removeEventListener(`mouseleave`, this._boundRestoreNormalColor);
                this.svg.unselectNode(this._playgroundSvg, project);
            }
        });

        this.svg.unselectNode(this._playgroundSvg, parentNodeModel);
        edge.remove();

        if (this._viewedProjectsMap.has(childNodeId) && (childNodeId !== parentNodeId)) {
            if (window.confirm(`Are you sure you want to add this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                this.dispatchEvent(new CustomEvent(`event-nodes-connected`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        projectNodeId: parentNodeModel.projectId,
                        parentNodeId: parentNodeModel.id,
                        childNodeId: childNodeModel.id
                    }
                }));
            }
        }
    }


    onKeyDown(event) {
        event.stopImmediatePropagation();
        // const $node = event.target;
        if (event.key === `Delete`) {
            if (this._selectedEdge) {
                // const sourceNodeId = this.svg.fetchEdgeSourceId(this._selectedEdge);
                // const sourceNode = this.retrieveNodeModel(sourceNodeId);
                const destinationNodeId = this.svg.fetchEdgeDestinationId(this._selectedEdge);

                const destinationNode = this.retrieveNodeModel(destinationNodeId);
                if (window.confirm(`Are you sure you want to disconnect this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                    const parentActivity = destinationNode.parent.activity;
                    const childActivityChildId = destinationNode.childId;
                    const remainingChildren = parentActivity._children.filter((entry) => {
                        return entry.id !== childActivityChildId;
                    });
                    parentActivity.children = remainingChildren;
                    this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                        detail: {activity: parentActivity}
                    }));
                    this.dispatchEvent(new CustomEvent(`event-promote-project`, {
                        detail: {node: destinationNode}
                    }));

                    // this._selectedActivityNodeMap.delete(selectedNodeModel.id);
                    this.unselectEverything();
                    this.dispatchEvent(new CustomEvent(`event-playground-clicked`, {
                        detail: {}
                    }));
                }
            } else
            if (this._selectedActivityNodeMap.size > 1) {
                alert(`Can only clear/disconnect one selected item`);
            } else if (this._selectedActivityNodeMap.size < 1) {
                alert(`Must select at least one item to clear/disconnect`);
            } else {
                // if the selected node is a root - then clear the project from the tree (manually remove graphics in clearPlayground)
                // if the selected node is a non-root node - then disconnect the jag from its parent (triggers DB update which auto redraws graphics)
                const selectedNodeModel = [...this._selectedActivityNodeMap.values()][0];
                if (selectedNodeModel.isRoot()) {
                    this.deleteNodeModel(selectedNodeModel.projectId);
                } else {
                    if (window.confirm(`Are you sure you want to disconnect this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                        const parentActivity = selectedNodeModel.parent.activity;
                        const childActivityChildId = selectedNodeModel.childId;
                        const remainingChildren = parentActivity._children.filter((entry) => {
                            return entry.id !== childActivityChildId;
                        });
                        parentActivity.children = remainingChildren;
                        this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                            detail: {activity: parentActivity}
                        }));
                        this.unselectEverything();
                    }
                }
                this.dispatchEvent(new CustomEvent(`event-playground-clicked`, {
                    detail: {}
                }));
            }
        }
    }


    restoreNormalColor(e) {
        const id = this.svg.fetchTargetId(e.target);
        const nodeModel = this._viewedProjectsMap.get(id);
        this.svg.unselectNode(this._playgroundSvg, nodeModel);
    }

    saveNode(node) {
        const projectId = node.projectId;
        const project = this._viewedProjectsMap.get(projectId);
        let projectNode;

        this.dispatchEvent(new CustomEvent(`event-node-updated`, {    // event-nodes-updated (or send an array of updates)
            detail: {nodeModel: node}
        }));
    }

    translate(node, offset) {
        node.x = node.x + offset.x;
        node.y = node.y + offset.y;
        node.children.forEach((child) => {
            return this.translate(child, offset);
        });
        return node;
    }

    shift() {
        this.viewedProjects.forEach((project) => {
            const workStack = [];
            let lowX = project.x;
            let highX = project.x;
            let lowY = project.y;
            let highY = project.y;

            workStack.push(project);
            while (workStack.length > 0) {
                const currentNode = workStack.pop();
                if (currentNode.x < lowX) {
                    lowX = currentNode.x;
                }
                if (currentNode.x > highX) {
                    highX = currentNode.x;
                }
                if (currentNode.y < lowY) {
                    lowY = currentNode.y;
                }
                if (currentNode.y > highY) {
                    highY = currentNode.y;
                }
                currentNode.children.forEach((child) => {
                    workStack.push(child);
                });
            }

            if ((lowX < 0) || (lowY < 0)) {
                const workStack = [];
                workStack.push(project);
                while (workStack.length > 0) {
                    const currentNode = workStack.pop();
                    if (lowX < 0) {
                        currentNode.x = currentNode.x + Math.abs(lowX);
                    }
                    if (lowY < 0) {
                        currentNode.y = currentNode.y + Math.abs(lowY);
                    }
                    currentNode.children.forEach((child) => {
                        workStack.push(child);
                    });
                }
            }
        });
    }

    get selectedNodes() {
        const selectedIdArray = Array.from(this._selectedActivityNodeMap.values());
        return selectedIdArray;
    }

    get viewedProjects() {
        const viewedRootNodes = Array.from(this._viewedProjectsMap.values());
        return viewedRootNodes;
    }

    // Find the equivalent Node Model if it exists as child of one of the displayed JAGS.
    retrieveNodeModel(id) {
        let nodeRetrieved;
        for (const project of this._viewedProjectsMap.values()) {
            const findNode = project.findChildById(id);
            if (findNode) {
                nodeRetrieved = findNode;
            }
        }
        return nodeRetrieved;
    }


    unselectEverything() {
        this._selectedActivityNodeMap.forEach((value, key) => {
            this._selectedActivityNodeMap.delete(value.id);  // redundant with the clear below?
            this.svg.unselectNode(this._playgroundSvg, value);
        });
        if (this._selectedEdge) {
            this.svg.unselectEdge(this._playgroundSvg, this._selectedEdge);
            this._selectedEdge = null;
        }
        this._selectedActivityNodeMap.clear();
    }


    collapseAll(nodeModel) {
        const edge = this.svg.fetchEdgeTo(nodeModel.id);
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        nodeGroup.classList.add(`hidden`);
        edge.classList.add(`hidden`);
        nodeModel.children.forEach((child) => {
            this.collapseAll(child);
        });
    }


    showExpand(nodeModel) {
        nodeModel.children.forEach((child) => {
            if (nodeModel.isExpanded) {
                const edge = this.svg.fetchEdgeTo(child.id);
                const nodeGroup = this.svg.fetchNodeGroup(child.id);
                nodeGroup.classList.remove(`hidden`);
                edge.classList.remove(`hidden`);
                this.showExpand(child);
            } else {
                this.collapseAll(child);
            }
        });
    }


    labelWidth(svgText) {
        const bbox = svgText.getBBox();
        const {width} = bbox;
        return width;
    }

    // Rename this to refreshPlayground (to match the timeview pattern)
    _rebuildNodeView(projectNodeModel) {
        // if ((!projectNodeModel.x) || (!projectNodeModel.y)) {  // @todo find a decent x,y
        //     projectNodeModel.x = 20;   // 30 + Math.floor(Math.random() * 20);
        //     projectNodeModel.y = 20; // Math.floor((this.clientHeight / 2) + (Math.random() * 70));
        // }
        this._viewedProjectsMap.set(projectNodeModel.id, projectNodeModel);
        this._refreshPlayground();
    }

    _refreshPlayground() {
        this.shift();
        // delete the svg
        this.svg.clearBackground(this.svg.fetchBackground(`jag`));
        // if projectNodeModel is Root ->  add it to the list of viewed trees. (viewedProjectsMap)
        // if not - remove it from the list of viewed trees. (viewedProjectsMap)
        this._viewedProjectsMap.forEach((value, key) => {
            if (!value.isRoot()) {
                this._viewedProjectsMap.delete(value.id);
            }
            // draw everything in the viewed trees (viewedProjectsMap)
            // concerns: svg is a finite area - might have to grow svg
            // timeview - this.treeHeight = nodeModel.findTreeHeight();  // not really needed if x-y are present
            this.treeHeight = value.findTreeHeight();
            // equiv to this._buildNodeViewFromNodeModel
        });
        const background = this.svg.fetchBackground(`jag`);
        this.buildJointActivityGraphs(background, this._viewedProjectsMap);
        this._selectedActivityNodeMap.forEach((value, key) => {
            this._selectedActivityNodeMap.set(value.id, value); // ?
            this.svg.selectNode(this._playgroundSvg, value);
        });
        this.windowSize = this.getBoundingClientRect();  // I'd recommend getBBox (which is part of SVG 1.1) o
        this.redrawSvg();
    }


    buildJointActivityGraphs(svg, viewedJagRoots) {
        //       let jagScope = new PlaygroundBox();
        viewedJagRoots.forEach((jagRoot) => {
            this.buildJointActivityGraph(svg, jagRoot);
            this.showExpand(jagRoot);
        });
    }

    buildJointActivityGraph(parentGroup, nodeModel) {
        const nodeBox = {x: nodeModel.x,
            y: nodeModel.y,
            width: 0,
            height: 0};

        const subgroup = this.svg.createSubGroup(nodeModel.id);
        const subgroupTop = subgroup.firstChild;
        const nodeContentGroup = this.svg.createNodeGroup(nodeModel.id);
        this.svg.positionItem(nodeContentGroup, Math.round(nodeModel.x), Math.round(nodeModel.y));
        parentGroup.appendChild(subgroup);
        subgroup.insertBefore(nodeContentGroup, subgroupTop);

        const labelElement = this.svg.createTextElement(nodeModel.name, nodeModel.id);
        const svgText = this.svg.positionItem(labelElement, this.svg.LABEL_INDENT, 0);
        const groupTop = nodeContentGroup.firstChild;
        nodeContentGroup.insertBefore(svgText, groupTop);
        nodeBox.height = this.svg.STANDARD_BOX_HEIGHT;
        nodeBox.width = Math.round(this.labelWidth(labelElement) + (this.svg.LABEL_INDENT * 3) + this.svg.BUTTON_SIZE);
        const svgRect = this.svg.createRectangle(nodeBox.width, nodeBox.height, nodeModel.id);
        this.svg.positionItem(svgRect, 0, 0);

        this.svg.applyDepthEffect(svgRect, nodeModel.treeDepth, this.treeHeight);
        if (this.hasColor) {
            this.svg.applyColorDepthEffect(svgRect, nodeModel.treeDepth, this.treeHeight);
        }
        nodeContentGroup.insertBefore(svgRect, svgText);


        this.svgSize.width = Math.max(this.svgSize.width, nodeBox.x + nodeBox.width);
        this.svgSize.height = Math.max(this.svgSize.height, nodeBox.y + nodeBox.height);

        if (nodeModel.hasChildren()) {
            const showButton = this.svg.createExpandButton(nodeModel.id, nodeBox.width, nodeBox.height, nodeModel.isExpanded);
            // showButton.addEventListener(`mousedown`, this.toggleExpand.bind(this));
            showButton.classList.add(`button`);
            nodeContentGroup.insertBefore(showButton, svgText);
        }
        if (this._viewedProjectsMap.size > 1) {
            const addButton = this.svg.createAddButton(nodeModel.id, nodeBox.width, nodeBox.height);
            this.svg.applyDepthEffect(addButton, nodeModel.treeDepth, this.treeHeight);
            // addButton.addEventListener(`mousedown`, this.addNode.bind(this));
            addButton.classList.add(`button`);
            nodeContentGroup.insertBefore(addButton, svgText);
        }


        nodeModel.children.forEach((child) => {
            const subNodeBox = this.buildJointActivityGraph(subgroup, child);
            const svgEdge = this.svg.createEdge(nodeModel.id, child.id, nodeBox, subNodeBox);
            svgEdge.addEventListener(`mousedown`, this.mousedownController.bind(this));
            subgroup.appendChild(svgEdge);
        });
        return nodeBox;
    }

    selectEdge(e) {
        this.unselectEverything();
        const edge = e.target;
        const edgeSourceId = this.svg.fetchEdgeSourceId(edge);
        const edgeDestinationId = this.svg.fetchEdgeDestinationId(edge);
        this._selectedEdge = edge;
        edge.setAttributeNS(null, `stroke`, `orange`);
    }

    // Definitely Used
    onEdgeInitialized(e, node) {
        this.removeEventListener(`mousemove`, this._boundDragView);
        this.removeEventListener(`mouseup`, this._boundStopDragView);
        this.addEventListener(`mousemove`, this._boundOnEdgeUpdated);
        this.addEventListener(`mouseup`, this._boundOnEdgeCanceled);

        this._created_edge = this._createEdge(node);
        this._is_edge_being_created = true;

        const [x, y] = this.fromClientToPlaygroundCoordinates(e.clientX, e.clientY);
        this._created_edge.setEnd(x, y);
    }

    /**
    Everything Edges - Definitely Used
    */

    _createEdge(origin, id = undefined) {
        const edge = new EdgeElement(this._playgroundSvg);
        edge.setLeadActivityNode(origin);
        if (id) {
            edge.setChildId(id);
        }
        edge.addEventListener(`keydown`, this.onKeyDown.bind(this));
        return edge;
    }

    fromClientToPlaygroundCoordinates(x, y) {
        const px = x - this.offsetLeft;
        const py = y - this.offsetTop;
        return [px, py];
    }


    onEdgeUpdated(e) {
        if (!this._is_edge_being_created) {
            return;
        }

        const [x, y] = this.fromClientToPlaygroundCoordinates(e.clientX, e.clientY);
        this._created_edge.setEnd(x, y);
    }

    onEdgeFinalized(e) {
        const node = e.target.offsetParent;

        if (!this._is_edge_being_created) {
            return;
        }

        if (window.confirm(`Are you sure you want to add this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
            this._is_edge_being_created = false;
            this._created_edge.setSubActivityNode(node);                // a lot happens in here
            this._created_edge.addEventListener(`event-nodes-selected`, this._boundHandleEdgeSelected);

            // identical issue below
            // parentActivity.addChild(childActivity);       @TODO Where did this parent obtain the child.  It works but dont know where it came from.
            // JAG.AddChild happens way down when jag-node.completeOutEdge finishes.
            // @TODO consider bringing it up here (separation of functionality)

            const parentNodeModel = this._created_edge._leadActivityNode.nodeModel;
            const childNodeModel = this._created_edge._subActivityNode.nodeModel;

            // childNodeModel.parent = parentNodeModel;
            // childNodeModel.childId = this._created_edge._childId
            // parentNodeModel.addChild(childNodeModel);

            //  @TODO -- Maybe the 'join new project stuff should go here?' -- setAttribute(project,newAncestor)  +  reparent
            //  @TODO -- half thought update Jag should come first - but now think the order is good... thoughts?

            this.dispatchEvent(new CustomEvent(`event-nodes-connected`, {
                bubbles: true,
                composed: true,
                detail: {
                    projectNodeId: parentNodeModel.projectId,
                    parentNodeId: parentNodeModel.id,
                    childNodeId: childNodeModel.id
                }
            }));

            //   //      this._viewedProjectsMap.delete(childNodeModel.id)
        } else {
            this.cancelEdge();
        }
    }

    cancelEdge() {
        if (!this._is_edge_being_created) {
            return;
        }

        this.removeEventListener(`mousemove`, this._boundOnEdgeUpdated);
        this.removeEventListener(`mouseup`, this._boundOnEdgeCanceled);

        this._created_edge.destroy();
        this._created_edge = undefined;
        this._is_edge_being_created = false;
    }

    onEdgeCanceled(e, node) {
        this.cancelEdge();
    }


    /**
     *
     * playgroundClicked
     * cancelDefault
     * onImport
     */


    // //////////////////////////////////////////////////////////////////////
    // ///////////  Called from ControllerAT  ///////////////////////////////
    // //////////////////////////////////////////////////////////////////////
    /**
     *
     * Handlers for ControllerAT
     *
     * _buildNodeViewFromNodeModel
     * _handleNewActivityActivityPopup
     * clearPlayground                        - Clears project(s) from playground (@arg: project Id or 'undefined' for all active projects)
     * handleClearSelected (@TODO)
     * handleRefresh
     * affectProjectView
     * _addActivityNodeTree
     * replaceActivityNode
     * createActivityNode  - called on new Project message from above
     * deleteNodeModel
     */

    findLongestAtEachDepth(rootNode) {
        const depthToLengthArray = [];
        const startingLevel = rootNode.treeDepth;
        const workStack = [];
        workStack.push(rootNode);
        while (workStack.length > 0) {
            const currentNode = workStack.pop();
            const currentRect = this.svg.fetchRectangle(currentNode.id);
            const currentRectLength = Number(currentRect.getAttributeNS(null, `width`));
            if ((depthToLengthArray[currentNode.treeDepth - startingLevel] === undefined) ||
                (depthToLengthArray[currentNode.treeDepth - startingLevel] < currentRectLength)) {
                depthToLengthArray[currentNode.treeDepth - startingLevel] = currentRectLength;
            }
            if (currentNode.isExpanded) {
                currentNode.children.forEach((child) => {
                    workStack.push(child);
                });
            }
        }
        return depthToLengthArray;
    }

    xIndentForDepth(longestAtEachDepthArray, margin) {
        const indentArray = [];
        indentArray[0] = margin;
        for (let depth = 1; depth < longestAtEachDepthArray.length; depth++) {
            indentArray[depth] = longestAtEachDepthArray[depth - 1] + margin + indentArray[depth - 1];
        }
        return indentArray;
    }

    redrawSelectedNodes() {
        const horizontalMargin = 50;
        let xIndentArray = [];
        let startTreeDepth = 0;
        let leafCount = 0;
        const boxHeight = this.svg.STANDARD_BOX_HEIGHT;
        const verticalMargin = 15;
        const startPoint = new Point();
        const offsetPoint = new Point();

        function layoutTree(nodeModel) {
            if ((nodeModel.hasChildren()) && (nodeModel.isExpanded)) {
                let childrenVerticalRange = 0;
                nodeModel.children.forEach((child) => {
                    child = layoutTree(child);
                    childrenVerticalRange = childrenVerticalRange + child.y;
                });
                nodeModel.x = xIndentArray[nodeModel.treeDepth - startTreeDepth];
                nodeModel.y = (childrenVerticalRange / nodeModel.children.length);
                return nodeModel;
            } else {
                nodeModel.x = xIndentArray[nodeModel.treeDepth - startTreeDepth];
                nodeModel.y = (leafCount * (boxHeight + verticalMargin));
                leafCount = leafCount + 1;
                return nodeModel;
            }
        }

        this.selectedNodes.forEach((node) => {
            const longestAtEachDepthArray = this.findLongestAtEachDepth(node);
            xIndentArray = this.xIndentForDepth(longestAtEachDepthArray, horizontalMargin);
            startTreeDepth = node.treeDepth;
            startPoint.x = node.x;
            startPoint.y = node.y;
            node = layoutTree(node);
            offsetPoint.x = startPoint.x - node.x;
            offsetPoint.y = startPoint.y - node.y;
            node = this.translate(node, offsetPoint);
            this.saveNode(node);
        });
    }

    _handleNewActivityActivityPopup(e) {
        const $initiator = document.getElementById(`menu-new`);
        this.popup({
            content: AtPlayground.NOTICE_CREATE_JAG,
            trackEl: this,
            inputs: {}, // event: e},
            highlights: [$initiator]
        });
    }


    clearPlayground(projectId = undefined) {
        this._viewedProjectsMap.delete(projectId);
        this._refreshPlayground();
        for (const jagNode of this._activeActivityNodeElementSet) {
            if ((projectId == undefined) || (jagNode.nodeModel.projectId === projectId)) {
                this._activeActivityNodeElementSet.delete(jagNode);
            }
        }
    }

    deleteNodeModel(deadId) {
        this._viewedProjectsMap.delete(deadId);
        this._selectedActivityNodeMap.delete(deadId);
        this._refreshPlayground();
    }


    deleteActivity(deletedUrn) {             // Activity got updated - does it affect our projects?
        this._viewedProjectsMap.forEach((value, key) => {
            const node = value;
            if (node.isActivityInProject(deletedUrn)) {
                this.dispatchEvent(new CustomEvent(`response-activity-deleted`, {
                    detail: {
                        projectModelId: node.id,
                        activityUrn: deletedUrn
                    }
                })); // event-activity-created in playground uses node
            }
        });
    }


    // replaceActivityNode(newActivity, deadUrn) {
    //     this._activeActivityNodeElementSet.forEach((node) => {
    //         if (node.nodeModel.activity.urn === deadUrn) {
    //             node.nodeModel.activity = newActivity;
    //         }
    //     });
    // }

    // this is called when a new jag appears from above --- applies?
    // note: creates a view based on Activity xxx now NodeModel
    // createActivityNode(nodeModel) {
    //     const $node = new ActivityNodeElement(nodeModel);
    //     $node.addEventListener(`mousedown`, this.handlePlaygroundSelectedNodes.bind(this));
    //
    //     $node.addEventListener(`keydown`, this.onKeyDown.bind(this));
    //
    //     $node.addEventListener(`drag`, () => {
    //         this._checkBounds();
    //     });
    //
    //     $node.addEventListener(`toggle-visible`, (e) => {
    //         if (e.detail) {
    //             this._checkBounds($node.getTree());
    //         } else {
    //             this._checkBounds();
    //         }
    //     });
    //
    //     // //?? @TODO think about this.
    //     $node.addEventListener(`refresh`, (e) => {
    //         this.dispatchEvent(new CustomEvent(`refresh`, {detail: e.detail}));
    //     });
    //     // Are these two below not the same info.  activeNodeSet needed?
    //
    //     $node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
    //     $node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));
    //
    //     this._activeActivityNodeElementSet.add($node);
    //     this._playgroundSvg.appendChild($node);
    //     return $node;
    // }


    // getNodeViewById(id) {
    //     for (const node of this._activeActivityNodeElementSet) {           // search through active elements
    //         if (node.nodeModel.id === id) {         // is this node in the tree of the currentNodeModel?
    //             return node;
    //         }
    //     }
    // }

    addNodeModel(projectNodeModel) {
        this._viewedProjectsMap.set(projectNodeModel.projectId, projectNodeModel);
        const $rootNode = this._buildNodeViewFromNodeModel(projectNodeModel);
        return $rootNode;
    }


    // //////////////////////////////////////////////////////////////////////
    // ///////////  Support Functions  //////////////////////////////////////
    // //////////////////////////////////////////////////////////////////////
    /**
     *
     * Support Functions
     *
     * _traverseActivityNodeTree    : Required by : _buildNodeViewFromNodeModel, handleRefresh, _addActivityNodeTree
     * deselectAll                  : Required by : playgroundClicked
     * onKeyDown                    : Required by : createActivityNode
     * _getNodePreferredHeight      : Required by : _traverseActivityNodeTree
     *
     */

    _getNodePreferredHeight(jagNode, jagNodeMap) {
        if (!jagNode.children || jagNode.children.length === 0) {
            return 1;
        }

        return jagNode.children.reduce((cut_set_size, child) => {
            const def = jagNodeMap.get(child.urn);
            return cut_set_size + (def ? this._getNodePreferredHeight(def, jagNodeMap) : 0);
        }, 0);
    }


    _eventImportJagHandler(e) {
        const $initiator = document.getElementById(`menu-new`);
        this.popup({
            content: AtPlayground.NOTICE_PASTE_JAG,
            trackEl: this,
            inputs: {}, // event: e},
            highlights: [$initiator]
        });
    }

    /**
     * Timeview imported Events
     */
    svgWheelZoomEvent(event) {
        // The wheel of Zoom - AS SEEN IN TIMEVIEW
        event.preventDefault();
        if (event.deltaY > 0) {
            this.zoomStep = this.zoomStep + 1;
        } else {
            this.zoomStep = this.zoomStep - 1;
        }
        this.redrawSvg();
    }


    dragView(e) {
        // The svg dragged by mouse - AS SEEN IN TIMEVIEW
        const zoomedBoxWidth = this.applyZoom(this.windowSize.width);
        const zoomedBoxHeight = this.applyZoom(this.windowSize.height);
        const svgViewSizeX = this.svgSize.width;
        const svgViewSizeY = this.svgSize.height;

        if (zoomedBoxWidth > svgViewSizeX) {
            this.panPosition.x = 0;
        } else {
            const delta = this.applyZoom(this._initialMouse.x - e.clientX);
            this.panPosition.x = Math.min(
                this.svgLocation.x + delta,
                svgViewSizeX - zoomedBoxWidth
            );
        }
        if (zoomedBoxHeight > svgViewSizeY) {
            this.panPosition.y = 0;
        } else {
            const delta = this.applyZoom(this._initialMouse.y - e.clientY);
            this.panPosition.y = Math.min(
                this.svgLocation.y + delta,
                svgViewSizeY - zoomedBoxHeight
            );
        }
        if (this.panPosition.x < 0) {
            this.panPosition.x = 0;
        }
        if (this.panPosition.y < 0) {
            this.panPosition.y = 0;
        }
        this.redrawSvg();
    }

    stopDragView() {
        // The svg not being dragged by mouse - AS SEEN IN TIMEVIEW
        this.removeEventListener(`mousemove`, this._boundDragView);
        this.svgLocation.x = this.panPosition.x;
        this.svgLocation.y = this.panPosition.y;
    }

    applyZoom(num) {
        const zoomedNum = num + (num * this.zoomStep * 0.05);
        return zoomedNum;
    }

    redrawSvg() {
        const zoomedBoxWidth = this.applyZoom(this.windowSize.width);
        const zoomedBoxHeight = this.applyZoom(this.windowSize.height);
        if ((zoomedBoxWidth > 0) && (zoomedBoxHeight > 0)) {
            this._playgroundSvg.setAttribute(
                `viewBox`,
                `${this.panPosition.x} ${this.panPosition.y}  ${zoomedBoxWidth}  ${zoomedBoxHeight}`
            );
        }
    }


    copyStylesInline(destinationNode, sourceNode) {
        const containerElements = [`svg`, `g`];
        for (let cd = 0; cd < destinationNode.childNodes.length; cd++) {
            const child = destinationNode.childNodes[cd];
            if (containerElements.indexOf(child.tagName) != -1) {
                this.copyStylesInline(child, sourceNode.childNodes[cd]);
                continue;
            }
            const style = sourceNode.childNodes[cd].currentStyle || window.getComputedStyle(sourceNode.childNodes[cd]);
            if (style == `undefined` || style == null) {
                continue;
            }
            for (let st = 0; st < style.length; st++) {
                child.style.setProperty(style[st], style.getPropertyValue(style[st]));
            }
        }
    }


    triggerDownload(imgURI, fileName) {
        const evt = new MouseEvent(`click`, {
            view: window,
            bubbles: false,
            cancelable: true
        });
        const a = document.createElement(`a`);
        a.setAttribute(`download`, fileName);
        a.setAttribute(`href`, imgURI);
        a.setAttribute(`target`, `_blank`);
        a.dispatchEvent(evt);
    }

    downloadSvg(svg, fileName) {
        const copy = svg.cloneNode(true);
        this.copyStylesInline(copy, svg);
        const canvas = document.createElement(`canvas`);
        const bbox = svg.getBBox();
        canvas.width = bbox.width;
        canvas.height = bbox.height;
        const ctx = canvas.getContext(`2d`);
        ctx.clearRect(0, 0, bbox.width, bbox.height);
        const data = (new XMLSerializer()).serializeToString(copy);
        const DOMURL = window.URL || window.webkitURL || window;
        const img = new Image();
        const svgBlob = new Blob([data], {type: `image/svg+xml;charset=utf-8`});
        const url = DOMURL.createObjectURL(svgBlob);
        img.onload = this.printIt(ctx, img, DOMURL, canvas, url, fileName).bind(this);
        img.src = url;
    }

    printIt(ctx, img, DOMURL, canvas, url, fileName) {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
        if (typeof navigator !== `undefined` && navigator.msSaveOrOpenBlob) {
            const blob = canvas.msToBlob();
            navigator.msSaveOrOpenBlob(blob, fileName);
        } else {
            const imgURI = canvas.
                toDataURL(`image/png`).
                replace(`image/png`, `image/octet-stream`);
            this.triggerDownload(imgURI, fileName);
        }
        document.removeChild(canvas);
    }


    printSvg(name) {
        this.svg.saveSvg(this._playgroundSvg, name);
    }


}

// END OF CLASS

AtPlayground.POPUP_TYPES = {
    WARNING: `popup-warning`,
    NOTICE: `popup-notice`,
    INFO: `popup-info`
};

// why cant this go inside scope.? Does anyone else need it?
AtPlayground.NOTICE_CREATE_JAG = Popupable._createPopup({
    type: AtPlayground.POPUP_TYPES.NOTICE,
    name: `Add New JAG Activity`,
    description: `Be precise.  You can always edit this later.`,
    properties: [
        {
            name: `name`,
            label: `Name`,
            type: `text`,
            options() {
                const eventMap = new Map();
                eventMap.set(`input`, () => {
                    const newName = UserPrefs.getDefaultUrnPrefix() + document.getElementById(`name`).value;
                    const validUrnChars = new RegExp(`[^0-9a-zA-Z:-]+`, `gu`);
                    const convName = newName.replace(` `, `-`).replace(validUrnChars, ``).toLowerCase();
                    document.getElementById(`urn`).value = convName;
                });
                return eventMap;
            }
        },
        {
            name: `urn`,
            label: `URN`,
            type: `text`,
            options() {
                const eventMap = new Map();
                return eventMap;
            }
        },
        {
            name: `description`,
            label: `Description`,
            type: `textarea`,
            options() {
                const paramMap = new Map();
                paramMap.set(`cols`, 24);
                paramMap.set(`rows`, 4);
                return paramMap;
            }
        }
    ],
    actions: [
        {
            text: `Create`,
            color: `black`,
            bgColor: `red`,
            //         action: function ({inputs: {}, outputs: activityConstruct}) {
            action({outputs: activityConstruct}) {                             // or maybe {inputs = {}, outputs: activityConstruct}
                this.dispatchEvent(new CustomEvent(`event-activity-created`, {
                    bubbles: true,
                    composed: true,
                    detail: {activityConstruct}
                }));
            }
        },
        {
            text: `Cancel`,
            color: `white`,
            bgColor: `black`
        }


    ]
    // display: ?
    // fallback: ?
    // skip: ?
});

// AtPlayground.NOTICE_REMOVE_CHILD = Popupable._createPopup({          // is this running - i want it?
//     type: AtPlayground.POPUP_TYPES.NOTICE,
//     name: `Disconnect Child`,
//     description: `Disconnect this child JAG from parent JAG?`,
//     actions: [
//         {
//             text: `Yes`,
//             color: `black`,
//             bgColor: `red`,
//             action({inputs: {node}}) {
//                 const edge = node.getParentEdge();
//                 const id = edge.getChildId();
//                 const parent = node.getParent();
//                 const jagUrn = parent.nodeModel.urn;
//                 const jagChild = {
//                     urn: node.nodeModel.urn,
//                     id: node.nodeModel.childId
//                 };
//                 const remainingChildren = parent.nodeModel.activity.children.filter((entry) => {
//                     // if (entry.id !== jagChild.id) {
//                     //     return entry;
//                     // }
//                     // xxxxx
//                     return entry.id !== jagChild.id;
//                 });
//                 parent.nodeModel.activity.children = remainingChildren;
//                 this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
//                     detail: {activity: parent.nodeModel.activity}
//                 }));
//             }
//         },
//         {
//             text: `No`,
//             color: `white`,
//             bgColor: `black`
//         }
//
//     ]
// });

// why cant this go inside scope.? Does anyone else need it?
AtPlayground.NOTICE_PASTE_JAG = Popupable._createPopup({
    type: AtPlayground.POPUP_TYPES.NOTICE,
    name: `Recreate JAG`,
    description: `Paste previously exported JAG`,
    properties: [
        {
            name: `description`,
            label: `JSON`,
            type: `textarea`,
            options() {
                const paramMap = new Map();
                paramMap.set(`cols`, 24);
                paramMap.set(`rows`, 4);
                return paramMap;
            }
        }
    ],
    actions: [
        {
            text: `Create`,
            color: `black`,
            bgColor: `red`,
            action({outputs: json}) {
                this.dispatchEvent(new CustomEvent(`event-import-jag`, {
                    bubbles: true,
                    composed: true,
                    detail: {result: json.description}
                }));
            }
        },
        {
            text: `Cancel`,
            color: `white`,
            bgColor: `black`
        },
        {
            text: `Or select a file...`,
            color: `white`,
            bgColor: `black`,
            async action() {                          //  input:{}, output:{}
                const getFiles = () => {
                    new Promise((resolve) => {
                        const input = document.createElement(`input`);
                        input.type = `file`;
                        input.onchange = () => {
                            return resolve([...input.files]);
                        };
                        input.click();
                    });
                };

                const selectedFiles = await getFiles();

                const reader = new FileReader();
                reader.addEventListener(`load`, function (event) {
                    this.dispatchEvent(new CustomEvent(`event-import-jag`, {
                        bubbles: true,
                        composed: true,
                        detail: {result: event.target.result}
                    }));
                }.bind(this));

                const selectedFile = selectedFiles[0];
                reader.readAsText(selectedFile);

                // for (let file of selectedFiles) {
                //     reader.readAsText(file);
                // }
            }
        }
    ]
    // display: ?
    // fallback: ?
    // skip: ?
});


AtPlayground.DEFAULT_CARDINAL_MULTIPLIER = 10;

AtPlayground.DEFAULT_ARROW_MULTIPLIER = 10;

AtPlayground.DEFAULT_ZOOM_MULTIPLIER = 0.9;

customElements.define(`jag-playground`, AtPlayground);

export default customElements.get(`jag-playground`);

// /         https://observablehq.com/@danburzo/drawing-svg-rectangles
