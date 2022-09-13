/**
 * @file AtTimeview - Visual area for viewing JAGs in the time domain.  This is a view only.
 *
 * @author ihmc (tlg)
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */

import TimeviewBox from '../models/timeview-box.js';

class AtTimeview extends HTMLElement {

    constructor() {
        super();
        this._timeContainerWrapperDiv = document.createElement(`div`);
        this._timeContainerWrapperDiv.id = `time-container-wrapper`;
        this.appendChild(this._timeContainerWrapperDiv);
        const windowHeight = this._timeContainerWrapperDiv.getBoundingClientRect().height;
        const windowWidth = this._timeContainerWrapperDiv.getBoundingClientRect().width;
        // const windowHeight = this.getBoundingClientRect().height;
        // const windowWidth = this.getBoundingClientRect().width;
        this._timeviewSvg = document.createElementNS(`http://www.w3.org/2000/svg`, `svg`);
        this._timeviewSvg.id = `time-container`;
        this._timeviewSvg.setAttribute(`version`, `1.1`);
        this._timeviewSvg.setAttribute(`xmlns`, `http://www.w3.org/2000/svg`);
        this.panX = 0;
        this.panY = 0;
        this.windowHeight = 0;
        this.windowWidth = 0;
        this.ratio = 0;
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

        this._timeviewSvg.addEventListener(`mousedown`, this.playgroundClicked.bind(this));
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
        rectangle.setAttributeNS(null, `fill`, `none`);
        rectangle.setAttributeNS(null, `stroke`, `black`);
        rectangle.setAttributeNS(null, `stroke-width`, this.LINE_WIDTH.toString());
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
        while (this._timeviewSvg.hasChildNodes()) {
            const deadChild = this._timeviewSvg.firstChild;
            this._timeviewSvg.removeChild(deadChild);
        }
    }

    refreshTimeview(nodeModel) {
        this.clearSvg();
        const outerBox = document.getElementById(`time-container-wrapper`).getBoundingClientRect();
    //    this._timeviewSvg.setAttribute(`viewBox`, `0 0 ${outerBox.width} ${outerBox.height}`);
        let boxSize = this.buildBoxSet(document.getElementById(`time-container`), nodeModel, this.START_X, this.START_Y);
        this.windowHeight = this.getBoundingClientRect().height;
        this.windowWidth = this.getBoundingClientRect().width;
        console.log(this.windowWidth);
        console.log(boxSize.width);
        this.ratio = this.windowWidth / boxSize.width;
        this.panX = 0;
        this.panY = 0;
        this._timeviewSvg.setAttribute(`viewBox`, `${this.panX} ${this.panY} ${this.windowWidth}  ${this.windowHeight}`);
        this.boxMap.clear();

        console.log(`-------------`);
        console.log(outerBox.width);
        console.log(outerBox.height);
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


    dragView(e) {
        console.log(this.ratio);
        this.panX = this.panX + ((this._initialMouse.x - e.clientX) * this.ratio) ;
        this.panY = this.panY + ((this._initialMouse.y - e.clientY) * this.ratio) ;
        const boxSize = this.getBoundingClientRect();
        this._timeviewSvg.setAttribute(`viewBox`, `${this.panX} ${this.panY}  ${this.windowWidth}  ${this.windowHeight}`);
    }

    stopDragView(event) {
        this.removeEventListener(`mousemove`, this._boundDragView);
    }

    playgroundClicked(e) {
        // The background clicker
        this.windowHeight = this.getBoundingClientRect().height;
        this.windowWidth = this.getBoundingClientRect().width;
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

