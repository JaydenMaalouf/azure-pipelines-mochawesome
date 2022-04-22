"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MochawesomeGenerator = void 0;
const fs = require("fs");
const path = require("path");
const task = require("azure-pipelines-task-lib/task");
const jssoup_1 = require("jssoup");
class MochawesomeGenerator {
    constructor(workingDirectory, outputDirectory) {
        this.required_files = ["default.html", "default.json"];
        this.default_content_type = "text/plain;charset=UTF-8";
        this.base64_extensions = ["png", "jpeg", "jpg", "gif", "html", "htm"];
        this.content_types = {
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
        this.workingDirectory = workingDirectory;
        this.outputDirectory = outputDirectory;
        this.allowed_extensions = Object.keys(this.content_types);
    }
    init() {
        this.required_files.forEach((file) => {
            let fullPath = path.join(this.workingDirectory, file);
            try {
                task.stats(fullPath);
                console.log("File exists.");
            }
            catch (e) {
                throw `ERROR: File ${fullPath} doesnt exists, but it should!`;
            }
        });
    }
    generate() {
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
        let indexPath = path.join(this.workingDirectory, "default.html");
        let htmlContent = fs.readFileSync(indexPath, "utf-8");
        if (!htmlContent.includes("sinon.js")) {
            task.debug("> Patching default.html file to make it use sinon.js and server.js");
            htmlContent = htmlContent.replace(`<script src="app.js"></script>`, `<script src="sinon.js"></script><script src="server.js"></script><script src="app.js"></script>`);
            task.debug("> Saving patched default.html file, so It can be opened without --allow-file-access-from-files");
            task.writeFile(indexPath, htmlContent);
        }
        else {
            task.debug("> Skipping patching of default.html as it's already patched");
        }
        task.debug("> Parsing default.html");
        let soup = new jssoup_1.default(htmlContent);
        task.debug("> Filling script tags with real files contents");
        let scriptTags = soup.findAll("script");
        scriptTags.forEach((tag) => {
            if (tag.attrs.src) {
                task.debug(`Hey, a script! (${tag})`);
                let filePath = path.join(this.workingDirectory, tag.attrs.src);
                task.debug(`...${tag}${filePath}`);
                let fileContent = fs.readFileSync(filePath, "utf-8");
                let tagSoup = new jssoup_1.default("<script></script>");
                let fullScriptTag = tagSoup.nextElement;
                fullScriptTag.insert(0, fileContent);
                tag.replaceWith(fullScriptTag);
            }
        });
        task.debug("Done filling script tags.");
        task.debug("> Replacing link tags with style tags with real file contents");
        let linkTags = soup.findAll("link");
        linkTags.forEach((tag) => {
            if (tag.attrs.rel == "stylesheet" && tag.attrs.href) {
                task.debug(`Hey, a link! (${tag})`);
                let filePath = path.join(this.workingDirectory, tag.attrs.href);
                task.debug(`...${tag}${filePath}`);
                let fileContent = fs.readFileSync(filePath, "utf-8");
                let tagSoup = new jssoup_1.default("<style></style>");
                let fullScriptTag = tagSoup.nextElement;
                fullScriptTag.insert(0, fileContent);
                tag.replaceWith(fullScriptTag);
            }
            else {
                task.debug(`Apparently not a link (${tag})`);
            }
        });
        task.debug("Done filling link tags.");
        task.writeFile(this.outputDirectory, soup.prettify());
        task.debug(`> Saving result as ${this.outputDirectory}`);
        let outputStats = task.stats(this.outputDirectory);
        task.debug(`Done. Complete file size is:${outputStats.size}`);
        return this.outputDirectory;
    }
    generateServerJs(serverJsPath, data) {
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
          /<img[^>]*src="(?<url>[^"]*)"\\/?>/,
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
            let content;
            if (b64) {
                let rawContent = Buffer.from(element.content).toString("utf-8");
                content = `data:${element.mime};base64, ${rawContent}`;
            }
            else {
                content = element.content
                    .replace(/\\/g, "\\\\")
                    .replace(/"/g, '\\"')
                    .replace(/\s/g, "");
            }
            fs.appendFileSync(serverJsPath, ` "${url}": "${content}", \n`);
        });
        fs.appendFileSync(serverJsPath, "};\n");
        fs.appendFileSync(serverJsPath, "\nvar server = sinon.fakeServer.create();\n");
        data.forEach((element) => {
            let url = element.url;
            let contentType = element.mime;
            fs.appendFileSync(serverJsPath, `\nserver.respondWith("GET", "${url}", [
          200, { "Content-Type": "${contentType}" }, server_data["${url}"],
        ]);`);
        });
        fs.appendFileSync(serverJsPath, "server.autoRespond = true;");
    }
    generateDataArray() {
        let data = [];
        task.debug("Generation started.");
        let files = this.getAllFiles(this.workingDirectory);
        if (files) {
            files.forEach((file) => {
                var _a;
                let dirName = path.dirname(file);
                task.debug(`dirName = ${dirName}`);
                if (path.dirname(file) == this.workingDirectory) {
                    return;
                }
                task.debug(`file = ${file}`);
                let relativeFile = path.relative(this.workingDirectory, file);
                task.debug(`relativeFile = ${relativeFile}`);
                let fileExtension = path.extname(file).replace(".", "");
                task.debug(`File Extension: ${fileExtension}`);
                if (!this.allowed_extensions.includes(fileExtension)) {
                    task.debug(`WARNING: Unsupported extension: ${fileExtension} (file: ${relativeFile}) skipping (supported are: ${this.allowed_extensions.join(", ")}`);
                    return;
                }
                let content;
                let mime = (_a = this.content_types[fileExtension]) !== null && _a !== void 0 ? _a : this.default_content_type;
                task.debug(`mime = ${mime}`);
                let isBinaryFile = this.base64_extensions.includes(fileExtension);
                task.debug(`isBinaryFile = ${isBinaryFile}`);
                if (isBinaryFile) {
                    let fileContent = fs.readFileSync(file);
                    content = Buffer.from(fileContent).toString("base64");
                }
                else {
                    let fileContent = fs.readFileSync(file, "utf-8");
                    content = fileContent;
                }
                data.push(new DataFile(relativeFile.replace(/\\/g, "/"), mime, content, isBinaryFile));
            });
        }
        return data;
    }
    getAllFiles(dirPath, arrayOfFiles) {
        let files = fs.readdirSync(dirPath);
        arrayOfFiles = arrayOfFiles || [];
        files.forEach((file) => {
            if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
                arrayOfFiles = this.getAllFiles(dirPath + "/" + file, arrayOfFiles);
            }
            else {
                arrayOfFiles.push(path.join(dirPath, file));
            }
        });
        return arrayOfFiles;
    }
}
exports.MochawesomeGenerator = MochawesomeGenerator;
class DataFile {
    constructor(url, mime, content, base64) {
        this.url = url;
        this.mime = mime;
        this.content = content;
        this.base64 = base64;
    }
}
