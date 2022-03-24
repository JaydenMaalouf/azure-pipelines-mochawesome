import task = require("azure-pipelines-task-lib/task");
import { TaskResult } from "azure-pipelines-task-lib/task";
import { IExecOptions } from "azure-pipelines-task-lib/toolrunner";
import { AllureGenerator } from "./allure";

async function run() {
  let allurePath: string;
  try {
    allurePath = task.which("allure", true);
  } catch (err) {
    throw "Allure Commandline not found.";
  }

  const allureTool = task.tool(allurePath);
  const outputDirectory = task.getInput("outputDirectory");
  allureTool.arg(["generate"]);
  allureTool.argIf(outputDirectory, ["-o", outputDirectory]);

  const workingDirectory = task.getInput("workingDirectory");
  const result = await allureTool.exec(<IExecOptions>{
    cwd: workingDirectory,
  });
  if (result != 0) {
    throw `Allure Generation failed with Exit Code: ${result}`;
  }

  if (outputDirectory) {
    let allureGen = new AllureGenerator(outputDirectory, workingDirectory);
    //TODO: set this to staging artifacts directory
    let outputFile = allureGen.generate();
    console.log(`Output file generated: ${outputFile}`);
    task.addAttachment("allure.report", "index.html", outputFile);
  }

  const shouldPublish = task.getBoolInput("publishResults");
  if (shouldPublish) {
    const testPublisher = new task.TestPublisher("Allure");
    //testPublisher.publish(outputDirectory, "true", "", "", "", "true");
  }
}

run().then(() => {
  task.setResult(TaskResult.Succeeded, "");
}).catch((error) =>  {
  task.setResult(TaskResult.Failed, error);
});
