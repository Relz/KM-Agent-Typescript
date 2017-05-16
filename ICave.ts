export interface ICave {
	isVisible: boolean;
	hasGold: boolean;
	probability: ICaveProbability;
	hasWind: boolean;
	hasBones: boolean;
}

export interface ICaveProbability {
	monster: number;
	hole: number;
}

export class CaveProbability implements ICaveProbability {
	private _monster: number;
	public get monster(): number {
		return this._monster;
	}

	public set monster(value: number) {
		this._monster = value;
	}

	private _hole: number;
	public get hole(): number {
		return this._hole;
	}

	public set hole(value: number) {
		this._hole = value;
	}
}
