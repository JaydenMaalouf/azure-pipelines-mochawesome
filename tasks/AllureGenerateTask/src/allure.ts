import fs = require("fs");
import path = require("path");
import task = require("azure-pipelines-task-lib/task");
import JSSoup from 'jssoup'; 

export class AllureGenerator {
  private workingDirectory: string;
  private outputDirectory: string;
  private required_files = ["index.html", "app.js", "styles.css"];
  private default_content_type = "text/plain;charset=UTF-8";
  private base64_extensions = ["png", "jpeg", "jpg", "gif", "html", "htm"];
  private content_types = {
    txt: "text/plain;charset=UTF-8",
    js: "application/javascript",
    json: "application/json",
    csv: "text/csv",
    css: "text/css",
    html: "text/html",
    htm: "text/html",
    png: "image/png",
    jpeg: "image/jpeg",
    jpg: "image/jpg",
    gif: "image/gif",
  };
  private allowed_extensions: string[];

  constructor(workingDirectory: string, outputDirectory: string) {
    this.workingDirectory = workingDirectory;
    this.outputDirectory = outputDirectory;
    this.allowed_extensions = Object.keys(this.content_types);
  }

  public init() {
    this.required_files.forEach((file) => {
      let fullPath = path.join(this.workingDirectory, file);
      try {
        task.stats(fullPath);
        console.log("File exists.");
      } catch (e) {
        throw `ERROR: File ${fullPath} doesnt exists, but it should!`;
      }
    });
  }

  public generate(): string {
    let data = this.generateDataArray();
    task.debug(`Found ${data.length} data files`);
    task.debug("> Building server.js file...");
    let serverJsPath = path.join(this.workingDirectory, "server.js");
    this.generateServerJs(serverJsPath, data);
    let serverJsStats = task.stats(serverJsPath);
    task.debug(`The server.js is built! Size is: ${serverJsStats.size} bytes`);

    task.debug("> Copying file sinon.js into folder...");
    let sinonOutputPath = path.join(this.workingDirectory, "sinon.js");
    task.cp(path.join(__dirname, "sinon.js"), sinonOutputPath);
    task.debug("The sinon.js has been copied");

    let indexPath = path.join(this.workingDirectory, "index.html");
    let htmlContent = fs.readFileSync(indexPath, "utf-8");
    if (!htmlContent.includes("sinon.js")) {
      task.debug(
        "> Patching index.html file to make it use sinon.js and server.js"
      );
      htmlContent = htmlContent.replace(
        `<script src="app.js"></script>`,
        `<script src="sinon.js"></script><script src="server.js"></script><script src="app.js"></script>`
      );
      task.debug(
        "> Saving patched index.html file, so It can be opened without --allow-file-access-from-files"
      );
      task.writeFile(indexPath, htmlContent);
    } else {
      task.debug("> Skipping patching of index.html as it's already patched");
    }

    task.debug("> Parsing index.html");
    let soup = new JSSoup(htmlContent);

    task.debug("> Filling script tags with real files contents");
    let scriptTags = soup.findAll("script");
    scriptTags.forEach((tag) => {
      task.debug(`Hey, a script! (${tag})`);
      let filePath = path.join(this.workingDirectory, tag.attrs.src);
      task.debug(`...${tag}${filePath}`);
      let fileContent = fs.readFileSync(filePath, "utf-8");
      let tagSoup = new JSSoup("<script></script>");
      let fullScriptTag = tagSoup.nextElement;
      fullScriptTag.insert(0, fileContent);
      tag.replaceWith(fullScriptTag);
    });
    task.debug("Done filling script tags.");

    task.debug("> Replacing link tags with style tags with real file contents");
    let linkTags = soup.findAll("link");
    linkTags.forEach((tag) => {
      if (tag.attrs.rel == "stylesheet") {
        task.debug(`Hey, a link! (${tag})`);
        let filePath = path.join(this.workingDirectory, tag.attrs.href);
        task.debug(`...${tag}${filePath}`);
        let fileContent = fs.readFileSync(filePath, "utf-8");
        let tagSoup = new JSSoup("<style></style>");
        let fullScriptTag = tagSoup.nextElement;
        fullScriptTag.insert(0, fileContent);
        tag.replaceWith(fullScriptTag);
      } else {
        task.debug(`Apparently not a link (${tag})`);
      }
    });
    task.debug("Done filling link tags.");

    let outputPath = path.join(this.outputDirectory, "complete.html");
    task.writeFile(outputPath, soup.prettify());
    task.debug(`> Saving result as ${outputPath}`);

    let outputStats = task.stats(outputPath);
    task.debug(`Done. Complete file size is:${outputStats.size}`);
    return outputPath;
  }

  private generateServerJs(serverJsPath: string, data: any[]) {
    let serverJsContent = `
    function _base64ToArrayBuffer(base64) {
      var binary_string = window.atob(base64);
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    }
    
    function _arrayBufferToBase64(buffer) {
      var binary = "";
      var bytes = new Uint8Array(buffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    }
    
    document.addEventListener("DOMContentLoaded", function () {
      var old_prefilter = jQuery.htmlPrefilter;
    
      jQuery.htmlPrefilter = function (v) {
        var regs = [
          /<a[^>]*href="(?<url>[^"]*)"[^>]*>/,
          /<img[^>]*src="(?<url>[^"]*)"\/?>/,
        ];
    
        for (i in regs) {
          reg = regs[i];
          m = reg.exec(v);
          if (m) {
            if (m["groups"] && m["groups"]["url"]) {
              var url = m["groups"]["url"];
              if (server_data.hasOwnProperty(url)) {
                v = v.replace(url, server_data[url]);
              }
            }
          }
        }
    
        return old_prefilter(v);
      };
    });`;

    fs.appendFileSync(serverJsPath, serverJsContent);
    fs.appendFileSync(serverJsPath, "var server_data={\n");
    data.forEach((element) => {
      let url = element.url;
      let b64 = element.base64;
      let content: string;
      if (b64) {
        let rawContent = Buffer.from(element.content).toString("utf-8");
        content = `data:${element.mime};base64, ${rawContent}`;
      } else {
        content = element.content
          .replace("\\", "\\\\")
          .replace('"', '\\"')
          .replace("\n", "\\n");
      }
      fs.appendFileSync(serverJsPath, ` "${url}": "${content}", \n`);
    });
    fs.appendFileSync(serverJsPath, "};\n");
    fs.appendFileSync(serverJsPath, "    var server = sinon.fakeServer.create();\n");
    data.forEach((element) => {
      let url = element.url;
      let contentType = element.mime;
      fs.appendFileSync(serverJsPath, `
        server.respondWith("GET", "{url}", [
              200, { "Content-Type": "${contentType}" }, server_data["${url}"],
        ]);
      `);
    });

    fs.appendFileSync(serverJsPath, "server.autoRespond = true;");
  }

  private generateDataArray(): DataFile[] {
    let data: DataFile[] = [];
    task.debug("Generation started.");
    let files = this.getAllFiles(this.workingDirectory);
    if (files) {
      files.forEach((file) => {
        task.debug(`File: ${file}`);
        let fileExtension = path.extname(file).replace(".", "");
        task.debug(`File Extension: ${fileExtension}`);
        if (!this.allowed_extensions.includes(fileExtension)) {
          task.warning(
            `WARNING: Unsupported extension: ${fileExtension} (file: ${file}) skipping (supported are: ${this.allowed_extensions.join(
              ", "
            )}`
          );
          return;
        }

        let content: string;
        let mime =
          this.content_types[fileExtension] ?? this.default_content_type;
        let isBinaryFile = this.base64_extensions.includes(fileExtension);
        if (isBinaryFile) {
          let fileContent = fs.readFileSync(file);
          content = Buffer.from(fileContent).toString("base64");
        } else {
          let fileContent = fs.readFileSync(file, "utf-8");
          content = fileContent;
        }

        data.push(new DataFile(file, mime, content, isBinaryFile));
      });
    }
    return data;
  }

  private getAllFiles(dirPath: string, arrayOfFiles?: string[]) {
    let files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach((file) => {
      if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
        arrayOfFiles = this.getAllFiles(dirPath + "/" + file, arrayOfFiles);
      } else {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    });

    return arrayOfFiles;
  }
}

class DataFile {
  public url: string;
  public mime: string;
  public content: string;
  public base64: boolean;

  constructor(url: string, mime: string, content: string, base64: boolean) {
    this.url = url;
    this.mime = mime;
    this.content = content;
    this.base64 = base64;
  }
}
