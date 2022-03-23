import task = require("azure-pipelines-task-lib/task");
import fs = require("fs");
import path = require("path");
import { TaskResult } from "azure-pipelines-task-lib/task";
import { IExecOptions } from "azure-pipelines-task-lib/toolrunner";
import { stringify } from "querystring";

async function run() {
  try {
    let allurePath: string;
    try {
      allurePath = task.which("allure", true);
    } catch (err) {
      throw "Allure Commandline not found.";
    }

    let allureTool = task.tool(allurePath);
    let outputDirectory = task.getInput("outputDirectory");
    allureTool.arg(["generate"]);
    allureTool.argIf(outputDirectory, ["-o", outputDirectory]);

    let workingDirectory = task.getInput("workingDirectory");
    let result = await allureTool.exec(<IExecOptions>{
      cwd: workingDirectory,
    });
    if (result != 0) {
      throw `Allure Generation failed with Exit Code: ${result}`;
    }

    if (outputDirectory) {
      let files = getAllFiles(outputDirectory);
      files.forEach((file) => {
        task.addAttachment("allure.report", "output", file);
      });
    }
  } catch (error) {
    task.setResult(task.TaskResult.Failed, error);
  }
}

function getAllFiles (dirPath: string, arrayOfFiles?: string[]) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
    }
  });

  return arrayOfFiles;
};

run();
