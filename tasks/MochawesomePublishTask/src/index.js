"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const task = require("azure-pipelines-task-lib/task");
const task_1 = require("azure-pipelines-task-lib/task");
const generator_1 = require("./generator");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const reportDirectory = task.getPathInput("reportDirectory");
        const outputDirectory = task.getPathInput("outputDirectory");
        if (outputDirectory) {
            const mochGen = new generator_1.MochawesomeGenerator(reportDirectory, outputDirectory);
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
            const findOptions = {
                allowBrokenSymbolicLinks: true,
                followSpecifiedSymbolicLink: true,
                followSymbolicLinks: true,
            };
            const matchingTestResultsFiles = task.findMatch(testResultsDirectory, testResultFilesFilter, findOptions);
            testPublisher.publish(matchingTestResultsFiles, "true", "", "", testRunTitle, "true");
        }
    });
}
run()
    .then(() => {
    task.setResult(task_1.TaskResult.Succeeded, "Mochawesome Report Generated Successfully");
})
    .catch((error) => {
    task.setResult(task_1.TaskResult.Failed, error);
});
