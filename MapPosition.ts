export interface IMapPosition {
	row: number;
	col: number;
}

export class MapPosition implements IMapPosition {
	public constructor(row: number, col: number) {
		this._row = row;
		this._col = col;
	}

	private _row: number;
	public get row(): number {
		return this._row;
	}

	public set row(value: number) {
		this._row = value;
	}

	private _col: number;
	public get col(): number {
		return this._col;
	}

	public set col(value: number) {
		this._col = value;
	}
}
