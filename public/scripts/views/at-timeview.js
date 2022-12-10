/**
 * @file AtTimeview - Visual area for viewing JAGs in the time domain.  This is a view only.
 *
 * @author ihmc (tlg)
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 *
 *
 * @TODO --- When showing a large SVG and scrolling to bottom.   Then switching to small SVG will leave viewer far from viewing area and unable to return.
 */

import TimeviewBox from '../models/svg-box.js';
import SvgObject from "../models/svg-object.js";
import Point from "../models/point.js";
import Traversal from "../utils/traversal.js";

class AtTimeview extends HTMLElement {

    constructor() {
        super();
        this.showTime = false;
        this.svgOriginPoint = new Point({x: 30,
            y: 30});
        this._timeContainerWrapperDiv = document.createElement(`div`);
        this._timeContainerWrapperDiv.id = `timeview-wrapper`;
        this.appendChild(this._timeContainerWrapperDiv);
        this.svg = new SvgObject(`timeview`);
        this.svg.standardHue = 200;
        this.svg.selectedHue = 150;
        this.svg.possibleHue = 50;
        this.svg.horizontalLeftMargin = 10;
        this.svg.horizontalRightMargin = 10;
        this.svg.verticalTopMargin = 10;
        this.svg.verticalBottomMargin = 2;
        this.svg.lineWidth = 2;
        this.svg.standardFontSize = 17;
        this.svg.stepBrightness = 5;
        this.svg.chosenFilter = `blur`;
        this.svg.chosenPattern = `diagonals`;
        this.pixelsPerTimeUnit = 10;

        this._timeviewSvg = this.svg.buildSvg();
        this.$def = this.svg.createDefinitionContainer();
        this._timeviewSvg.appendChild(this.$def);
        this.filterMap = this.svg.createCustomFilters();
        this.$chosenFilter = this.filterMap.get(this.svg.chosenFilter);
        this.$def.appendChild(this.$chosenFilter);
        this.$background = this.svg.createBackground();
        this._timeviewSvg.appendChild(this.$background);
        this._timeContainerWrapperDiv.appendChild(this._timeviewSvg);

        this.currentNodeModel = null;
        this.svgLocationX = 0;
        this.svgLocationY = 0;
        this.windowSize = null;
        this.svgBox = null;
        this.panX = 0;
        this.panY = 0;
        this.zoomStep = 0;

        this.boxMap = new Map();  // id, svg rectangle (id is copy of corresponding node id)
        this.zoomMap = new Map(); // id, zoom level (each node temporarily saves users zoom level)

        this._timeviewSvg.addEventListener(`mousedown`, this.svgMouseDownEvent.bind(this));
        this._timeviewSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));
        this._boundDragView = this.dragView.bind(this);
        this._boundStopDragView = this.stopDragView.bind(this);
        this._treeHeight = null;
    }

    printSvg(name) {
        this.svg.saveSvg(this._timeviewSvg, name);
    }

    refreshTimeview(nodeModel = this.currentNodeModel) {
        if (this.currentNodeModel) {
            this.zoomMap.set(this.currentNodeModel.id, this.zoomStep);
        }
        this.currentNodeModel = nodeModel;

        this.svg.clearBackground(this.id);
        if (this.currentNodeModel) {
            if (this.zoomMap.has(this.currentNodeModel.id)) {
                this.zoomStep = this.zoomMap.get(this.currentNodeModel.id);
            } else {
                this.zoomStep = 0;
            }
            this.treeHeight = nodeModel.findTreeHeight();
            const expanded = true;
            this.svgBox = this.buildTimelineDiagram(this.svg.fetchBackground(this.id), nodeModel, this.svgOriginPoint, expanded);
            this.windowSize = this.getBoundingClientRect();
            this.redrawSvg();
            this.boxMap.clear(); // ?
        }
    }

    tempGetRandomTime(estimatedTime) {
        const random = Math.floor(Math.random() * estimatedTime) + (estimatedTime / 2);
        return random;
    }

    createNodeSvgBox(nodeModel) {
        const nodeModelBox = new TimeviewBox();
        nodeModelBox.id = nodeModel.id;
        nodeModelBox.label = nodeModel.name;
        return nodeModelBox;
    }

    fetchSvgGroupContainer(nodeModel) {
        if (nodeModel.isRoot()) {
            return this.svg.fetchBackground();
        } else {
            return this.svg.fetchSubGroup(nodeModel.id);
        }
    }

    getInnerParallelBox(nodeModel, boxOriginPoint, isExpanded) {
        console.log(boxOriginPoint);
        const nodeModelBox = this.createNodeSvgBox(nodeModel);
        nodeModelBox.topLeftX = boxOriginPoint.x;
        nodeModelBox.topLeftY = boxOriginPoint.y;
        const labelElement = this.svg.createTextElement(nodeModelBox.label, nodeModel.id);
        const parentGroup = this.svg.fetchSubGroup(nodeModel.id);
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        nodeGroup.insertBefore(labelElement, nodeGroup.firstChild);
        const labelingWidth = (this.svg.labelIndent) + this.svg.labelWidth(labelElement);

        let newBox;                           //  newBox is the collection of all the things the node box needs/has
        let movingDownwardMarker = boxOriginPoint.y + this.svg.verticalLabelShift;
        let widestChild = 0;
        let growingBoxHeight = 0;
        nodeModel.children.forEach((childNodeModel) => {
            const childBoxCornerPoint = new Point({x: boxOriginPoint.x + this.svg.horizontalLeftMargin,
                y: movingDownwardMarker + this.svg.verticalTopMargin});
            const expanded = (isExpanded) ? nodeModel.isExpanded : false;
            newBox = this.buildTimelineDiagram(parentGroup, childNodeModel, childBoxCornerPoint, expanded);          // !!!!!!!!

            movingDownwardMarker = movingDownwardMarker + newBox.height + this.svg.verticalTopMargin;
            growingBoxHeight = growingBoxHeight + newBox.height;
            if (newBox.width > widestChild) {
                widestChild = newBox.width;
            }
        });
        nodeModelBox.height = this.svg.verticalLabelShift + growingBoxHeight + ((nodeModel.children.length + 1) * this.svg.verticalTopMargin);
        nodeModelBox.width = Math.max(
            widestChild + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin),
            labelingWidth
        );
        this.svg.positionItem(labelElement, (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        return nodeModelBox;
    }

    getInnerSequentialBox(nodeModel, boxCornerPoint, isExpanded) {
        console.log(boxCornerPoint);
        const nodeModelBox = this.createNodeSvgBox(nodeModel);
        nodeModelBox.topLeftX = boxCornerPoint.x;
        nodeModelBox.topLeftY = boxCornerPoint.y;
        const labelElement = this.svg.createTextElement(nodeModelBox.label, nodeModel.id);
        const parentGroup = this.svg.fetchSubGroup(nodeModel.id);
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        nodeGroup.insertBefore(labelElement, nodeGroup.firstChild);
        const labelingWidth = this.svg.labelWidth(labelElement) + (this.svg.labelIndent) + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin);
        let newBox;
        let movingForwardMarker = boxCornerPoint.x;
        let tallestChild = 0;
        let growingBoxWidth = 0;
        nodeModel.children.forEach((childNodeModel) => {
            const childBoxCornerPoint = new Point({x: movingForwardMarker + this.svg.horizontalLeftMargin,
                y: boxCornerPoint.y + this.svg.verticalLabelShift});
            const expanded = (isExpanded) ? nodeModel.isExpanded : false;
            newBox = this.buildTimelineDiagram(parentGroup, childNodeModel, childBoxCornerPoint, expanded);      // !!!!
            movingForwardMarker = movingForwardMarker + newBox.width + this.svg.horizontalLeftMargin;
            growingBoxWidth = growingBoxWidth + newBox.width;
            if (newBox.height > tallestChild) {
                tallestChild = newBox.height;
            }
        });
        nodeModelBox.height = this.svg.verticalLabelShift + this.svg.verticalTopMargin + tallestChild + this.svg.verticalBottomMargin;
        nodeModelBox.width = Math.max(
            growingBoxWidth + ((nodeModel.children.length + 1) * this.svg.horizontalLeftMargin),
            labelingWidth
        );
        this.svg.positionItem(labelElement, (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        return nodeModelBox;
    }

    buildChildNodeMap(nodeModel, parentGroup, isExpanded) {
        const boxMap = new Map();
        nodeModel.children.forEach((childNodeModel) => {
            const expanded = (isExpanded) ? nodeModel.isExpanded : false;
            const newBox = this.buildTimelineDiagram(parentGroup, childNodeModel, new Point(), expanded);       // !!!
            boxMap.set(childNodeModel.id, newBox);
        });
        return boxMap;
    }

    buildNodeBox(nodeModel, boxMap) {
        const nodeModelBox = this.createNodeSvgBox(nodeModel);
        const labelElement = this.svg.createTextElement(nodeModelBox.label, nodeModel.id);
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        nodeGroup.insertBefore(labelElement, nodeGroup.firstChild);
        const labelingWidth = this.svg.labelWidth(labelElement) + (this.svg.labelIndent);

        nodeModelBox.totalLeafHeight = 0;  //  The height is the sum of the tallest part of each non-sibling-dependent node    sum(child1.maxheight + .. + childn.maxheight)
        nodeModelBox.width = labelingWidth;  // The width is the maximum of the non-sibling-dependent node's total widths  max(child1.totalWidth... childn.totalwidth)
        nodeModel.children.forEach((childNodeModel) => {
            let childWidth = 0;
            if (childNodeModel.isTopProducerSibling()) {
                this.repopulateLeafSize(childNodeModel, boxMap);                         // leaf Size gives the height of dependent sibling leaf's boxHeights totaled
                const widestAtDepthArray = this.findWidestAtDepth(childNodeModel, boxMap, new Array());   // widest sibling box at each depth level ex. [13,43,26]
                childWidth = widestAtDepthArray.reduce((partialSum, a) => {                               // add those widest together.
                    return partialSum + a;
                }, 0);
                nodeModelBox.totalLeafHeight = nodeModelBox.totalLeafHeight + boxMap.get(childNodeModel.id).totalLeafHeight;
            }
            nodeModelBox.width = Math.max(nodeModelBox.width, childWidth);
        });
        nodeModelBox.width = nodeModelBox.width + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin);
        nodeModelBox.height = this.svg.verticalLabelShift + nodeModelBox.totalLeafHeight + this.svg.verticalTopMargin + this.svg.verticalBottomMargin;
        this.svg.positionItem(labelElement, (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        return nodeModelBox;
    }

    you only need one grouping`

    getInnerNoneBox(nodeModel, boxCornerPoint, isExpanded) {
        // BUILD BOX

        const parentGroup = this.svg.fetchSubGroup(nodeModel.id);
        // Recursively find the sizes of nodes internal children -- add immediate children to boxMap (id-> box size info)
        const boxMap = this.buildChildNodeMap(nodeModel, parentGroup, isExpanded);
        const nodeModelBox = this.buildNodeBox(nodeModel, boxMap);   // determine size/shape of containing box (none,p,s dependent)
        // const boxCornerPoint = new Point({x: this.svg.horizontalLeftMargin,
        //     y: this.svg.verticalTopMargin + this.svg.verticalLabelShift});
        nodeModelBox.topLeftX = boxCornerPoint.x;
        nodeModelBox.topLeftY = boxCornerPoint.y;
        const childCornerPoint = new Point({x: boxCornerPoint.x + this.svg.horizontalLeftMargin,
            y: boxCornerPoint.y + this.svg.verticalLabelShift});
        nodeModel.children.forEach((childNodeModel) => {

            if (childNodeModel.isTopProducerSibling()) {
                this.produceDataLayout(childCornerPoint, childNodeModel, boxMap, nodeModelBox);
                const box = boxMap.get(childNodeModel.id);
                childCornerPoint.y = childCornerPoint.y + box.totalLeafHeight;
            }
        });
        return nodeModelBox;
    }

    produceDataLayout(childBoxCornerPoint, node, boxMap, parentBox) {
        const nodeGroup = this.svg.fetchNodeGroup(node.id);
        const box = boxMap.get(node.id);
        const rectangle = this.svg.fetchRectangle(node.id);
        let widthExtender = 0;
        const parentRightSide = parentBox.topLeftX + parentBox.width;
        const rightSideLimit = parentRightSide - this.svg.horizontalRightMargin;
        const childRightSide = childBoxCornerPoint.x + box.width;
        if ((node.providesOutputTo.length === 0) && ((childRightSide) < (rightSideLimit))) {
            widthExtender = (rightSideLimit) - (childRightSide);
        }
        this.svg.resizeRectangle(rectangle, box.width + widthExtender, box.totalLeafHeight);
        this.svg.positionItem(nodeGroup, childBoxCornerPoint.x, childBoxCornerPoint.y);
        const nextPoint = new Point({x: childBoxCornerPoint.x + box.width,
            y: childBoxCornerPoint.y});
        node.providesOutputTo.forEach((dependant) => {
            this.produceDataLayout(nextPoint, dependant, boxMap, parentBox);
            nextPoint.y = nextPoint.y + boxMap.get(node.id).height;
        });
    }

    getInnerLeafBox(nodeModel, boxCornerPoint) {
        const nodeModelBox = this.createNodeSvgBox(nodeModel);
        nodeModelBox.topLeftX = boxCornerPoint.x;
        nodeModelBox.topLeftY = boxCornerPoint.y;
        const labelElement = this.svg.createTextElement(nodeModelBox.label, nodeModel.id);
        const nodeGroup = this.svg.fetchNodeGroup(nodeModel.id);
        nodeGroup.insertBefore(labelElement, nodeGroup.firstChild);
        const labelingWidth = this.svg.labelWidth(labelElement) + (this.svg.labelIndent) + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin);
        nodeModelBox.height = this.svg.standardBoxHeight;
        nodeModelBox.totalLeafHeight = nodeModelBox.height;
        nodeModelBox.width = (this.showTime) ? nodeModel.contextualExpectedDuration * this.pixelsPerTimeUnit : labelingWidth;
        this.svg.positionItem(labelElement, (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), 0);
        return nodeModelBox;
    }

    buildTimelineDiagram(parentGroup, nodeModel, boxCornerPoint, isExpanded) {
        const subGroup = this.svg.createSubGroup(nodeModel.id);
        parentGroup.appendChild(subGroup);
        const nodeGroup = this.svg.createNodeGroup(nodeModel.id);
        subGroup.appendChild(nodeGroup);
        let nodeModelBox;
        // const childOriginPoint = new Point({x: boxCornerPoint.x + this.svg.horizontalLeftMargin,
        //     y: boxCornerPoint.y + this.svg.verticalLabelShift});
        if (nodeModel.hasChildren()) {
            if (nodeModel._activity.connector.execution === `node.execution.parallel`) {               // Catch-all @TODO -> need smarter control
                nodeModelBox = this.getInnerParallelBox(nodeModel, boxCornerPoint, isExpanded);
            }
            if (nodeModel._activity.connector.execution === `node.execution.sequential`) {
                nodeModelBox = this.getInnerSequentialBox(nodeModel, boxCornerPoint, isExpanded);
            }
            if (nodeModel._activity.connector.execution === `node.execution.none`) {
                nodeModelBox = this.getInnerNoneBox(nodeModel, boxCornerPoint, isExpanded);
            }
        } else {
            nodeModelBox = this.getInnerLeafBox(nodeModel, boxCornerPoint);
        }
        const svgBox = this.svg.createRectangle(nodeModelBox.width, nodeModelBox.height, nodeModel.id);
        // this.svg.positionItem(nodeGroup, nodeModelBox.topLeftX, nodeModelBox.topLeftY);
        this.svg.positionItem(nodeGroup, boxCornerPoint.x, boxCornerPoint.y);
        this.svg.applyFilter(svgBox, this.svg.chosenFilter);
        this.svg.applyLightnessDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        if (this.hasColor) {
            this.svg.applyColorDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        }
        nodeGroup.insertBefore(svgBox, nodeGroup.firstChild);
        this.boxMap.set(nodeModelBox.id, nodeModelBox);
        return nodeModelBox;
    }

    svgWheelZoomEvent(event) {
        event.preventDefault();
        if (event.deltaY > 0) {
            this.zoomStep = this.zoomStep + 1;
        } else {
            this.zoomStep = this.zoomStep - 1;
        }
        this.redrawSvg();
    }

    applyZoom(num) {
        const zoomedNum = num + (num * this.zoomStep * 0.05);
        return zoomedNum;
    }

    redrawSvg() {
        const zoomedBoxWidth = this.applyZoom(this.windowSize.width);
        const zoomedBoxHeight = this.applyZoom(this.windowSize.height);
        if ((zoomedBoxWidth > 0) && (zoomedBoxHeight > 0)) {
            this._timeviewSvg.setAttribute(
                `viewBox`,
                `${this.panX} ${this.panY}  ${zoomedBoxWidth}  ${zoomedBoxHeight}`
            );
        }
    }

    dragView(e) {
        const zoomedBoxWidth = this.applyZoom(this.windowSize.width);
        const zoomedBoxHeight = this.applyZoom(this.windowSize.height);
        const svgViewSizeX = this.svgBox.width + this.svgOriginPoint.x + this.svg.horizontalLeftMargin;
        const svgViewSizeY = this.svgBox.height + this.svgOriginPoint.y + this.svg.verticalTopMargin;

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
        this.removeEventListener(`mousemove`, this._boundDragView);
        this.svgLocationX = this.panX;
        this.svgLocationY = this.panY;
    }

    svgMouseDownEvent(e) {
        // The background clicker
        this.windowSize = this.getBoundingClientRect();
        this._initialMouse = {
            x: e.clientX,
            y: e.clientY
        };
        this.addEventListener(`mousemove`, this._boundDragView);
        this.addEventListener(`mouseup`, this._boundStopDragView);
    }


    logMapElements(value, key, map) {
        //  to use:              boxMap.forEach(this.logMapElements);
        console.log(`m[${key}] = ${value}`);
        console.log(JSON.stringify(value));
    }


    findWidestAtDepth(sibling, boxMap, widestAtDepth) {
        const fetchActivitiesCallback = (sibling) => {
            const depth = sibling.dependencySlot;
            const box = boxMap.get(sibling.id);
            if ((widestAtDepth[depth] == undefined) || (widestAtDepth[depth] < box.width)) {
                widestAtDepth[depth] = box.width;
            }
        };
        Traversal.recurseProvidesIOPostorder(sibling, fetchActivitiesCallback);
        return widestAtDepth;
    }

    repopulateLeafSize(node, boxMap) {
        const fetchActivitiesCallback = (node) => {
            const nodebox = boxMap.get(node.id);
            if (node.providesOutputTo.length > 0) {
                nodebox.totalLeafHeight = 0;
                node.providesOutputTo.forEach((child) => {
                    const childNodebox = boxMap.get(child.id);
                    nodebox.totalLeafHeight = nodebox.totalLeafHeight + childNodebox.totalLeafHeight;
                });
            }
        };
        Traversal.recurseProvidesIOPostorder(node, fetchActivitiesCallback);
    }


}

customElements.define(`jag-timeview`, AtTimeview);
export default customElements.get(`jag-timeview`);


//
// getRoutesFromBinding(node) {
//     const routeList = [];
//     const childRoutes = [];
//     const allRoutes = [];
//     node.children.forEach((child) => {
//         const routeIndex = [];
//         if (!node.activity.isDependentSibling(child.activity.urn)) {                // if not dependant on a sibling...(its a starting point)
//             this.findRoutes(node, child, routeIndex, routeList);
//         }
//     });
//     return routeList;
// }
//
// findRoutes(node, child, routeIndex, routeList) {
//     if (node.activity.hasConsumingSiblings(child.activity.urn)) {
//         node.activity.bindings.forEach((bind) => {
//             if (bind.from.urn === child.activity.urn) {
//                 node.children.forEach((childSibling) => {
//                     if (childSibling.activity.urn === bind.to.urn) {
//                         routeIndex.push(child);
//                         this.findRoutes(node, childSibling, routeIndex, routeList);
//                         routeIndex.pop(); // the end consumer
//                         routeIndex.pop(); // current producerUrn (it gets re-added if another binding found)
//                     }
//                 });
//             }
//         });
//     } else {
//         routeIndex.push(child);
//         routeList.push([...routeIndex]);
//     }
//     return routeList;
// }
