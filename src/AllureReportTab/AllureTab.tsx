import * as React from "react";

export interface IAllureTabState {
  htmlContent: string;
}

export class AllureTab extends React.Component<IAllureTabState> {
  private htmlContent = "<b>Loading...</b>";

  constructor(props: IAllureTabState) {
    super(props);

    this.htmlContent = props.htmlContent;
    console.log("set the indexAttachment");
    console.log(this.htmlContent);
  }

  public render(): JSX.Element {
    return (
      <div
        className="Container"
        dangerouslySetInnerHTML={{ __html: this.htmlContent }}
      ></div>
    );
  }
}
