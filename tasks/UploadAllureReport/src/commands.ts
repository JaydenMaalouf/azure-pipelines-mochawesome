export class AllureCommand {
  public readonly name: string;
  public readonly workingDirectory: string;
  public readonly additionalArgs: string | undefined;

  constructor(
      name: string,
      workingDirectory: string,
      additionalArgs?: string | undefined
  ) {
      this.name = name;
      this.workingDirectory = workingDirectory;  
      this.additionalArgs = additionalArgs;
  } 
}