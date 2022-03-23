import { ToolRunner } from "azure-pipelines-task-lib/toolrunner";
import task = require("azure-pipelines-task-lib/task");
import { AllureCommand } from "./commands";

export class AllureToolRunner {
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
