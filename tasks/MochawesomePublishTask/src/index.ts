import task = require("azure-pipelines-task-lib/task");
import { TaskResult, FindOptions } from "azure-pipelines-task-lib/task";
import { MochawesomeGenerator } from "./generator";

async function run() {
  const reportDirectory = task.getPathInput("reportDirectory");
  const outputDirectory = task.getPathInput("outputDirectory");
  if (outputDirectory) {
    const mochGen = new MochawesomeGenerator(reportDirectory, outputDirectory);
    task.debug("Generating output");
    const outputFile = mochGen.generate();
    console.log(`Output file generated: ${outputFile}`);
    task.addAttachment("mochawesome.report", "index.html", outputFile);
  }

  const shouldPublish = task.getBoolInput("publishResults");
  if (shouldPublish) {
    console.log(`Publishing test results`);
    const testReporter = task.getInput("testReporter");
    const testPublisher = new task.TestPublisher(testReporter);

    const testRunTitle = task.getInput("runTitle");
    const testResultFilesFilter = task.getInput("resultFilesFilter");
    const testResultsDirectory = task.getPathInput("testResultsDirectory");

    const findOptions = <FindOptions>{
      allowBrokenSymbolicLinks: true,
      followSpecifiedSymbolicLink: true,
      followSymbolicLinks: true,
    };
    const matchingTestResultsFiles = task.findMatch(
      testResultsDirectory,
      testResultFilesFilter,
      findOptions
    );
    testPublisher.publish(matchingTestResultsFiles, "true", "", "", testRunTitle, "true");
  }
}

run()
  .then(() => {
    task.setResult(TaskResult.Succeeded, "Mochawesome Report Generated Successfully");
  })
  .catch((error) => {
    task.setResult(TaskResult.Failed, error);
  });
