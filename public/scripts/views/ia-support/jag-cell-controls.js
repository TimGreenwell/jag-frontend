/**
 * @fileOverview JAG controls component.
 *
 * @author mvignati
 * @version 0.08
 */

'use strict';

class JagCellControls extends HTMLElement {

    constructor(cell) {
        super();
        this._cell = cell;

        this._initUI();
        this._initListeners();
    }

    _initUI() {
        this._addButton = document.createElement(`div`);
        this._removeButton = document.createElement(`div`);

        this._addButton.classList.add(`jag-button`, `add-child-button`);
        this._removeButton.classList.add(`jag-button`, `remove-button`);


        this.appendChild(this._addButton);

        // Only show the remove icon if not root.
        if (!this._cell.isRoot()) {
            this.appendChild(this._removeButton);
        }
    }

    _initListeners() {
        this._addButton.addEventListener(`click`, () => {
            this.dispatchEvent(new CustomEvent(
                `event-cell-addchild`,
                {
                    bubbles: true,
                    composed: true,
                    detail: {cell: this._cell}
                }
            ));
        });

        this._removeButton.addEventListener(`click`, () => {
            let parentCellActivity = this._cell.parent.activity;
            let childChildId = this._cell.childId;
            parentCellActivity.removeChild(childChildId);
            this.dispatchEvent(new CustomEvent(
                `event-activity-updated`,
                {
                    bubbles: true,
                    composed: true,
                    detail: {activity: parentCellActivity}
                }
            ));

            // this.dispatchEvent(new CustomEvent('event-cell-prunechild',
            //     { bubbles: true,
            //     composed: true,
            //     detail: {cell: this._cell}}));
        });
    }

}

customElements.define(`jag-controls`, JagCellControls);
export default customElements.get(`jag-controls`);

