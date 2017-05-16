import { Action } from "./Action";
import { Actions } from "./Actions";
import { IAction } from "./IAction";
import { ICave } from "./ICave";
import { Map } from "./Map";
import { IMapPosition, MapPosition } from "./MapPosition";
import { Parser } from "./Parser";
import { Request } from "./Request";

enum Direction {
	Top, Right, Bottom, Left
}

export class Agent {
	private _decimalSystem: number = 10;
	private _map: Map;
	private _wayActions: IAction[];
	private _wayMapPositions: MapPosition[];
	private _wayMapDirections: Direction[];

	public constructor(map: Map) {
		this._map = map;
		this._wayActions = [];
		this._wayMapPositions = [];
		this._wayMapDirections = [];
		this._name = "";
		this._legCount = 0;
		this._arrowCount = 0;
		this._direction = Direction.Bottom;
		this._mapPosition = new MapPosition(-1, -1);
	}

	private _name: string;
	public get name(): string {
		return this._name;
	}

	private _legCount: number;
	public get legCount(): number {
		return this._legCount;
	}

	private _arrowCount: number;
	public get arrowCount(): number {
		return this._arrowCount;
	}

	private _direction: Direction;
	public get direction(): Direction {
		return this._direction;
	}

	private _mapPosition: IMapPosition;
	public get mapPosition(): IMapPosition {
		return this._mapPosition;
	}

	public get row(): number {
		return this._mapPosition.row;
	}

	public get col(): number {
		return this._mapPosition.col;
	}

	public deserialize(agentJson: any): void {
		this._name = agentJson.aname;
		this.setDirection(agentJson.dir);
		this._legCount = agentJson.legscount;
		this.setPosition(agentJson.cavenum);
		this._arrowCount = agentJson.arrowcount;
		const tmp: string = this.arrowCount === 1 ? "a" : "";
		console.log(`Создатель, Моё имя - ${this.name}, Я начал на позиции {${this.row} ${this.col}}, направлен ${this.directionToString(this.direction)}.`);
		if (this.arrowCount === 0) {
			console.log(`Но у меня нет стрел, чтобы убить монстра =(`);
		} else {
			console.log(`Также у меня есть ${this.arrowCount} стрел${tmp}, чтобы убить монстра!`);
		}
	}

	public makeTurn(): void {
		if (this._wayActions.length !== 0) {
			this.keepWay();

			return;
		}
		if (this._map.world.isMonsterAlive && this.tryToKillMonsterNear()) {
			return;
		}
		if (this._map.caves[this.row][this.col].hasGold) {
			this.takeTreasure();

			return;
		}
		this.makeWay();
		if (this._wayActions.length !== 0) {
			this.keepWay();
		} else {
			this.makeTurn();
		}
	}

	private keepWay(): void {
		Request.send(this._wayActions[0], (jsonResponseStr: string) => {
			const jsonResponse: any = JSON.parse(jsonResponseStr);
			if (!Request.check(jsonResponse)) {
				return;
			}
			this._wayActions.splice(0, 1);
			this._mapPosition.row = this._wayMapPositions[0].row;
			this._mapPosition.col = this._wayMapPositions[0].col;
			this._wayMapPositions.splice(0, 1);
			this._direction = this._wayMapDirections[0];
			this._wayMapDirections.splice(0, 1);
			console.log(`Я на позиции {${this.row} ${this.col}}, направлен ${this.directionToString(this.direction)}`);
			//console.log(`На самом деле ${jsonResponse.text.iagent.cavenum} и ${jsonResponse.text.iagent.dir}`);
			const currentCave: ICave = Parser.parseCave(jsonResponse.text.currentcave);
			this._map.updateCave(this.row, this.col, currentCave);
			if (currentCave.hasWind) {
				console.log("Дует... где-то рядом яма... надо быть осторожным");
			}
			if (currentCave.hasBones && this._map.world.isMonsterAlive) {
				console.log("Кости... значит монстр совсем близко... страшно *тяжелый вздох*");
			}

			this.makeTurn();
		});
	}

	private tryToKillMonsterNear(): boolean {
		let monsterRow: number = this.row;
		let monsterCol: number = this.col;
		if (this.row > 0 && this._map.caves[this.row - 1][this.col].probability.monster === 1) {
			--monsterRow;
		} else if (this.col < this._map.width - 1 && this._map.caves[this.row][this.col + 1].probability.monster === 1) {
			++monsterCol;
		} else if (this.row < this._map.height - 1 && this._map.caves[this.row + 1][this.col].probability.monster === 1) {
			++monsterRow;
		} else if (this.col > 0 && this._map.caves[this.row][this.col - 1].probability.monster === 1) {
			--monsterCol;
		}
		if (monsterRow !== this.row || monsterCol !== this.col) {
			console.log(`Создатель, Я нашёл монстра в позиции: ${monsterRow} ${monsterCol}.`);
			if (this.arrowCount == 0) {
				console.log(`Но у меня нет стрел, чтобы убить его...`);

				return false;
			}
			const action: IAction = new Action();
			action.passive = this.computePassiveAction(
				new MapPosition(monsterRow, monsterCol),
				new MapPosition(this.row, this.col),
				this.direction
			);
			const newAgentDirection: Direction = this.computeAgentDirection(
				new MapPosition(monsterRow, monsterCol),
				new MapPosition(this.row, this.col)
			);
			action.active = Actions.active.shoot;
			Request.send(action, (jsonResponseStr: string) => {
				const jsonResponse: any = JSON.parse(jsonResponseStr);
				if (!Request.check(jsonResponse)) {
					return;
				}
				this._direction = newAgentDirection;
				if (!jsonResponse.text.worldinfo.ismonsteralive) {
					this._map.world.isMonsterAlive = false;
					console.log("Создатель! Я убил монстра! Осталось забрать золото.");
					--this._arrowCount;
					this._map.setZeroMonsterProbability();
				} else {
					console.log("Черт! Монстр всё ещё жив... Но зато я знаю, что здесь нет монстра");
					this._map.caves[this._map.reachableCavesMapPositions[0].row][this._map.reachableCavesMapPositions[0].col].probability.monster = 0;
				}
				this._map.updateReachableCave(monsterRow, monsterCol);
				this.makeTurn();
			});

			return true;
		}
		if (this._map.caves[this._map.reachableCavesMapPositions[0].row][this._map.reachableCavesMapPositions[0].col].probability.monster !== 0) {
			console.log(`Создатель, Я попал в сложную ситуацию, монстр может находиться в позиции: ${this._map.reachableCavesMapPositions[0].row} ${this._map.reachableCavesMapPositions[0].col}.`);
			if (this.arrowCount == 0) {
				console.log(`Но у меня нет стрел, чтобы убить его... Тогда буду надеяться, что его там нет...`);

				return false;
			} else {
				console.log(`Попробую выстрелить туда.`);
			}
			const action: IAction = new Action();
			action.passive = this.computePassiveAction(
				new MapPosition(this._map.reachableCavesMapPositions[0].row, this._map.reachableCavesMapPositions[0].col),
				new MapPosition(this.row, this.col),
				this.direction
			);
			const newAgentDirection: Direction = this.computeAgentDirection(
				new MapPosition(this._map.reachableCavesMapPositions[0].row, this._map.reachableCavesMapPositions[0].col),
				new MapPosition(this.row, this.col)
			);
			action.active = Actions.active.shoot;
			Request.send(action, (jsonResponseStr: string) => {
				const jsonResponse: any = JSON.parse(jsonResponseStr);
				if (!Request.check(jsonResponse)) {
					return;
				}
				this._direction = newAgentDirection;
				if (!jsonResponse.text.worldinfo.ismonsteralive) {
					this._map.world.isMonsterAlive = false;
					console.log("Создатель! Я убил монстра! Осталось забрать золото.");
					--this._arrowCount;
					this._map.setZeroMonsterProbability();

				} else {
					console.log("Черт! Монстр всё ещё жив... Но зато я знаю, что здесь нет монстра");
					this._map.caves[this._map.reachableCavesMapPositions[0].row][this._map.reachableCavesMapPositions[0].col].probability.monster = 0;
				}
				this._map.updateReachableCave(this._map.reachableCavesMapPositions[0].row, this._map.reachableCavesMapPositions[0].col);
				this.makeTurn();
			});

			return true;
		}

		return false;
	}

	private takeTreasure(): void {
		const action: IAction = new Action();
		action.passive = Actions.passive.noAction;
		action.active = Actions.active.takeGold;
		Request.send(action, (jsonResponseStr: string) => {
			console.log("Создатель! Я нашёл золото! Миссия выполнена!");
			this._map.world.doesTreasureTaken = true;
			const jsonResponse: any = JSON.parse(jsonResponseStr);
			if (jsonResponse.error !== "GAME IS REACHED") {
				console.log("Однако, сервер так не думает...");
			}
		});
	}

	/*private printWavedMap(wavedMap: number[][]): void {
		for (let i: number = 0; i < wavedMap.length; ++i) {
			for (let j: number = 0; j < wavedMap[0].length; ++j) {
				process.stdout.write(wavedMap[i][j] === Number.MAX_VALUE ? "* " : wavedMap[i][j].toString() + " ");
			}
			process.stdout.write("\n");
		}
		process.stdout.write("\n");
	}*/

	private makeWay(): void {
		if (this._map.reachableCavesMapPositions.length === 0) {
			console.log("Создатель, Я обошёл всю карту!");
			return;
		}
		const goalCaveMapPosition: IMapPosition = new MapPosition(this._map.reachableCavesMapPositions[0].row, this._map.reachableCavesMapPositions[0].col);
		const wavedMap: number[][] = [];
		this.initializeWavedMap(wavedMap);
		this.waveAlgorithm(wavedMap);
		//this.printWavedMap(wavedMap);
		//console.log(`Цель: ${goalCaveMapPosition.row}, ${goalCaveMapPosition.col}`);
		while (goalCaveMapPosition.row !== this.row || goalCaveMapPosition.col !== this.col) {
			this._wayMapPositions.unshift(new MapPosition(goalCaveMapPosition.row, goalCaveMapPosition.col));
			let doesWayExists: boolean = false;
			if (
				goalCaveMapPosition.row > 0
				&& this._map.caves[goalCaveMapPosition.row - 1][goalCaveMapPosition.col].isVisible
				&& wavedMap[goalCaveMapPosition.row - 1][goalCaveMapPosition.col] === wavedMap[goalCaveMapPosition.row][goalCaveMapPosition.col] - 1
			) {
				--goalCaveMapPosition.row;
				doesWayExists = true;
			} else if (
				goalCaveMapPosition.col < this._map.width - 1
				&& this._map.caves[goalCaveMapPosition.row][goalCaveMapPosition.col + 1].isVisible
				&& wavedMap[goalCaveMapPosition.row][goalCaveMapPosition.col + 1] === wavedMap[goalCaveMapPosition.row][goalCaveMapPosition.col] - 1
			) {
				++goalCaveMapPosition.col;
				doesWayExists = true;
			} else if (
				goalCaveMapPosition.row < this._map.height - 1
				&& this._map.caves[goalCaveMapPosition.row + 1][goalCaveMapPosition.col].isVisible
				&& wavedMap[goalCaveMapPosition.row + 1][goalCaveMapPosition.col] === wavedMap[goalCaveMapPosition.row][goalCaveMapPosition.col] - 1
			) {
				++goalCaveMapPosition.row;
				doesWayExists = true;
			} else if (
				goalCaveMapPosition.col > 0
				&& this._map.caves[goalCaveMapPosition.row][goalCaveMapPosition.col - 1].isVisible
				&& wavedMap[goalCaveMapPosition.row][goalCaveMapPosition.col - 1] === wavedMap[goalCaveMapPosition.row][goalCaveMapPosition.col] - 1
			) {
				--goalCaveMapPosition.col;
				doesWayExists = true;
			}
			if (!doesWayExists) {
				this._map.reachableCavesMapPositions.splice(0, 1);
				return;
			}
		}

		let agentDirection: Direction = this._direction;
		const fromCaveMapPosition: MapPosition = new MapPosition(this.row, this.col);
		for (let i: number = 0; i < this._wayMapPositions.length; ++i) {
			const result: IAction = new Action();
			result.passive = this.computePassiveAction(this._wayMapPositions[i], fromCaveMapPosition, agentDirection);
			result.active = Actions.active.go;
			/*if (result.passive === "") {
				continue;
			}*/
			this._wayActions.push(result);
			agentDirection = this.computeAgentDirection(this._wayMapPositions[i], fromCaveMapPosition);
			this._wayMapDirections.push(agentDirection);
			fromCaveMapPosition.row = this._wayMapPositions[i].row;
			fromCaveMapPosition.col = this._wayMapPositions[i].col;
		}
		if (this._map.caves[this._wayMapPositions[this._wayMapPositions.length - 1].row][this._wayMapPositions[this._wayMapPositions.length - 1].col].probability.monster !== 0) {
			if (this.arrowCount == 0) {
				console.log(`Создатель, Я попал в сложную ситуацию, монстр может находиться в позиции: ${this._map.reachableCavesMapPositions[0].row} ${this._map.reachableCavesMapPositions[0].col}. Но у меня нет стрел, чтобы убить его... Тогда буду надеяться, что его там нет...`);
			} else {
				this._wayActions.pop();
				this._wayMapPositions.pop();
				this._wayMapDirections.pop();
			}
		}
	}

	private computePassiveAction(toCaveMapPosition: MapPosition, fromCaveMapPosition: MapPosition, agentDirection: Direction): string {
		let result: string = "";
		if (toCaveMapPosition.row < fromCaveMapPosition.row) {
			switch (agentDirection) {
				case Direction.Top:
					result = Actions.passive.noAction;
					break;
				case Direction.Right:
					result = Actions.passive.turn.left;
					break;
				case Direction.Bottom:
					result = Actions.passive.turn.around;
					break;
				case Direction.Left:
					result = Actions.passive.turn.right;
					break;
				default:
					break;
			}
		} else if (toCaveMapPosition.col > fromCaveMapPosition.col) {
			switch (agentDirection) {
				case Direction.Top:
					result = Actions.passive.turn.right;
					break;
				case Direction.Right:
					result = Actions.passive.noAction;
					break;
				case Direction.Bottom:
					result = Actions.passive.turn.left;
					break;
				case Direction.Left:
					result = Actions.passive.turn.around;
					break;
				default:
					break;
			}
		} else if (toCaveMapPosition.row > fromCaveMapPosition.row) {
			switch (agentDirection) {
				case Direction.Top:
					result = Actions.passive.turn.around;
					break;
				case Direction.Right:
					result = Actions.passive.turn.right;
					break;
				case Direction.Bottom:
					result = Actions.passive.noAction;
					break;
				case Direction.Left:
					result = Actions.passive.turn.left;
					break;
				default:
					break;
			}
		} else if (toCaveMapPosition.col < fromCaveMapPosition.col) {
			switch (agentDirection) {
				case Direction.Top:
					result = Actions.passive.turn.left;
					break;
				case Direction.Right:
					result = Actions.passive.turn.around;
					break;
				case Direction.Bottom:
					result = Actions.passive.turn.right;
					break;
				case Direction.Left:
					result = Actions.passive.noAction;
					break;
				default:
					break;
			}
		}

		return result;
	}

	private computeAgentDirection(toCaveMapPosition: MapPosition, fromCaveMapPosition: MapPosition): Direction {
		if (toCaveMapPosition.row < fromCaveMapPosition.row) {
			return Direction.Top;
		}
		if (toCaveMapPosition.col > fromCaveMapPosition.col) {
			return Direction.Right;
		}
		if (toCaveMapPosition.row > fromCaveMapPosition.row) {
			return Direction.Bottom;
		}
		if (toCaveMapPosition.col < fromCaveMapPosition.col) {
			return Direction.Left;
		}

		return Direction.Top;
	}

	private initializeWavedMap(wavedMap: number[][]): void {
		for (let row: number = 0; row < this._map.height; ++row) {
			wavedMap.push([]);
			for (let col: number = 0; col < this._map.width; ++col) {
				wavedMap[row].push(Number.MAX_VALUE);
			}
		}
		wavedMap[this.row][this.col] = 0;
	}

	private waveAlgorithm(wavedMap: number[][]): void {
		const queue: MapPosition[] = [];
		queue.push(new MapPosition(this.row, this.col));

		while (queue.length !== 0) {
			const mapPosition: MapPosition = queue[0];
			queue.splice(0, 1);
			if (
				mapPosition.row > 0
				&& wavedMap[mapPosition.row - 1][mapPosition.col] > wavedMap[mapPosition.row][mapPosition.col] + 1
			) {
				wavedMap[mapPosition.row - 1][mapPosition.col] = wavedMap[mapPosition.row][mapPosition.col] + 1;
				if (
					this._map.caves[mapPosition.row - 1][mapPosition.col].isVisible
					&& this._map.caves[mapPosition.row - 1][mapPosition.col].probability.hole === 0
				) {
					queue.push(new MapPosition(mapPosition.row - 1, mapPosition.col));
				}
			}
			if (
				mapPosition.col < this._map.width - 1
				&& wavedMap[mapPosition.row][mapPosition.col + 1] > wavedMap[mapPosition.row][mapPosition.col] + 1
			) {
				wavedMap[mapPosition.row][mapPosition.col + 1] = wavedMap[mapPosition.row][mapPosition.col] + 1;
				if (
					this._map.caves[mapPosition.row][mapPosition.col + 1].isVisible
					&& this._map.caves[mapPosition.row][mapPosition.col + 1].probability.hole === 0
				) {
					queue.push(new MapPosition(mapPosition.row, mapPosition.col + 1));
				}
			}
			if (
				mapPosition.row < this._map.height - 1
				&& wavedMap[mapPosition.row + 1][mapPosition.col] > wavedMap[mapPosition.row][mapPosition.col] + 1
			) {
				wavedMap[mapPosition.row + 1][mapPosition.col] = wavedMap[mapPosition.row][mapPosition.col] + 1;
				if (
					this._map.caves[mapPosition.row + 1][mapPosition.col].isVisible
					&& this._map.caves[mapPosition.row + 1][mapPosition.col].probability.hole === 0
				) {
					queue.push(new MapPosition(mapPosition.row + 1, mapPosition.col));
				}
			}
			if (
				mapPosition.col > 0
				&& wavedMap[mapPosition.row][mapPosition.col - 1] > wavedMap[mapPosition.row][mapPosition.col] + 1
			) {
				wavedMap[mapPosition.row][mapPosition.col - 1] = wavedMap[mapPosition.row][mapPosition.col] + 1;
				if (
					this._map.caves[mapPosition.row][mapPosition.col - 1].isVisible
					&& this._map.caves[mapPosition.row][mapPosition.col - 1].probability.hole === 0
				) {
					queue.push(new MapPosition(mapPosition.row, mapPosition.col - 1));
				}
			}
		}
	}

	private setDirection(directionStr: string): void {
		switch (directionStr) {
			case "Up":
				this._direction = Direction.Top;
				break;
			case "Right":
				this._direction = Direction.Right;
				break;
			case "Down":
				this._direction = Direction.Bottom;
				break;
			case "Left":
				this._direction = Direction.Left;
				break;
			default:
				this._direction = Direction.Bottom;
				break;
		}
	}

	private setPosition(positionStr: string): void {
		let rowStr: string = "";
		let i: number = 0;
		for (i; i < positionStr.length; ++i) {
			if (positionStr[i] === "_") {
				++i;
				break;
			}
			rowStr += positionStr[i];
		}

		let colStr: string = "";
		for (i; i < positionStr.length; ++i) {
			colStr += positionStr[i];
		}
		this._mapPosition.row = parseInt(rowStr, this._decimalSystem);
		this._mapPosition.col = parseInt(colStr, this._decimalSystem);
	}

	private directionToString(value: Direction): string {
		switch (value) {
			case Direction.Top:
				return "Вверх";
			case Direction.Right:
				return "Вправо";
			case Direction.Bottom:
				return "Вниз";
			case Direction.Left:
				return "Влево";
			default:
				break;
		}

		return "";
	}
}
