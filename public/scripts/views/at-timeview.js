/**
 * @file AtTimeview - Visual area for viewing JAGs in the time domain.  This is a view only.
 *
 * @author ihmc (tlg)
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */

import TimeviewBox from '../models/timeview-box.js';
// customElements.define(`jag-timeview`, class extends HTMLElement {

class AtTimeview extends HTMLElement {

    constructor() {
        super();
        const svgns = `http://www.w3.org/2000/svg`;
        this._timeContainerWrapperDiv = document.createElement(`div`);
        this._timeContainerWrapperDiv.id = `time-container-wrapper`;
        this.appendChild(this._timeContainerWrapperDiv);

        this._timeviewSvg = document.createElementNS(svgns, `svg`);
        this._timeviewSvg.id = `time-container`;
        this._timeviewSvg.setAttribute(`version`, `1.1`);
        this._timeviewSvg.setAttribute(`xmlns`, svgns);

        const defs = document.createElementNS(svgns, `defs`);
        this._timeviewSvg.appendChild(defs);

        const filter = document.createElementNS(svgns, `filter`);
        filter.setAttributeNS(null, `id`, `blur-effect`);
        filter.setAttributeNS(null, `x`, `-20px`);
        filter.setAttributeNS(null, `y`, `-20px`);
        filter.setAttributeNS(null, `width`, `160px`);
        filter.setAttributeNS(null, `height`, `160px`);
        defs.appendChild(filter);

        const feOffset = document.createElementNS(svgns, `feOffset`);
        feOffset.setAttributeNS(null, `result`, `offOut`);
        feOffset.setAttributeNS(null, `in`, `SourceAlpha`);
        feOffset.setAttributeNS(null, `dx`, `3`);
        feOffset.setAttributeNS(null, `dy`, `3`);

        const feGaussianBlur = document.createElementNS(svgns, `feGaussianBlur`);
        feGaussianBlur.setAttributeNS(null, `result`, `blurOut`);
        feGaussianBlur.setAttributeNS(null, `in`, `offOut`);
        feGaussianBlur.setAttributeNS(null, `stdDeviation`, `2`);

        const feBlend = document.createElementNS(svgns, `feBlend`);
        feBlend.setAttributeNS(null, `in`, `SourceGraphic`);
        feBlend.setAttributeNS(null, `in2`, `blurOut`);
        feBlend.setAttributeNS(null, `mode`, `normal`);

        filter.appendChild(feOffset);
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feBlend);

        this.svgLocationX = 0;
        this.svgLocationY = 0;
        this.windowSize = null;
        this.svgSize = null;
        this.panX = 0;
        this.panY = 0;
        this.zoomStep = 0;
        this._timeviewSvg.setAttribute(`overflow-x`, `auto`);
        this._timeviewSvg.setAttribute(`overflow-y`, `auto`);

        this._timeContainerWrapperDiv.appendChild(this._timeviewSvg);
        this.START_X = 5;
        this.START_Y = 5;
        this.HORIZONTAL_MARGIN = 10;
        this.VERTICAL_MARGIN = 10;
        this.LINE_WIDTH = 1;
        this.STANDARD_FONT_SIZE = 15;
        this.LABEL_INDENT = this.VERTICAL_MARGIN / 2;
        this.LABEL_HEIGHT = this.STANDARD_FONT_SIZE;
        this.STANDARD_BOX_HEIGHT = this.STANDARD_FONT_SIZE + this.LABEL_INDENT;

        this.boxMap = new Map();

        this._timeviewSvg.addEventListener(`mousedown`, this.svgMouseDownEvent.bind(this));
        this._timeviewSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));
        this._boundDragView = this.dragView.bind(this);
        this._boundStopDragView = this.stopDragView.bind(this);
    }

    drawRectangle(x, y, width, height) {
        const rectangle = document.createElementNS(`http://www.w3.org/2000/svg`, `rect`);
        rectangle.setAttributeNS(null, `x`, x);
        rectangle.setAttributeNS(null, `y`, y);
        rectangle.setAttributeNS(null, `width`, width);
        rectangle.setAttributeNS(null, `height`, height);
        rectangle.setAttributeNS(null, `rx`, `3`);
        rectangle.setAttributeNS(null, `fill`, `none`);
        rectangle.setAttributeNS(null, `stroke`, `black`);
        rectangle.setAttributeNS(null, `stroke-width`, this.LINE_WIDTH.toString());
        rectangle.setAttributeNS(null, `filter`, `url(#blur-effect)`);
        return rectangle;
    }

    createTextElement(text) {
        const svgText = document.createElementNS(`http://www.w3.org/2000/svg`, `text`);
        svgText.setAttributeNS(null, `font-size`, this.STANDARD_FONT_SIZE.toString());
        svgText.setAttributeNS(null, `dominant-baseline`, `text-before-edge`);
        const textNode = document.createTextNode(text);
        svgText.appendChild(textNode);
        return svgText;
    }

    labelWidth(svgText) {
        const bbox = svgText.getBBox();
        const {width} = bbox;
        return width;
    }

    positionTextElement(svgText, x, y) {
        svgText.setAttributeNS(null, `x`, x);
        svgText.setAttributeNS(null, `y`, y);
        return svgText;
    }

    clearSvg() {
        this._timeviewSvg.childNodes.forEach((gNode) => {
            if (gNode.nodeName === `g`) {
                this._timeviewSvg.removeChild(gNode);
            }
        });
    }

    refreshTimeview(nodeModel) {
        this.clearSvg();
        this.zoomStep = 0;
        this.svgLocationX = 0;
        this.svgLocationY = 0;
        this.svgSize = this.buildBoxSet(document.getElementById(`time-container`), nodeModel, this.START_X, this.START_Y);
        this.windowSize = this.getBoundingClientRect();
        // this.syncSizes(nodeModel);
        // this.createSVG();
        this.redrawSvg();
        this.boxMap.clear();
    }

    // createSVG(){
    //     this.boxMap.forEach((value, key) => {
    //         this.drawRectangle(value.x,value.y,value.width,value.height));
    //     });
    // }

    syncSizes(nodeModel) {

        const box = this.boxMap.get(nodeModel.id);
        if (!nodeModel.isRoot()) {
            if ((nodeModel.parent._activity.connector.execution === `node.execution.parallel`) ||
            (nodeModel.parent._activity.connector.execution === `node.execution.none`) ||
            (nodeModel.parent._activity.connector.execution !== `node.execution.sequential`)) {
                nodeModel.parent.children.forEach((sibling) => {
                    if ((this.boxMap.has(sibling.id))) {    // (nodeModel.id !== sibling.id) &&
                        const boxOfSibling = this.boxMap.get(sibling.id);
                        console.log(`Comparing ${nodeModel.name} (${box.width}) and ${sibling.name} (${boxOfSibling.width})`);
                        if (boxOfSibling.width > box.width) {
                            console.log(`Sibling is bigger than me`);
                            box.width = boxOfSibling.width;
                            this.boxMap.set(nodeModel.id, box);
                            let updatedBox = document.getElementById(`timebox:${nodeModel.id}`);
                            updatedBox.setAttributeNS(null, `width`, box.width);
                        } else if (box.width > boxOfSibling.width) {
                            console.log(`I am bigger than sibling`);
                            boxOfSibling.width = box.width;
                            this.boxMap.set(sibling.id, boxOfSibling);
                            let updatedBox = document.getElementById(`timebox:${sibling.id}`);
                            updatedBox.setAttributeNS(null, `width`, box.width);
                        }
                    }
                });
            }
        }
        nodeModel.children.forEach((child) => {
            if ((nodeModel._activity.connector.execution === `node.execution.parallel`) ||
                (nodeModel._activity.connector.execution === `node.execution.none`) ||
                (nodeModel._activity.connector.execution !== `node.execution.sequential`)) {
                if (this.boxMap.has(child.id)) {
                    const boxOfChild = this.boxMap.get(child.id);
                    if (boxOfChild.width < box.width - (2 * this.HORIZONTAL_MARGIN)) {
                        boxOfChild.width = box.width - (2 * this.HORIZONTAL_MARGIN);
                        this.boxMap.set(child.id, boxOfChild);
                        let updatedBox = document.getElementById(`timebox:${child.id}`);
                        updatedBox.setAttributeNS(null, `width`, box.width);
                    }
                }
            }
            this.syncSizes(child);
        });

    }


    buildBoxSet(parentGroup, nodeModel, topLeftX, topLeftY) {
        topLeftY = topLeftY + this.LABEL_HEIGHT;
        const box = new TimeviewBox();
        box.id = nodeModel.id;
        box.label = nodeModel.name;
        const labelElement = this.createTextElement(box.label);
        const group = document.createElementNS(`http://www.w3.org/2000/svg`, `g`);
        group.id = `timegroup:${nodeModel.id}`;
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
                    newBox = this.buildBoxSet(group, child, topLeftX + this.HORIZONTAL_MARGIN, childTopLeftY + this.VERTICAL_MARGIN);
                    childTopLeftY = childTopLeftY + newBox.height + this.VERTICAL_MARGIN;
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
                box.topLeftX = topLeftX + this.HORIZONTAL_MARGIN;
                box.topLeftY = topLeftY + this.VERTICAL_MARGIN;
                const svgText = this.positionTextElement(labelElement, box.topLeftX + this.LABEL_INDENT, box.topLeftY);
                group.appendChild(svgText);
                box.height = growingBoxHeight + ((nodeModel.children.length + 1) * this.VERTICAL_MARGIN) + this.LABEL_HEIGHT;

                box.width = Math.max(
                    widestChild + (this.HORIZONTAL_MARGIN * 2),
                    this.labelWidth(labelElement) + (this.LABEL_INDENT * 2)
                );
            }
            if (nodeModel._activity.connector.execution === `node.execution.sequential`) {
                let childTopLeftX = topLeftX;
                let tallestChild = 0;
                let growingBoxWidth = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(group, child, childTopLeftX + this.HORIZONTAL_MARGIN, topLeftY + this.VERTICAL_MARGIN);
                    childTopLeftX = childTopLeftX + newBox.width + this.HORIZONTAL_MARGIN;
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
                box.topLeftX = topLeftX + this.HORIZONTAL_MARGIN;
                box.topLeftY = topLeftY + this.VERTICAL_MARGIN;
                const svgText = this.positionTextElement(labelElement, box.topLeftX + this.LABEL_INDENT, box.topLeftY);
                group.appendChild(svgText);
                box.height = tallestChild + (this.VERTICAL_MARGIN * 2) + this.LABEL_HEIGHT;
                box.width = Math.max(
                    growingBoxWidth + ((nodeModel.children.length + 1) * this.HORIZONTAL_MARGIN),
                    this.labelWidth(labelElement) + (this.LABEL_INDENT * 2)
                );
            }
        } else {
            box.topLeftX = topLeftX + this.HORIZONTAL_MARGIN;
            box.topLeftY = topLeftY + this.VERTICAL_MARGIN;
            const svgText = this.positionTextElement(labelElement, box.topLeftX + this.LABEL_INDENT, box.topLeftY);
            group.appendChild(svgText);
            box.height = this.STANDARD_BOX_HEIGHT;
            box.width = this.labelWidth(labelElement) + (this.LABEL_INDENT * 2);
        }
        const svgBox = this.drawRectangle(box.topLeftX, box.topLeftY, box.width, box.height);
        svgBox.id = `timebox:${nodeModel.id}`;
        group.appendChild(svgBox);
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
        const svgViewSizeX = this.svgSize.width + this.START_X + this.HORIZONTAL_MARGIN;
        const svgViewSizeY = this.svgSize.height + this.START_Y + this.VERTICAL_MARGIN;

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

