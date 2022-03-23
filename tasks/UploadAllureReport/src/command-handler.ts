import task = require("azure-pipelines-task-lib/task");
import { AllureCommand } from "./commands";
import { AllureToolHandler, IAllureToolHandler } from "./allure";
import {
  ToolRunner,
  IExecOptions,
  IExecSyncOptions,
  IExecSyncResult,
} from "azure-pipelines-task-lib/toolrunner";

export class CommandHandler {
  allureToolHandler: IAllureToolHandler;

  constructor() {
    this.allureToolHandler = new AllureToolHandler();
  }

  public async execute(command: string): Promise<number> {
    return await this[command]();
  }

  public async init(): Promise<number> {
    let initCommand = new AllureCommand(
      "init",
      task.getInput("workingDirectory"),
      task.getInput("commandOptions")
    );

    let allureTool = this.allureToolHandler.createToolRunner(initCommand);

    return allureTool.exec(<IExecOptions>{
      cwd: initCommand.workingDirectory,
    });
  }
}
