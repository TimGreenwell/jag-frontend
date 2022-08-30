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
        this._timeContainerDiv = document.createElementNS(`http://www.w3.org/2000/svg`, `svg`);
        this._timeContainerDiv.id = `time-container`;
        this._timeContainerDiv.setAttribute(`version`, `1.1`);
        this._timeContainerDiv.setAttribute(`xmlns`, `http://www.w3.org/2000/svg`);
        this._timeContainerDiv.setAttribute(`width`, `100%`);
        this._timeContainerDiv.setAttribute(`height`, `auto`);
        this.appendChild(this._timeContainerDiv);
        this.boxMap = new Map();
        this.START_X = 10;
        this.START_Y = 10;
        this.HORIZONTAL_MARGIN = 10;
        this.VERTICAL_MARGIN = 10;
        this.LINE_WIDTH = 1;
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

    writeText(x, y, text) {
        const svgText = document.createElementNS(`http://www.w3.org/2000/svg`, `text`);
        svgText.setAttributeNS(null, `x`, x);
        svgText.setAttributeNS(null, `y`, y);
        svgText.setAttributeNS(null, `width`, `30`);
        svgText.setAttributeNS(null, `height`, `auto`);
        svgText.setAttributeNS(null, `font-size`, `20`);
        const textNode = document.createTextNode(text);
        svgText.appendChild(textNode);
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
        this.buildBoxSet(nodeModel, this.START_X, this.START_Y, 0, 0);
        for (const box of this.boxMap.values()) {
            console.log(`id : ${box.id}`);
            console.log(`label : ${box.label}`);
            console.log(`x : ${box.x}`);
            console.log(`y : ${box.y}`);
            console.log(`height : ${box.height}`);
            console.log(`width : ${box.width}`);
            console.log(`\n`);
            this.drawRectangle(box.x, box.y, box.width, box.height);
        }
    }

    buildBoxSet(nodeModel, topLeftX, topLeftY, width = 0, height = 0) {
        if (nodeModel.hasChildren()) {
            const box = new TimeviewBox();
            let newBox;
            if (nodeModel._activity.connector.execution === `node.execution.parallel`) {
                let childrenTopLeftY = topLeftY;
                let biggestX = 0;
                let parentBoxHeight = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(child, topLeftX + this.HORIZONTAL_MARGIN, childrenTopLeftY + this.VERTICAL_MARGIN, 0, 0);
                    childrenTopLeftY = childrenTopLeftY + newBox.height + this.VERTICAL_MARGIN;
                    parentBoxHeight = parentBoxHeight + newBox.height;
                    if (newBox.width > biggestX){
                        biggestX = newBox.width;
                    }
                });
                nodeModel.children.forEach((child) => {
                    let boxToStretch = this.boxMap.get(child.id);
                    boxToStretch.width = biggestX;
                    this.boxMap.set(child.id, boxToStretch);
                });
                box.x = topLeftX + this.HORIZONTAL_MARGIN;
                box.y = topLeftY + this.VERTICAL_MARGIN;
                box.height = parentBoxHeight + ((nodeModel.children.length + 1) * this.VERTICAL_MARGIN);
                box.width = biggestX + (this.HORIZONTAL_MARGIN * 2);
                box.label = nodeModel.urn;
                box.id = nodeModel.id;
                this.boxMap.set(box.id, box);
                return box;
            }
            if (nodeModel._activity.connector.execution === `node.execution.sequential`) {
                let childrenTopLeftX = topLeftX;
                let biggestY = 0;
                let parentBoxWidth = 0;
                nodeModel.children.forEach((child) => {
                    newBox = this.buildBoxSet(child, childrenTopLeftX + this.HORIZONTAL_MARGIN, topLeftY + this.VERTICAL_MARGIN, 0, 0);
                    childrenTopLeftX = childrenTopLeftX + newBox.width + this.HORIZONTAL_MARGIN;
                    parentBoxWidth = parentBoxWidth + newBox.width;
                    if (newBox.height > biggestY){
                        biggestY = newBox.height;
                    }
                });
                nodeModel.children.forEach((child) => {
                    let boxToStretch = this.boxMap.get(child.id);
                    boxToStretch.height = biggestY;
                    this.boxMap.set(child.id, boxToStretch);
                });
                box.x = topLeftX + this.HORIZONTAL_MARGIN;
                box.y = topLeftY + this.VERTICAL_MARGIN;
                box.height = biggestY + (this.VERTICAL_MARGIN * 2);
                console.log(parentBoxWidth);
                console.log(nodeModel.children.width);
                console.log(this.HORIZONTAL_MARGIN);
                box.width = parentBoxWidth + ((nodeModel.children.length + 1) * this.HORIZONTAL_MARGIN);
                box.label = nodeModel.urn;
                box.id = nodeModel.id;
                this.boxMap.set(box.id, box);
                return box;
            }
        } else {
            const box = new TimeviewBox();
            box.x = topLeftX + this.HORIZONTAL_MARGIN;
            box.y = topLeftY + this.VERTICAL_MARGIN;
            box.height = 30;
            box.width = 60;
            box.label = nodeModel.urn;
            box.id = nodeModel.id;
            this.boxMap.set(box.id, box);
            return box;
        }
    }

    drawNode(nodeModel, startX = TimeviewBox.START_X, startY = TimeviewBox.START_Y) {
        const timeviewBox = new TimeviewBox();
        timeviewBox.id = nodeModel.id;
        timeviewBox.label = nodeModel.urn;
        console.log(nodeModel);
        if (nodeModel.hasChildren()) {
            console.log(`hasChildren`);
        } else {
            console.log(`is a Leaf`);
        }

        this.drawRectangle(50, 50, 100, 20);
        this.writeText(50, 50, `Goober`);
    }

}


customElements.define(`jag-timeview`, AtTimeview);

export default customElements.get(`jag-timeview`);

