/**
 * @file AtTimeview - Visual area for viewing JAGs in the time domain.  This is a view only.
 *
 * @author ihmc (tlg)
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */

import TimeviewBox from '../models/svg-box.js';
import SvgObject from "../models/svg-object.js";

class AtTimeview extends HTMLElement {

    constructor() {
        super();
        this.START_X = 5;
        this.START_Y = 5;
        this._timeContainerWrapperDiv = document.createElement(`div`);
        this._timeContainerWrapperDiv.id = `timeview-wrapper`;
        this.appendChild(this._timeContainerWrapperDiv);
        this.svg = new SvgObject(`timeview`);
        this.svg.standardHue = 200;
        this.svg.selectedHue = 150;
        this.svg.possibleHue = 50;
        this.svg.horizontalMargin = 10;
        this.svg.verticalMargin = 10;
        this.svg.lineWidth = 2;
        this.svg.standardFontSize = 17;
        this.svg.stepBrightness = 5;

        this._timeviewSvg = this.svg.buildSvg();
        this.$def = this.svg.createDefinitionContainer();
        this._timeviewSvg.appendChild(this.$def);
        this.filterMap = this.svg.createCustomFilters();
        this.$blur3dFilter = this.filterMap.get(`blur`);
        this.$def.appendChild(this.$blur3dFilter);
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


    // positionTextElement(svgText, x, y) {
    //     svgText.setAttributeNS(null, `x`, x);
    //     svgText.setAttributeNS(null, `y`, y);
    //     return svgText;
    // }

    // clearSvg() {
    //     this._timeviewSvg.childNodes.forEach((gNode) => {
    //         if (gNode.nodeName === `g`) {
    //             this._timeviewSvg.removeChild(gNode);
    //         }
    //     });
    // }

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
            this.svgSize = this.buildBoxSet(this.svg.fetchBackground(this.id), nodeModel, this.START_X, this.START_Y);
            this.windowSize = this.getBoundingClientRect();
            // this.syncSizes(nodeModel);
            // this.createSVG();
            this.redrawSvg();
            this.boxMap.clear(); // ?
        }
    }


    buildBoxSet(parentGroup, nodeModel, topLeftX, topLeftY) {
        let svgText;
        let groupTop;
        topLeftY = topLeftY + this.svg.standardFontSize;
        const box = new TimeviewBox();
        box.id = nodeModel.id;
        box.label = nodeModel.name;
        const labelElement = this.svg.createTextElement(box.label, nodeModel.id);
        const group = this.svg.createSubGroup(nodeModel.id);
        // const group = document.createElementNS(`http://www.w3.org/2000/svg`, `g`);
        // group.id = `timegroup:${nodeModel.id}`;
        parentGroup.appendChild(group);

        if (nodeModel.hasChildren()) {
            let newBox;
            if ((nodeModel._activity.connector.execution === `node.execution.parallel`) ||
            (nodeModel._activity.connector.execution === `node.execution.none`) ||
            (nodeModel._activity.connector.execution !== `node.execution.sequential`)) {               // Catch-all @TODO -> need smarter control
                let childTopLeftY = topLeftY;
                let widestChild = 0;
                let growingBoxHeight = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(group, child, topLeftX + this.svg.horizontalMargin, childTopLeftY + this.svg.verticalMargin);
                    childTopLeftY = childTopLeftY + newBox.height + this.svg.verticalMargin;
                    growingBoxHeight = growingBoxHeight + newBox.height;
                    if (newBox.width > widestChild) {
                        widestChild = newBox.width;
                    }
                });
                nodeModel.children.forEach((child) => {
                    const boxToStretch = this.boxMap.get(child.id);
                    boxToStretch.width = widestChild;
                    this.boxMap.set(child.id, boxToStretch);
                });
                box.topLeftX = topLeftX + this.svg.horizontalMargin;
                box.topLeftY = topLeftY + this.svg.verticalMargin;
                svgText = this.svg.positionItem(labelElement, box.topLeftX + this.svg.labelIndent, box.topLeftY);
                groupTop = group.firstChild;
                group.insertBefore(svgText, groupTop);
                box.height = growingBoxHeight + ((nodeModel.children.length + 1) * this.svg.verticalMargin) + this.svg.standardFontSize;

                box.width = Math.max(
                    widestChild + (this.svg.horizontalMargin * 2),
                    this.svg.labelWidth(labelElement) + (this.svg.labelIndent * 2)
                );
            }
            if (nodeModel._activity.connector.execution === `node.execution.sequential`) {
                let childTopLeftX = topLeftX;
                let tallestChild = 0;
                let growingBoxWidth = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(group, child, childTopLeftX + this.svg.horizontalMargin, topLeftY + this.svg.verticalMargin);
                    childTopLeftX = childTopLeftX + newBox.width + this.svg.horizontalMargin;
                    growingBoxWidth = growingBoxWidth + newBox.width;
                    if (newBox.height > tallestChild) {
                        tallestChild = newBox.height;
                    }
                });
                nodeModel.children.forEach((child) => {
                    const boxToStretch = this.boxMap.get(child.id);
                    boxToStretch.height = tallestChild;
                    this.boxMap.set(child.id, boxToStretch);
                });
                box.topLeftX = topLeftX + this.svg.horizontalMargin;
                box.topLeftY = topLeftY + this.svg.verticalMargin;
                svgText = this.svg.positionItem(labelElement, box.topLeftX + this.svg.labelIndent, box.topLeftY);
                groupTop = group.firstChild;
                group.insertBefore(svgText, groupTop);
                box.height = tallestChild + (this.svg.verticalMargin * 2) + this.svg.standardFontSize;
                box.width = Math.max(
                    growingBoxWidth + ((nodeModel.children.length + 1) * this.svg.horizontalMargin),
                    this.svg.labelWidth(labelElement) + (this.svg.labelIndent * 2)
                );
            }
        } else {
            box.topLeftX = topLeftX + this.svg.horizontalMargin;
            box.topLeftY = topLeftY + this.svg.verticalMargin;
            svgText = this.svg.positionItem(labelElement, box.topLeftX + this.svg.labelIndent, box.topLeftY);
            groupTop = group.firstChild;
            group.insertBefore(svgText, groupTop);
            box.height = this.svg.standardBoxHeight;
            box.width = this.svg.labelWidth(labelElement) + (this.svg.labelIndent * 2);
        }
        const svgBox = this.svg.createRectangle(box.width, box.height, nodeModel.id);
        this.svg.positionItem(svgBox, box.topLeftX, box.topLeftY);
        this.svg.applyFilter(svgBox, this.$custom3dFilter.id);
        this.svg.applyDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        if (this.hasColor) {
            this.svg.applyColorDepthEffect(svgBox, nodeModel.treeDepth, this.treeHeight);
        }
        // const svgBox = this.drawRectangle(box.topLeftX, box.topLeftY, box.width, box.height, nodeModel.treeDepth);
        // svgBox.id = `timebox:${nodeModel.id}`;
        group.insertBefore(svgBox, svgText);
        this.boxMap.set(box.id, box);
        return box;
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
        const svgViewSizeX = this.svgSize.width + this.START_X + this.svg.horizontalMargin;
        const svgViewSizeY = this.svgSize.height + this.START_Y + this.svg.verticalMargin;

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


// syncSizes(nodeModel) {  // attempt to size all boxes to maximum.
//     const box = this.boxMap.get(nodeModel.id);
//     if (!nodeModel.isRoot()) {
//         if ((nodeModel.parent._activity.connector.execution === `node.execution.parallel`) ||
//         (nodeModel.parent._activity.connector.execution === `node.execution.none`) ||
//         (nodeModel.parent._activity.connector.execution !== `node.execution.sequential`)) {
//             nodeModel.parent.children.forEach((sibling) => {
//                 if ((this.boxMap.has(sibling.id))) {    // (nodeModel.id !== sibling.id) &&
//                     const boxOfSibling = this.boxMap.get(sibling.id);
//                     console.log(`Comparing ${nodeModel.name} (${box.width}) and ${sibling.name} (${boxOfSibling.width})`);
//                     if (boxOfSibling.width > box.width) {
//                         console.log(`Sibling is bigger than me`);
//                         box.width = boxOfSibling.width;
//                         this.boxMap.set(nodeModel.id, box);
//                         const updatedBox = document.getElementById(`timebox:${nodeModel.id}`);
//                         updatedBox.setAttributeNS(null, `width`, box.width);
//                     } else if (box.width > boxOfSibling.width) {
//                         console.log(`I am bigger than sibling`);
//                         boxOfSibling.width = box.width;
//                         this.boxMap.set(sibling.id, boxOfSibling);
//                         const updatedBox = document.getElementById(`timebox:${sibling.id}`);
//                         updatedBox.setAttributeNS(null, `width`, box.width);
//                     }
//                 }
//             });
//         }
//     }
//     nodeModel.children.forEach((child) => {
//         if ((nodeModel._activity.connector.execution === `node.execution.parallel`) ||
//             (nodeModel._activity.connector.execution === `node.execution.none`) ||
//             (nodeModel._activity.connector.execution !== `node.execution.sequential`)) {
//             if (this.boxMap.has(child.id)) {
//                 const boxOfChild = this.boxMap.get(child.id);
//                 if (boxOfChild.width < box.width - (2 * this.svgParameters.HORIZONTAL_MARGIN)) {
//                     boxOfChild.width = box.width - (2 * this.svgParameters.HORIZONTAL_MARGIN);
//                     this.boxMap.set(child.id, boxOfChild);
//                     const updatedBox = document.getElementById(`timebox:${child.id}`);
//                     updatedBox.setAttributeNS(null, `width`, box.width);
//                 }
//             }
//         }
//         this.syncSizes(child);
//     });
// }

