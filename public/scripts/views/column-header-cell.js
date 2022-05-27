/**
 * @fileOverview Column header view.
 *
 * @author mvignati
 * @version 0.27
 */

'use strict';

import AnalysisCell from './analysis-cell.js';

class ColumnHeader extends AnalysisCell {

	constructor(name, col, row = 0, col_end = 1, row_end = 1, size = 10) {
		super();
		this._name = name;
		this._start = { col: col, row: row };
		this._end = { col: col_end, row: row_end };
		this._span_type = { col: ColumnHeader.SPAN, row: ColumnHeader.SPAN };
		this._size = size;

		this._init();
	}

	set colStart(start) {
		this._start.col = start;
		this._update();
	}

	set rowStart(start) {
		this._start.row = start;
		this._update();
	}

	set colSpan(span) {
		this._end.col = span;
		this._update();
	}

	set rowSpan(span) {
		this._end.row = span;
		this._update();
	}

	set colSpanType(span_type) {
		this._span_type.col = span_type;
		this._update();
	}

	set rowSpanType(span_type) {
		this._span_type.row = span_type;
		this._update();
	}

	get size() {
		return this._size;
	}

	set size(size) {
		this._size = size;
		this.style.width =  `${this._size}px`;
	}

	_init() {
		this.innerText = this._name;

		this._update();
		this.addEventListener('wheel', handleMouseWheel, {passive: true} );
	}

	_update() {
		// Starts at index + 1 since css grid is 1 based.
		this.style.setProperty('--col-start', this._start.col + 1);
		this.style.setProperty('--row-start', this._start.row + 1);

		let col_end = this._end.col;
		if(this._span_type.col === ColumnHeader.SPAN)
			col_end += ' span';
		this.style.setProperty('--col-end', col_end);

		let row_end = this._end.row;
		if(this._span_type.row === ColumnHeader.SPAN)
			row_end += ' span';
		this.style.setProperty('--row-end', row_end);
	}

}

ColumnHeader.SENSITIVITY = 10;
ColumnHeader.SPAN = Symbol();
ColumnHeader.END = Symbol();

function handleMouseWheel (event) {
	event.preventDefault();

	const target = event.target;
	target.size += Math.sign(event.deltaY) * ColumnHeader.SENSITIVITY;
}

customElements.define('ia-column-header', ColumnHeader);
export default customElements.get('ia-column-header');
