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

        this.currentNodeModel.activity.bindings.forEach((binding) => {
            console.log()
            console.log(binding.from)
            console.log(this.currentNodeModel.activity.getConsumingLeaves(binding.from))
            console.log()

        });


        this.svg.clearBackground(this.id);
        if (this.currentNodeModel) {
            if (this.zoomMap.has(this.currentNodeModel.id)) {
                this.zoomStep = this.zoomMap.get(this.currentNodeModel.id);
            } else {
                this.zoomStep = 0;
            }
            this.treeHeight = nodeModel.findTreeHeight();
            this.svgSize = this.buildBoxSet(this.svg.fetchBackground(this.id), nodeModel, this.START_X, this.START_Y);
            this.windowSize = this.getBoundingClientRect();
            this.redrawSvg();
            this.boxMap.clear(); // ?
        }
    }

    tempGetRandomTime(estimatedTime) {
        let random =  Math.floor(Math.random() * estimatedTime) + (estimatedTime / 2);
        return random
     }

    placeInnerBox(innerBox, topLeftX, topLeftY) {
        innerBox.topLeftX = topLeftX + this.svg.horizontalLeftMargin;
        innerBox.topLeftY = topLeftY + this.svg.verticalTopMargin;
    }

    createNewNodeBoxChild(nodeModel, parentGroup) {

    }

    buildBoxSet(parentGroup, nodeModel, topLeftX, topLeftY) {
        let svgText;
        let groupTop;
        topLeftY = topLeftY + this.svg.standardFontSize;          // move Y down past label of container
        const nodeModelBox = new TimeviewBox();
        nodeModelBox.id = nodeModel.id;
        nodeModelBox.label = nodeModel.name;
        const labelElement = this.svg.createTextElement(nodeModelBox.label, nodeModel.id);
        const group = this.svg.createSubGroup(nodeModel.id);
        groupTop = group.firstChild;
        group.insertBefore(labelElement, groupTop);
        parentGroup.appendChild(group);
        let labelingWidth = this.svg.labelWidth(labelElement) + (this.svg.labelIndent) + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin)

        if (nodeModel.hasChildren()) {
            let newBox;
            if ((nodeModel._activity.connector.execution === `node.execution.parallel`) ||
            (nodeModel._activity.connector.execution === `node.execution.none`) ||
            (nodeModel._activity.connector.execution !== `node.execution.sequential`)) {               // Catch-all @TODO -> need smarter control
                let childTopLeftY = topLeftY;
                let widestChild = 0;
                let growingBoxHeight = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(group, child, topLeftX + this.svg.horizontalLeftMargin, childTopLeftY + this.svg.verticalTopMargin);
                    childTopLeftY = childTopLeftY + newBox.height + this.svg.verticalTopMargin;
                    growingBoxHeight = growingBoxHeight + newBox.height;
                    if (newBox.width > widestChild) {
                        widestChild = newBox.width;
                    }
                });
                // nodeModel.children.forEach((child) => {
                //     const boxToStretch = this.boxMap.get(child.id);
                //     boxToStretch.width = widestChild;
                //     this.boxMap.set(child.id, boxToStretch);
                // });
                this.placeInnerBox(nodeModelBox, topLeftX, topLeftY);
                nodeModelBox.height = growingBoxHeight + ((nodeModel.children.length + 1) * this.svg.verticalTopMargin) + this.svg.standardFontSize;

                nodeModelBox.width = Math.max(
                    widestChild + (this.svg.horizontalLeftMargin + this.svg.horizontalRightMargin),
                    labelingWidth
                );

                svgText = this.svg.positionItem(labelElement, nodeModelBox.topLeftX + (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), nodeModelBox.topLeftY);
            }
            if (nodeModel._activity.connector.execution === `node.execution.sequential`) {
                let childTopLeftX = topLeftX;
                let tallestChild = 0;
                let growingBoxWidth = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(group, child, childTopLeftX + this.svg.horizontalLeftMargin, topLeftY + this.svg.verticalTopMargin);
                    childTopLeftX = childTopLeftX + newBox.width + this.svg.horizontalLeftMargin;
                    growingBoxWidth = growingBoxWidth + newBox.width;
                    if (newBox.height > tallestChild) {
                        tallestChild = newBox.height;
                    }
                });
                // nodeModel.children.forEach((child) => {
                //     const boxToStretch = this.boxMap.get(child.id);
                //     boxToStretch.height = tallestChild;
                //     this.boxMap.set(child.id, boxToStretch);
                // });
                this.placeInnerBox(nodeModelBox, topLeftX, topLeftY);

                nodeModelBox.height = tallestChild + (this.svg.verticalTopMargin + this.svg.verticalBottomMargin) + this.svg.standardFontSize;
                nodeModelBox.width = Math.max(
                    growingBoxWidth + ((nodeModel.children.length + 1) * this.svg.horizontalLeftMargin),
                    labelingWidth
                );

                svgText = this.svg.positionItem(labelElement, nodeModelBox.topLeftX + (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), nodeModelBox.topLeftY);
            }
        } else {
            this.placeInnerBox(nodeModelBox, topLeftX, topLeftY);
            nodeModelBox.height = this.svg.standardBoxHeight;
            nodeModelBox.width = (this.showTime) ? nodeModel.contextualExpectedDuration * 100 : labelingWidth;
            svgText = this.svg.positionItem(labelElement, nodeModelBox.topLeftX + (nodeModelBox.width / 2) - (this.svg.labelWidth(labelElement) / 2), nodeModelBox.topLeftY);
            groupTop = group.firstChild;
            group.insertBefore(svgText, groupTop);
        }
        const svgBox = this.svg.createRectangle(nodeModelBox.width, nodeModelBox.height, nodeModel.id);
        this.svg.positionItem(svgBox, nodeModelBox.topLeftX, nodeModelBox.topLeftY);
        this.svg.applyFilter(svgBox, this.svg.chosenFilter);
        this.svg.applyLightnessDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        if (this.hasColor) {
            this.svg.applyColorDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        }
        group.insertBefore(svgBox, svgText);
        this.boxMap.set(nodeModelBox.id, nodeModelBox);

        // let expectedDuration = nodeModel.contextualExpectedDuration;
        // let timeUnit = (nodeModelBox.width * 0.95) / expectedDuration ;
        // let lineLength = expectedDuration * timeUnit;
        // let startPoint = new Point();
        // let endPoint = new Point();
        // startPoint.x = nodeModelBox.topLeftX + this.svg.labelIndent;
        // startPoint.y = nodeModelBox.topLeftY + nodeModelBox.height - 10;
        // endPoint.x = nodeModelBox.topLeftX + lineLength;
        // endPoint.y = nodeModelBox.topLeftY + nodeModelBox.height - 10;
        // const line = this.svg.createLine(nodeModel.id, startPoint, endPoint);
        // let groupLast = group.lastChild;
        // group.insertBefore(line, groupLast);

        // let actualTime = this.tempGetRandomTime(nodeModel.contextualExpectedDuration)
        // console.log(`###`)
        // console.log(`Expected: ${nodeModel.contextualExpectedDuration}`)
        // console.log(`Actual Time: ${actualTime}`)
        // lineLength = actualTime * timeUnit;
        // startPoint = new Point();
        // endPoint = new Point();
        // startPoint.x = nodeModelBox.topLeftX + this.svg.labelIndent;
        //   startPoint.y = nodeModelBox.topLeftY + nodeModelBox.height - 7;
        // endPoint.x = nodeModelBox.topLeftX + lineLength;
        // endPoint.y = nodeModelBox.topLeftY + nodeModelBox.height - 7;
        // const line2 = this.svg.createLine(`${nodeModel.id}2`, startPoint, endPoint);
        // group.insertBefore(line2, groupLast);

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


