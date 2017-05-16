export class Actions {
	public static passive: IPassiveAction = {
		noAction: "noAct",
		turn: {
			around: "upSideDn",
			left: "onLeft",
			right: "onRight"
		}
	};
	public static active: IActiveAction = {
		go: "Go",
		noAction: "noAct",
		shoot: "Shoot",
		takeGold: "Take"
	};
}

export interface IPassiveAction {
	turn: ITurn;
	noAction: string;
}

export interface IActiveAction {
	noAction: string;
	go: string;
	shoot: string;
	takeGold: string;
}

interface ITurn {
	left: string;
	right: string;
	around: string;
}
