import task = require("azure-pipelines-task-lib/task");
import { CommandHandler } from "./command-handler";

async function run() {
  let commandHandler = new CommandHandler();
  try {
    let command = task.getInput("command");
    if (command == undefined) {
      throw "Bad Input Command";
    }

    let result = await commandHandler.execute(command);
    task.setResult(task.TaskResult.Succeeded, "");
  } catch (error) {
    task.setResult(task.TaskResult.Failed, error);
  }
}

run();
