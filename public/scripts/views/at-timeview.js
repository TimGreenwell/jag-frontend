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
        this._timeContainerWrapperDiv.id = `timeContainerWrapper`;
        this.appendChild(this._timeContainerWrapperDiv);
        this._timeContainerDiv = document.createElementNS(`http://www.w3.org/2000/svg`, `svg`);
        this._timeContainerDiv.id = `time-container`;
        this._timeContainerDiv.setAttribute(`version`, `1.1`);
        this._timeContainerDiv.setAttribute(`xmlns`, `http://www.w3.org/2000/svg`);
        this._timeContainerDiv.setAttribute(`width`, `100%`);
        this._timeContainerDiv.setAttribute(`height`, `100%`);
        this._timeContainerWrapperDiv.appendChild(this._timeContainerDiv);
        this.START_X = 10;
        this.START_Y = 10;
        this.HORIZONTAL_MARGIN = 10;
        this.VERTICAL_MARGIN = 10;
        this.LINE_WIDTH = 1;
        this.STANDARD_FONT_SIZE = 15;
        this.LABEL_INDENT = this.VERTICAL_MARGIN / 2;
        this.LABEL_HEIGHT = this.STANDARD_FONT_SIZE;
        this.STANDARD_BOX_HEIGHT = this.STANDARD_FONT_SIZE + this.LABEL_INDENT;

        this.boxMap = new Map();
    }

    drawRectangle(x, y, width, height) {
        const rectangle = document.createElementNS(`http://www.w3.org/2000/svg`, `rect`);
        rectangle.setAttributeNS(null, `x`, x);
        rectangle.setAttributeNS(null, `y`, y);
        rectangle.setAttributeNS(null, `width`, width);
        rectangle.setAttributeNS(null, `height`, height);
        rectangle.setAttributeNS(null, `fill`, `none`);
        rectangle.setAttributeNS(null, `stroke`, `black`);
        rectangle.setAttributeNS(null, `stroke-width`, this.LINE_WIDTH.toString());
        document.getElementById(`time-container`).appendChild(rectangle);
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

    writeTextElement(svgText, x, y) {
        svgText.setAttributeNS(null, `x`, x);
        svgText.setAttributeNS(null, `y`, y);
        document.getElementById(`time-container`).appendChild(svgText);
    }


    clearSvg() {
        while (this._timeContainerDiv.hasChildNodes()) {
            const deadChild = this._timeContainerDiv.firstChild;
            this._timeContainerDiv.removeChild(deadChild);
        }
    }

    refreshTimeview(nodeModel) {
        this.clearSvg();
        this.boxMap.clear();
        this.buildBoxSet(nodeModel, this.START_X, this.START_Y);
        for (const box of this.boxMap.values()) {
            this.drawRectangle(box.x, box.y, box.width, box.height);
        }
    }

    buildBoxSet(nodeModel, topLeftX, topLeftY) {
        topLeftY = topLeftY + this.LABEL_HEIGHT;
        const box = new TimeviewBox();
        box.id = nodeModel.id;
        box.label = nodeModel.name;
        const labelElement = this.createTextElement(box.label);

        if (nodeModel.hasChildren()) {
            let newBox;
            if (nodeModel._activity.connector.execution === `node.execution.parallel`) {
                let childTopLeftY = topLeftY;
                let widestChild = 0;
                let growingBoxHeight = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(child, topLeftX + this.HORIZONTAL_MARGIN, childTopLeftY + this.VERTICAL_MARGIN);
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
                this.writeTextElement(labelElement, box.x + this.LABEL_INDENT, box.y);
                box.height = growingBoxHeight + ((nodeModel.children.length + 1) * this.VERTICAL_MARGIN) + this.LABEL_HEIGHT;
                box.width = Math.max(
                    widestChild + (this.HORIZONTAL_MARGIN * 2),
                    this.labelWidth(labelElement) + (this.LABEL_INDENT * 2)
                );
            }
            if ((nodeModel._activity.connector.execution === `node.execution.sequential`) ||
                (nodeModel._activity.connector.execution === `node.execution.none`) ||
                (nodeModel._activity.connector.execution !== `node.execution.parallel`))  // Catch-all @TODO -> need smarter control
            {
                let childTopLeftX = topLeftX;
                let biggestY = 0;
                let growingBoxWidth = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(child, childTopLeftX + this.HORIZONTAL_MARGIN, topLeftY + this.VERTICAL_MARGIN);
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
                this.writeTextElement(labelElement, box.x + this.LABEL_INDENT, box.y);
                box.height = biggestY + (this.VERTICAL_MARGIN * 2) + this.LABEL_HEIGHT;
                box.width = Math.max(
                    growingBoxWidth + ((nodeModel.children.length + 1) * this.HORIZONTAL_MARGIN),
                    this.labelWidth(labelElement) + (this.LABEL_INDENT * 2)
                );
            }
        } else {
            box.x = topLeftX + this.HORIZONTAL_MARGIN;
            box.y = topLeftY + this.VERTICAL_MARGIN;
            this.writeTextElement(labelElement, box.x + this.LABEL_INDENT, box.y);
            box.height = this.STANDARD_BOX_HEIGHT;
            box.width = this.labelWidth(labelElement) + (this.LABEL_INDENT * 2);
        }
        this.boxMap.set(box.id, box);
        return box;
    }

}

customElements.define(`jag-timeview`, AtTimeview);
export default customElements.get(`jag-timeview`);

