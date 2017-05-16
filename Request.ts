import * as http from "http";
import * as https from "https";
import { IAction } from "./IAction";
import { IRequestOptions } from "./IRequestOptions";

const gameId: number = 0;
const userId: number = 0;

const options: IRequestOptions = {
	headers: { "Content-Type": "application/json" },
	host: "mooped.net",
	method: "GET",
	path: "",
	port: 443
};

export class Request {
	public static send(action: IAction, callback: (result: string) => void): void {
		options.path = `/local/its/index.php?module=game&action=agentaction&gameid=${gameId}&userid=${userId}&act=${action.passive}%20${action.active}`;
		const request: http.ClientRequest = https.request(options, (result: http.IncomingMessage) => {
			let jsonResponseStr: string = "";
			result.on("data", (data: Buffer) => {
				jsonResponseStr += data;
			});
			result.on("end", () => callback(jsonResponseStr));
		});
		request.on("error", (e: Error) => {
			console.log(`Problem with request: ${e.message}`);
		});
		request.end();
	}

	public static check(jsonResponse: any): boolean {
		if (jsonResponse.text === null) {
			if (jsonResponse.error === "GAME OVER, AGENT IS DEAD") {
				console.log("Прости, создатель, Я умер...");

				return false;
			}
			if (jsonResponse.error === "GAME OVER, reached the limit of steps") {
				console.log("Прости, создатель, Я превысил ограничение в кол-ве ходов...");

				return false;
			}
			console.log(`Ошибка: ${jsonResponse.error}`);
			console.log(`Тип ошибки: ${jsonResponse.error_type}`);

			return false;
		}

		return true;
	}

	public static ConsoleLogInfo(): void {
		console.log(`User Id: ${userId}`);
		console.log(`Game Id: ${gameId}`);
	}
}
