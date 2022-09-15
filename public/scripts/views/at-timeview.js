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
        const windowHeight = this._timeContainerWrapperDiv.getBoundingClientRect().height;
        const windowWidth = this._timeContainerWrapperDiv.getBoundingClientRect().width;


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

        // const feOffset = document.createElementNS(svgns, `feOffset`);
        // feOffset.setAttributeNS(null, `result`, `offOut`);
        // feOffset.setAttributeNS(null, `in`, `SourceAlpha`);
        // feOffset.setAttributeNS(null, `dx`, `0`);
        // feOffset.setAttributeNS(null, `dy`, `0`);


        const feGaussianBlur = document.createElementNS(svgns, `feGaussianBlur`);
        // this._gaussianFilter.setAttribute(`in`, `SourceGraphic`);
        // feGaussianBlur.setAttributeNS(null, `result`, `blurOut`);
        // feGaussianBlur.setAttributeNS(null, `in`, `offOut`);
        feGaussianBlur.setAttributeNS(null, `stdDeviation`, `2`);

        // const feBlend = document.createElementNS(svgns, `feBlend`);
        // feBlend.setAttributeNS(null, `in`, `SourceGraphic`);
        // feBlend.setAttributeNS(null, `in2`, `blurOut`);
        // feBlend.setAttributeNS(null, `mode`, `normal`);

        // filter.appendChild(feOffset);
        filter.appendChild(feGaussianBlur);
        // filter.appendChild(feBlend);



        this.svgLocationX = 0;
        this.svgLocationY = 0;
        this.windowHeight = 0;
        this.windowWidth = 0;
        this.zoomAdjustment = 0;
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

    // setViewBox(x,y){
    //     height = this._timeviewSvg.first.firstOne
    //     this._timeviewSvg.setAttribute(`viewBox`, `0 0 ${x} ${y}`);
    // }

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
        // rectangle.style.filter = `url(#blur-effect)`;
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
        // while (this._timeviewSvg.hasChildNodes()) {
        //     const deadChild = this._timeviewSvg.firstChild;
        //     this._timeviewSvg.removeChild(deadChild);
        // }
    }

    refreshTimeview(nodeModel) {
        this.clearSvg();
        this.zoomStep = 0;
        this.svgLocationX = 0;
        this.svgLocationY = 0;
        this.svgSize = this.buildBoxSet(document.getElementById(`time-container`), nodeModel, this.START_X, this.START_Y);
        this.windowSize = this.getBoundingClientRect();
        const zoomedBoxWidth = this.windowSize.width + (this.windowSize.width * this.zoomStep * 0.05);
        const zoomedBoxHeight = this.windowSize.height + (this.windowSize.height * this.zoomStep * 0.05);
        this._timeviewSvg.setAttribute(
            `viewBox`,
            `${this.svgLocationX} ${this.svgLocationY}  ${zoomedBoxWidth}  ${zoomedBoxHeight}`
        );
        this.boxMap.clear();
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
                box.x = topLeftX + this.HORIZONTAL_MARGIN;
                box.y = topLeftY + this.VERTICAL_MARGIN;
                const svgText = this.positionTextElement(labelElement, box.x + this.LABEL_INDENT, box.y);
                group.appendChild(svgText);
                box.height = growingBoxHeight + ((nodeModel.children.length + 1) * this.VERTICAL_MARGIN) + this.LABEL_HEIGHT;
                box.width = Math.max(
                    widestChild + (this.HORIZONTAL_MARGIN * 2),
                    this.labelWidth(labelElement) + (this.LABEL_INDENT * 2)
                );
            }
            if (nodeModel._activity.connector.execution === `node.execution.sequential`) {
                let childTopLeftX = topLeftX;
                let biggestY = 0;
                let growingBoxWidth = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(group, child, childTopLeftX + this.HORIZONTAL_MARGIN, topLeftY + this.VERTICAL_MARGIN);
                    childTopLeftX = childTopLeftX + newBox.width + this.HORIZONTAL_MARGIN;
                    growingBoxWidth = growingBoxWidth + newBox.width;
                    if (newBox.height > biggestY) {
                        biggestY = newBox.height;
                    }
                });
                nodeModel.children.forEach((child) => {
                    const boxToStretch = this.boxMap.get(child.id);
                    boxToStretch.height = biggestY;
                    this.boxMap.set(child.id, boxToStretch);
                });
                box.x = topLeftX + this.HORIZONTAL_MARGIN;
                box.y = topLeftY + this.VERTICAL_MARGIN;
                const svgText = this.positionTextElement(labelElement, box.x + this.LABEL_INDENT, box.y);
                group.appendChild(svgText);
                box.height = biggestY + (this.VERTICAL_MARGIN * 2) + this.LABEL_HEIGHT;
                box.width = Math.max(
                    growingBoxWidth + ((nodeModel.children.length + 1) * this.HORIZONTAL_MARGIN),
                    this.labelWidth(labelElement) + (this.LABEL_INDENT * 2)
                );
            }
        } else {
            box.x = topLeftX + this.HORIZONTAL_MARGIN;
            box.y = topLeftY + this.VERTICAL_MARGIN;
            const svgText = this.positionTextElement(labelElement, box.x + this.LABEL_INDENT, box.y);
            group.appendChild(svgText);
            box.height = this.STANDARD_BOX_HEIGHT;
            box.width = this.labelWidth(labelElement) + (this.LABEL_INDENT * 2);
        }
        const svgBox = this.drawRectangle(box.x, box.y, box.width, box.height);
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

    redrawSvg() {
        const zoomedBoxWidth = this.windowSize.width + (this.windowSize.width * this.zoomStep * 0.05);
        const zoomedBoxHeight = this.windowSize.height + (this.windowSize.height * this.zoomStep * 0.05);
        if ((zoomedBoxWidth > 0) && (zoomedBoxHeight)) {
            this._timeviewSvg.setAttribute(
                `viewBox`,
                `${this.panX} ${this.panY}  ${zoomedBoxWidth}  ${zoomedBoxHeight}`
            );
        }
    }

    dragView(e) {
        const zoomedBoxWidth = this.windowSize.width + (this.windowSize.width * this.zoomStep * 0.05);
        const zoomedBoxHeight = this.windowSize.height + (this.windowSize.height * this.zoomStep * 0.05);
        const svgViewSizeX = this.svgSize.width + this.START_X + this.HORIZONTAL_MARGIN;
        const svgViewSizeY = this.svgSize.height + this.START_Y + this.VERTICAL_MARGIN;

        if (zoomedBoxWidth > svgViewSizeX) {
            this.panX = 0;
        } else {
            const delta = this._initialMouse.x - e.clientX;
            this.panX = Math.min(
                this.svgLocationX + (delta + (delta * this.zoomStep * 0.05)),
                svgViewSizeX - zoomedBoxWidth
            );
        }
        if (zoomedBoxHeight > svgViewSizeY) {
            this.panY = 0;
        } else {
            const delta = this._initialMouse.y - e.clientY;
            this.panY = Math.min(
                this.svgLocationY + (delta + (delta * this.zoomStep * 0.05)),
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

    stopDragView(event) {
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

