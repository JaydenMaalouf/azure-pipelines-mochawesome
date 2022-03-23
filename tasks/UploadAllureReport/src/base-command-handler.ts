
export abstract class BaseCommandHandler {
    public async init(): Promise<number> {
      let initCommand = new TerraformBaseCommandInitializer(
          "init",
          tasks.getInput("workingDirectory"),
          tasks.getInput("commandOptions")
      );
      
      let terraformTool;
      
      terraformTool = this.terraformToolHandler.createToolRunner(initCommand);
      this.handleBackend(terraformTool);
      
      return terraformTool.exec(<IExecOptions> {
          cwd: initCommand.workingDirectory
      });
  }
}