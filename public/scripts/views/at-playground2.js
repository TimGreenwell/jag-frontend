/**
 * @file AtPlayground - Visual area for authoring JAGs.  Controls the general playground environment
 * including panning, zooming, adding and removing edges/nodes.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */

import ActivityNodeElement from './at-support/jag-node.js';
import EdgeElement from './at-support/edge.js';
import Popupable from '../utils/popupable.js';
import UserPrefs from '../utils/user-prefs.js';
import PlaygroundBox from '../models/svg-box.js';
import Svg from '../utils/svg.js';
import Point from '../models/point.js';

class AtPlayground extends Popupable {

    constructor() {
        super();
        this._playgroundWrapperDiv = document.createElement(`div`);
        this._playgroundWrapperDiv.id = `playground-wrapper`;
        this.setPopupBounds(this._playgroundWrapperDiv);
        this.appendChild(this._playgroundWrapperDiv);

        this._playgroundSvg = Svg.buildSvg(`playground-svg`);
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
        this._is_edge_being_created = false;
        this.currentNodeModel = null;                      // node in focus (selected or head of selected)  // needed?  - we have selectedActivityNodeMap

        // EVENTS
        // SVG Events
        document.addEventListener(`keydown`, this.onKeyDown.bind(this));                        // ctrl for select children
        this._playgroundSvg.addEventListener(`mousedown`, this.svgMouseDownEvent.bind(this));   // background clicked (start svg panning)
        this._boundDragView = this.dragView.bind(this);                                              // pan svg
        this._boundStopDragView = this.stopDragView.bind(this);                                      // cease panning
        this._playgroundSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));       // mousewheel (zooming)

        // Node Events
        this._boundLinkNodes = this.linkNodes.bind(this);
        this._boundSignalPossibleChild = this.signalPossibleChild.bind(this);
        this._boundRestoreNormalColor = this.restoreNormalColor.bind(this);
        this._boundDragNode = this.dragNode.bind(this);
        this._boundStopDraggingNode = this.stopDraggingNode.bind(this);
        this._boundOnEdgeUpdated = this.onEdgeUpdated.bind(this);             // ?
        this._boundOnEdgeCanceled = this.onEdgeCanceled.bind(this);           // ?
        this._boundStopDragView = this.stopDragView.bind(this);               // ?
        this._boundToggleExpand = this.toggleExpand.bind(this);
    }

    shift() {


        this.viewedProjects.forEach((project) => {
            let workStack = [];
            let lowX = project.x;
            let highX = project.x;
            let lowY = project.y;
            let highY = project.y;

            workStack.push(project);
            while (workStack.length > 0) {
                let currentNode = workStack.pop();
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

            // this.svgSize.width = highX - lowX;
            // this.svgSize.height = highY - lowY;

            if ((lowX < 0) || (lowY < 0)) {


                let workStack = [];
                workStack.push(project);
                while (workStack.length > 0) {
                    let currentNode = workStack.pop();
                    if (lowX < 0) {
                        currentNode.x = currentNode.x + Math.abs(lowX);
                    }
                    if (lowY < 0) {
                        currentNode.y = currentNode.y + Math.abs(lowY);
                    }
                    console.log(`${currentNode.name} now at: ${currentNode.x}, ${currentNode.y}`)
                    currentNode.children.forEach((child) => {
                        workStack.push(child);
                    })
                }
            }


        })
    }

    get selectedNodes() {
        const selectedIdArray = Array.from(this._selectedActivityNodeMap.values());
        return selectedIdArray;
    }  // ok

    get viewedProjects() {
        const viewedRootNodes = Array.from(this._viewedProjectsMap.values());
        return viewedRootNodes;
    } // ok

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

    unselectAllNodes() {
        this._selectedActivityNodeMap.forEach((value, key) => {
            this._selectedActivityNodeMap.delete(value.id);
            Svg.unselectNode(this._playgroundSvg, value);
        });
        this._selectedActivityNodeMap.clear();
    }


    // Node Dragging
    screenToSVGCoords(e) {
        // Read the SVG's bounding rectangle...
        const canvasRect = this._playgroundSvg.getBoundingClientRect();
        // ...and transform clientX / clientY to be relative to that rectangle
        return {
            x: Math.round(e.clientX - canvasRect.x),
            y: Math.round(e.clientY - canvasRect.y)
        };
    }

    stopDraggingNode(e) {
        e.preventDefault();
        this.svgSelectedItems.nodes.forEach((nodeItem) => {
            const id = nodeItem.id.replace(`node-`, ``);
            const nodeModel = this._selectedActivityNodeMap.get(id);

            const transformString = nodeItem.getAttributeNS(null, `transform`);
            const transformComponents = Svg.parse(transformString);
            const groupTransformX = Number(transformComponents.translate[0]);
            const groupTransformY = Number(transformComponents.translate[1]);
            nodeModel.x = groupTransformX;
            nodeModel.y = groupTransformY;
            this.dispatchEvent(new CustomEvent(`event-node-updated`, {    // event-nodes-updated (or send an array of updates)
                detail: {nodeModel}
            }));
        });



        this._playgroundWrapperDiv.removeEventListener(`mousemove`, this._boundDragNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseup`, this._boundStopDraggingNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseleave`, this._boundStopDraggingNode);
    }

    dragNode(e) {
        e.preventDefault();
        const diffX = Math.round(e.x - this.svgCursor.x);
        const diffY = Math.round(e.y - this.svgCursor.y); // Diff between cursor start and now.

        this.svgSelectedItems.nodes.forEach((nodeGroup, key) => {
            // A static position can be found as x,y in the nodeModel in selectedItems map
            const nodeModel = this._selectedActivityNodeMap.get(key.replace(`node-`, ``));
            Svg.modifyTransform(nodeGroup, nodeModel, diffX, diffY);
        });
        this.svgSelectedItems.incomingEdges.forEach((edge) => {
            Svg.changeDestination(this.svgSelectedItems, edge);
        });
        this.svgSelectedItems.outgoingEdges.forEach((edge) => {
            Svg.changeSource(this.svgSelectedItems, edge);
        });
    }

    /**
                   Events
    */

    eventNodeSelected(e) {           // on mousedown  applied during jag-node create
        this.unselectAllNodes();
        const rectangle = e.target;
        const nodeModelId = rectangle.id.replace(`rect-`, ``);
        const selectedNodeModel = this.retrieveNodeModel(nodeModelId);
        if ((e.ctrlKey) || (!selectedNodeModel.isExpanded)) {
            selectedNodeModel.gatherDescendents().forEach((descendant) => {
                this._selectedActivityNodeMap.set(descendant.id, descendant);
                Svg.selectNode(this._playgroundSvg, descendant);
            });
        }
        this._selectedActivityNodeMap.set(selectedNodeModel.id, selectedNodeModel);
        Svg.selectNode(this._playgroundSvg, selectedNodeModel);
        this.svgCursor = this.screenToSVGCoords(e);   // transform screen to svg

        this.svgCursor.x = Math.round(e.x);
        this.svgCursor.y = Math.round(e.y);

        this.svgSelectedItems = {incomingEdges: [],
            outgoingEdges: [],
            nodes: new Map()};
        this._selectedActivityNodeMap.forEach((value, key) => {
            const incomingEdge = Svg.fetchEdgeTo(key);
            const outgoingEdges = Svg.fetchEdgesFrom(key);
            const node = Svg.fetchNodeGroup(key);     //*
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

        e.stopPropagation();  // Don't let it bubble up to the playgroundClicker handler.
    }


    toggleExpand(e) {
        const id = e.target.id.replace(`show-`, ``);
        let nodeModel;
        for (const project of this._viewedProjectsMap.values()) {
            const findNode = project.findChildById(id);
            if (findNode) {
                nodeModel = findNode;
            }
        }
        nodeModel.isExpanded = !nodeModel.isExpanded;
        this.dispatchEvent(new CustomEvent(`event-node-updated`, {
            detail: {nodeModel}
        }));
    }

    labelWidth(svgText) {
        const bbox = svgText.getBBox();
        const {width} = bbox;
        return width;
    }

    // Rename this to refreshPlayground (to match the timeview pattern)
    _rebuildNodeView(projectNodeModel) {
        if ((!projectNodeModel.x) || (!projectNodeModel.y)) {  //@todo find a decent x,y
            projectNodeModel.x = 20;   //30 + Math.floor(Math.random() * 20);
            projectNodeModel.y = 20; //Math.floor((this.clientHeight / 2) + (Math.random() * 70));
        }
        this._viewedProjectsMap.set(projectNodeModel.id, projectNodeModel);
        this._refreshPlayground();
    }

    _refreshPlayground() {
        this.shift();
        // delete the svg
        Svg.clearSvg(this._playgroundSvg);
        // if projectNodeModel is Root ->  add it to the list of viewed trees. (viewedProjectsMap)
        // if not - remove it from the list of viewed trees. (viewedProjectsMap)
        this._viewedProjectsMap.forEach((values, key) => {
            if (!values.isRoot()) {
                this._viewedProjectsMap.delete(values.id);
            }
            // draw everything in the viewed trees (viewedProjectsMap)
            // concerns: svg is a finite area - might have to grow svg
            // timeview - this.treeHeight = nodeModel.findTreeHeight();  // not really needed if x-y are present
            this.treeHeight = values.findTreeHeight();
            // equiv to this._buildNodeViewFromNodeModel


        });
        this.buildJointActivityGraphs(document.getElementById(`playground-svg`), this._viewedProjectsMap);
        this._selectedActivityNodeMap.forEach((value, key) => {
            this._selectedActivityNodeMap.set(value.id, value);
            Svg.selectNode(this._playgroundSvg, value);
        });
        this.windowSize = this.getBoundingClientRect();  // I'd recommend getBBox (which is part of SVG 1.1) o
        this.redrawSvg();
    }


    buildJointActivityGraphs(svg, viewedJagRoots) {
        //       let jagScope = new PlaygroundBox();
        viewedJagRoots.forEach((jagRoot) => {
            this.buildJointActivityGraph(svg, jagRoot);
        });
    }

    buildJointActivityGraph(parentGroup, nodeModel) {
        // let svgText;
        // let groupTop;


        let nodeBox = {x: nodeModel.x, y: nodeModel.y, width: 0, height: 0};

        const group = Svg.createGroup(`group-${nodeModel.id}`);
        const nodeContentGroup = Svg.createGroup(`node-${nodeModel.id}`);
        Svg.positionItem(nodeContentGroup, Math.round(nodeModel.x), Math.round(nodeModel.y));
        parentGroup.appendChild(group);
        group.appendChild(nodeContentGroup);

        const labelElement = Svg.createTextElement(`${nodeModel.name}`, `text-${nodeModel.id}`);
        const svgText = Svg.positionItem(labelElement, Svg.LABEL_INDENT, 0);
        const groupTop = nodeContentGroup.firstChild;
        nodeContentGroup.insertBefore(svgText, groupTop);
        nodeBox.height = Svg.STANDARD_BOX_HEIGHT;
        nodeBox.width = Math.round(this.labelWidth(labelElement) + (Svg.LABEL_INDENT * 3) + Svg.BUTTON_SIZE);
        const svgRect = Svg.createRectangle(nodeBox.width, nodeBox.height);
        Svg.positionItem(svgRect, 0, 0);
        svgRect.addEventListener(`mousedown`, this.eventNodeSelected.bind(this));
        svgRect.id = `rect-${nodeModel.id}`;
        Svg.applyDepthEffect(svgRect, nodeModel.treeDepth, this.treeHeight);
        nodeContentGroup.insertBefore(svgRect, svgText);

        this.svgSize.width = Math.max(this.svgSize.width, nodeBox.x + nodeBox.width);
        this.svgSize.height = Math.max(this.svgSize.height, nodeBox.y + nodeBox.height);

        if (nodeModel.hasChildren()) {
            const showButton = Svg.createShowTriangle(nodeBox.width, nodeBox.height, nodeModel.isExpanded);
            showButton.addEventListener(`mousedown`, this.toggleExpand.bind(this));
            showButton.id = `show-${nodeModel.id}`;
            nodeContentGroup.insertBefore(showButton, svgText);
        }
        if (this._viewedProjectsMap.size > 1) {
            const addButton = Svg.createAddButton(nodeBox.width, nodeBox.height);
            addButton.id = `add-${nodeModel.id}`;
            Svg.applyDepthEffect(addButton, nodeModel.treeDepth, this.treeHeight);
            addButton.addEventListener(`mousedown`, this.addNode.bind(this));
            nodeContentGroup.insertBefore(addButton, svgText);
        }


        nodeModel.children.forEach((child) => {
            const subNodeBox = this.buildJointActivityGraph(group, child);
            const svgEdge = Svg.createEdge(nodeBox, subNodeBox);
            svgEdge.id = `edge-${nodeModel.id}:edge-${child.id}`;

            group.appendChild(svgEdge);
            // const edge = this._createEdge($newViewNode, child.id);         // this wants a jag-node - not a nodeModel
            // const $childViewNode = this._buildNodeViewFromNodeModel(child);                          // first build child
            // edge.setSubActivityNode($childViewNode);                                                       // then connect tail of edge to it.
            // edge.addEventListener(`event-nodes-selected`, this._boundHandleEdgeSelected);
        });
        return nodeBox;
    }

    signalPossibleChild(e){
        e.stopPropagation();
        console.log(`I see a volunteer`);
        let id = Svg.fetchTargetId(e.target);
        let nodeModel = this._viewedProjectsMap.get(id);
        console.log(`going to light up ${nodeModel.name}`)
        Svg.signalPossibleChild(this._playgroundSvg, nodeModel);
    }

    restoreNormalColor(e){
        let id = Svg.fetchTargetId(e.target);
        let nodeModel = this._viewedProjectsMap.get(id);
        Svg.unselectNode(this._playgroundSvg, nodeModel);
    }

    addNode(e) {
        e.stopPropagation();
        //1. For every active Node - add Event listeners:
        // a) on mouse up == check if valid and add as child.
        // b) on mouse over == check if valid and light up some color
        const parentId = Svg.fetchTargetId(e.target);
        const parentNodeModel = this.retrieveNodeModel(parentId);
        const parentProjectId = parentNodeModel.projectId;
        this.viewedProjects.forEach((project) => {
            if (project.id !== parentProjectId) {
                const nodeGroup = Svg.fetchNodeGroup(project.id);
                nodeGroup.classList.add(`possibleChild`);   // the other way
                nodeGroup.addEventListener(`mouseover`, this._boundSignalPossibleChild);
                nodeGroup.addEventListener(`mouseout`, this._boundRestoreNormalColor);
            }
        });
        //2 light up some color0
        Svg.signalPossibleChild(this._playgroundSvg, parentNodeModel);
        //3 start edge following mouse
        let rect = Svg.fetchRectangle(parentNodeModel.id);
        let height = Number(rect.getAttributeNS(null, `height`));
        let width = Number(rect.getAttributeNS(null, `width`));
        let sourceBox = {x: parentNodeModel.x, y: parentNodeModel.y, height: height, width: width};
        let destBox = {x:e.x, y:e.y, height:0, width:0}


        let edge = Svg.createEdge(sourceBox, destBox);
        edge.id = `edge-${parentNodeModel.id}:cursor`;
        this._playgroundSvg.appendChild(edge);
        this.currentNodeModel = parentNodeModel;
        document.addEventListener(`mousemove`, this._boundLinkNodes);


        document.addEventListener(`mouseup`, (ev) => {
            this.viewedProjects.forEach((project) => {
                console.log("GOT A MOUSE UP!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                if (project.id !== parentProjectId) {
                    const nodeGroup = Svg.fetchNodeGroup(project.id);
                    nodeGroup.classList.remove(`possibleChild`);   // the other way
                    nodeGroup.removeEventListener(`mouseover`, this._boundSignalPossibleChild);
                    nodeGroup.removeEventListener(`mouseout`, this._boundRestoreNormalColor);
                    Svg.unselectNode(this._playgroundSvg, project);
                }
            })
            document.removeEventListener(`mousemove`, this._boundLinkNodes);
            Svg.unselectNode(this._playgroundSvg, parentNodeModel);
        })
    }

// TODO look at https://stackoverflow.com/questions/256754/how-to-pass-arguments-to-addeventlistener-listener-function   -- tomceks answwer...


    // THIS IS THE UGLIEST USING CURRENTNODEMODEL!!!  Why cant we pass arguments ?
    linkNodes(e) {
        e.stopPropagation();
        // let id = this.currentNodeModel.id;
        // let edge = Svg.fetchEdgesFrom(id).at(-1);
        let edge = Svg.fetchEdgeToCursor();
        let cursorPoint = this.screenToSVGCoords(e);
        Svg.followCursor(edge, cursorPoint);
    }



    // _handleEdgeSelected(e) {
    //     console.log(`I don't think I ever get called!!!!!!!!!!!!!!!!!!!!!!`);
    //     console.log(`Things listen - but never called at the right level`);
    //     if (e.detail.selected) {
    //         this._selectedActivityNodeSet.add(e.target);  // needs to become a MAP
    //     } else {
    //         this._selectedActivityNodeSet.delete(e.target);// needs to become a MAP
    //     }
    // }

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


    redrawSelectedNodes() {
        this.selectedNodes.forEach((node) => {
            this._redrawNodes(node);
        });
    }

    _redrawNodes(currentNodeModel, x = null, y = null) {
        const margin = 25;
        if (x && y) {
            currentNodeModel.x = x;
            currentNodeModel.y = y;
        }
        currentNodeModel.setPosition(currentNodeModel.x, currentNodeModel.y);
        const $newViewNode = this.getNodeViewById(currentNodeModel.id);
        //    const $newViewNode = this.createActivityNode(currentNodeModel)
        $newViewNode.setTranslation(currentNodeModel.x, currentNodeModel.y);

        // assume all children have same height as the parent.
        const x_offset = Math.floor(currentNodeModel.x + $newViewNode.clientWidth + margin);
        const preferred_height = currentNodeModel.leafCount * ($newViewNode.clientHeight + margin);
        let y_offset = Math.floor(currentNodeModel.y - (preferred_height / 2));


        currentNodeModel.children.forEach((child) => {
            const local_preferred_size = child.leafCount * ($newViewNode.clientHeight + margin);
            y_offset = y_offset + (local_preferred_size);
            //     let edge = this._createEdge($newViewNode, child.id);                                       // this wants a jag-node - not a nodeModel
            const $childViewNode = this._redrawNodes(child, x_offset, y_offset);                          // first build child

            //     edge.setSubActivityNode($childViewNode);                                                   // then connect tail of edge to it.
            //     edge.addEventListener('event-nodes-selected', this._boundHandleEdgeSelected);
        });

        return $newViewNode;
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
        for (const jagNode of this._activeActivityNodeElementSet) {
            if ((projectId == undefined) || (jagNode.nodeModel.projectId === projectId)) {
                jagNode.removeAllEdges();
                jagNode.detachHandlers();
                this._activeActivityNodeElementSet.delete(jagNode);
                this._playgroundSvg.removeChild(jagNode);
            }
        }
        this._checkBounds();
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

    deleteNodeModel(deadId) {
        // The deadId is a node marked for deletion.  Death can either be
        // annihilation or absorption into another project.  AtPlayground nodes
        // with an ancestor matching deadId are removed.
        // let deadIdModel = this._viewedProjectsMap.get(deadId)
        this._viewedProjectsMap.delete(deadId);
        for (const node of this._activeActivityNodeElementSet) {           // search through active elements
            //        if (node.nodeModel.projectId === deadId) {         // is this node in the tree of the currentNodeModel?
            if (!this._viewedProjectsMap.has(node.nodeModel.projectId)) {
                node.removeAllEdges();
                node.detachHandlers();
                this._activeActivityNodeElementSet.delete(node);
                this._playgroundSvg.removeChild(node);
            }
        }
    }


    getNodeViewById(id) {
        for (const node of this._activeActivityNodeElementSet) {           // search through active elements
            if (node.nodeModel.id === id) {         // is this node in the tree of the currentNodeModel?
                return node;
            }
        }
    }

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

    // deselectAll() {
    //     this._selectedActivityNodeMap.clear();
    //     this.redrawSvg();
    // }

    onKeyDown(event) {
        event.stopImmediatePropagation();
        const $node = event.target;
        if (event.key === `Delete`) {
            if (this._selectedActivityNodeMap.size > 1) {
                alert(`Can only clear/disconnect one selected item`);
            } else if (this._selectedActivityNodeMap.size < 1) {
                alert(`Must select at least one item to clear/disconnect`);
            } else {
                // if the selected node is a root - then clear the project from the tree (manually remove graphics in clearPlayground)
                // if the selected node is a non-root node - then disconnect the jag from its parent (triggers DB update which auto redraws graphics)
                // @TODO - bit ugly with two functions for 'delete'  - I cant think of alternative
                // @TODO - might consider a deleted edge to mean disconnect jag

                if ($node.nodeModel.projectId === $node.nodeModel.id) {
                    this.clearPlayground($node.nodeModel.projectId);
                    this.deselectAll();
                } else {
                    if (window.confirm(`Are you sure you want to disconnect this node as a child? (This will change all instances of the parent node to reflect this change.)`)) {
                        const parentActivity = $node.getParent().nodeModel.activity;
                        const childActivityChildId = $node.nodeModel.childId;
                        const remainingChildren = parentActivity._children.filter((entry) => {
                            // if (entry.id !== childActivityChildId) {
                            //     return entry;
                            // }
                            // xxxxxx
                            return entry.id !== childActivityChildId;
                        });
                        parentActivity.children = remainingChildren;
                        this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                            detail: {activity: parentActivity}
                        }));
                        this.deselectAll();
                    }
                }
            }
        } else if (event.key === `ArrowLeft`) {
            if (this._canMoveView.left) {
                this._dragView(Number(AtPlayground.DEFAULT_ARROW_MULTIPLIER), 0);
            }
        } else if (event.key === `ArrowRight`) {
            if (this._canMoveView.right) {
                this._dragView(-1 * AtPlayground.DEFAULT_ARROW_MULTIPLIER, 0);
            }
        } else if (event.key === `ArrowUp`) {
            if (this._canMoveView.up) {
                this._dragView(0, Number(AtPlayground.DEFAULT_ARROW_MULTIPLIER));
            }
        } else if (event.key === `ArrowDown`) {
            if (this._canMoveView.down) {
                this._dragView(0, -1 * AtPlayground.DEFAULT_ARROW_MULTIPLIER);
            }
        } else if (event.key === `PageUp`) {
            this._zoomView(this._zoomFactor / AtPlayground.DEFAULT_ZOOM_MULTIPLIER);
        } else if (event.key === `PageDown`) {
            this._zoomView(this._zoomFactor * AtPlayground.DEFAULT_ZOOM_MULTIPLIER);
        }
    }

    _getNodePreferredHeight(jagNode, jagNodeMap) {
        if (!jagNode.children || jagNode.children.length === 0) {
            return 1;
        }

        return jagNode.children.reduce((cut_set_size, child) => {
            const def = jagNodeMap.get(child.urn);
            return cut_set_size + (def ? this._getNodePreferredHeight(def, jagNodeMap) : 0);
        }, 0);
    }

    // handleLibraryListItemSelected({
    //                                   activity: selectedActivity,
    //                                   activity_set: selectedActivityDescendants = new Map(),
    //                                   isExpanded: isExpanded = false
    //                               }) {
    //     this._addActivityNodeTree(selectedActivity, selectedActivityDescendants, isExpanded);
    // }


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

    svgMouseDownEvent(e) {
        // When background is clicked - few things happen:
        // 1) Everything is unselected - let controller know.
        // 2) Prepare for panning

        const unselectedNodeArray = this.selectedNodes;
        this.unselectAllNodes();
        const selectedNodeArray = this.selectedNodes;
        this.dispatchEvent(new CustomEvent(`event-playground-clicked`, {
            detail: {
                selectedNodeArray,
                unselectedNodeArray
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

AtPlayground.NOTICE_REMOVE_CHILD = Popupable._createPopup({          // is this running - i want it?
    type: AtPlayground.POPUP_TYPES.NOTICE,
    name: `Disconnect Child`,
    description: `Disconnect this child JAG from parent JAG?`,
    actions: [
        {
            text: `Yes`,
            color: `black`,
            bgColor: `red`,
            action({inputs: {node}}) {
                const edge = node.getParentEdge();
                const id = edge.getChildId();
                const parent = node.getParent();
                const jagUrn = parent.nodeModel.urn;
                const jagChild = {
                    urn: node.nodeModel.urn,
                    id: node.nodeModel.childId
                };
                const remainingChildren = parent.nodeModel.activity.children.filter((entry) => {
                    // if (entry.id !== jagChild.id) {
                    //     return entry;
                    // }
                    // xxxxx
                    return entry.id !== jagChild.id;
                });
                parent.nodeModel.activity.children = remainingChildren;
                this.dispatchEvent(new CustomEvent(`event-activity-updated`, {
                    detail: {activity: parent.nodeModel.activity}
                }));
            }
        },
        {
            text: `No`,
            color: `white`,
            bgColor: `black`
        }

    ]
});

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
