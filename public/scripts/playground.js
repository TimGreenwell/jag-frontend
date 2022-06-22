/**
 * @file Playground - Visual area for authoring JAGs.  Controls the general playground environment
 * including panning, zooming, adding and removing edges/nodes.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.80
 */

import JagNodeElement from './views/jag-node.js';
import EdgeElement from './views/edge.js';
import Popupable from './utils/popupable.js';
import UserPrefs from "./utils/user-prefs.js";

class Playground extends Popupable {

    constructor() {
        super();
        const margin = 50;
        this._edgeContainerDiv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this._edgeContainerDiv.setAttribute('version', '1.1');
        this._edgeContainerDiv.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        this._edgeContainerDiv.id = "edges-container";
        this.appendChild(this._edgeContainerDiv);

        this._nodeContainerDiv = document.createElement('div');
        this._nodeContainerDiv.id = "nodes-container";
        this.appendChild(this._nodeContainerDiv);
        this.setPopupBounds(this._nodeContainerDiv);

        this._activeNodeModelMap = new Map();         // All active Jag root nodes - should be in sync with _activeJagNodeElementSet


        this._activeJagNodeElementSet = new Set();    // set of JagNodes (view)
        this._selectedJagNodeElementSet = new Set();  // set of JagNodes (view)
        this._is_edge_being_created = false;

        this._cardinals = {
            left: this._createCardinal("left", 1, 0),
            right: this._createCardinal("right", -1, 0),
            up: this._createCardinal("up", 0, 1),
            down: this._createCardinal("down", 0, -1)
        };

        this._canMoveView = {
            left: false,
            right: false,
            up: false,
            down: false
        };

        this._showCardinals(this._canMoveView);

        this._zoomFactor = 1.00;

        this._boundHandleEdgeSelected = this._handleEdgeSelected.bind(this);
        this._boundOnEdgeUpdated = this.onEdgeUpdated.bind(this);
        this._boundOnEdgeCanceled = this.onEdgeCanceled.bind(this);
        this._boundDragView = this.dragView.bind(this);
        this._boundStopDragView = this.stopDragView.bind(this);


        // Turned this off temporarily.  Most keys have no function here.  They all work when
        // a node inside is selected
        // document.addEventListener('keydown', this.onKeyDown.bind(this));

        this.addEventListener('mousedown', this.playgroundClicked.bind(this));

        this.addEventListener('mousemove', (e) => {
            e.stopPropagation()
            this._edgeContainerDiv.dispatchEvent(new MouseEvent('mousemove', {clientX: e.clientX, clientY: e.clientY}));
        });

        //	this.addEventListener('dragenter', this.onPreImport.bind(this));     // what is this?
        this.addEventListener('dragover', this.cancelDefault.bind(this));
        this.addEventListener('drop', this.onImport.bind(this));

    }


    /**
     *      Local Handlers
     *         -- Edge Handling
     */

    /**
     * Edge Handling
     *
     * _handleEdgeSelected
     * onEdgeInitialized
     * _createEdge
     * onEdgeUpdated
     * onEdgeFinalized
     * cancelEdge
     * onEdgeCanceled
     *
     */



    delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }


    _handleEdgeSelected(e) {
        if (e.detail.selected) {
            this._selectedJagNodeElementSet.add(e.target);
        } else {
            this._selectedJagNodeElementSet.delete(e.target);
        }
    }

    onEdgeInitialized(e, node) {
        this.removeEventListener('mousemove', this._boundDragView);
        this.removeEventListener('mouseup', this._boundStopDragView);
        this.addEventListener('mousemove', this._boundOnEdgeUpdated);
        this.addEventListener('mouseup', this._boundOnEdgeCanceled);

        this._created_edge = this._createEdge(node);
        this._is_edge_being_created = true;

        const [x, y] = this.fromClientToPlaygroundCoordinates(e.clientX, e.clientY);
        this._created_edge.setEnd(x, y);
    }

    _createEdge(origin, id = undefined) {
        const edge = new EdgeElement(this._edgeContainerDiv);
        edge.setLeadActivityNode(origin);
        if (id) edge.setChildId(id);
        return edge;
    }

    onEdgeUpdated(e) {
        if (!this._is_edge_being_created)
            return;

        const [x, y] = this.fromClientToPlaygroundCoordinates(e.clientX, e.clientY);
        this._created_edge.setEnd(x, y);
    }

    async onEdgeFinalized(e) {

        let node = e.target.offsetParent;

        if (!this._is_edge_being_created)
            return;

        if (window.confirm("Are you sure you want to add this node as a child? (This will change all instances of the parent node to reflect this change.)")) {
            this._is_edge_being_created = false;
            this._created_edge.setSubActivityNode(node)                // a whole lot happens in here
            this._created_edge.addEventListener('playground-nodes-selected', this._boundHandleEdgeSelected);

            // identical issue below
            //parentJag.addChild(childJag);       @TODO Where did this parent obtain the child.  It works but dont know where it came from.
            // JAG.AddChild happens way down when jag-node.completeOutEdge finishes.
            // @TODO consider bringing it up here (separation of functionality)

            const parentNodeModel = this._created_edge._leadActivityNode.nodeModel;
            const childNodeModel = this._created_edge._subActivityNode.nodeModel;

            // childNodeModel.parent = parentNodeModel;
            // childNodeModel.childId = this._created_edge._childId
            // parentNodeModel.addChild(childNodeModel);

          //  @TODO -- Maybe the 'join new project stuff should go here?' -- setAtribute(project,newAncestor)  +  reparentize
          //  @TODO -- half thought update Jag should come first - but now think the order is good... rethoughts?


                   this.dispatchEvent(new CustomEvent('local-nodes-joined', {
                       bubbles: true,
                       composed: true,
                       detail: { projectNodeId: parentNodeModel.project, parentNodeId: parentNodeModel.id, childNodeId: childNodeModel.id }
                   }));

   //   //      this._activeNodeModelMap.delete(childNodeModel.id)
        } else {
            this.cancelEdge();
        }
    }

    cancelEdge() {
        if (!this._is_edge_being_created)
            return;

        this.removeEventListener('mousemove', this._boundOnEdgeUpdated);
        this.removeEventListener('mouseup', this._boundOnEdgeCanceled);

        this._created_edge.destroy();
        this._created_edge = undefined;
        this._is_edge_being_created = false;
    }

    onEdgeCanceled(e, node) {
        this.cancelEdge();
    }


    /**
     *
     * Playground Pan and Zoom
     *
     * _createCardinal
     * _checkBounds
     * _showCardinals
     * _zoomView
     * _dragView
     * dragView
     * stopDragView
     * fromClientToPlaygroundCoordinates
     *
     */

    _createCardinal(type, dx, dy) {
        const cardinal = document.createElement("div");
        cardinal.classList.add("cardinal");
        cardinal.classList.add(type);

        this.appendChild(cardinal);

        cardinal.addEventListener('mouseenter', () => {
            const hoverInterval = setInterval(function () {
                this._dragView(dx * Playground.DEFAULT_CARDINAL_MULTIPLIER, dy * Playground.DEFAULT_CARDINAL_MULTIPLIER);
            }.bind(this), 10);

            cardinal.addEventListener('mouseleave', () => {
                clearInterval(hoverInterval);
            });
        });

        return cardinal;
    }

    _checkBounds(nodes = this._activeJagNodeElementSet) {
        const bounds = this.getBoundingClientRect();
        let [minX, minY, maxX, maxY] = [bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height];
        let showLeft, showRight, showUp, showDown;

        for (const node of nodes) {
            if (node.visible) {
                const {x, y, width, height} = node.getBoundingClientRect();

                if (x < minX) showLeft = true;
                if (x + width > maxX) showRight = true;
                if (y < minY) showUp = true;
                if (y + height > maxY) showDown = true;
            }
        }

        if (nodes == this._activeJagNodeElementSet) {
            return this._showCardinals({
                left: showLeft || false,
                right: showRight || false,
                up: showUp || false,
                down: showDown || false
            });
        }

        return this._showCardinals({
            left: showLeft,
            right: showRight,
            up: showUp,
            down: showDown
        });
    }

    _showCardinals(toggle = {left, right, up, down}) {
        this._canMoveView = {
            left: toggle.left != undefined ? toggle.left : this._canMoveView.left,
            right: toggle.right != undefined ? toggle.right : this._canMoveView.right,
            up: toggle.up != undefined ? toggle.up : this._canMoveView.up,
            down: toggle.down != undefined ? toggle.down : this._canMoveView.down
        };

        for (const [key, value] of Object.entries(toggle)) {
            if (value == true || value == false) {
                this._cardinals[key].classList.toggle("visible", value);
            }
        }

        return this._canMoveView;
    }

    _zoomView(factor) {
        this._zoomFactor = factor;
        const transform = `scale(${factor})`;
        this._edgeContainerDiv.style.transform = transform;
        this._nodeContainerDiv.style.transform = transform;
        this._checkBounds();
    }

    _dragView(dx, dy) {
        for (let node of this._activeJagNodeElementSet) {
            node.translate(dx, dy, false);

            node.nodeModel.x = node.nodeModel.x + dx;
            node.nodeModel.y = node.nodeModel.y + dy;
        }

        this._checkBounds();
    }

    dragView(e) {
        const dx = e.clientX - this._initialMouse.x;
        const dy = e.clientY - this._initialMouse.y;

        this._dragView(dx, dy);

        this._initialMouse = {x: e.clientX, y: e.clientY};
    }

    stopDragView(e) {
        this.removeEventListener('mousemove', this._boundDragView);
    }

    fromClientToPlaygroundCoordinates(x, y) {
        const px = x - this.offsetLeft;
        const py = y - this.offsetTop;
        return [px, py];
    }

    /**
     *
     * playgroundClicked
     * cancelDefault
     * onImport
     */

    handlePlaygroundSelectedNodes(e) {           // on mousedown  applied during jag-node create
        let $node = e.target.offsetParent
        if (!e.shiftKey) {
            this._selectedJagNodeElementSet.forEach(local_node => {
                if (local_node != $node)
                    local_node.setSelected(false);
            });
            this._selectedJagNodeElementSet.clear();
        }

        this._selectedJagNodeElementSet.add($node);

        if (e.ctrlKey) {
            const all_selected = $node.setSelected(true, new Set());   // @TODO looks like it wants two booleans.  not a set.
            for (const sub_node of all_selected)
                this._selectedJagNodeElementSet.add(sub_node);
        } else {
            $node.setSelected(true);
        }

        let selectedJagNodeElementArray = [...this._selectedJagNodeElementSet];
        let selectedNodeArray = selectedJagNodeElementArray.map(jagNodeElement => {return jagNodeElement.nodeModel})

        this.dispatchEvent(new CustomEvent('playground-nodes-selected', {
            detail: {
                selectedNodeArray: selectedNodeArray
            }
        }));
        e.stopPropagation();  // Don't let it bubble up to the playgroundClicker handler.
    }

    playgroundClicked(e) {
        // The background clicker
        if (!e.shiftKey) this.deselectAll();

        let selectedJagNodeElementArray = [...this._selectedJagNodeElementSet];
        let selectedNodeArray = selectedJagNodeElementArray.map(jagNodeElement => {return jagNodeElement.nodeModel})

        this.dispatchEvent(new CustomEvent('playground-clicked', {detail: {selectedNodeArray: selectedNodeArray}}));
        this._edgeContainerDiv.dispatchEvent(new MouseEvent('click', {
            clientX: e.clientX,
            clientY: e.clientY,
            shiftKey: e.shiftKey
        }));
        this._initialMouse = {x: e.clientX, y: e.clientY};
        this.addEventListener('mousemove', this._boundDragView);
        this.addEventListener('mouseup', this._boundStopDragView);
    }

    cancelDefault(e) {
        e.preventDefault();
    }

    onImport(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        const reader = new FileReader();
        reader.addEventListener('load', function (content) {
        });
        reader.readAsText(files[0]);
    }

    ////////////////////////////////////////////////////////////////////////
    /////////////  Called from ControllerAT  ///////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    /**
     *
     * Handlers for ControllerAT
     *
     * _buildNodeViewFromNodeModel
     * _handleNewJagActivityPopup
     * clearPlayground
     * handleClearSelected (@TODO)
     * handleRefresh
     * updateJagModel
     * _addJagNodeTree
     * replaceJagNode
     * createJagNode  - called on new Project message from above
     * deleteNodeModel
     */
    //  the way with HEAD + child map   ===> want to go to the tree method.
    // replaced -- but keep for now - new method missing some things still
    traverseJagNodeTree(currentParentJagNode, descendantJagNodeMap, isExpanded, margin, x, y, childURN = undefined, context = undefined) {
        // if no child...  createJagNode
        // else proceed with the current child
        const node = childURN || this.createJagNode(currentParentJagNode, isExpanded);

        if (context) {
            if (context.name) node.setContextualName(context.name);
            if (context.description) node.setContextualDescription(context.description);
        }

        node.setTranslation(x + node.clientWidth / 2.0, y + node.clientHeight / 2.0);

        if (!currentParentJagNode.children)
            return node;

        const preferred_size = this._getNodePreferredHeight(currentParentJagNode, descendantJagNodeMap);          // hhhh

        // assume all children have same height as the parent.
        const node_height = node.clientHeight + margin;
        const preferred_height = preferred_size * node_height;
        const x_offset = x + node.clientWidth + margin;
        let y_offset = y - preferred_height / 2;

        const childrenMap = new Map();
        for (const child_edge of node.getChildEdges()) {
            childrenMap.set(child_edge.getChildId(), child_edge.getSubActivityNode());
        }

        currentParentJagNode.children.forEach((child) => {
            const currentChildJagNode = descendantJagNodeMap.get(child.urn);
            const local_preferred_size = this._getNodePreferredHeight(currentChildJagNode, descendantJagNodeMap);
            y_offset += (local_preferred_size * node_height) / 2;

            const sub_node = this._traverseJagNodeTree(currentChildJagNode, descendantJagNodeMap, true, margin, x_offset, y_offset, childrenMap.get(child.id), child);
            y_offset += (local_preferred_size * node_height) / 2;

            if (!childrenMap.has(child.id)) {
                let edge = this._createEdge(node, child.id);
                edge.setSubActivityNode(sub_node);
                edge.addEventListener('playground-nodes-selected', this._boundHandleEdgeSelected);
            }

            if (child.name) sub_node.setContextualName(child.name);
            if (child.description) sub_node.setContextualDescription(child.description);
        });

        for (const [id, child] of childrenMap.entries()) {
            let actual = false;

            for (const actual_child of currentParentJagNode.children) {
                if (actual_child.id == id) {
                    actual = true;
                    break;
                }
            }

            if (!actual) {
                const tree = child.getTree();
                for (const node of tree) {
                    node.removeAllEdges();
                    node.detachHandlers();
                    this._activeJagNodeElementSet.delete(node);
                    this._nodeContainerDiv.removeChild(node);
                }
            }
        }
        return node;
    }



    _buildNodeViewFromNodeModel(currentNodeModel, x, y) {
        // currentNodeModel should be project root at first.
        // if it were smart enough to join up with parent - then it could be anywhere
        // something to consoder for later
        let margin = 20


        if (this._activeNodeModelMap.has(currentNodeModel.id)) {
            console.log("REDRAWING " + currentNodeModel.id)

             }
        else{
            console.log("CREATING " + currentNodeModel.id)

        }
        this._activeNodeModelMap.set(currentNodeModel.id, currentNodeModel);
        console.log(this._activeNodeModelMap.size)

        if ((!currentNodeModel.x) || (!currentNodeModel.y) ) {
            currentNodeModel.x = 10
            currentNodeModel.y = this.clientHeight / 2
        }
        let xPos = (true) ? currentNodeModel.x : x;
        let yPos = (true) ? currentNodeModel.y : y;

        currentNodeModel.setPosition(xPos, yPos)
        const $newViewNode = this.createJagNode(currentNodeModel)

        $newViewNode.setTranslation(xPos + $newViewNode.clientWidth / 2.0, yPos + $newViewNode.clientHeight / 2.0);

        // assume all children have same height as the parent.
        const x_offset = xPos + $newViewNode.clientWidth + margin;
        const preferred_height = currentNodeModel.leafCount * ($newViewNode.clientHeight + margin);
        let y_offset = yPos - (preferred_height / 2);

        currentNodeModel.children.forEach((child) => {

            //  local_preferred_size Getting NaN here  VV why?
            const local_preferred_size = child.leafCount * ($newViewNode.clientHeight + margin);
            y_offset = y_offset + (local_preferred_size) / 2;

            let edge = this._createEdge($newViewNode, child.id);         // this wants a jag-node - not a nodeModel


            let $childViewNode = this._buildNodeViewFromNodeModel(child, x_offset, y_offset)                          // first build child

            edge.setSubActivityNode($childViewNode);                                                       // then connect tail of edge to it.
            edge.addEventListener('playground-nodes-selected', this._boundHandleEdgeSelected);

            // if (child.name) sub_node.setContextualName(child.name);
            // if (child.description) sub_node.setContextualDescription(child.description);

        })
        return $newViewNode
    }

    _handleNewJagActivityPopup(e) {
        const $initiator = document.getElementById('menu-new');
        this.popup({
            content: Playground.NOTICE_CREATE_JAG,
            trackEl: this,
            inputs: {},//event: e},
            highlights: [$initiator]
        });
    }



    clearPlayground(projectId = undefined) {                 // clearNodeSet
        for (let jagNode of this._activeJagNodeElementSet) {

                if ((projectId == undefined) || (jagNode.nodeModel.project = projectId)) {
                    jagNode.removeAllEdges();
                    jagNode.detachHandlers();
                    this._activeJagNodeElementSet.delete(jagNode);
                    this._nodeContainerDiv.removeChild(jagNode);
                }}
         this._checkBounds();
    }

    handleClearSelected() {  // you get this on the menu click 'delete node'    @TODO
        console.log("When implemented.. these nodes will be pruned:")
        console.log(this._selectedJagNodeElementSet)
    }     // @TODO

    handleRefresh({jagModel, jagModel_set, alreadyRefreshedNodes = new Set()}) {
        const margin = 50;

        for (let node of this._activeJagNodeElementSet) {
            if (!alreadyRefreshedNodes.has(node) && node.jagModel === jagModel) {
                const root = node.getRoot();

                if (root == node) {
                    const [x, y] = node.getPosition();
                    this._traverseJagNodeTree(jagModel, jagModel_set, true, margin, x, y, node);

                    const tree = node.getTree();

                    for (const node of tree) {
                        alreadyRefreshedNodes.add(node);
                    }
                } else {
                    root.refresh(alreadyRefreshedNodes);
                }
            }
        }
    }

    updateJagModel(updatedUrn) {             // Activity got updated - does it affect our projects?
   //     for (let node of this._activeNodeModelMap.values()) { // Return events with affected Project ids and the URN
        this._activeNodeModelMap.forEach((value, key) => {

            let node = value;
            console.log("Somehow its running TWICE")
            console.log(key)
            console.log(node)
            console.log(this._activeNodeModelMap.values())

            if (node.isActivityInProject(updatedUrn)) {
                this.dispatchEvent(new CustomEvent('new-activity-affects-project', {
                    detail: {
                        projectModel: node,
                        activityUrn: updatedUrn
                    }
                })); // local-jag-created in playground uses node

            }
        })
    }

    deleteJagModel(deletedUrn) {             // Activity got updated - does it affect our projects?
        this._activeNodeModelMap.forEach((value, key) => {

            let node = value;
            console.log("Somehow its running TWICE")
            console.log(key)
            console.log(node)
            console.log(this._activeNodeModelMap.values())

            if (node.isActivityInProject(deletedUrn)) {

                this.dispatchEvent(new CustomEvent('deleted-activity-affects-project', {
                    detail: {
                        projectModelId: node.id,
                        activityUrn: deletedUrn
                    }
                })); // local-jag-created in playground uses node

            }
        })

    }


    // add JagNodeTree == used when popup creates new jag -- (obs now i think) also broke - but appears in right place
    _addJagNodeTree(selectedJag, selectedJagDescendants = new Map(), isExpanded = false) {
        //const margin = 50;
        const height = this.clientHeight;
        const node = this._traverseJagNodeTree(selectedJag, selectedJagDescendants, isExpanded, margin, 10, height / 2);
        this._checkBounds(node.getTree());
    }

    replaceJagNode(newJagModel, deadUrn) {
        this._activeJagNodeElementSet.forEach((node) => {
            if (node.nodeModel.jag.urn == deadUrn) {
                node.nodeModel.jag = newJagModel;
            }
        })
    }

    // this is called when a new jag appears from above --- applies?
    //note: creates a view based on JagModel xxx now NodeModel
    createJagNode(nodeModel, expanded) {
        const $node = new JagNodeElement(nodeModel, expanded);
        $node.addEventListener('mousedown', this.handlePlaygroundSelectedNodes.bind(this));

        $node.addEventListener('keydown', this.onKeyDown.bind(this));

        $node.addEventListener('drag', () => {
            this._checkBounds()
        });

        $node.addEventListener('toggle-visible', (e) => {
            if (e.detail) {
                this._checkBounds($node.getTree());
            } else {
                this._checkBounds();
            }
        });

        ////?? @TODO think about this.
        $node.addEventListener('refresh', (e) => {
            this.dispatchEvent(new CustomEvent('refresh', {detail: e.detail}));
        });
        // Are these two below not the same info.  activeNodeSet needed?

        $node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
        $node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));

        this._activeJagNodeElementSet.add($node);
        this._nodeContainerDiv.appendChild($node);
        return $node;
    }

    deleteNodeModel(deadId) {
        // The deadId is a node marked for deletion.  Death can either be
        // annihilation or absorbtion into another project.  Playground nodes
        // with an ancester matching deadId are removed.
        // let deadIdModel = this._activeNodeModelMap.get(deadId)
        this._activeNodeModelMap.delete(deadId)
        console.log("DELETEING = DELETEING _ DELETING + DELETING      --> " + deadId)
        console.log(this._activeNodeModelMap.size)


        for (let node of this._activeJagNodeElementSet) {           // search through active elements
            if (node.nodeModel.project == deadId) {         // is this node in the tree of the currentNodeModel?
                node.removeAllEdges();
                node.detachHandlers();
                this._activeJagNodeElementSet.delete(node);
                this._nodeContainerDiv.removeChild(node);
            }
        }



       // this._activeJagNodeElementSet.forEach((node) => {
            // Vernichtern
            // if (!this._activeNodeModelMap.has(node.nodeModel.project)) {
            //     node.removeAllEdges();
            //     node.detachHandlers();
            //     this._activeJagNodeElementSet.delete(node);
            //     this._nodeContainerDiv.removeChild(node);
            // }
        // })
    }

    _rebuildNodeView(projectNodeModel) {                                  // @TODO extremely similar to *deleteNodeModel* + _buildNodeViewFromNodeModel
        let margin = 20

        // wanted to nix the next three lines - but needed for the getAncestor of each viewNode in the next section
        // or can I assume all projectModels at this point have been parentized.  (watch for it)
        // for (let project of this._activeNodeModelMap.values()) {          // @TODO this can be applied at a more sensible place. (when structure changes)
        //     project.parentize(project);
        // }

        // This removes all Playground elements === @TODO understand destroy/rebuild is most accurate - but maybe later a more delicate solution
        for (let node of this._activeJagNodeElementSet) {           // search through active elements
            if (node.nodeModel.project == projectNodeModel.id) {         // is this node in the tree of the currentNodeModel?
                node.removeAllEdges();
                node.detachHandlers();
                this._activeJagNodeElementSet.delete(node);
                this._nodeContainerDiv.removeChild(node);
            }
        }

    this.deleteNodeModel(projectNodeModel.id)
    this._buildNodeViewFromNodeModel(projectNodeModel);



        // for (let rootNode of this._activeNodeModelMap.values()) {
        //     let workStack = [];
        //     workStack.push(rootNode);
        //     while (workStack.length > 0) {
        //         let currentNodeModel = workStack.pop();
        //         const $newViewNode = this.createJagNode(currentNodeModel)
        //         $newViewNode.setTranslation(currentNodeModel.x + $newViewNode.clientWidth / 2.0, currentNodeModel.y + $newViewNode.clientHeight / 2.0);
        //
        //         currentNodeModel.children.forEach((child) => {
        //             let edge = this._createEdge(currentNodeModel, child.id);
        //             edge.setSubActivityNode(child);
        //             edge.addEventListener('playground-nodes-selected', this._boundHandleEdgeSelected);
        //             workStack.push(child)
        //     //        this._edgeContainerDiv.appendChild(edge);
        //         })
        //     }
        //
        //
        // }

        // if (child.name) sub_node.setContextualName(child.name);
        // if (child.description) sub_node.setContextualDescription(child.description);
    }

    ////////////////////////////////////////////////////////////////////////
    /////////////  Support Functions  //////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    /**
     *
     * Support Functions
     *
     * _traverseJagNodeTree    : Required by : _buildNodeViewFromNodeModel, handleRefresh, _addJagNodeTree
     * deselectAll             : Required by : playgroundClicked
     * onKeyDown               : Required by : createJagNode
     * _getNodePreferredHeight : Required by : _traverseJagNodeTree
     *
     */


    deselectAll() {
        this._selectedJagNodeElementSet.forEach(n => n.setSelected(false));
        this._selectedJagNodeElementSet.clear();
    }

    onKeyDown(event) {
        event.stopImmediatePropagation();
        let $node = event.target
          if (event.key == 'Delete') {
            if (this._selectedJagNodeElementSet.length>1) {
                alert("Can only clear/disconnect one selected item")
            }
            else  if (this._selectedJagNodeElementSet.length<1)
            {
                    alert("Must select at least one item to clear/disconnect")
            }
            else {
                    // if the selected node is a root - then clear the project from the tree
                    // if the selected node is a non-root node - then disconnect the jag from its parent
                    // @TODO - bit ugly with two functions for 'delete'  - I cant think of alternative
                    // @TODO - migth consider a delted edge to mean disconnect jag

                    if ($node.nodeModel.project == $node.nodeModel.id) {
                        this.clearPlayground($node.nodeModel.project);
                    } else {
                        if (window.confirm("Are you sure you want to remove this node as a child? (This will change all instances of the parent node to reflect this change.)"))

                        {
                        const edge = $node.getParentEdge();
                        const id = edge.getChildId();
                        const parent = $node.getParent();
                        const jagUrn = parent.nodeModel.urn
                        const jagChild = {urn: $node.nodeModel.urn, id: $node.nodeModel.childId}
                        let remainingChildren = parent.nodeModel.jag.children.filter(entry => {
                            if (entry.id != jagChild.id) {
                                return entry;
                            }
                        })
                        parent.nodeModel.jag.children = remainingChildren
                        this.dispatchEvent(new CustomEvent('local-jag-updated', {
                            detail: {jagModel: parent.nodeModel.jag}
                        }));




                        // this.popup({
                        //     content: Playground.NOTICE_REMOVE_CHILD,
                        //     trackEl: $node,
                        //     inputs: {node: $node},
                        //     highlights: [$node]
                        // });
                    }}

                }
        } else if (e.key == 'ArrowLeft') {
            if (this._canMoveView.left) {
                this._dragView(1 * Playground.DEFAULT_ARROW_MULTIPLIER, 0);
            }
        } else if (e.key == 'ArrowRight') {
            if (this._canMoveView.right) {
                this._dragView(-1 * Playground.DEFAULT_ARROW_MULTIPLIER, 0);
            }
        } else if (e.key == 'ArrowUp') {
            if (this._canMoveView.up) {
                this._dragView(0, 1 * Playground.DEFAULT_ARROW_MULTIPLIER);
            }
        } else if (e.key == 'ArrowDown') {
            if (this._canMoveView.down) {
                this._dragView(0, -1 * Playground.DEFAULT_ARROW_MULTIPLIER);
            }
        } else if (e.key == 'PageUp') {
            this._zoomView(this._zoomFactor / Playground.DEFAULT_ZOOM_MULTIPLIER);
        } else if (e.key == 'PageDown') {
            this._zoomView(this._zoomFactor * Playground.DEFAULT_ZOOM_MULTIPLIER);
        }
    }

    _getNodePreferredHeight(jagNode, jagNodeMap) {
        if (!jagNode.children || jagNode.children.length === 0)
            return 1;

        return jagNode.children.reduce((cut_set_size, child) => {
            const def = jagNodeMap.get(child.urn);
            return cut_set_size + (def ? this._getNodePreferredHeight(def, jagNodeMap) : 0);
        }, 0);
    }

    //////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////

    handleLibraryListItemSelected({
                                      jagModel: selectedJag,
                                      jagModel_set: selectedJagDescendants = new Map(),
                                      expanded: isExpanded = false
                                  }) {
        this._addJagNodeTree(selectedJag, selectedJagDescendants, isExpanded);
    }


//  I think this just returns the number of leaves.
// if so, we already keep track of leaf count at each node during build.


}

// END OF CLASS
// Initial UI builder creates
// <svg version="1.1" xmlns="http//www.w3.org/2000/svg"></svg>
//	  <div></div>
//	  <div class="popup-box" style="visablity


Playground.POPUP_TYPES = {
    WARNING: 'popup-warning',
    NOTICE: 'popup-notice',
    INFO: 'popup-info'
};

// why cant this go inside scope.? Does anyone else need it?
Playground.NOTICE_CREATE_JAG = Popupable._createPopup({
    type: Playground.POPUP_TYPES.NOTICE,
    name: "Add New JAG Activity",
    description: "Be precise.  You can always edit this later.",
    properties: [
        {
            name: 'popname', label: 'Name', type: 'text', options: function () {
                let eventMap = new Map();
                eventMap.set('input', () => {
                    const newName = UserPrefs.getDefaultUrnPrefix() + document.getElementById('popname').value;
                    const convName = newName.replace(' ', '-').replace(/[^0-9a-zA-Z:-]+/g, "").toLowerCase();
                    document.getElementById('popurn').value = convName;
                });
                return eventMap;
            }
        },
        {
            name: 'popurn', label: 'URN', type: 'text', options: function () {
                let eventMap = new Map();
                return eventMap;
            }
        },
        {
            name: 'popdescription', label: 'Description', type: 'textarea',
            options: async function () {
                let paramMap = new Map();
                paramMap.set('cols', 24);
                paramMap.set('rows', 4);
                return paramMap;
            }
        },
    ],
    actions: [
        {
            text: "Create", color: "black", bgColor: "red",
            action: async function ({inputs: {}, outputs: {popname, popurn, popdescription}}) {

                this.dispatchEvent(new CustomEvent('local-jag-created', {
                    detail: {
                        urn: popurn,
                        name: popname,
                        description: popdescription
                    }
                })); // local-jag-created in playground uses node
            }
        },
        {text: "Cancel", color: "white", bgColor: "black"}
    ]
    // display: ?
    // fallback: ?
    // skip: ?
});

Playground.NOTICE_REMOVE_CHILD = Popupable._createPopup({
    type: Playground.POPUP_TYPES.NOTICE,
    name: "Disconnect Child",
    description: "Disconnect this child JAG from parent JAG?",
    actions: [
        {
            text: "Yes", color: "black", bgColor: "red",
            action: function ({inputs: {node}}) {
                const edge = node.getParentEdge();
                const id = edge.getChildId();
                const parent = node.getParent();
                const jagUrn = parent.nodeModel.urn
                const jagChild = {urn: node.nodeModel.urn, id: node.nodeModel.childId}
                let remainingChildren = parent.nodeModel.jag.children.filter(entry => {
                    if (entry.id != jagChild.id) {
                        return entry;
                    }
                })
                parent.nodeModel.jag.children = remainingChildren
                this.dispatchEvent(new CustomEvent('local-jag-updated', {
                    detail: {jagModel: parent.nodeModel.jag}
                }));
            }
        },
        {text: "No", color: "white", bgColor: "black"}
    ]
});


Playground.DEFAULT_CARDINAL_MULTIPLIER = 10;

Playground.DEFAULT_ARROW_MULTIPLIER = 10;

Playground.DEFAULT_ZOOM_MULTIPLIER = 0.9;

customElements.define('jag-playground', Playground);

export default customElements.get('jag-playground');


/**
 * Apparently UNUSED???
 *
 // _generateActivityGraphFromJSON(json) {
  	// 	let root_goal = json.rootGoal;
  	// 	let root_node = this.addRootGoal(root_goal.name, root_goal.description);
  	// 	root_node.getConnector().setType(root_goal.connectorType);
  	// 	root_node.setTranslation(50, 50);
  	// 	this._generateSubGoals(root_node, root_goal);
  	// }
 //
 // _generateSubGoals(root_node, root) {
  	// 	let x_start = root_node._translation.x,
  	// 		y_offset = root_node._translation.y + 150;
  	//
  	// 	if(!root.subgoals)
  	// 		return;
  	//
  	// 	root.subgoals.forEach(subgoal => {
  	// 		let node;
  	// 		if(subgoal.type == 'GOAL') {
  	// 			node = this.addSubGoal(subgoal.item.name, subgoal.item.description);
  	// 			node.getConnector().setType(subgoal.item.connectorType);
  	// 		} else {
  	// 			node = this.addActivity(subgoal.item.name, subgoal.item.description);
  	// 		}
  	//
  	// 		node.setTranslation(x_start, y_offset);
  	// 		let edge = this._createEdge(root_node);
  	// 		edge.setSubActivityNode(node);
  	// 		this._generateSubGoals(node, subgoal.item);
  	// 		x_start += 175;
  	// 	});
  	// }
 *
 *
 *    // getSelectedAsJSON() {
 *     // 	if(this._selectedJagNodeElementSet.size == 0)
 *     // 		return undefined;
 *     //
 *     // 	return this._selectedJagNodeElementSet.values().next().value.jagModel.toJSON();
 *     // }
 *
 *     // getSelectedURN() {
 *     // 	if(this._selectedJagNodeElementSet.size == 0)
 *     // 		return undefined;
 *     //
 *     // 	return this._selectedJagNodeElementSet.values().next().value.jagModel.urn;
 *     // }
 *
 *
 */