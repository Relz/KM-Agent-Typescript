import { Cave } from "./Cave";
import { ICave } from "./ICave";
import { IMapPosition, MapPosition } from "./MapPosition";
import { World } from "./World";

export class Map {
	private _mapWidth: number = 4;
	private _mapHeight: number = 4;

	private _unexploredCaveCount: number = this._mapWidth * this._mapHeight;

	public constructor(world: World) {
		this._world = world;
		this._caves = [];
		this._reachableCavesMapPositions = [];
		for (let rowIndex: number = 0; rowIndex < this._mapHeight; ++rowIndex) {
			const row: ICave[] = [];
			for (let colIndex: number = 0; colIndex < this._mapWidth; ++colIndex) {
				row.push(new Cave());
			}
			this._caves.push(row);
		}
	}

	private _world: World;
	public get world(): World {
		return this._world;
	}

	public set world(value: World) {
		this._world = value;
	}

	public get width(): number {
		if (this.height === 0) {
			return 0;
		}

		return this.caves[0].length;
	}

	public get height(): number {
		return this.caves.length;
	}

	private _caves: ICave[][];
	public get caves(): ICave[][] {
		return this._caves;
	}

	private _reachableCavesMapPositions: IMapPosition[];
	public get reachableCavesMapPositions(): IMapPosition[] {
		return this._reachableCavesMapPositions;
	}

	/*public pushReachableCave(value: ICave): void {
		this._reachableCaves.push(value);
	}

	public popReachableCave(): void {
		this._reachableCaves.pop();
	}*/

	public updateCave(row: number, col: number, cave: ICave): void {
		if (!this._caves[row][col].isVisible) {
			--this._unexploredCaveCount;
			this._caves[row][col] = cave;
			this.computeProbabilitiesNearCave(row, col);
			this.updateReachableCaves(row, col);
		}
	}

	public setZeroMonsterProbability(): void {
		const monsterMapPositions: IMapPosition[] = [];
		for (let i: number = 0; i < this._reachableCavesMapPositions.length; ++i) {
			if (this.caves[this._reachableCavesMapPositions[i].row][this._reachableCavesMapPositions[i].col].probability.monster !== 0) {
				monsterMapPositions.push(
					new MapPosition(
						this._reachableCavesMapPositions[i].row,
						this._reachableCavesMapPositions[i].col
					)
				);
				this._reachableCavesMapPositions.splice(i, 1);
			}
		}

		for (let row: number = 0; row < this.height; ++row) {
			for (let col: number = 0; col < this.width; ++col) {
				this._caves[row][col].probability.monster = 0;
			}
		}
		for (let i: number = 0; i < monsterMapPositions.length; ++i) {
			this.insertReachableCaveMapPositionSort(monsterMapPositions[i]);
		}
	}

	public printVisible(): void {
		for (let row: number = 0; row < this.height; ++row) {
			for (let col: number = 0; col < this.width; ++col) {
				process.stdout.write(this._caves[row][col].isVisible ? "1" : "0");
			}
			process.stdout.write("\n");
		}
	}

	public printHasGold(): void {
		for (let row: number = 0; row < this.height; ++row) {
			for (let col: number = 0; col < this.width; ++col) {
				process.stdout.write(this._caves[row][col].hasGold ? "1" : "0");
			}
			process.stdout.write("\n");
		}
	}

	public printHasWind(): void {
		for (let row: number = 0; row < this.height; ++row) {
			for (let col: number = 0; col < this.width; ++col) {
				process.stdout.write(this._caves[row][col].hasWind ? "1" : "0");
			}
			process.stdout.write("\n");
		}
	}

	public printHasBones(): void {
		for (let row: number = 0; row < this.height; ++row) {
			for (let col: number = 0; col < this.width; ++col) {
				process.stdout.write(this._caves[row][col].hasBones ? "1" : "0");
			}
			process.stdout.write("\n");
		}
	}

	public printMonsterProbability(): void {
		for (let row: number = 0; row < this.height; ++row) {
			for (let col: number = 0; col < this.width; ++col) {
				process.stdout.write(this._caves[row][col].probability.monster.toString() + " ");
			}
			process.stdout.write("\n");
		}
	}

	public printHoleProbability(): void {
		for (let row: number = 0; row < this.height; ++row) {
			for (let col: number = 0; col < this.width; ++col) {
				process.stdout.write(this._caves[row][col].probability.hole.toString() + " ");
			}
			process.stdout.write("\n");
		}
	}

	public updateReachableCaves(row: number, col: number): void {
		const nearCavesMapPositions: IMapPosition[] = [];
		if (row > 0 && !this._caves[row - 1][col].isVisible) {
			nearCavesMapPositions.push(new MapPosition(row - 1, col));
		}
		if (col < this.width - 1 && !this._caves[row][col + 1].isVisible) {
			nearCavesMapPositions.push(new MapPosition(row, col + 1));
		}
		if (row < this.height - 1 && !this._caves[row + 1][col].isVisible) {
			nearCavesMapPositions.push(new MapPosition(row + 1, col));
		}
		if (col > 0 && !this._caves[row][col - 1].isVisible) {
			nearCavesMapPositions.push(new MapPosition(row, col - 1));
		}

		for (let i: number = 0; i < this._reachableCavesMapPositions.length; ++i) {
			if (this._reachableCavesMapPositions[i].row === row && this._reachableCavesMapPositions[i].col === col) {
				this._reachableCavesMapPositions.splice(i, 1);
			}
		}

		for (let j: number = 0; j < nearCavesMapPositions.length; ++j) {
			let found: boolean = false;
			for (let i: number = 0; i < this._reachableCavesMapPositions.length; ++i) {
				if (this._reachableCavesMapPositions[i].row === nearCavesMapPositions[j].row && this._reachableCavesMapPositions[i].col === nearCavesMapPositions[j].col) {
					found = true;
				}
			}
			if (!found) {
				this.insertReachableCaveMapPositionSort(nearCavesMapPositions[j]);
			}
		}
	}

	public updateReachableCave(row: number, col: number): void {
		for (let i: number = 0; i < this._reachableCavesMapPositions.length; ++i) {
			if (this._reachableCavesMapPositions[i].row === row && this._reachableCavesMapPositions[i].col === col) {
				this._reachableCavesMapPositions.splice(i, 1);
			}
		}
		this.insertReachableCaveMapPositionSort(new MapPosition(row, col));
	}

	private computeProbabilitiesNearCave(row: number, col: number): void {
		this.computeHoleProbabilitiesNearCave(row, col);
		if (this.world.isMonsterAlive) {
			this.computeMonsterProbabilitiesNearCave(row, col);
		}
	}

	private computeHoleProbabilitiesNearCave(row: number, col: number): void {
		const nearCavesMapPositions: IMapPosition[] = [];
		if (row > 0 && !this._caves[row - 1][col].isVisible) {
			nearCavesMapPositions.push(new MapPosition(row - 1, col));
		}
		if (col < this.width - 1 && !this._caves[row][col + 1].isVisible) {
			nearCavesMapPositions.push(new MapPosition(row, col + 1));
		}
		if (row < this.height - 1 && !this._caves[row + 1][col].isVisible) {
			nearCavesMapPositions.push(new MapPosition(row + 1, col));
		}
		if (col > 0 && !this._caves[row][col - 1].isVisible) {
			nearCavesMapPositions.push(new MapPosition(row, col - 1));
		}
		for (let i: number = 0; i < nearCavesMapPositions.length; ++i) {
			if (this._caves[row][col].hasWind) {
				if (this._caves[nearCavesMapPositions[i].row][nearCavesMapPositions[i].col].probability.hole > 0) {
					this._caves[nearCavesMapPositions[i].row][nearCavesMapPositions[i].col].probability.hole = 1;
				} else {
					this._caves[nearCavesMapPositions[i].row][nearCavesMapPositions[i].col].probability.hole = 1 / nearCavesMapPositions.length;
				}
				for (let j: number = 0; j < this._reachableCavesMapPositions.length; ++j) {
					if (this._reachableCavesMapPositions[j].row === nearCavesMapPositions[i].row && this._reachableCavesMapPositions[j].col === nearCavesMapPositions[i].col) {
						this._reachableCavesMapPositions.splice(j, 1);
						this.insertReachableCaveMapPositionSort(new MapPosition(nearCavesMapPositions[i].row, nearCavesMapPositions[i].col));
					}
				}
			} else {
				this._caves[nearCavesMapPositions[i].row][nearCavesMapPositions[i].col].probability.hole = 0;
			}
		}
	}

	private computeMonsterProbabilitiesNearCave(row: number, col: number): void {
		const nearCaves: ICave[] = [];
		if (row > 0 && !this._caves[row - 1][col].isVisible) {
			nearCaves.push(this._caves[row - 1][col]);
		}
		if (col < this.width - 1 && !this._caves[row][col + 1].isVisible) {
			nearCaves.push(this._caves[row][col + 1]);
		}
		if (row < this.height - 1 && !this._caves[row + 1][col].isVisible) {
			nearCaves.push(this._caves[row + 1][col]);
		}
		if (col > 0 && !this._caves[row][col - 1].isVisible) {
			nearCaves.push(this._caves[row][col - 1]);
		}
		for (let i: number = 0; i < nearCaves.length; ++i) {
			if (this._caves[row][col].hasBones) {
				if (nearCaves[i].probability.monster > 0) {
					nearCaves[i].probability.monster = 1;
				} else {
					nearCaves[i].probability.monster = 1 / nearCaves.length;
				}
				if (nearCaves[i].probability.monster === 1) {
					break;
				}
			} else {
				nearCaves[i].probability.monster = 0;
			}
		}
	}

	private insertReachableCaveMapPositionSort(caveMapPosition: IMapPosition): void {
		const cave0: ICave = this._caves[caveMapPosition.row][caveMapPosition.col];
		let doesInserted: boolean = false;
		for (let i: number = 0; i < this._reachableCavesMapPositions.length; ++i) {
			const cave1: ICave = this._caves[this._reachableCavesMapPositions[i].row][this._reachableCavesMapPositions[i].col];
			if (cave0.probability.monster + cave0.probability.hole <= cave1.probability.monster + cave1.probability.hole) {
				this._reachableCavesMapPositions.splice(i, 0, caveMapPosition);
				doesInserted = true;
				break;
			}
		}
		if (!doesInserted) {
			for (let i: number = 0; i < this._reachableCavesMapPositions.length; ++i) {
				const cave1: ICave = this._caves[this._reachableCavesMapPositions[i].row][this._reachableCavesMapPositions[i].col];
				if (cave0.probability.monster < cave1.probability.monster) {
					this._reachableCavesMapPositions.splice(i, 0, caveMapPosition);
					doesInserted = true;
					break;
				}
			}
		}
		if (!doesInserted) {
			for (let i: number = 0; i < this._reachableCavesMapPositions.length; ++i) {
				const cave1: ICave = this._caves[this._reachableCavesMapPositions[i].row][this._reachableCavesMapPositions[i].col];
				if (cave0.probability.hole < cave1.probability.hole) {
					this._reachableCavesMapPositions.splice(i, 0, caveMapPosition);
					doesInserted = true;
					break;
				}
			}
		}
		if (!doesInserted) {
			this._reachableCavesMapPositions.push(caveMapPosition);
		}
	}
}
