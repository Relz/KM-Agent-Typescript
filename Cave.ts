import { CaveProbability, ICave, ICaveProbability } from "./ICave";

export class Cave implements ICave {
	public constructor() {
		this._isVisible = false;
		this._hasGold = false;
		this._probability = new CaveProbability();
		this._probability.monster = 0;
		this._probability.hole = 0;
		this._hasWind = false;
		this._hasBones = false;
	}

	private _isVisible: boolean;
	public get isVisible(): boolean {
		return this._isVisible;
	}

	public set isVisible(value: boolean) {
		this._isVisible = value;
	}

	private _hasGold: boolean;
	public get hasGold(): boolean {
		return this._hasGold;
	}

	public set hasGold(value: boolean) {
		this._hasGold = value;
	}

	private _probability: ICaveProbability;
	public get probability(): ICaveProbability {
		return this._probability;
	}

	public set probability(value: ICaveProbability) {
		this._probability = value;
	}

	private _hasWind: boolean;
	public get hasWind(): boolean {
		return this._hasWind;
	}

	public set hasWind(value: boolean) {
		this._hasWind = value;
	}

	private _hasBones: boolean;
	public get hasBones(): boolean {
		return this._hasBones;
	}

	public set hasBones(value: boolean) {
		this._hasBones = value;
	}
}
