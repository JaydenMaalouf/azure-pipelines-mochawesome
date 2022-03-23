import * as React from "react"
import * as ReactDOM from "react-dom"
import * as SDK from "azure-devops-extension-sdk";
import { Attachment, Build, BuildRestClient } from "azure-devops-extension-api/Build";
import { getClient } from "azure-devops-extension-api";

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
    };
  } catch (error) {
    console.log(error);
  }
});

function displayReports(attachmentClient: BuildAttachmentClient) {
  console.log("ready");
}

class BuildAttachmentClient {
  private build: Build;
  private authHeaders: Object = undefined;

  constructor(build: Build) {
    this.build = build;
  }

  // private async getAuthHeaders(): Promise<Object> {
  //   if (this.authHeaders === undefined) {
  //     console.log('Get access token')
  //     const accessToken = await SDK.getAccessToken()
  //     const b64encodedAuth = Buffer.from(':' + accessToken).toString('base64')
  //     this.authHeaders = { headers: {'Authorization': 'Basic ' + b64encodedAuth} }
  //   }
  //   return this.authHeaders
  // }

  public async init() {
    console.log("Get attachment list");
    const buildClient: BuildRestClient = getClient(BuildRestClient);
    let attachments: Attachment[] = await buildClient.getAttachments(
      this.build.project.id,
      this.build.id,
      "allure.report"
    );
    
    console.log(attachments);
  }

  private async getAuthHeaders(): Promise<Object> {
    if (this.authHeaders === undefined) {
      console.log('Get access token')
      const accessToken = await SDK.getAccessToken()
      const b64encodedAuth = Buffer.from(':' + accessToken).toString('base64')
      this.authHeaders = { headers: {'Authorization': 'Basic ' + b64encodedAuth} }
    }
    return this.authHeaders
  }

  public async downloadAttachment(attachment: Attachment): Promise<string> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(attachment._links.self.href, headers);
    if (!response.ok) {
      throw new Error(response.statusText)
    }
    return await response.text()
  }
}
