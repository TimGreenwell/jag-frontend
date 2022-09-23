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
        this.SVGNS = `http://www.w3.org/2000/svg`;
        this.START_X = 5;
        this.START_Y = 5;
        this.HORIZONTAL_MARGIN = 10;
        this.VERTICAL_MARGIN = 10;
        this.LINE_WIDTH = 2;
        this.STANDARD_FONT_SIZE = 17;
        this.LABEL_INDENT = this.VERTICAL_MARGIN / 2;
        this.LABEL_HEIGHT = this.STANDARD_FONT_SIZE;
        this.STANDARD_BOX_HEIGHT = this.STANDARD_FONT_SIZE + this.LABEL_INDENT;

        this._timeContainerWrapperDiv = document.createElement(`div`);
        this._timeContainerWrapperDiv.id = `time-container-wrapper`;
        this.appendChild(this._timeContainerWrapperDiv);

        this._timeviewSvg = document.createElementNS(this.SVGNS, `svg`);
        this._timeviewSvg.id = `time-container`;
        this._timeviewSvg.setAttribute(`version`, `1.1`);
        this._timeviewSvg.setAttribute(`xmlns`, this.SVGNS);

        this.$def = this.createFilterDefinition();
        this._timeviewSvg.appendChild(this.$def);

        this.currentNodeModel = null;
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

        this.boxMap = new Map();
        this.zoomMap = new Map();

        this._timeviewSvg.addEventListener(`mousedown`, this.svgMouseDownEvent.bind(this));
        this._timeviewSvg.addEventListener(`wheel`, this.svgWheelZoomEvent.bind(this));
        this._boundDragView = this.dragView.bind(this);
        this._boundStopDragView = this.stopDragView.bind(this);
        this._treeHeight = null;
    }

    createFilterDefinition(){
        const defs = document.createElementNS(this.SVGNS, `defs`);

        const filter = document.createElementNS(this.SVGNS, `filter`);
        filter.setAttributeNS(null, `id`, `blur-effect`);
        filter.setAttributeNS(null, `x`, `-20%`);
        filter.setAttributeNS(null, `y`, `-20%`);
        filter.setAttributeNS(null, `width`, `150%`);
        filter.setAttributeNS(null, `height`, `180%`);
        defs.appendChild(filter);

        // ////////////////////////////////////////////////////////////////////////////////////////////
        const feOffset = document.createElementNS(this.SVGNS, `feOffset`);
        feOffset.setAttributeNS(null, `in`, `SourceAlpha`);
        feOffset.setAttributeNS(null, `result`, `offOut`);
        feOffset.setAttributeNS(null, `dx`, `3`);
        feOffset.setAttributeNS(null, `dy`, `3`);

        const feGaussianBlur = document.createElementNS(this.SVGNS, `feGaussianBlur`);
        feGaussianBlur.setAttributeNS(null, `in`, `offOut`);
        feGaussianBlur.setAttributeNS(null, `result`, `blurOut`);
        feGaussianBlur.setAttributeNS(null, `stdDeviation`, `2`);

        const feBlend = document.createElementNS(this.SVGNS, `feBlend`);
        feBlend.setAttributeNS(null, `in`, `SourceGraphic`);
        feBlend.setAttributeNS(null, `in2`, `blurOut`);
        feBlend.setAttributeNS(null, `mode`, `normal`);

        // ////////////////////////////////////////////////////////////////////////////////////////////
        // Thickens input
        // const feMorphology = document.createElementNS(this.SVGNS, `feMorphology`);
        // feMorphology.setAttributeNS(null, `in`, `SourceAlpha`);
        // feMorphology.setAttributeNS(null, `result`, `BEVEL_10`);
        // feMorphology.setAttributeNS(null,`operator`,  `dilate`);
        // feMorphology.setAttributeNS(null, `radius`, `1`);

        // 3d extrude
        const feConvolveMatrix = document.createElementNS(this.SVGNS, `feConvolveMatrix`);
        feConvolveMatrix.setAttributeNS(null, `in`, `SourceAlpha`);
        feConvolveMatrix.setAttributeNS(null, `result`, `Convolved`);
        feConvolveMatrix.setAttributeNS(null,`order`,  `4,4`);
        feConvolveMatrix.setAttributeNS(null, `kernelMatrix`,
            `1 0 0 0
                  0 1 0 0
                  0 0 1 0
                  0 0 0 1`
        );


        const feOffset2 = document.createElementNS(this.SVGNS, `feOffset`);
        feOffset2.setAttributeNS(null, `in`, `Convolved`);
        feOffset2.setAttributeNS(null, `dx`, `-2`);
        feOffset2.setAttributeNS(null, `dy`, `-2`);
        feOffset2.setAttributeNS(null, `result`, `ConvolvedAndOffset`);

        const feComposite = document.createElementNS(this.SVGNS, `feComposite`);
        feComposite.setAttributeNS(null, `operator`, `over`);
        feComposite.setAttributeNS(null, `in`, `SourceGraphic`);
        feComposite.setAttributeNS(null, `in2`, `ConvolvedAndOffset`);
        feComposite.setAttributeNS(null, `result`, `outout`);


        // filter.appendChild(feOffset);
        // filter.appendChild(feGaussianBlur);
        // filter.appendChild(feBlend);
        filter.appendChild(feConvolveMatrix);
        // filter.appendChild(feConvolveMatrix);
        filter.appendChild(feOffset2);
        filter.appendChild(feComposite);
        return defs;
    }

    drawRectangle(x, y, width, height, depth) {
        const rectangle = document.createElementNS(`http://www.w3.org/2000/svg`, `rect`);
        rectangle.setAttributeNS(null, `x`, x);
        rectangle.setAttributeNS(null, `y`, y);
        rectangle.setAttributeNS(null, `width`, width);
        rectangle.setAttributeNS(null, `height`, height);
        rectangle.setAttributeNS(null, `rx`, `7`);
        let step = 5;
        let shadeFill = 50 - (this.treeHeight * step / 2) +  (depth * step);
        let shadeStroke = shadeFill - (step * 4);
        rectangle.setAttributeNS(null, `fill`, `hsla(200,100%,${shadeFill}%,1)`);
        rectangle.setAttributeNS(null, `stroke`, `hsla(200,100%,${shadeStroke}%,1)`);
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

    refreshTimeview(nodeModel = this.currentNodeModel) {
        if (this.currentNodeModel) {
            this.zoomMap.set(this.currentNodeModel.id, this.zoomStep);
        }
        this.currentNodeModel = nodeModel;
        this.clearSvg();
        if (this.currentNodeModel) {
            if (this.zoomMap.has(this.currentNodeModel.id)) {
                this.zoomStep = this.zoomMap.get(this.currentNodeModel.id);
            } else {
                this.zoomStep = 0;
            }
            this.treeHeight = nodeModel.findTreeHeight();
            this.svgSize = this.buildBoxSet(document.getElementById(`time-container`), nodeModel, this.START_X, this.START_Y);
            this.windowSize = this.getBoundingClientRect();
            // this.syncSizes(nodeModel);
            // this.createSVG();
            this.redrawSvg();
            this.boxMap.clear();
        }
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
                            const updatedBox = document.getElementById(`timebox:${nodeModel.id}`);
                            updatedBox.setAttributeNS(null, `width`, box.width);
                        } else if (box.width > boxOfSibling.width) {
                            console.log(`I am bigger than sibling`);
                            boxOfSibling.width = box.width;
                            this.boxMap.set(sibling.id, boxOfSibling);
                            const updatedBox = document.getElementById(`timebox:${sibling.id}`);
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
                        const updatedBox = document.getElementById(`timebox:${child.id}`);
                        updatedBox.setAttributeNS(null, `width`, box.width);
                    }
                }
            }
            this.syncSizes(child);
        });
    }


    buildBoxSet(parentGroup, nodeModel, topLeftX, topLeftY) {

        let svgText;
        let groupTop;
        topLeftY = topLeftY + this.LABEL_HEIGHT;
        const box = new TimeviewBox();
        box.id = nodeModel.id;
        box.label = nodeModel.name;
        const labelElement = this.createTextElement(`${box.label}`);
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
                svgText = this.positionTextElement(labelElement, box.topLeftX + this.LABEL_INDENT, box.topLeftY);
                groupTop = group.firstChild;
                group.insertBefore(svgText, groupTop);
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
                svgText = this.positionTextElement(labelElement, box.topLeftX + this.LABEL_INDENT, box.topLeftY);
                groupTop = group.firstChild;
                group.insertBefore(svgText, groupTop);
                box.height = tallestChild + (this.VERTICAL_MARGIN * 2) + this.LABEL_HEIGHT;
                box.width = Math.max(
                    growingBoxWidth + ((nodeModel.children.length + 1) * this.HORIZONTAL_MARGIN),
                    this.labelWidth(labelElement) + (this.LABEL_INDENT * 2)
                );
            }
        } else {
            box.topLeftX = topLeftX + this.HORIZONTAL_MARGIN;
            box.topLeftY = topLeftY + this.VERTICAL_MARGIN;
            svgText = this.positionTextElement(labelElement, box.topLeftX + this.LABEL_INDENT, box.topLeftY);
            groupTop = group.firstChild;
            group.insertBefore(svgText, groupTop);
            box.height = this.STANDARD_BOX_HEIGHT;
            box.width = this.labelWidth(labelElement) + (this.LABEL_INDENT * 2);
        }
        const svgBox = this.drawRectangle(box.topLeftX, box.topLeftY, box.width, box.height, nodeModel.treeDepth);
        svgBox.id = `timebox:${nodeModel.id}`;
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

