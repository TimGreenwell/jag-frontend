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

class AtTimeview extends HTMLElement {

    constructor() {
        super();
        this.showTime = false;

        this.START_X = 5;
        this.START_Y = 5;
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
        this.svgSize = null;
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
            const boxCornerPoint = new Point({x: this.START_X,
                y: this.START_Y});
            this.svgSize = this.buildBoxSet(this.svg.fetchBackground(this.id), nodeModel, boxCornerPoint, expanded);
            this.windowSize = this.getBoundingClientRect();
            this.redrawSvg();
            this.boxMap.clear(); // ?
        }
    }

    tempGetRandomTime(estimatedTime) {
        const random = Math.floor(Math.random() * estimatedTime) + (estimatedTime / 2);
        return random;
    }

    buildDataDependence(node) {

    }
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

    createNodeSvgBox(boxCornerPoint, nodeModel) {
        const nodeModelBox = new TimeviewBox();
        nodeModelBox.id = nodeModel.id;
        nodeModelBox.label = nodeModel.name;
        nodeModelBox.topLeftX = boxCornerPoint.x + this.svg.horizontalLeftMargin;
        nodeModelBox.topLeftY = boxCornerPoint.y + this.svg.verticalTopMargin;
        return nodeModelBox;
    }


    getInnerParallelBox(nodeModel, boxCornerPoint, subGroup, isExpanded) {
        const nodeModelBox = this.createNodeSvgBox(boxCornerPoint, nodeModel);
        const labelElement = this.svg.createTextElement(nodeModelBox.label, nodeModel.id);
        subGroup.insertBefore(labelElement, subGroup.firstChild);
        const labelingWidth = this.svg.labelWidth(labelElement) + (this.svg.labelIndent) + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin);

        let newBox;
        let shiftDown = boxCornerPoint.y;
        let widestChild = 0;
        let growingBoxHeight = 0;
        nodeModel.children.forEach((childNodeModel) => {
            const childBoxCornerPoint = new Point();
            childBoxCornerPoint.x = boxCornerPoint.x + this.svg.horizontalLeftMargin;
            childBoxCornerPoint.y = shiftDown + this.svg.verticalTopMargin;
            const expanded = (isExpanded) ? nodeModel.isExpanded : false;
            newBox = this.buildBoxSet(subGroup, childNodeModel, childBoxCornerPoint, expanded);          // !!!!!!!!

            shiftDown = shiftDown + newBox.height + this.svg.verticalTopMargin;
            growingBoxHeight = growingBoxHeight + newBox.height;
            if (newBox.width > widestChild) {
                widestChild = newBox.width;
            }
        });
        nodeModelBox.height = growingBoxHeight + ((nodeModel.children.length + 1) * this.svg.verticalTopMargin) + this.svg.standardFontSize;
        nodeModelBox.width = Math.max(
            widestChild + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin),
            labelingWidth
        );
        this.svg.positionItem(labelElement, nodeModelBox.topLeftX + (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), nodeModelBox.topLeftY);
        return nodeModelBox;
    }

    getInnerSequentialBox(nodeModel, boxCornerPoint, subGroup, isExpanded) {
        const nodeModelBox = this.createNodeSvgBox(boxCornerPoint, nodeModel);
        const labelElement = this.svg.createTextElement(nodeModelBox.label, nodeModel.id);
        subGroup.insertBefore(labelElement, subGroup.firstChild);
        const labelingWidth = this.svg.labelWidth(labelElement) + (this.svg.labelIndent) + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin);
        let newBox;
        let shiftRight = boxCornerPoint.x;
        let tallestChild = 0;
        let growingBoxWidth = 0;
        nodeModel.children.forEach((childNodeModel) => {
            const childBoxCornerPoint = new Point();
            childBoxCornerPoint.x = shiftRight + this.svg.horizontalLeftMargin;
            childBoxCornerPoint.y = boxCornerPoint.y + this.svg.verticalTopMargin;
            const expanded = (isExpanded) ? nodeModel.isExpanded : false;
            newBox = this.buildBoxSet(subGroup, childNodeModel, childBoxCornerPoint, expanded);
            shiftRight = shiftRight + newBox.width + this.svg.horizontalLeftMargin;
            growingBoxWidth = growingBoxWidth + newBox.width;
            if (newBox.height > tallestChild) {
                tallestChild = newBox.height;
            }
        });
        nodeModelBox.height = tallestChild + (this.svg.verticalTopMargin + this.svg.verticalBottomMargin) + this.svg.standardFontSize;
        nodeModelBox.width = Math.max(
            growingBoxWidth + ((nodeModel.children.length + 1) * this.svg.horizontalLeftMargin),
            labelingWidth
        );
        this.svg.positionItem(labelElement, nodeModelBox.topLeftX + (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), nodeModelBox.topLeftY);
        return nodeModelBox;
    }


    getInnerNoneBox(nodeModel, boxCornerPoint, subGroup, isExpanded) {
        const nodeModelBox = this.createNodeSvgBox(boxCornerPoint, nodeModel);
        const labelElement = this.svg.createTextElement(nodeModelBox.label, nodeModel.id);
        subGroup.insertBefore(labelElement, subGroup.firstChild);
        const labelingWidth = this.svg.labelWidth(labelElement) + (this.svg.labelIndent) + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin);
        const boxMap = new Map();
        let newBox;
        const shiftRight = boxCornerPoint.x;
        nodeModel.children.forEach((childNodeModel) => {
            const childBoxCornerPoint = new Point();
            childBoxCornerPoint.x = shiftRight + this.svg.horizontalLeftMargin;
            childBoxCornerPoint.y = boxCornerPoint.y + this.svg.verticalTopMargin;
            const expanded = (isExpanded) ? nodeModel.isExpanded : false;
            newBox = this.buildBoxSet(subGroup, childNodeModel, childBoxCornerPoint, expanded);
            boxMap.set(childNodeModel.id, newBox);
        });
        let depth = 0;
        nodeModel.children.forEach((childNodeModel) => {
            if (childNodeModel.dependencySlot > depth) {
                depth = childNodeModel.dependencySlot;
            }
        });
        console.log(depth);
        const tallest = [];
        const widest = [];
        const heightSum = [];
        for (let i = 0; i <= depth; i++) {
            tallest[i] = 0;
            widest[i] = 0;
            heightSum[i] = 0;
        }

        nodeModel.children.forEach((childNodeModel) => {
            const childBox = boxMap.get(childNodeModel.id);
            if (childBox.height > tallest[childNodeModel.dependencySlot]) {
                tallest[childNodeModel.dependencySlot] = childBox.height;
            }
            if (childBox.width > widest[childNodeModel.dependencySlot]) {
                widest[childNodeModel.dependencySlot] = childBox.width;
            }
            heightSum[childNodeModel.dependencySlot] = heightSum[childNodeModel.dependencySlot] + childBox.height ;
        });

        console.log(tallest);
        console.log(widest);
        console.log(heightSum);
    }

    // Given Bindings:

    getInnerLeafBox(nodeModel, boxCornerPoint, subGroup, isExpanded) {
        const nodeModelBox = this.createNodeSvgBox(boxCornerPoint, nodeModel);
        const labelElement = this.svg.createTextElement(nodeModelBox.label, nodeModel.id);
        subGroup.insertBefore(labelElement, subGroup.firstChild);
        const labelingWidth = this.svg.labelWidth(labelElement) + (this.svg.labelIndent) + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin);
        nodeModelBox.height = this.svg.standardBoxHeight;
        nodeModelBox.width = (this.showTime) ? nodeModel.contextualExpectedDuration * this.pixelsPerTimeUnit : labelingWidth;
        this.svg.positionItem(labelElement, nodeModelBox.topLeftX + (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), nodeModelBox.topLeftY);
        return nodeModelBox;
    }

    buildBoxSet(parentGroup, nodeModel, boxCornerPoint, isExpanded) {
        let svgText;
        boxCornerPoint.y = boxCornerPoint.y + this.svg.standardFontSize;          // move Y down past label of container
        const subGroup = this.svg.createSubGroup(nodeModel.id);
        parentGroup.appendChild(subGroup);

        let nodeModelBox;
        if (nodeModel.children) {
            if (nodeModel._activity.connector.execution === `node.execution.parallel`) {               // Catch-all @TODO -> need smarter control
                nodeModelBox = this.getInnerParallelBox(nodeModel, boxCornerPoint, subGroup, isExpanded);
            }
            if (nodeModel._activity.connector.execution === `node.execution.sequential`) {
                nodeModelBox = this.getInnerSequentialBox(nodeModel, boxCornerPoint, subGroup, isExpanded);
            }
            if (nodeModel._activity.connector.execution === `node.execution.none`) {
                nodeModelBox = this.getInnerNoneBox(nodeModel, boxCornerPoint, subGroup, isExpanded);
            }
        } else {
            nodeModelBox = this.getInnerLeafBox(nodeModel, boxCornerPoint, subGroup, isExpanded);
        }
        const svgBox = this.svg.createRectangle(nodeModelBox.width, nodeModelBox.height, nodeModel.id);
        this.svg.positionItem(svgBox, nodeModelBox.topLeftX, nodeModelBox.topLeftY);
        this.svg.applyFilter(svgBox, this.svg.chosenFilter);
        this.svg.applyLightnessDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        if (this.hasColor) {
            this.svg.applyColorDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        }
        subGroup.insertBefore(svgBox, subGroup.firstChild);
        // subGroup.insertBefore(svgBox, svgText);
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
        const svgViewSizeX = this.svgSize.width + this.START_X + this.svg.horizontalLeftMargin;
        const svgViewSizeY = this.svgSize.height + this.START_Y + this.svg.verticalTopMargin;

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

}

customElements.define(`jag-timeview`, AtTimeview);
export default customElements.get(`jag-timeview`);


