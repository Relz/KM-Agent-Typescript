import { Actions } from "./Actions";
import { Agent } from "./Agent";
import { IAction } from "./IAction";
import { ICave } from "./ICave";
import { Map } from "./Map";
import { Parser } from "./Parser";
import { Request } from "./Request";
import { World } from "./World";

const action: IAction = {
	active: Actions.active.noAction,
	passive: Actions.passive.noAction
};

Request.send(action, (jsonResponseStr: string) => {
	const jsonResponse: any = JSON.parse(jsonResponseStr);
	if (!Request.check(jsonResponse)) {
		console.log("Игра не существует.");
		return;
	}
	const currentCave: ICave = Parser.parseCave(jsonResponse.text.currentcave);
	const world: World = new World();
	const map: Map = new Map(world);
	const agent: Agent = new Agent(map);
	agent.deserialize(jsonResponse.text.iagent);
	map.updateCave(agent.row, agent.col, currentCave);
	agent.makeTurn();
});
