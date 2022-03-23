import task = require("azure-pipelines-task-lib/task");
import { AllureCommand } from "./commands";
import { AllureToolHandler, IAllureToolHandler } from "./allure";
import { IExecOptions } from "azure-pipelines-task-lib/toolrunner";

export class CommandHandler {
  allureToolHandler: IAllureToolHandler;

  constructor() {
    this.allureToolHandler = new AllureToolHandler();
  }

  public async execute(command: string): Promise<number> {
    return await this[command]();
  }

  public async generate(): Promise<number> {
    let initCommand = new AllureCommand(
      "generate",
      task.getInput("workingDirectory"),
      task.getInput("commandOptions")
    );

    let allureTool = this.allureToolHandler.createToolRunner(initCommand);

    return allureTool.exec(<IExecOptions>{
      cwd: initCommand.workingDirectory,
    });
  }
}
