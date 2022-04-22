"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const task = require("azure-pipelines-task-lib/task");
const task_1 = require("azure-pipelines-task-lib/task");
const toolrunner_1 = require("azure-pipelines-task-lib/toolrunner");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let npmPath;
            try {
                npmPath = task.which("npm", true);
            }
            catch (err) {
                throw "NPM not found.";
            }
            const npmRunner = new toolrunner_1.ToolRunner(npmPath);
            npmRunner.arg(["install", "-g", "mochawesome", "mochawesome-report-generator"]);
            const result = yield npmRunner.exec();
            if (result == 0) {
                task.setResult(task_1.TaskResult.Succeeded, "Successfully installed mochawesome");
                return;
            }
            throw `Tool installation failed with Exit Code: ${result}`;
        }
        catch (error) {
            task.setResult(task_1.TaskResult.Failed, error);
        }
    });
}
run();
