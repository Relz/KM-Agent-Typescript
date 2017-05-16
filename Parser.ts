import { Cave } from "./Cave";
import { ICave } from "./ICave";

export class Parser {
	public static parseCave(currentCaveJson: any): ICave {
		const cave: ICave = new Cave();
		cave.isVisible = currentCaveJson.isVisiable;
		cave.hasGold = currentCaveJson.isGold;
		cave.probability.monster = (currentCaveJson.isMonster) ? 1 : 0;
		cave.probability.hole = (currentCaveJson.isHole) ? 1 : 0;
		cave.hasWind = currentCaveJson.isWind;
		cave.hasBones = currentCaveJson.isBones;

		return cave;
	}
}
