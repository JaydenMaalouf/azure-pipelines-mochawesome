import task = require("azure-pipelines-task-lib/task");
import { TaskResult } from "azure-pipelines-task-lib/task";
import { IExecOptions } from "azure-pipelines-task-lib/toolrunner";

async function run() {
  try {
    let allurePath: string;
    try {
      allurePath = task.which("allure", true);
    } catch (err) {
      throw "Allure Commandline not found.";
    }

    let allureTool = task.tool(allurePath);
    allureTool.arg(["generate", "-o", task.getInput("outputDirectory")]);

    let result = await allureTool.exec(<IExecOptions>{
      cwd: task.getInput("workingDirectory"),
    });
    if (result == 0) {
      task.setResult(TaskResult.Succeeded, "");
      return;
    }

    throw `Allure Generation failed with Exit Code: ${result}`;
  } catch (error) {
    task.setResult(task.TaskResult.Failed, error);
  }
}

run();
