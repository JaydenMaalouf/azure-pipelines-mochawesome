import * as React from "react";
import * as ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import { Attachment, Build, BuildRestClient } from "azure-devops-extension-api/Build";
import { getClient } from "azure-devops-extension-api";
import { AllureTab } from "./AllureTab";

SDK.init();
SDK.ready().then(() => {
  try {
    const config = SDK.getConfiguration();
    if (typeof config.onBuildChanged === "function") {
      config.onBuildChanged(async (build: Build) => {
        let buildAttachmentClient = new BuildAttachmentClient(build);
        buildAttachmentClient
          .init()
          .then(() => {
            displayReports(buildAttachmentClient);
          })
          .catch((error) => {
            console.log(error);
          });
      });
    }
  } catch (error) {
    console.log(error);
  }
});

function displayReports(attachmentClient: BuildAttachmentClient) {
  console.log("fetching attachments");
  let attachments = attachmentClient.fetchAttachments();
  console.log(attachments);
  console.log("finding index.hmtl");
  let indexAttachment = attachments.find(x => x.name == "aW5kZXguaHRtbA==.html");
  console.log(indexAttachment);
  console.log("ready");
  console.log("downloading content");
  attachmentClient.downloadAttachment(indexAttachment).then((content) => {
    console.log(content);
  
    ReactDOM.render(
      <AllureTab htmlContent={content} />,
      document.getElementById("allure-extension-container")
    );
    document.getElementById("allure-extension-message").style.display = "none";
  });
}

class BuildAttachmentClient {
  private build: Build;
  private authHeaders: Object = undefined;
  public attachments: Attachment[] = undefined;

  constructor(build: Build) {
    this.build = build;
  }

  public async init(){
    this.attachments = await this.getAttachments();
  }

  private async getAttachments() {
    console.log("Get attachment list");
    const buildClient: BuildRestClient = getClient(BuildRestClient);
    return await buildClient.getAttachments(
      this.build.project.id,
      this.build.id,
      "allure.report"
    );
  }

  public fetchAttachments() {
    if (this.attachments == undefined) {
      this.getAttachments().then((attachments) => {
        this.attachments = attachments;
      });
    }

    return this.attachments;
  }

  private async getAuthHeaders(): Promise<Object> {
    if (this.authHeaders === undefined) {
      console.log("Get access token");
      const accessToken = await SDK.getAccessToken();
      const b64encodedAuth = Buffer.from(":" + accessToken).toString("base64");
      this.authHeaders = {
        headers: { Authorization: "Basic " + b64encodedAuth },
      };
    }
    return this.authHeaders;
  }
  
  public async downloadAttachment(attachment: Attachment): Promise<string> {
    const headers = await this.getAuthHeaders();
    console.log("downloading:");
    console.log(attachment);
    const response = await fetch(attachment._links.self.href, headers);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  
    console.log("repsonse");
    console.log(response);
    return await response.text();
  }
}
