export class World {
	private _holeStartCount: number = 2;

	public constructor() {
		this._isMonsterAlive = true;
		this._holeCount = this._holeStartCount;
	}

	private _isMonsterAlive: boolean;
	public get isMonsterAlive(): boolean {
		return this._isMonsterAlive;
	}

	public set isMonsterAlive(value: boolean) {
		this._isMonsterAlive = value;
	}

	private _holeCount: number;
	public get holeCount(): number {
		return this._holeCount;
	}

	public decreaseHoleCount(): void {
		--this._holeCount;
	}

	private _doesTreasureTaken: boolean;
	public get doesTreasureTaken(): boolean {
		return this._doesTreasureTaken;
	}

	public set doesTreasureTaken(value: boolean) {
		this._doesTreasureTaken = value;
	}
}
