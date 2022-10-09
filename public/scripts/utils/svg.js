export default class Svg {

    static {
        this.SVGNS = `http://www.w3.org/2000/svg`;
        this.HUE = 200;
        this.SELECTED_HUE = 400;
        this.POSSIBLE_HUE = 600;
        this.HORIZONTAL_MARGIN = 10;
        this.VERTICAL_MARGIN = 10;
        this.LINE_WIDTH = 2;
        this.STANDARD_FONT_SIZE = 17;
        this.LABEL_INDENT = this.VERTICAL_MARGIN / 2;
        this.LABEL_HEIGHT = this.STANDARD_FONT_SIZE;
        this.STANDARD_BOX_HEIGHT = (2 * this.VERTICAL_MARGIN) + this.LABEL_HEIGHT;
        this.BUTTON_SIZE = 8;
        this.INITIAL_BRIGHTNESS = 50;
        this.STEP_BRIGHTNESS = 5;
    }

    static updateHSLA(hslaString, hue, saturation, lightness, alpha) {
        const components = hslaString.replace(`hsla(`, ``).replace(`)`, ``);
        const hslaArray = components.split(`,`);
        if (hue) {
            hslaArray[0] = hue;
        }
        if (saturation) {
            hslaArray[1] = saturation;
        }
        if (lightness) {
            hslaArray[2] = lightness;
        }
        if (alpha) {
            hslaArray[3] = alpha;
        }
        return `hsla(${hslaArray.join(`,`)})`;
    }

    static updateHue(oldHSLA, newHue) {
        return this.updateHSLA(oldHSLA, newHue, null, null, null);
    }

    static updateSaturation(oldHSLA, newSaturation) {
        return this.updateHSLA(oldHSLA, null, newSaturation, null, null);
    }

    static updateLightness(oldHSLA, newLightness) {
        return this.updateHSLA(oldHSLA, null, null, newLightness, null);
    }

    static updateAlpha(oldHSLA, newAlpha) {
        return this.updateHSLA(oldHSLA, null, null, null, newAlpha);
    }



    static buildSvg(id) {
        const svg = document.createElementNS(Svg.SVGNS, `svg`);
        svg.id = id;
        svg.setAttribute(`version`, `1.1`);
        svg.setAttribute(`xmlns`, this.SVGNS);
        return svg;
    }

    static selectNode(svg, node) {  // Apply 'select' effect (highlight)
        const rectangle = svg.getElementById(`rect-${node.id}`);
        const text = svg.getElementById(`text-${node.id}`);
        const hsla = rectangle.getAttributeNS(null, `fill`);
        const shadeFill = hsla.split(`,`)[2];
        rectangle.setAttributeNS(null, `fill`, `hsla(${Svg.SELECTED_HUE},100%,${shadeFill},1)`);
    }

    static signalPossibleChild(svg, node) {  // Apply 'select' effect (highlight)
        const rectangle = svg.getElementById(`rect-${node.id}`);
        const text = svg.getElementById(`text-${node.id}`);
        const hsla = rectangle.getAttributeNS(null, `fill`);
        const shadeFill = hsla.split(`,`)[2];
        console.log(`hsla(${Svg.POSSIBLE_HUE},100%,${shadeFill},1)`)
        rectangle.setAttributeNS(null, `fill`, `hsla(${Svg.POSSIBLE_HUE},100%,${shadeFill},1)`);
    }

    static unselectNode(svg, node) {   // Remove 'select' effect (highlight)
        const rectangle = svg.getElementById(`rect-${node.id}`);
        const text = svg.getElementById(`text-${node.id}`);
        const hsla = rectangle.getAttributeNS(null, `fill`);
        const shadeFill = hsla.split(`,`)[2];
        rectangle.setAttributeNS(null, `fill`, `hsla(${Svg.HUE},100%,${shadeFill},1)`);
    }

    static parse(a)    // shameless stolen from chernjie - stackoverflow
    {
        const b = {};
        for (const i in a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g)) {
            const c = a[i].match(/[\w\.\-]+/g);
            b[c.shift()] = c;
        }
        return b;
    }

    static modifyTransform(nodeGroup, nodeModel, diffX, diffY) {
        const groupTransformX = nodeModel.x + diffX;
        const groupTransformY = nodeModel.y + diffY;
        const newTransform = `translate(${groupTransformX},${groupTransformY})`;
        nodeGroup.setAttributeNS(null, `transform`, `${newTransform}`);
    }


    static followCursor(edge, cursor) {
        const origPath = edge.getAttributeNS(null, `d`);
        const splitOrigPath = origPath.split(` `);
        const ox = Math.round(Number(splitOrigPath[1]));
        const oy = Math.round(Number(splitOrigPath[2]));
        const ex = cursor.x;
        const ey = cursor.y;

        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        edge.setAttributeNS(null, `d`, cubicCurve);
    }



    static changeDestination(svgSelectedItems, edge) {
        const origPath = edge.getAttributeNS(null, `d`);
        const splitOrigPath = origPath.split(` `);
        const ox = Math.round(Number(splitOrigPath[1]));
        const oy = Math.round(Number(splitOrigPath[2]));
        const destinationNodeId = edge.id.split(`:`)[1].replace(`edge-`, ``);
        const destinationNode = svgSelectedItems.nodes.get(destinationNodeId);

        const transformString = destinationNode.getAttributeNS(null, `transform`);
        const transformComponents = this.parse(transformString);
        const ex = Number(transformComponents.translate[0]);
        const boxAdjustment = (this.STANDARD_BOX_HEIGHT / 2);
        const ey = Number(transformComponents.translate[1]) + boxAdjustment;

        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        edge.setAttributeNS(null, `d`, cubicCurve);
    }

    static changeSource(svgSelectedItems, edge) {
        const origPath = edge.getAttributeNS(null, `d`);
        const sourceNodeId = edge.id.split(`:`)[0].replace(`edge-`, ``);
        const sourceNode = svgSelectedItems.nodes.get(sourceNodeId);
        const id = sourceNode.id.replace(`node-`, ``);
        const rect = document.getElementById(`rect-${id}`);
        const width = rect.getAttributeNS(null, `width`);

        const splitOrigPath = origPath.split(` `);

        const transformString = sourceNode.getAttributeNS(null, `transform`);
        const transformComponents = this.parse(transformString);
        let boxAdjustment = width;
        const ox = Number(transformComponents.translate[0]) + Number(boxAdjustment);
        boxAdjustment = (this.STANDARD_BOX_HEIGHT / 2);
        const oy = Number(transformComponents.translate[1]) + boxAdjustment;

        const ex = Math.round(Number(splitOrigPath[8]));
        const ey = Math.round(Number(splitOrigPath[9]));

        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        edge.setAttributeNS(null, `d`, cubicCurve);
    }








    static positionItem(item, x, y) {
        if (item.tagName.toLowerCase() === `g`) {
            item.setAttributeNS(null, `transform`, `translate(${x},${y})`);
        } else if (item.tagName.toLowerCase() === `circle`) {
            item.setAttributeNS(null, `cx`, x);
            item.setAttributeNS(null, `cy`, y);
        } else {
            item.setAttributeNS(null, `x`, x);
            item.setAttributeNS(null, `y`, y);
        }
        return item;
    }

    static createCircle(x, y, radius) {
        const circle = document.createElementNS(this.SVGNS, `circle`);
        circle.setAttributeNS(null, `cx`, x);
        circle.setAttributeNS(null, `cy`, y);
        circle.setAttributeNS(null, `r`, radius);
        return circle;
    }

    static resizeRectangle(rectangle, height, width) {
        rectangle.setAttributeNS(null, `width`, width);
        rectangle.setAttributeNS(null, `height`, height);
        return rectangle;
    }

    static createAddButton(width, height) {
        const halfFont = this.STANDARD_FONT_SIZE / 2;
        const addButton = document.createElementNS(this.SVGNS, `g`);
        const circle = this.createCircle(width - halfFont, height - halfFont, halfFont);
        // circle.setAttributeNS(null, `fill`, `${fillShading}`);
        circle.setAttributeNS(null, `fill-opacity`, `1`);
        // circle.setAttributeNS(null, `stroke`, `${strokeShading}`);
        circle.setAttributeNS(null, `stroke-width`, `${this.LINE_WIDTH}`);
        const horizLine = document.createElementNS(this.SVGNS, `path`);

        horizLine.setAttributeNS(null, `d`, `M ${width - this.STANDARD_FONT_SIZE},${height - halfFont} L ${width},${height - halfFont}`);
        // horizLine.setAttributeNS(null, `stroke`, `${strokeShading}`);
        horizLine.setAttributeNS(null, `stroke-width`, `${this.LINE_WIDTH}`);
        const vertLine = document.createElementNS(this.SVGNS, `path`);

        vertLine.setAttributeNS(null, `d`, `M ${width - halfFont},${height - this.STANDARD_FONT_SIZE} L ${width - halfFont},${height}`);
        // vertLine.setAttributeNS(null, `stroke`, `${strokeShading}`);
        vertLine.setAttributeNS(null, `stroke-width`, `${this.LINE_WIDTH}`);
        addButton.appendChild(circle);
        addButton.appendChild(horizLine);
        addButton.appendChild(vertLine);
        return addButton;
    }

    static composeTrianglePath(width, isExpanded) {
        let path;
        if (isExpanded) {
            const x1 = width - this.LABEL_INDENT;
            const y1 = 3;
            const x2 = x1;
            const y2 = y1 + this.STANDARD_FONT_SIZE;
            const x3 = x2 - (this.STANDARD_FONT_SIZE / 2);
            const y3 = y2 - (this.STANDARD_FONT_SIZE / 2);
            path = `M ${x1}, ${y1} L ${x2},${y2} ${x3},${y3} Z`
        } else {
            const x1 = width - this.LABEL_INDENT;
            const y1 = (this.STANDARD_FONT_SIZE / 2) + 3;
            const x2 = x1 - (this.STANDARD_FONT_SIZE / 2);
            const y2 = y1 - (this.STANDARD_FONT_SIZE / 2);
            const x3 = x2;
            const y3 = y2 + (this.STANDARD_FONT_SIZE);
            path = `M ${x1}, ${y1} L ${x2},${y2} ${x3},${y3} Z`
        }
        return path
    }

    static createRectangle(width, height, depthOfNode) {
        let rectangle = document.createElementNS(this.SVGNS, `rect`);
        rectangle = this.resizeRectangle(rectangle, height, width);
        return rectangle;
    }


    static addColor(item, fill = `black`, stroke = `black`) {
        item.setAttributeNS(null, `fill`, `hsla(${this.HUE},100%,${fill}%,1)`);
        item.setAttributeNS(null, `stroke`, `hsla(${this.HUE},100%,${stroke}%,1)`);
    }


    static buildPath(sourceBox, destBox) {
        const ox = sourceBox.x + sourceBox.width;
        const oy = sourceBox.y + (sourceBox.height / 2);
        const ex = destBox.x;
        const ey = destBox.y + (destBox.height / 2);
        const delta_x = (ex - ox) / 2.0;
        const x1 = ox + delta_x;
        const y1 = oy;
        const x2 = ex - delta_x;
        const y2 = ey;
        // const mx = (ox + ex) / 2.0;
        // const my = (oy + ey) / 2.0;
        const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
        return cubicCurve;
    }

    static createEdge(sourceBox, destBox) {
        const edge = document.createElementNS(this.SVGNS, `path`);
        edge.setAttributeNS(null, `stroke`, `hsla(${this.HUE},100%,0%,1)`);
        edge.setAttributeNS(null, `fill`, `transparent`);
        edge.setAttributeNS(null, `stroke-width`, this.LINE_WIDTH);
        // edge.setAttributeNS(null, `stroke-dasharray`, `4`);
        const cubicCurve = Svg.buildPath(sourceBox, destBox);
        edge.setAttributeNS(null, `d`, cubicCurve);
        return edge;
    }

    static createTextElement(text, id) {
        const svgText = document.createElementNS(this.SVGNS, `text`);
        svgText.id = id;
        svgText.setAttributeNS(null, `font-size`, this.STANDARD_FONT_SIZE.toString());
        svgText.setAttributeNS(null, `dominant-baseline`, `text-before-edge`);
        svgText.setAttributeNS(null, `pointer-events`, `none`);
        const textNode = document.createTextNode(text);
        svgText.appendChild(textNode);
        return svgText;
    }

    static clearSvg(svg) {
        svg.childNodes.forEach((gNode) => {
            while (svg.firstChild) {
                //The list is LIVE so it will re-index each call
                svg.removeChild(svg.firstChild);
            }

        });
    }

    static createShowTriangle(width, height, isExpanded) {
        let triangle = document.createElementNS(this.SVGNS, `path`);
        let path = Svg.composeTrianglePath(width, isExpanded);
        triangle.setAttributeNS(null, `d`, path);
        return triangle;
    }

    static createGroup(id){
        const group = document.createElementNS(this.SVGNS, `g`);
        group.id = id;
        return group;
    }

    static applyDepthEffect(item, depth, treeHeight) {
        const fillShading = Svg.fillDepthLightness(depth, treeHeight);
        const strokeShading = Svg.strokeDepthLightness(depth, treeHeight);
        const fill = `hsla(${this.HUE},100%,${fillShading}%,1)`;
        const stroke = `hsla(${this.HUE},100%,${strokeShading}%,1)`;
        item.setAttributeNS(null, `fill`, fill);
        item.setAttributeNS(null, `stroke`, stroke);
    }

    static fillDepthLightness(depthOfNode, treeHeight) {
        return this.INITIAL_BRIGHTNESS - (treeHeight * this.STEP_BRIGHTNESS / 2) + (depthOfNode * this.STEP_BRIGHTNESS);
    }

    static strokeDepthLightness(depthOfNode, treeHeight) {
        const fillShading = this.fillDepthLightness(depthOfNode, treeHeight);
        const strokeShading = fillShading - (this.STEP_BRIGHTNESS * 4);
        return strokeShading;
    }


    static fetchEdgeToCursor() {
        let cursorEdge = document.querySelector(`[id$=cursor]`);
        return cursorEdge;
    }
    static fetchEdgeTo(nodeId) {
        let incomingEdges = document.querySelector(`[id$=edge-${nodeId}]`);
        return incomingEdges;
    }
    static fetchEdgesFrom(nodeId){
        let outgoingEdges = Array.from(document.querySelectorAll(`[id^=edge-${nodeId}]`));
        return outgoingEdges;
    }
    static fetchNodeGroup(id){
        return document.getElementById(`node-${id}`);
    }

    static fetchRectangle(id){
        return document.getElementById(`rect-${id}`);
    }
    static fetchGroup(id){
        return document.getElementById(`group-${id}`);
    }

    static fetchTargetId(svgElement){
        let id;
        if (svgElement.id) {
            id = svgElement.id.split(`-`)[1];
        }
        else {
            id = Svg.fetchTargetId(svgElement.parentNode);
        }
        return id;
    }


}
