// /**
//  * @file Node model for a specific analysis' JAG.
//  *
//  * @author mvignati
//  * @version 1.65
//  */
//
// 'use strict';
//
//
// export default class Svg {
//
//     constructor({
//         id,
//         HUE = 200,
//         SELECTED_HUE = 150,
//         POSSIBLE_HUE = 50,
//         HORIZONTAL_MARGIN = 10,
//         VERTICAL_MARGIN = 10,
//         LINE_WIDTH = 2,
//         STANDARD_FONT_SIZE = 17,
//         STEP_BRIGHTNESS = 5
//     } = {}) {
//         this._id = id;
//         this.HUE = HUE;
//         this.SELECTED_HUE = SELECTED_HUE;
//         this.POSSIBLE_HUE = POSSIBLE_HUE;
//         this.HORIZONTAL_MARGIN = HORIZONTAL_MARGIN;
//         this.VERTICAL_MARGIN = VERTICAL_MARGIN;
//         this.LINE_WIDTH = LINE_WIDTH;
//         this.STANDARD_FONT_SIZE = STANDARD_FONT_SIZE;
//         this.STEP_BRIGHTNESS = STEP_BRIGHTNESS;
//
//         this.LABEL_INDENT = this.VERTICAL_MARGIN / 2;
//         this.LABEL_HEIGHT = this.STANDARD_FONT_SIZE;
//         this.STANDARD_BOX_HEIGHT = (2 * this.VERTICAL_MARGIN) + this.LABEL_HEIGHT;
//         this.BUTTON_SIZE = this.STANDARD_FONT_SIZE / 2;
//         this.INITIAL_BRIGHTNESS = 50;
//
//         this.SVG = `svg`;
//         this.BACKGROUND = `background`;
//         this.SUBGROUP = `subgroup`;
//         this.NODEGROUP = `node`;
//         this.RECTANGLE = `rect`;
//         this.EDGE = `edge`;
//         this.EXPAND = `expand`;
//         this.ADD = `add`;
//         this.ID_SEPARATOR = `-`;
//         this.EDGE_SEPARATOR = `:`;
//         this.TEXT = `text`;
//         this.CURSOR = `cursor`;
//         this.SVGNS = `http://www.w3.org/2000/svg`;
//         this._customFilters = this.createCustomFilters();
//         this._id = id;
//     }
//
//     get id() {
//         return this._id;
//     }
//
//     get customFilters() {
//         return this._customFilters;
//     }
//
//     /**
//     Color and Shading Methods
//
//      updateHSLA - modify current hsla
//      updateHue  - adjust hue portion of current hsla (color wheel: 1-360)
//      updateSaturation - adjust saturation portion of current hsla (0% = black)
//      updateLightness - adjust lightness portion of current hsla (100% = white)
//      updateAlpha - adjust alpha portion of current hsla (0% = invisible)
//      addColor - @TODO future effort to use color instead of lightness for depth effect
//      applyDepthEffect - adjust lightness based on depth in tree
//      fillDepthLightness - apply effect to fill
//      strokeDepthLightness - apply effect to stroke
//     */
//
//     updateHSLA(hslaString, hue, saturation, lightness, alpha) {
//         const components = hslaString.replace(`hsla(`, ``).replace(`)`, ``);
//         const hslaArray = components.split(`,`);
//         if (hue) {
//             hslaArray[0] = hue;
//         }
//         if (saturation) {
//             hslaArray[1] = saturation;
//         }
//         if (lightness) {
//             hslaArray[2] = lightness;
//         }
//         if (alpha) {
//             hslaArray[3] = alpha;
//         }
//         return `hsla(${hslaArray.join(`,`)})`;
//     }
//
//     updateHue(oldHSLA, newHue) {
//         return this.updateHSLA(oldHSLA, newHue, null, null, null);
//     }
//
//     updateSaturation(oldHSLA, newSaturation) {
//         return this.updateHSLA(oldHSLA, null, newSaturation, null, null);
//     }
//
//     updateLightness(oldHSLA, newLightness) {
//         return this.updateHSLA(oldHSLA, null, null, newLightness, null);
//     }
//
//     updateAlpha(oldHSLA, newAlpha) {
//         return this.updateHSLA(oldHSLA, null, null, null, newAlpha);
//     }
//
//     addColor(item, fill = `black`, stroke = `black`) {
//         item.setAttributeNS(null, `fill`, `hsla(${this.HUE},100%,${fill}%,1)`);
//         item.setAttributeNS(null, `stroke`, `hsla(${this.HUE},100%,${stroke}%,1)`);
//     }
//
//     applyColorDepthEffect(item, depth, treeHeight) {
//         const hue = Math.round(360 / treeHeight * depth);
//         const hsla = item.getAttributeNS(null, `fill`);
//         const newHsla = this.updateHue(hsla, hue);
//         item.setAttributeNS(null, `fill`, newHsla);
//         item.setAttributeNS(null, `stroke`, newHsla);
//     }
//
//     applyDepthEffect(item, depth, treeHeight) {
//         const fillShading = this.fillDepthLightness(depth, treeHeight);
//         const strokeShading = this.strokeDepthLightness(depth, treeHeight);
//         const fill = `hsla(${this.HUE},100%,${fillShading}%,1)`;
//         const stroke = `hsla(${this.HUE},100%,${strokeShading}%,1)`;
//         item.setAttributeNS(null, `fill`, fill);
//         item.setAttributeNS(null, `stroke`, stroke);
//     }
//
//     fillDepthLightness(depthOfNode, treeHeight) {
//         return this.INITIAL_BRIGHTNESS - (treeHeight * this.STEP_BRIGHTNESS / 2) + (depthOfNode * this.STEP_BRIGHTNESS);
//     }
//
//     strokeDepthLightness(depthOfNode, treeHeight) {
//         const fillShading = this.fillDepthLightness(depthOfNode, treeHeight);
//         const strokeShading = fillShading - (this.STEP_BRIGHTNESS * 4);
//         return strokeShading;
//     }
//
//     /**
//      * Object creation
//      *
//      * buildSvg  - highest level object
//      * createBackground - group to hold all sub-groups
//      * createSubGroup - group to hold node groups and edges (and sub-subgroups, if exist)
//      * createNodeGroup - group to hold node rectangle, text, button groups
//      * createCircle - test circle for debugging points
//      * createAddButton - group holding svg components forming 'add button'
//      * createExpandButton - group holding svg components forming `expand button`
//      * createRectangle - Rectangle giving nodeGroup its form and size
//      * resizeRectangle - Convenience function to set and change rectangle size
//      * createEdge - basic edge components (path is defined with pathing methods)
//      * createTextElement - basic svg text components
//      */
//
//     buildSvg() {
//         const svg = document.createElementNS(this.SVGNS, `svg`);
//         svg.id = `${this.SVG}${this.ID_SEPARATOR}${this._id}`;
//         svg.setAttribute(`version`, `1.1`);
//         svg.setAttribute(`xmlns`, this.SVGNS);
//         svg.setAttribute(`pointer-events`, `none`);
//         return svg;
//     }
//
//     createBackground() {
//         const group = document.createElementNS(this.SVGNS, `g`);
//         group.id = `${this.BACKGROUND}${this.ID_SEPARATOR}${this._id}`;
//         group.setAttributeNS(null, `pointer-events`, `bounding-box`);
//         group.setAttributeNS(null, `cursor`, `all-scroll`);
//         return group;
//     }
//
//     createSubGroup(subgroupId) {
//         const group = document.createElementNS(this.SVGNS, `g`);
//         group.id = `${this.SUBGROUP}${this.ID_SEPARATOR}${subgroupId}${this.ID_SEPARATOR}${this._id}`;
//         group.setAttributeNS(null, `pointer-events`, `none`);
//         return group;
//     }
//
//     createNodeGroup(id) {
//         const nodeGroup = document.createElementNS(this.SVGNS, `g`);
//         nodeGroup.id = `${this.NODEGROUP}${this.ID_SEPARATOR}${id}${this.ID_SEPARATOR}${this._id}`;
//         nodeGroup.setAttributeNS(null, `pointer-events`, `bounding-box`);   // handled by under rect -rethink
//         return nodeGroup;
//     }
//
//     createCircle(x, y, radius) {
//         const circle = document.createElementNS(this.SVGNS, `circle`);
//         circle.setAttributeNS(null, `cx`, x);
//         circle.setAttributeNS(null, `cy`, y);
//         circle.setAttributeNS(null, `r`, radius);
//         return circle;
//     }
//
//     createAddButton(id, width, height) {
//         const halfFont = this.STANDARD_FONT_SIZE / 2;
//         const addButton = document.createElementNS(this.SVGNS, `g`);
//         const circle = this.createCircle(width - halfFont, height - halfFont, halfFont);
//         // circle.setAttributeNS(null, `fill`, `${fillShading}`);
//         circle.setAttributeNS(null, `fill-opacity`, `1`);
//         // circle.setAttributeNS(null, `stroke`, `${strokeShading}`);
//         circle.setAttributeNS(null, `stroke-width`, `${this.LINE_WIDTH}`);
//         const horizLine = document.createElementNS(this.SVGNS, `path`);
//
//         horizLine.setAttributeNS(null, `d`, `M ${width - this.STANDARD_FONT_SIZE},${height - halfFont} L ${width},${height - halfFont}`);
//         // horizLine.setAttributeNS(null, `stroke`, `${strokeShading}`);
//         horizLine.setAttributeNS(null, `stroke-width`, `${this.LINE_WIDTH}`);
//         const vertLine = document.createElementNS(this.SVGNS, `path`);
//
//         vertLine.setAttributeNS(null, `d`, `M ${width - halfFont},${height - this.STANDARD_FONT_SIZE} L ${width - halfFont},${height}`);
//         // vertLine.setAttributeNS(null, `stroke`, `${strokeShading}`);
//         vertLine.setAttributeNS(null, `stroke-width`, `${this.LINE_WIDTH}`);
//         addButton.appendChild(circle);
//         addButton.appendChild(horizLine);
//         addButton.appendChild(vertLine);
//         addButton.id = `${this.ADD}${this.ID_SEPARATOR}${id}${this.ID_SEPARATOR}${this._id}`;
//         addButton.setAttributeNS(null, `cursor`, `pointer`);
//         addButton.setAttributeNS(null, `pointer-events`, `bounding-box`);   // handled with classList?
//         return addButton;
//     }
//
//     createExpandButton(id, width, height, isExpanded) {
//         let path;
//         const expandButton = document.createElementNS(this.SVGNS, `g`);
//         if (isExpanded) {
//             const x1 = width - this.LABEL_INDENT;
//             const y1 = 3;
//             const x2 = x1;
//             const y2 = y1 + this.STANDARD_FONT_SIZE;
//             const x3 = x2 - (this.STANDARD_FONT_SIZE / 2);
//             const y3 = y2 - (this.STANDARD_FONT_SIZE / 2);
//             path = `M ${x1}, ${y1} L ${x2},${y2} ${x3},${y3} Z`;
//         } else {
//             const x1 = width - this.LABEL_INDENT;
//             const y1 = (this.STANDARD_FONT_SIZE / 2) + 3;
//             const x2 = x1 - (this.STANDARD_FONT_SIZE / 2);
//             const y2 = y1 - (this.STANDARD_FONT_SIZE / 2);
//             const x3 = x2;
//             const y3 = y2 + (this.STANDARD_FONT_SIZE);
//             path = `M ${x1}, ${y1} L ${x2},${y2} ${x3},${y3} Z`;
//         }
//         const triangle = document.createElementNS(this.SVGNS, `path`);
//         triangle.setAttributeNS(null, `d`, path);
//         expandButton.appendChild(triangle);
//         expandButton.id = `${this.EXPAND}${this.ID_SEPARATOR}${id}${this.ID_SEPARATOR}${this._id}`;
//         expandButton.setAttributeNS(null, `cursor`, `pointer`);
//         expandButton.setAttributeNS(null, `pointer-events`, `bounding-box`);    // handled with classlist?
//         return expandButton;
//     }
//
//     createRectangle(width, height, id) {
//         let rectangle = document.createElementNS(this.SVGNS, `rect`);
//         rectangle = this.resizeRectangle(rectangle, height, width);
//         rectangle.setAttributeNS(null, `rx`, `7`);
//         rectangle.setAttributeNS(null, `cursor`, `grab`);
//         // rectangle.setAttributeNS(null, `pointer-events`, `bounding-box`);
//         rectangle.id = `${this.RECTANGLE}${this.ID_SEPARATOR}${id}${this.ID_SEPARATOR}${this._id}`;
//         return rectangle;
//     }
//
//     resizeRectangle(rectangle, height, width) {
//         rectangle.setAttributeNS(null, `width`, width);
//         rectangle.setAttributeNS(null, `height`, height);
//         return rectangle;
//     }
//
//     createEdge(sourceId, destId, sourceBox, destBox) {
//         const edge = document.createElementNS(this.SVGNS, `path`);
//         edge.setAttributeNS(null, `stroke`, `hsla(${this.HUE},100%,0%,1)`);
//         edge.setAttributeNS(null, `fill`, `transparent`);
//         edge.setAttributeNS(null, `stroke-width`, this.LINE_WIDTH);
//         // edge.setAttributeNS(null, `stroke-dasharray`, `4`);
//         const cubicCurve = this.buildPath(sourceBox, destBox);
//         edge.setAttributeNS(null, `d`, cubicCurve);
//         edge.setAttributeNS(null, `cursor`, `pointer`);
//         edge.setAttributeNS(null, `pointer-events`, `visibleStroke`);
//         const edgeSourceId = `${this.EDGE}${this.ID_SEPARATOR}${sourceId}${this.ID_SEPARATOR}${this.id}`;
//         const edgeDestId = `${this.EDGE}${this.ID_SEPARATOR}${destId}${this.ID_SEPARATOR}${this._id}`;
//         edge.id = `${edgeSourceId}${this.EDGE_SEPARATOR}${edgeDestId}`;
//         return edge;
//     }
//
//     createEdgeToCursor(sourceId, sourceBox) {
//         const edge = document.createElementNS(this.SVGNS, `path`);
//         edge.setAttributeNS(null, `stroke`, `hsla(${this.POSSIBLE_HUE},100%,0%,1)`);
//         edge.setAttributeNS(null, `fill`, `transparent`);
//         edge.setAttributeNS(null, `stroke-width`, this.LINE_WIDTH);
//         // edge.setAttributeNS(null, `stroke-dasharray`, `4`);
//         const cubicCurve = this.buildPath(sourceBox, sourceBox);
//         edge.setAttributeNS(null, `d`, cubicCurve);
//         edge.setAttributeNS(null, `pointer-events`, `none`);
//         const edgeSourceId = `${this.EDGE}${this.ID_SEPARATOR}${sourceId}${this.ID_SEPARATOR}${this._id}`;
//         const edgeDestId = `${this.CURSOR}`;
//         edge.id = `${edgeSourceId}${this.EDGE_SEPARATOR}${edgeDestId}`;
//         return edge;
//     }
//
//
//     createTextElement(text, id) {
//         const svgText = document.createElementNS(this.SVGNS, `text`);
//         svgText.id = `${this.TEXT}${this.ID_SEPARATOR}${id}${this.EDGE_SEPARATOR}${this._id}`;
//         svgText.setAttributeNS(null, `font-size`, this.STANDARD_FONT_SIZE.toString());
//         svgText.setAttributeNS(null, `dominant-baseline`, `text-before-edge`);
//         svgText.setAttributeNS(null, `pointer-events`, `none`);
//         const textNode = document.createTextNode(text);
//         svgText.appendChild(textNode);
//         return svgText;
//     }
//
//     /**
//      * Positioning
//      *
//      * modifyTransform - changing location of a group of components
//      * positionItem - changing location of item in respect to its group
//      */
//
//     modifyTransform(nodeGroup, nodeModel, diffX, diffY) {
//         const groupTransformX = nodeModel.x + diffX;
//         const groupTransformY = nodeModel.y + diffY;
//         const newTransform = `translate(${groupTransformX},${groupTransformY})`;
//         nodeGroup.setAttributeNS(null, `transform`, `${newTransform}`);
//     }
//
//     positionItem(item, x, y) {
//         if (item.tagName.toLowerCase() === `g`) {
//             item.setAttributeNS(null, 'transform', `translate(${x},${y})`);
//             const xxx = item.getAttributeNS(null, `transform`);
//         } else if (item.tagName.toLowerCase() === `circle`) {
//             item.setAttributeNS(null, `cx`, x);
//             item.setAttributeNS(null, `cy`, y);
//         } else {
//             item.setAttributeNS(null, `x`, x);
//             item.setAttributeNS(null, `y`, y);
//         }
//         return item;
//     }
//
//     /**
//      * Object State Change
//      *
//      * selectNode - update appearance of node to being selected
//      * signalPossibleChild - update appearance of node to being possible added child
//      * unselectNode - reset appearance to normal
//      */
//
//
//     selectNode(svg, node) {  // Apply 'select' effect (highlight)
//         const rectangle = svg.getElementById(`${this.RECTANGLE}${this.ID_SEPARATOR}${node.id}${this.ID_SEPARATOR}${this._id}`);
//         // const text = svg.getElementById(`${this.TEXT}${this.ID_SEPARATOR}${node.id}${this.EDGE_SEPARATOR}${this.id}`);
//         const hsla = rectangle.getAttributeNS(null, `fill`);
//         const shadeFill = hsla.split(`,`)[2];
//         rectangle.setAttributeNS(null, `fill`, `hsla(${this.SELECTED_HUE},100%,${shadeFill},1)`);
//     }
//
//     signalPossibleChild(svg, node) {  // Apply 'select' effect (highlight)
//         const rectangle = svg.getElementById(`${this.RECTANGLE}${this.ID_SEPARATOR}${node.id}${this.ID_SEPARATOR}${this._id}`);
//         // const text = svg.getElementById(`${this.TEXT}${this.ID_SEPARATOR}${node.id}${this.EDGE_SEPARATOR}${this.id}`);
//         const hslaFill = rectangle.getAttributeNS(null, `fill`);
//         const shadeFill = hslaFill.split(`,`)[2];
//         rectangle.setAttributeNS(null, `fill`, `hsla(${this.POSSIBLE_HUE},100%,${shadeFill},1)`);
//         const hslaStroke = rectangle.getAttributeNS(null, `stroke`);
//         const shadeStroke = hslaStroke.split(`,`)[2];
//         rectangle.setAttributeNS(null, `stroke`, `hsla(${this.POSSIBLE_HUE},100%,${shadeStroke},1)`);
//     }
//
//     unselectNode(svg, node) {   // Remove 'select' effect (highlight)
//         const rectangle = svg.getElementById(`${this.RECTANGLE}${this.ID_SEPARATOR}${node.id}${this.ID_SEPARATOR}${this._id}`);
//         const text = svg.getElementById(`${this.TEXT}${this.ID_SEPARATOR}${node.id}${this.ID_SEPARATOR}${this._id}`);
//         const hslaFill = rectangle.getAttributeNS(null, `fill`);
//         const shadeFill = hslaFill.split(`,`)[2];
//         rectangle.setAttributeNS(null, `fill`, `hsla(${this.HUE},100%,${shadeFill},1)`);
//         const hslaStroke = rectangle.getAttributeNS(null, `stroke`);
//         const shadeStroke = hslaStroke.split(`,`)[2];
//         rectangle.setAttributeNS(null, `stroke`, `hsla(${this.HUE},100%,${shadeStroke},1)`);
//     }
//
//     unselectEdge(svg, edge) {
//         edge.setAttributeNS(null, `stroke`, `hsla(${this.HUE},100%,0%,1)`);
//     }
//
//         /**
//      * Pathing
//      *
//      * followCursor - destination end of edge attached to cursor position
//      * changeDestination - destination end of edge attached to moving object
//      * changeSource - source end of edge attached to moving object
//      * buildPath - use source and destination positions to form cubic pathing
//      *
//      */
//     // svgElement;
//
//     followCursor(edge, cursor) {
//         const origPath = edge.getAttributeNS(null, `d`);
//         const splitOrigPath = origPath.split(` `);
//         const ox = Math.round(Number(splitOrigPath[1]));
//         const oy = Math.round(Number(splitOrigPath[2]));
//         const ex = cursor.x;
//         const ey = cursor.y;
//
//         const delta_x = (ex - ox) / 2.0;
//         const x1 = ox + delta_x;
//         const y1 = oy;
//         const x2 = ex - delta_x;
//         const y2 = ey;
//         const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
//         edge.setAttributeNS(null, `d`, cubicCurve);
//     }
//
//     changeDestination(svgSelectedItems, edge) {
//         const origPath = edge.getAttributeNS(null, `d`);
//         const splitOrigPath = origPath.split(` `);
//         const ox = Math.round(Number(splitOrigPath[1]));
//         const oy = Math.round(Number(splitOrigPath[2]));
//         const destinationNodeId = this.fetchEdgeDestinationId(edge);
//         const destinationNode = svgSelectedItems.nodes.get(destinationNodeId);
//
//         const transformString = destinationNode.getAttributeNS(null, `transform`);
//         const transformComponents = this.parse(transformString);
//         const ex = Number(transformComponents.translate[0]);
//         const boxAdjustment = (this.STANDARD_BOX_HEIGHT / 2);
//         const ey = Number(transformComponents.translate[1]) + boxAdjustment;
//
//         const delta_x = (ex - ox) / 2.0;
//         const x1 = ox + delta_x;
//         const y1 = oy;
//         const x2 = ex - delta_x;
//         const y2 = ey;
//         const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
//         edge.setAttributeNS(null, `d`, cubicCurve);
//     }
//
//     changeSource(svgSelectedItems, edge) {
//         const origPath = edge.getAttributeNS(null, `d`);
//         const sourceNodeId = this.fetchEdgeSourceId(edge);
//         const sourceNode = svgSelectedItems.nodes.get(sourceNodeId);
//         const id = sourceNode.id.replace(`${this.NODEGROUP}${this.ID_SEPARATOR}`, ``);
//         const rect = document.getElementById(`${this.RECTANGLE}${this.ID_SEPARATOR}${id}`);
//         const width = rect.getAttributeNS(null, `width`);
//
//         const splitOrigPath = origPath.split(` `);
//
//         const transformString = sourceNode.getAttributeNS(null, `transform`);
//         const transformComponents = this.parse(transformString);
//         let boxAdjustment = width;
//         const ox = Number(transformComponents.translate[0]) + Number(boxAdjustment);
//         boxAdjustment = (this.STANDARD_BOX_HEIGHT / 2);
//         const oy = Number(transformComponents.translate[1]) + boxAdjustment;
//
//         const ex = Math.round(Number(splitOrigPath[8]));
//         const ey = Math.round(Number(splitOrigPath[9]));
//
//         const delta_x = (ex - ox) / 2.0;
//         const x1 = ox + delta_x;
//         const y1 = oy;
//         const x2 = ex - delta_x;
//         const y2 = ey;
//         const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
//         edge.setAttributeNS(null, `d`, cubicCurve);
//     }
//
//     buildPath(sourceBox, destBox) {
//         const ox = sourceBox.x + sourceBox.width;
//         const oy = sourceBox.y + (sourceBox.height / 2);
//         const ex = destBox.x;
//         const ey = destBox.y + (destBox.height / 2);
//         const delta_x = (ex - ox) / 2.0;
//         const x1 = ox + delta_x;
//         const y1 = oy;
//         const x2 = ex - delta_x;
//         const y2 = ey;
//         // const mx = (ox + ex) / 2.0;
//         // const my = (oy + ey) / 2.0;
//         const cubicCurve = `M ${ox} ${oy} C ${x1} ${y1}, ${x2} ${y2}, ${ex} ${ey}`;
//         return cubicCurve;
//     }
//
//     /**
//      * Fetching - getter/setters
//      *
//      * fetchBackground - retrieve outer group (best highest level of background pointer events)
//      * fetchNodeGroup - retrieve collection of items forming node
//      * fetchExpandButton - retrieve collection of items forming Expand Button
//      * fetchAddButton - retrieve collection of items forming add Button
//      * fetchRectangle - retrieve nodeGroup's rectangle
//      * fetchTargetId - retrieve pointer target's id
//      * fetchTargetElementType - retrieve pointer target's element
//      * fetchEdgeSourceId - retrieve edge's source element id
//      * fetchEdgeDestinationId - retrieve edge's destination element id
//      * fetchEdgeToCursor - retrieve the edge attached to the cursor during node linkage
//      * fetchEdgeTo - retrieve the edge leading into a given node
//      * fetchEdgesFrom - retrieve the edges leaving a given node
//      */
//
//     fetchBackground() {
//         return document.getElementById(`${this.BACKGROUND}${this.ID_SEPARATOR}${this._id}`);
//     }
//
//     fetchNodeGroup(id) {
//         return document.getElementById(`${this.NODEGROUP}${this.ID_SEPARATOR}${id}${this.ID_SEPARATOR}${this._id}`);
//     }
//
//     fetchExpandButton(id) {
//         return document.getElementById(`${this.EXPAND}${this.ID_SEPARATOR}${id}${this.ID_SEPARATOR}${this._id}`);
//     }
//
//     fetchAddButton(id) {
//         return document.getElementById(`${this.ADD}${this.ID_SEPARATOR}${id}${this.ID_SEPARATOR}${this._id}`);
//     }
//
//     fetchRectangle(id) {
//         return document.getElementById(`${this.RECTANGLE}${this.ID_SEPARATOR}${id}${this.ID_SEPARATOR}${this._id}`);
//     }
//
//
//     fetchTargetId(svgElement) {
//         let id;
//         if (svgElement.id) {
//             id = svgElement.id.split(this.ID_SEPARATOR)[1];
//         } else {
//             id = this.fetchTargetId(svgElement.parentNode);
//         }
//         return id;
//     }
//
//     fetchTargetElementType(svgElement) {
//         let id;
//         if (svgElement.id) {
//             id = svgElement.id.split(this.ID_SEPARATOR)[0];
//         } else {
//             id = this.fetchTargetElementType(svgElement.parentNode);
//         }
//         return id;
//     }
//
//     fetchEdgeSourceId(edge) {
//         console.log(edge);
//         const edgeSourceId = edge.id.split(this.EDGE_SEPARATOR)[0];
//         const sourceId = edgeSourceId.split(this.ID_SEPARATOR)[1];
//         return sourceId;
//     }
//
//     fetchEdgeDestinationId(edge) {
//         const edgeDestinationId = edge.id.split(this.EDGE_SEPARATOR)[1];
//         const destinationId = edgeDestinationId.split(this.ID_SEPARATOR)[1];
//         return destinationId;
//     }
//
//     fetchEdgeToCursor() {
//         const cursorEdge = document.querySelector(`[id$=${this.CURSOR}]`);
//         return cursorEdge;
//     }
//
//     fetchEdgeTo(nodeId) {
//         const incomingEdges = document.querySelector(`[id$=${this.EDGE}${this.ID_SEPARATOR}${nodeId}${this.ID_SEPARATOR}${this._id}]`);
//         return incomingEdges;
//     }
//
//     fetchEdgesFrom(nodeId) {
//         const outgoingEdges = Array.from(document.querySelectorAll(`[id^=${this.EDGE}${this.ID_SEPARATOR}${nodeId}${this.ID_SEPARATOR}${this._id}]`));
//         return outgoingEdges;
//     }
//
//     /**
//      * Utilities
//      *
//      * parse - converts a group's transform string into an object (orig author:chernjie from stackoverflow)
//      * clearBackground - completely wipe all elements from background
//      * saveSvg - downloads text version of the SVG object
//      */
//
//     labelWidth(svgText) {
//         const bbox = svgText.getBBox();
//         const {width} = bbox;
//         return Math.round(width);
//     }
//
//     parse(a) {    // shameless stolen from chernjie - stackoverflow
//         const b = {};
//         for (const i in a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g)) {
//             const c = a[i].match(/[\w\.\-]+/g);
//             b[c.shift()] = c;
//         }
//         return b;
//     }
//
//     clearBackground(id) {
//         const background = this.fetchBackground(id);
//         background.childNodes.forEach((gNode) => {
//             while (background.firstChild) {
//                 // The list is LIVE so it will re-index each call
//                 background.removeChild(background.firstChild);
//             }
//         });
//     }
//
//     saveSvg(svgEl, name = `jag`) {
//         const svgData = svgEl.outerHTML;
//         const preface = `<?xml version="1.0" standalone="no"?>\r\n`;
//         const svgBlob = new Blob([preface, svgData], {type: `image/svg+xml;charset=utf-8`});
//         const svgUrl = URL.createObjectURL(svgBlob);
//         const downloadLink = document.createElement(`a`);
//         downloadLink.href = svgUrl;
//         downloadLink.download = name;
//         document.body.appendChild(downloadLink);
//         downloadLink.click();
//         document.body.removeChild(downloadLink);
//     }
//
//     createDefinitionContainer() {
//         const defs = document.createElementNS(this.SVGNS, `defs`);
//         return defs;
//     }
//
//     createCustomFilters() {
//         const customFilterMap = new Map();
//         // 3d extrude // //////////////////////////////////////////////////////////////
//         const feConvolveMatrix = document.createElementNS(this.SVGNS, `feConvolveMatrix`);
//         feConvolveMatrix.setAttributeNS(null, `in`, `SourceAlpha`);
//         feConvolveMatrix.setAttributeNS(null, `result`, `Convolved`);
//         feConvolveMatrix.setAttributeNS(null, `order`, `4,4`);
//         feConvolveMatrix.setAttributeNS(
//             null, `kernelMatrix`,
//             `
//           1 0 0 0
//           0 1 0 0
//           0 0 1 0
//           0 0 0 1`
//         );
//         // //////////////////////////////////////////////////////////////////////////
//         const feOffset = document.createElementNS(this.SVGNS, `feOffset`);
//         feOffset.setAttributeNS(null, `in`, `Convolved`);
//         feOffset.setAttributeNS(null, `dx`, `-2`);
//         feOffset.setAttributeNS(null, `dy`, `-2`);
//         feOffset.setAttributeNS(null, `result`, `ConvolvedAndOffset`);
//         // //////////////////////////////////////////////////////////////////////////
//         const feComposite = document.createElementNS(this.SVGNS, `feComposite`);
//         feComposite.setAttributeNS(null, `operator`, `over`);
//         feComposite.setAttributeNS(null, `in`, `SourceGraphic`);
//         feComposite.setAttributeNS(null, `in2`, `ConvolvedAndOffset`);
//         feComposite.setAttributeNS(null, `result`, `outout`);
//         // //////////////////////////////////////////////////////////////////////////
//         const filter3dEffect = document.createElementNS(this.SVGNS, `filter`);
//         filter3dEffect.setAttributeNS(null, `id`, `blur-effect`);
//         filter3dEffect.setAttributeNS(null, `x`, `-20%`);
//         filter3dEffect.setAttributeNS(null, `y`, `-20%`);
//         filter3dEffect.setAttributeNS(null, `width`, `150%`);
//         filter3dEffect.setAttributeNS(null, `height`, `180%`);
//         filter3dEffect.appendChild(feConvolveMatrix);
//         filter3dEffect.appendChild(feOffset);
//         filter3dEffect.appendChild(feComposite);
//
//         customFilterMap.set(filter3dEffect.id, filter3dEffect);
//         return customFilterMap;
//     }
//
//     applyFilter(svgItem, filterId) {
//         svgItem.setAttributeNS(null, `filter`, `url(#${filterId})`);
//     }
//
// }
//
// //  applyColorEffect(nodeModel) {
// //     const numberOfLeaves = nodeModel.leafCount;
// //     const colorDelta = Math.max(360 / numberOfLeaves, 5);
// //     this.colorTree(nodeModel, 0, colorDelta);
// // }
// //
// //  colorTree(node, currentStep, colorDelta) {
// //     let colorValue;
// //     if (node.hasChildren()) {
// //         let colorTotal = 0;
// //         node.children.forEach((child) => {
// //             const returns = this.colorTree(child, currentStep, colorDelta);
// //             colorTotal = colorTotal + returns.colorValue;
// //             currentStep = returns.currentStep;
// //         });
// //         colorValue = colorTotal / node.children.length;
// //         const rectangle = this.fetchRectangle(node.id);
// //         const hsla = rectangle.getAttributeNS(null, `fill`);
// //         const newHsla = this.updateHue(hsla, colorValue);
// //         rectangle.setAttributeNS(null, `fill`, newHsla);
// //     } else {
// //         colorValue = currentStep * colorDelta;
// //         const rectangle = this.fetchRectangle(node.id);
// //         const hsla = rectangle.getAttributeNS(null, `fill`);
// //         const newHsla = this.updateHue(hsla, colorValue);
// //         rectangle.setAttributeNS(null, `fill`, newHsla);
// //         currentStep = currentStep + 1;
// //     }
// //
// //     set svgParameters(svgParameters) {
// //     }
// //
// //     set svgLineWidth(lineWidth){
// //         this.svgParameters({lineWith : lineWidth});
// //     }
// //
