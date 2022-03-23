import task = require("azure-pipelines-task-lib/task");
import { ToolRunner } from "azure-pipelines-task-lib/toolrunner";
import { AllureCommand } from "./commands";

export interface IAllureToolHandler {
  createToolRunner(command?: AllureCommand): ToolRunner;
}

export class AllureToolHandler implements IAllureToolHandler {
  public createToolRunner(command?: AllureCommand): ToolRunner {
    let allurePath;
    try {
      allurePath = task.which("allure", true);
    } catch (err) {
      throw new Error("Allure CLI not found.");
    }

    let allureToolRunner: ToolRunner = task.tool(allurePath);
    if (command) 
    {
      allureToolRunner.arg(command.name);
      if (command.additionalArgs) 
      {
        allureToolRunner.line(command.additionalArgs);
      }
    }

    return allureToolRunner;
  }
}
