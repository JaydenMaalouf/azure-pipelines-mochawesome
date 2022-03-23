import task = require("azure-pipelines-task-lib/task");
import { TaskResult } from "azure-pipelines-task-lib/task";
import { ToolRunner, IExecOptions } from "azure-pipelines-task-lib/toolrunner";

async function run() {
  try {
    const npmRunner = new ToolRunner("npm");
    npmRunner.arg(["install", "-g", "allure-commandline"]);

    const result = await npmRunner.exec();
    if (result == 0)
    {
      task.setResult(TaskResult.Succeeded, "");
      return;
    }

    throw `Tool installation failed with Exit Code: ${result}`;
  } catch (error) {
    task.setResult(TaskResult.Failed, error);
  }
}

run();
