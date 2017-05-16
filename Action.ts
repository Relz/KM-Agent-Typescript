import { IAction } from "./IAction";

export class Action implements IAction {
	private _passive: string;
	public get passive(): string {
		return this._passive;
	}

	public set passive(value: string) {
		this._passive = value;
	}

	private _active: string;
	public get active(): string {
		return this._active;
	}

	public set active(value: string) {
		this._active = value;
	}
}
