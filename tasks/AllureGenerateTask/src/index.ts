import task = require("azure-pipelines-task-lib/task");
import fs = require("fs");
import path = require("path");
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
      const files = getAllFiles(outputDirectory);
      files.forEach((file) => {
        const relativeFile = path.relative(outputDirectory, file)
        const b64EncodedFile = Buffer.from(relativeFile).toString('base64')
        task.addAttachment("allure.report", b64EncodedFile, file);
      });
    }

    task.setResult(TaskResult.Succeeded, "");
  } catch (error) {
    task.setResult(TaskResult.Failed, error);
  }
}

function getAllFiles (dirPath: string, arrayOfFiles?: string[]) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
};

run();
