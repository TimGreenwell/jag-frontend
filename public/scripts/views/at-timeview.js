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
        this.appendChild(this._timeContainerDiv);
    }

    static {
        const LINE_WIDTH = 2;
        const HORIZONTAL_MARGIN = 2;
        const VERTICAL_MARGIN = 2;
        const START_X = 10;
        const START_Y = 10;
    }

    drawRectangle(x, y, width, height) {
        const rectangle = document.createElementNS(`http://www.w3.org/2000/svg`, `rect`);
        rectangle.setAttributeNS(null, `x`, x);
        rectangle.setAttributeNS(null, `y`, y);
        rectangle.setAttributeNS(null, `width`, width);
        rectangle.setAttributeNS(null, `height`, height);
        rectangle.setAttributeNS(null, `fill`, `none`);
        rectangle.setAttributeNS(null, `stroke`, `black`);
        rectangle.setAttributeNS(null, `stroke-width`, `2`);
        document.getElementById( `time-container`).appendChild(rectangle);
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
        document.getElementById( `time-container`).appendChild(svgText);
    }

    clearSvg() {
        while (this._timeContainerDiv.hasChildNodes()) {
            const deadChild = this._timeContainerDiv.firstChild;
            this._timeContainerDiv.removeChild(deadChild);
        }
    }

    drawNode(startX = TimeviewBox.START_X, startY = TimeviewBox.START_Y, nodeModel) {
        const timeviewBox = new TimeviewBox();
        timeviewBox.id = nodeModel.id;
        timeviewBox.label = nodeModel.urn;
        console.log(nodeModel);
        if (nodeModel.hasChildren()) {
            console.log(`hasChildren`);
        } else {
            console.log(`is a Leaf`);
        }
        this._timeview.clearSvg();
        this._timeview.drawRectangle(50, 50, 100, 20);
        this._timeview.writeText(50, 50, `Goober`);
    }

}


customElements.define(`jag-timeview`, AtTimeview);

export default customElements.get(`jag-timeview`);

