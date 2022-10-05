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

class AtPlayground extends Popupable {

    constructor() {
        super();
        this.SVGNS = `http://www.w3.org/2000/svg`;
        this.HUE = 200;
        this.HORIZONTAL_MARGIN = 10;
        this.VERTICAL_MARGIN = 10;
        this.LINE_WIDTH = 2;
        this.STANDARD_FONT_SIZE = 17;
        this.LABEL_INDENT = this.VERTICAL_MARGIN / 2;
        this.LABEL_HEIGHT = this.STANDARD_FONT_SIZE;
        this.STANDARD_BOX_HEIGHT = (2 * this.VERTICAL_MARGIN) + this.LABEL_HEIGHT;


        this.INITIAL_BRIGHTNESS = 50;
        this.STEP_BRIGHTNESS = 5;

        this._playgroundWrapperDiv = document.createElement(`div`);
        this._playgroundWrapperDiv.id = `playground-wrapper`;
        this.setPopupBounds(this._playgroundWrapperDiv);
        this.appendChild(this._playgroundWrapperDiv);
        this._playgroundSvg = document.createElementNS(this.SVGNS, `svg`);
        this._playgroundSvg.id = `playground-svg`;
        this._playgroundSvg.setAttribute(`version`, `1.1`);
        this._playgroundSvg.setAttribute(`xmlns`, this.SVGNS);
        this._playgroundSvg.setAttribute(`overflow-x`, `auto`);
        this._playgroundSvg.setAttribute(`overflow-y`, `auto`);
        this._playgroundWrapperDiv.appendChild(this._playgroundSvg);

        // SVG control (panning, zooming)
        this.svgLocationX = 0;
        this.svgLocationY = 0;
        this.windowSize = null;
        this.svgSize = {height: 0,
            width: 0};
        this.panX = 0;
        this.panY = 0;
        this.zoomStep = 0;
        this._zoomFactor = 1.00;   //  PROB NOT NECESSARY
        this.svgCursor = {x: 0,
            y: 0};     // @todo Localize this later   // location  of pointer
        this.innerNodeDelta = {x: 0,
            y: 0};     // @todo Localize this later   // diff of pointer to upper left of rectangle

        // Data objects displayed by the SVG
        this._viewedProjectsMap = new Map();               // All active Jag root nodes - id,node
        this._activeActivityNodeElementSet = new Set();    // set of ActivityNodes (all)
        this._selectedActivityNodeMap = new Map();  // set of ActivityNodes (selected)
        this._is_edge_being_created = false;
        this.currentNodeModel = null;                      // node in focus (selected or head of selected)

        // EVENTS
        // SVG Events
        document.addEventListener(`keydown`, this.onKeyDown.bind(this));
        this._playgroundSvg.addEventListener(`mousedown`, this.svgMouseDownEvent.bind(this));   // background clicked (start svg panning)
        this._boundDragView = this.dragView.bind(this);                                              // pan svg
        this._boundStopDragView = this.stopDragView.bind(this);                                      // cease panning
        this._playgroundSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));       // mousewheel (zooming)

        // Node Events
        this._boundDragNode = this.dragNode.bind(this);
        this._boundStopDraggingNode = this.stopDraggingNode.bind(this);
        // this._boundHandleEdgeSelected = this._handleEdgeSelected.bind(this);  // ?
        this._boundOnEdgeUpdated = this.onEdgeUpdated.bind(this);             // ?
        this._boundOnEdgeCanceled = this.onEdgeCanceled.bind(this);           // ?
        this._boundDragView = this.dragView.bind(this);                       // ?
        this._boundStopDragView = this.stopDragView.bind(this);               // ?
    }

    get selectedNodes() {
        const selectedIdArray = Array.from(this._selectedActivityNodeMap.values());
        return selectedIdArray;
    }  // ok

    get viewedProjects() {
        const viewedRootNodes = Array.from(this._viewedProjectsMap.values());
        return viewedRootNodes;
    } // ok


    // UTILITY

    // Find the equivalent Node Model if it exists within one of the displayed JAGS.
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


    // SVG Manipulation
    selectNode(node) {  // Apply 'select' effect (highlight)
        this._selectedActivityNodeMap.set(node.id, node);
        const rectangle = this._playgroundSvg.getElementById(`node${node.id}`);
        const text = this._playgroundSvg.getElementById(`text${node.id}`);
        const hsla = rectangle.getAttributeNS(null, `fill`);
        const shadeFill = hsla.split(`,`)[2];
        rectangle.setAttributeNS(null, `fill`, `hsla(500,100%,${shadeFill},1)`);
    }

    unselectNode(node) {   // Remove 'select' effect (highlight)
        this._selectedActivityNodeMap.delete(node.id);
        const rectangle = this._playgroundSvg.getElementById(`node${node.id}`);
        const text = this._playgroundSvg.getElementById(`text${node.id}`);
        const hsla = rectangle.getAttributeNS(null, `fill`);
        const shadeFill = hsla.split(`,`)[2];
        rectangle.setAttributeNS(null, `fill`, `hsla(200,100%,${shadeFill},1)`);
    }

    unselectAllNodes() {
        this._selectedActivityNodeMap.forEach((value, key) => {
            this.unselectNode(value);
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
        this._playgroundWrapperDiv.removeEventListener(`mousemove`, this._boundDragNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseup`, this._boundStopDraggingNode);
        this._playgroundWrapperDiv.removeEventListener(`mouseleave`, this._boundStopDraggingNode);
    }


    changeDestination(origPath, destBoxTopLeftX, destBoxTopLeftY) {


        const splitOrigPath = origPath.split(` `);
        const ox = Math.round(splitOrigPath[1]);
        const oy = Math.round(splitOrigPath[2]);
        // const ex = Math.round(splitOrigPath[8]);
        // const ey = Math.round(splitOrigPath[9]);

        const ex = Math.round(Number(splitOrigPath[8]) + destBoxTopLeftX);
        const ey = Math.round(Number(splitOrigPath[9]) + destBoxTopLeftY + (this.STANDARD_BOX_HEIGHT / 2));
        console.log(ex)
        console.log(ey)
        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        return cubicCurve;
    }

    dragNode(e) {
        e.preventDefault();
        const rectangle = e.target;

        //     let newSvgCursor = this.screenToSVGCoords(e);   // transform screen to svg

        let diffX = e.x - this.svgCursor.x; // - this.innerNodeDelta.x;
        let diffY = e.y - this.svgCursor.y; //  - this.innerNodeDelta.y;

        this.svgSelectedItems.nodes.forEach((nodeItem) => {
            let id = nodeItem.id.replace(`node`,``);
            let nodeModel = this._selectedActivityNodeMap.get(id);
            this.moveItem(nodeItem, nodeModel.x + diffX, nodeModel.y + diffY);
        }) 
        
        
        this.svgSelectedItems.incomingEdges.forEach((edge) => {
            let origPath = edge.getAttributeNS(null, `d`);
            let sourceNodeId = edge.id.split(`:`)[0].replace(`node`,``);
            let destinationNodeId = edge.id.split(`:`)[1].replace(`node`,``);
            let newPath = this.buildPath();
            edge.setAttributeNS(null, `d`, `${newPath}`);
        })

        // const x = this.svgCursor.x - this.innerNodeDelta.x;           // further transform to upper left point of node position
        // const y = this.svgCursor.y - this.innerNodeDelta.y;

        // rectangle.setAttributeNS(null, `x`, `${x}`);
        // rectangle.setAttributeNS(null, `y`, `${y}`);
    }


    /**
                   Events
    */

    eventNodeSelected(e) {           // on mousedown  applied during jag-node create
        this.unselectAllNodes();
        const rectangle = e.target;
        const nodeId = rectangle.id.replace(`node`, ``);
        const selectedNodeModel = this.retrieveNodeModel(nodeId);
        if (e.ctrlKey) {
            selectedNodeModel.gatherDescendents().forEach((descendant) => {
                this.selectNode(descendant);
            });
        }
        this.selectNode(selectedNodeModel);

        this.svgCursor = this.screenToSVGCoords(e);   // transform screen to svg

        this.svgCursor.x = e.x;
        this.svgCursor.y = e.y;
        this.innerNodeDelta.x = this.svgCursor.x - selectedNodeModel.x;           // further transform to upper left point of node position
        this.innerNodeDelta.y = this.svgCursor.y - selectedNodeModel.y;

        this.svgSelectedItems = {edges: [],
            nodes: new Map()};
        this._selectedActivityNodeMap.forEach((value, key) => {
            const edges = Array.from(document.querySelectorAll(`[id*=edge${key}]`));
            this.svgSelectedItems.edges = [...this.svgSelectedItems.edges, ...edges];
            this.svgSelectedItems.nodes.set(key, document.getElementById(`node${key}`));
            })
        

        console.log(this.svgSelectedItems.edges)
        console.log(this.svgSelectedItems.nodes)

        this.svgCursor.x = e.x;
        this.svgCursor.y = e.y;

        this._playgroundWrapperDiv.addEventListener(`mousemove`, this._boundDragNode);
        this._playgroundWrapperDiv.addEventListener(`mouseup`, this._boundStopDraggingNode);
        this._playgroundWrapperDiv.addEventListener(`mouseleave`, this._boundStopDraggingNode);


        const selectedNodeArray = Array.from(this._selectedActivityNodeMap.values());
        this.dispatchEvent(new CustomEvent(`event-nodes-selected`, {
            detail: {selectedNodeArray}
        }));
        e.stopPropagation();  // Don't let it bubble up to the playgroundClicker handler.
    }


    fillDepthLightness(depthOfNode) {
        return this.INITIAL_BRIGHTNESS - (this.treeHeight * this.STEP_BRIGHTNESS / 2) + (depthOfNode * this.STEP_BRIGHTNESS);
    }

    strokeDepthLightness(depthOfNode) {
        const fillShading = this.fillDepthLightness(depthOfNode);
        const strokeShading = fillShading - (this.STEP_BRIGHTNESS * 4);
        return strokeShading;
    }

    moveItem(item, x, y) {
        item.setAttributeNS(null, `x`, x);
        item.setAttributeNS(null, `y`, y);
        return item;
    }

    createCircle(x, y, radius) {
        let circle = document.createElementNS(this.SVGNS, `circle`);
        circle = this.moveItem(circle, x, y);
        circle.setAttributeNS(null, `r`, radius);
        circle.setAttributeNS(null, `fill`, `blue`);
        return circle;
    }

    updateHSLA(hslaString, hue, saturation, lightness, alpha) {
        const components = hslaString.replace(`hsla(`, ``).replace(`)`, ``);
        const hslaArray = components.split(`,`);
        if (hue) {
            hslaArray[0] = hue;
        }
        if (saturation) {
            hslaArray[1] = saturation;
        }
        if (lightness) {
            hslaArray[2] = lightness;
        }
        if (alpha) {
            hslaArray[3] = alpha;
        }
        return `hsla(${hslaArray.join(`,`)})`;
    }

    updateHue(oldHSLA, newHue) {
        return this.updateHSLA(oldHSLA, newHue, null, null, null);
    }

    updateSaturation(oldHSLA, newSaturation) {
        return this.updateHSLA(oldHSLA, null, newSaturation, null, null);
    }

    updateLightness(oldHSLA, newLightness) {
        return this.updateHSLA(oldHSLA, null, null, newLightness, null);
    }

    updateHue(oldHSLA, newAlpha) {
        return this.updateHSLA(oldHSLA, null, null, null, newAlpha);
    }


    resizeRectangle(rectangle, height, width) {
        rectangle.setAttributeNS(null, `width`, width);
        rectangle.setAttributeNS(null, `height`, height);
        return rectangle;
    }

    createRectangle(x, y, width, height, depthOfNode) {
        let rectangle = document.createElementNS(this.SVGNS, `rect`);
        rectangle = this.moveItem(rectangle, x, y);
        rectangle = this.resizeRectangle(rectangle, height, width);
        rectangle.setAttributeNS(null, `pointer-events`, `bounding-box`);
        rectangle.setAttributeNS(null, `rx`, `7`);
        const fillShading = this.fillDepthLightness(depthOfNode);
        const strokeShading = this.strokeDepthLightness(depthOfNode);
        rectangle.setAttributeNS(null, `fill`, `hsla(${this.HUE},100%,${fillShading}%,1)`);
        rectangle.setAttributeNS(null, `stroke`, `hsla(${this.HUE},100%,${strokeShading}%,1)`);
        rectangle.setAttributeNS(null, `stroke-width`, this.LINE_WIDTH.toString());
        rectangle.addEventListener(`mousedown`, this.eventNodeSelected.bind(this));
        return rectangle;
    }


    buildPath(sourceBox, destBox) {
        const ox = sourceBox.topLeftX + sourceBox.width;
        const oy = sourceBox.topLeftY + (sourceBox.height / 2);
        const ex = destBox.topLeftX;
        const ey = destBox.topLeftY + (destBox.height / 2);
        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        // const mx = (ox + ex) / 2.0;
        // const my = (oy + ey) / 2.0;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        return cubicCurve;
    }

    createEdge(sourceBox, destBox) {
        const edge = document.createElementNS(this.SVGNS, `path`);
        edge.setAttributeNS(null, `stroke`, `hsla(${this.HUE},100%,0%,1)`);
        edge.setAttributeNS(null, `fill`, `transparent`);
        edge.setAttributeNS(null, `stroke-width`, this.LINE_WIDTH);
        // edge.setAttributeNS(null, `stroke-dasharray`, `4`);
        const cubicCurve = this.buildPath(sourceBox, destBox);
        edge.setAttributeNS(null, `d`, cubicCurve);
        return edge;
    }


    createTextElement(text) {
        const svgText = document.createElementNS(this.SVGNS, `text`);
        svgText.setAttributeNS(null, `font-size`, this.STANDARD_FONT_SIZE.toString());
        svgText.setAttributeNS(null, `dominant-baseline`, `text-before-edge`);
        svgText.setAttributeNS(null, `pointer-events`, `none`);
        const textNode = document.createTextNode(text);
        svgText.appendChild(textNode);
        return svgText;
    }
    labelWidth(svgText) {
        const bbox = svgText.getBBox();
        const {width} = bbox;
        return width;
    }

    clearSvg() {
        this._playgroundSvg.childNodes.forEach((gNode) => {
            if (gNode.nodeName === `g`) {
                this._playgroundSvg.removeChild(gNode);
            }
        });
    }


    //
    // _buildNodeViewFromNodeModel(currentNodeModel) {
    //     if ((!currentNodeModel.x) || (!currentNodeModel.y)) {
    //         currentNodeModel.x = 30 + Math.floor(Math.random() * 20);
    //         currentNodeModel.y = Math.floor((this.clientHeight / 2) + (Math.random() * 70));
    //     }
    //     currentNodeModel.setPosition(currentNodeModel.x, currentNodeModel.y);
    //     const $newViewNode = this.createActivityNode(currentNodeModel);
    //     $newViewNode.setTranslation(currentNodeModel.x, currentNodeModel.y);
    //     if (currentNodeModel.isExpanded) {
    //         currentNodeModel.children.forEach((child) => {
    //             const edge = this._createEdge($newViewNode, child.id);         // this wants a jag-node - not a nodeModel
    //             const $childViewNode = this._buildNodeViewFromNodeModel(child);                          // first build child
    //             edge.setSubActivityNode($childViewNode);                                                       // then connect tail of edge to it.
    //             edge.addEventListener(`event-nodes-selected`, this._boundHandleEdgeSelected);
    //         });
    //     }
    //     return $newViewNode;
    // }

    // Rename this to refreshPlayground (to match the timeview pattern)
    _rebuildNodeView(projectNodeModel) {
        this._viewedProjectsMap.set(projectNodeModel.id, projectNodeModel);
        this._refreshPlayground();
    }

    _refreshPlayground() {
        // delete the svg
        this.clearSvg();
        // if projectNodeModel is Root ->  add it to the list of viewed trees. (viewedProjectsMap)
        // if not - remove it from the list of viewed trees. (viewedProjectsMap)
        this._viewedProjectsMap.forEach((values, key) => {
            if (values.isRoot()) {
                this._viewedProjectsMap.set(key, values);
            } else {
                this._viewedProjectsMap.delete(values.id);
            }
            // draw everything in the viewed trees (viewedProjectsMap)
            // concerns: svg is a finite area - might have to grow svg
            // timeview - this.treeHeight = nodeModel.findTreeHeight();  // not really needed if x-y are present
            this.treeHeight = values.findTreeHeight();
            // equiv to this._buildNodeViewFromNodeModel
            const svgScope = new PlaygroundBox();
            this.buildJointActivityGraphs(document.getElementById(`playground-svg`), this._viewedProjectsMap, svgScope);
        });
        this._selectedActivityNodeMap.forEach((value, key) => {
            this.selectNode(value);
        });
        this.windowSize = this.getBoundingClientRect();
        this.redrawSvg();
    }


    buildJointActivityGraphs(svg, viewedJagRoots) {
        const svgScope = new PlaygroundBox();
        let jagScope = new PlaygroundBox();
        viewedJagRoots.forEach((jagRoot) => {
            jagScope = this.buildJointActivityGraph(svg, jagRoot);
        });
    }

    buildJointActivityGraph(parentGroup, nodeModel) {
        let svgText;
        let groupTop;
        const box = new PlaygroundBox();
        box.id = `model${nodeModel.id}`;
        box.label = nodeModel.name;
        if ((!nodeModel.x) || (!nodeModel.y)) {
            nodeModel.x = 30 + Math.floor(Math.random() * 20);
            nodeModel.y = Math.floor((this.clientHeight / 2) + (Math.random() * 70));
        }
        box.topLeftX = nodeModel.x;
        box.topLeftY = nodeModel.y;
        const labelElement = this.createTextElement(`${box.label}`);
        labelElement.id = `text${nodeModel.id}`;
        const group = document.createElementNS(this.SVGNS, `g`);
        group.id = `group${nodeModel.id}`;
        parentGroup.appendChild(group);

        // here


        svgText = this.moveItem(labelElement, box.topLeftX + this.LABEL_INDENT, box.topLeftY);
        groupTop = group.firstChild;
        group.insertBefore(svgText, groupTop);
        box.height = this.STANDARD_BOX_HEIGHT;
        box.width = this.labelWidth(labelElement) + (this.LABEL_INDENT * 2);
        const svgBox = this.createRectangle(box.topLeftX, box.topLeftY, box.width, box.height, nodeModel.treeDepth);
        svgBox.id = `node${nodeModel.id}`;
        group.insertBefore(svgBox, svgText);
        this.svgSize.width = Math.max(this.svgSize.width, box.topLeftX + box.width);
        this.svgSize.height = Math.max(this.svgSize.height, box.topLeftY + box.height);
        if ((nodeModel.isExpanded) || true) {
            nodeModel.children.forEach((child) => {
                const subBox = this.buildJointActivityGraph(group, child);
                const svgEdge = this.createEdge(box, subBox);
                svgEdge.id = `edge${nodeModel.id}:edge${child.id}`;

                group.appendChild(svgEdge);
                // const edge = this._createEdge($newViewNode, child.id);         // this wants a jag-node - not a nodeModel
                // const $childViewNode = this._buildNodeViewFromNodeModel(child);                          // first build child
                // edge.setSubActivityNode($childViewNode);                                                       // then connect tail of edge to it.
                // edge.addEventListener(`event-nodes-selected`, this._boundHandleEdgeSelected);
            });
        }
        return box;
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


    replaceActivityNode(newActivity, deadUrn) {
        this._activeActivityNodeElementSet.forEach((node) => {
            if (node.nodeModel.activity.urn === deadUrn) {
                node.nodeModel.activity = newActivity;
            }
        });
    }

    // this is called when a new jag appears from above --- applies?
    // note: creates a view based on Activity xxx now NodeModel
    createActivityNode(nodeModel) {
        const $node = new ActivityNodeElement(nodeModel);
        $node.addEventListener(`mousedown`, this.handlePlaygroundSelectedNodes.bind(this));

        $node.addEventListener(`keydown`, this.onKeyDown.bind(this));

        $node.addEventListener(`drag`, () => {
            this._checkBounds();
        });

        $node.addEventListener(`toggle-visible`, (e) => {
            if (e.detail) {
                this._checkBounds($node.getTree());
            } else {
                this._checkBounds();
            }
        });

        // //?? @TODO think about this.
        $node.addEventListener(`refresh`, (e) => {
            this.dispatchEvent(new CustomEvent(`refresh`, {detail: e.detail}));
        });
        // Are these two below not the same info.  activeNodeSet needed?

        $node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
        $node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));

        this._activeActivityNodeElementSet.add($node);
        this._playgroundSvg.appendChild($node);
        return $node;
    }

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

        const unselectedNodeArray = Array.from(this._selectedActivityNodeMap.values());
        this.unselectAllNodes();
        const selectedNodeArray = Array.from(this._selectedActivityNodeMap.values());
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
        const svgViewSizeX = this.svgSize.width + this.HORIZONTAL_MARGIN;
        const svgViewSizeY = this.svgSize.height + this.VERTICAL_MARGIN;

        if (zoomedBoxWidth > svgViewSizeX) {
            this.panX = 0;
        } else {
            const delta = this.applyZoom(this._initialMouse.x - e.clientX);
            this.panX = Math.min(
                this.svgLocationX + delta,
                svgViewSizeX - zoomedBoxWidth
            );
        }
        if (zoomedBoxHeight > svgViewSizeY) {
            this.panY = 0;
        } else {
            const delta = this.applyZoom(this._initialMouse.y - e.clientY);
            this.panY = Math.min(
                this.svgLocationY + delta,
                svgViewSizeY - zoomedBoxHeight
            );
        }
        if (this.panX < 0) {
            this.panX = 0;
        }
        if (this.panY < 0) {
            this.panY = 0;
        }
        this.redrawSvg();
    }

    stopDragView() {
        // The svg not being dragged by mouse - AS SEEN IN TIMEVIEW
        this.removeEventListener(`mousemove`, this._boundDragView);
        this.svgLocationX = this.panX;
        this.svgLocationY = this.panY;
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
                `${this.panX} ${this.panY}  ${zoomedBoxWidth}  ${zoomedBoxHeight}`
            );
        }
    }


}

// END OF CLASS
// Initial UI builder creates
// <svg version='1.1' xmlns=this.SVGNS></svg>
//      <div></div>
//      <div class='popup-box' style='visablity


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
                    console.log(`File read...... and passed to event`);
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
