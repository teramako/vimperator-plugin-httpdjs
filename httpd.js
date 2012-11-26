// vim: sw=2 ts=2 et fdm=marker foldlevel=1:
"use strict";

// == SEVER_CONFIG == {{{1
// =============================================================================
/** @namespace */
var SERVER_CONFIG = {
  port: 8090,
  autoStart: true,
  debug: false,
}; // 1}}}
// == PATH_HANDLERS == {{{1
// =============================================================================
/**
 * @namespace 
 * PATH: function (Request::request, Response::response) {}
 * or
 * PATH: {
 *   handle: function (Request::request, Response::response) {}
 * }
 */
var PATH_HANDLERS = {
  // PATH: /markdown {{{2
  "/markdown": {
    DIR: "markdown",
    currentTab: null,
    // Element::getTab () {{{3
    getTab: function markdown_getTab() {
      if (this.currentTab)
        return this.currentTab;

      var self = this;
      dumpn("[/markdown] open new tab " + this.URL);
      var tab = gBrowser.loadOneTab(this.URL, { inBackground: false });
      tab.addEventListener("TabClose", function onTabClose() {
        tab.removeEventListener("TabClose", onTabClose, false);
        self.currentTab = null;
      }, false);
      return this.currentTab = tab;
    }, // 3}}}
    // String::URL {{{3
    get URL () {
      var file = utils.getFileFromRoot([this.DIR, "markdown.html"]);
      var url = services.get("io").newFileURI(file).spec;
      delete this.URL;
      return this.URL = url;
    }, // 3}}}
    // MarkdownConverter::markdownConverter {{{3
    get markdownConverter() {
      var tmp = {},
          file = utils.getFileFromRoot([this.DIR, "pagedown", "Markdown.Converter.js"]);
      services.get("scriptloader").loadSubScript(services.get("io").newFileURI(file).spec, tmp);
      delete this.markdownConverter;
      return this.markdownConverter = new tmp.Markdown.Converter();
    }, // 3}}}
    // void::handle (Request::request, Response::response) {{{3
    handle: function handle_markdown (request, response) {
      var markdownHTML = "";
      var title = "httpd.js";
      switch (request.method) {
        case "POST": {
          dumpn("[/markdown] handle POST");
          let data = "";
          let query = new RequestQuery(request);
          let fileField = query.get("file", null);
          if (fileField)
            data = fileField.toString("UTF-8");

          if (data)
            markdownHTML = this.markdownConverter.makeHtml(data);

          let browser = this.getTab().linkedBrowser;
          let doc = browser.contentDocument;
          if (doc.readyState === "complete") {
            doc.body.innerHTML = markdownHTML;
          } else {
            browser.addEventListener("DOMContentLoaded", function onload() {
              browser.removeEventListener("DOMContentLoaded", onload, false);
              browser.contentDocument.body.innerHTML = markdownHTML;
            }, false);
          }
        }
        // DONT break;
        case "GET": {
          dumpn("[/markdown] handle GET");
          if (!this.currentTab)
            throw HTTP_404;

          let doc = this.currentTab.linkedBrowser.contentDocument;
          response.setStatusLine(request.httpVersion, 200, "OK");
          response.setHeader("Content-Type", "text/html", false);
          let body = [
            '<!DOCTYPE html>',
            '<html xmlns="http://www.w3.org/1999/xhtml">',
            '<head><meta charset="utf-8"/><title>' + title + '</title></head>',
            '<body>',
            markdownHTML || doc.body.innerHTML,
            '</body>',
            '</html>', ''
          ].join("\n");

          response.write(UnicodeConverter("UTF-8").ConvertFromUnicode(body));
        }
        break;
        case "DELETE": {
          response.setStatusLine(request.httpVersion, 202, "Accepted");
          if (this.currentTab) {
            gBrowser.removeTab(this.currentTab);
            this.currentTab = null;
          }
        }
        break;
        default:
          throw HTTP_404;
      }
      endTime = window.performance.now();
      dumpn("[/markdown] handled END");
    }, // 3}}}
  }, // 2}}}
  // PATH: /vimperator {{{2
  "/vimperator": {
    // String::evalScript (String::script, Boolean::isHTML) {{{3
    evalScript: function evalScript (script, isHTML) {
      try {
        var res = liberator.eval(script);
        return typeof res === "object" ?  util.objectToString(res, isHTML) : String(res);
      } catch (e) {
        return e.toString() + "\n\n" + e.stack;
      }
    }, // 3}}}
    // void::execCommand (String::command) {{{3
    execCommand: function execVimperatorCommand (command) {
      liberator.trapErrors(function() { liberator.execute(command); });
    }, // 3}}}
    // void::handle (Request::request, Response::response) {{{3
    handle: function handle_vimperator (request, response) {
      switch (request.method) {
        case "GET":
        case "POST":
          break;
        default:
          throw HTTP_404;
      }
      var query = new RequestQuery(request);
      var arg = query.getData("q", ""), // query
          type = query.getData("type", "js"); // exec type
      switch (type) {
        case "cmd":
          dumpn("[/vimperator] execute command: " + arg);
          response.setStatusLine("1.1", 204, "No Content");
          this.execCommand(arg);
          break;
        case "js": {
          dumpn("[/vimperator] execute javascript: " + arg);
          let text;
          let isHTML = (query.getData("ot", "text") === "html"); // output-type
          if (isHTML) {
            let title = util.escapeHTML(arg);
            text = ['<!DOCTYPE html>',
              '<html xmlns="http://www.w3.org/1999/xhtml">',
              '<head>',
              '  <mata charset="utf-8"/>',
              '  <title>' + title + '</title>',
              '</head>',
              '<body>',
              '<h1>' + title + '</h1>',
              '<pre>' + this.evalScript(arg, isHTML) + '</pre>',
              '</body>',
              '</html>'
            ].join("\n");
          } else {
            text = "Query: " + arg + "\n\n" + this.evalScript(arg, isHTML);
          }
          text = text.replace(/[\xA0]/g, " ");
          response.setStatusLine("1.1", 200, "OK");
          response.setHeader("Content-Type", (isHTML ? "text/html" : "text/plain") + "; charset=utf-8", false);
          response.write(UnicodeConverter("UTF-8").ConvertFromUnicode(text));
        }
        break;
        default:
          throw HTTP_404;
      }
    }, // 3}}}
  }, // 2}}}
};
// 1}}}
// == ERROR_HANDLERS == {{{1
// =============================================================================
/**
 * @namespace
 * HTTP_StatusCode: function (Request::request, Response::response)
 * or
 * HTTP_StatusCode: {
 *   handle: function (Request::request, Reponse::response)
 * }
 */
var ERROR_HANDLERS = {
};
// 1}}}

// == Request body parser == {{{1
// =============================================================================
var BinaryInputStream = CC("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream", "setInputStream");
var UnicodeConverter  = CC("@mozilla.org/intl/scriptableunicodeconverter", "nsIScriptableUnicodeConverter",
                           function (charset) { this.charset = charset; });

var CRLF = "\r\n";
// Class RequestQuery (Request::request) {{{2
/**
 * @Constructor
 * @param {Request} request
 */
function RequestQuery (request) {
  this.request = request;
  this.data = new window.Map;
  this.parse(request);
}
RequestQuery.prototype = {
  // void::parse ([Request::req]) {{{3
  parse: function RB_parse (req) {
    if (!req)
      req = this.request;

    var queryString = req.queryString,
        contentLength = req.hasHeader("Content-Length") ?
                        parseInt(req.getHeader("Content-Length"), 10) :
                        0,
        contentType;
    if (queryString)
      this._setFormURLEncoded(queryString);

    if (contentLength <= 0)
      return;
    if (!req.hasHeader("Content-Type"))
      throw HTTP_400;

    contentType = new HeaderValue("Content-Type", req.getHeader("Content-Type"));
    switch (contentType.value) {
      case "multipart/form-data": {
        let boundary = contentType.metadata.boundary;
        if (!boundary)
          throw HTTP_400;
        return this._setMultipartFormData(this._getInputData(contentLength), boundary);
      }
      case "application/x-www-form-urlencoded":
        return this._setFormURLEncoded(this._getInputData(contentLength));
      default:
        throw HTTP_400;
    }
  }, // 3}}}
  // String::getData (any::key [, any::defaultValue]) {{{3
  getData: function RB_getData (key, defaultValue) {
    return this.data.has(key) ? this.data.get(key).data : defaultValue;
  }, // 3}}}
  // any::get (any::key [, any:defaultValue]) {{{3
  get: function RB_get (key, defaultValue) {
    return this.data.has(key) ? this.data.get(key) : null;
  }, // 3}}}
  // void::set (any::key,  any:defaultValue) {{{3
  set: function RB_set (key, value) {
    return this.data.set(key, value);
  }, // 3}}}
  // Boolean::has (any::key) {{{3
  has: function RB_has (key) {
    return this.data.has(key);
  }, // 3}}}
  // Boolean::delete (any::key) {{{3
  delete: function RB_delete(key) {
    return this.data.delete(key);
  }, // 3}}}
  // Number::getter length {{{3
  get length () {
    return this.data.size();
  }, // 3}}}
  // Iterator::iterator () {{{3
  iterator: function () {
    return this.m.iterator();
  }, // 3}}}
  // String::_getInputData ([Number::count]) {{{3
  _getInputData: function RB__getInputData (count) {
    var input = this.request.bodyInputStream,
        bis;
    try {
      bis = BinaryInputStream(input);
      if (count == null)
        length = bis.available();

      return (count > 0) ? bis.readBytes(count) : "";
    } catch (e) {
      throw e;
    } finally {
      bis.close();
    }
  }, // 3}}}
  // Map::_setMultipartFormData (String:buffer, String::boundary) {{{3
  _setMultipartFormData: function RB__setMultipartFormData(buffer, boundary) {
    var currentField,
        index = 0;
    boundary = "--" + boundary;
    const len = boundary.length;

    while (true) {
      // START
      let index = buffer.indexOf(boundary);
      if (index !== 0 ||
          buffer.substr(len, 2) === "--")
        break;

      buffer = buffer.substr(len + 2);
      currentField = new RequestBodyField(true);
      // HEADER
      index = buffer.indexOf(CRLF + CRLF);
      currentField.setHeaders(buffer.substr(0, index).split(CRLF));
      if (currentField.name) {
        this.data.set(currentField.name, currentField);
      } else {
        this.data.set(index++, currentField);
      }
      buffer = buffer.substr(index + 4);
      // BODY
      index = buffer.indexOf(CRLF + boundary);
      currentField.data = buffer.substr(0, index);
      buffer = buffer.substr(index + 2);
      // CHECK END
      if (buffer.startsWith(boundary + "--")) {
        break;
      }
    }
    return this.data;
  }, // 3}}}
  // Map::_setFormURLEncoded (String::buffer) {{{3
  _setFormURLEncoded: function RB__setFormURLEncoded(buffer) {
    for (let keyValue of buffer.split("&")) {
      let pos = keyValue.indexOf("=");
      if (pos === -1)
        this.data.set(keyValue, new RequestBodyField(false, keyValue));
      else {
        let key = keyValue.substr(0, pos),
            value = keyValue.substr(pos + 1);
        this.data.set(key, new RequestBodyField(false, key, value));
      }
    }
    return this.data;
  }, // 3}}}
}; // 2}}}
// Class HeaderValue (String::name, String::data) {{{2
/**
 * @Constructor
 * @param {String} name
 * @param {String} data
 */
function HeaderValue (name, data) {
  this.name = name;
  this.value = "";
  this.metadata = {};
  this.parse(data);
}
HeaderValue.prototype = {
  // void::parse (String::data) {{{3
  parse: function HV_parse (data) {
    data = data.trim();
    var res = {},
        values = data.split(/;\s*/);
    this.value = values[0] || "";
    for (let i = 1, len = values.length; i < len; ++i) {
      let data = values[i];
      let index = data.indexOf("=");
      if (index === -1)
        continue;

      let key = data.substr(0, index).toLowerCase(),
          value = data.substr(index + 1).trim();
      switch (value.charAt(0)) {
        case "\"":
        case "'":
          value = value.slice(1, -1);
          break;
      }
      this.metadata[key] = value;
    }
  }, // 3}}}
  // String::toString () {{{3
  toString: function HV_toString() {
    var str = [this.name + ": " + this.value];
    for (let key in this.metadata) {
      str.push(key + "=" + this.metadata[key].quote());
    }
    return str.join("; ");
  }, // 3}}}
};
// 2}}}
// Class RequestBodyField (Boolean::isFormData [, String::name, String::data]) {{{2
/** 
 * @Constructor
 * @param {Boolean} isFormData
 * @param {String} [name]
 * @param {String} [data]
 */
function RequestBodyField (isFormData, name, data) {
  this.name = name || "";
  this._data = "";
  this.isFormData = !!isFormData;
  if (data)
    this.data = data;
}
RequestBodyField.prototype = {
  // ReponseBodyField's default properties {{{3
  contentType: "application/octetstream",
  fileName: "",
  // 3}}}
  // String::getter data {{{3
  get data() {
    return this._data;
  }, // 3}}}
  // String::setter data {{{3
  set data(val) {
    if (!this.isFormData) {
      val = decodeURIComponent(val);
    }
    return this._data = val;
  }, // 3}}}
  // void::setHeaders (String::lines) {{{3
  setHeaders: function RBF_setHeaders (lines) {
    if (!Array.isArray(lines)) {
      if (typeof lines === "string")
        lines = lines.split(CRLF);
      else
        throw new TypeError("lines mult be Array or string");
    }
    for (var i = 0, len = lines.length; i < len; ++i)
      this._parseHeader(lines[i]);
  }, // 3}}}
  // void::_parseHeader (String::line) {{{3
  _parseHeader: function RBF__parseHeader (line) {
    if (!this.isFormData)
      return;
    line = line.trim();
    var pos = line.indexOf(":");
    if (pos === -1)
      return;

    var headerName = line.substr(0, pos).trim(),
        lowerHeaderName = headerName.toLowerCase(),
        headerValue = line.substr(pos + 1);

    if (lowerHeaderName in this._headerHandlers) {
      this._headerHandlers[lowerHeaderName].call(this, new HeaderValue(headerName, headerValue));
    }
  }, // 3}}}
  // Object::_headerHandlers {{{3
  _headerHandlers: {
    "content-disposition": function (aHeaderValue) {
      var m = aHeaderValue.metadata;
      if ("name" in m)
        this.name = m.name;
      if ("filename" in m)
        this.fileName = m.filename;
    },
    "content-type": function (aHeaderValue) {
      var m = aHeaderValue.metadata;
      this.contentType = aHeaderValue.value;
      if ("charset" in m)
        this.charset = m.charset;
    },
  }, // 3}}}
  // String::toString ([String::charset]) {{{3
  toString: function RBF_toString (charset) {
    charset = charset || this.charset || "";
    if (charset)
      return UnicodeConverter(charset).ConvertToUnicode(this._data);

    return this._data;
  }, // 3}}}
};
// 2}}}
// 1}}}
// == utils == {{{1
// =============================================================================
/** @namespace */
var utils = {
  // nsFile::ROOT {{{2
  get ROOT_FILE  () {
    var file = io.File(PATH).parent;
    delete this.ROOT_FILE;
    return this.ROOT_FILE  = file;
  }, // 2}}}
  // nsIFile::getFileFromRoot (String[]::paths) {{{2
  /**
   * @param {String[]} [paths]
   * @return {nsIFile}
   */
  getFileFromRoot: function utils_getFileFromRoot (paths) {
    var file = this.ROOT_FILE.clone();
    file.append("httpd");
    if (paths && Array.isArray(paths)) {
      for (var path of paths)
        file.append(path);
    }
    return file;
  }, // 2}}}
  // String::escapeHTML (String:text) {{{2
  escapeHTML: function utils_escapeHTML (text) {
    return text.replace(/[<>&]/g, function(char) {
      switch (char) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        default:
          return char;
      }
    });
  }, // 2}}}
}; // 1}}}

// CC (contractID, interfaceName [, initializer]) {{{1
/**
 * @description fix Component.Constructor
 * @param {String} contractID
 * @param {String} interfaceName
 * @param {String|Function} initializer
 * @return {Functioin}
 */
function CC (contractID, interfaceName, initializer) {
  return function ComponentsConstructor () {
    var instance = Cc[contractID].createInstance(Ci[interfaceName]);
    if (initializer) {
      switch (typeof initializer) {
        case "string":
          instance[initializer].apply(instance, arguments);
          break;
        case "function":
          initializer.apply(instance, arguments);
          break;
        default:
          throw new TypeError("Bad initializer");
      }
    }
    return instance;
  }
} // 1}}}
function dumpn() {}

// createServer () {{{1
function createServer () {
  var httpd = new HttpServer();
  for (var path in PATH_HANDLERS) {
    httpd.registerPathHandler(path, PATH_HANDLERS[path]);
  }
  for (var code in ERROR_HANDLERS) {
    httpd.registerErrorHandler(code, ERROR_HANDLERS[code]);
  }
  return httpd;
} /// 1}}}

// init () {{{1
(function init() {
  if (modules.httpd && !modules.httpd._socketClosed) {
    modules.httpd.stop(function(){
      liberator.log("unloaded httpd");
      delete modules.httpd;
      init();
    });
    return;
  }
  liberator.log("initialized httpd");
  {
    let file = utils.getFileFromRoot(["httpd.js"]);
    let tmp = Cu.import(services.get("io").newFileURI(file).spec, __context__);
    tmp.DEBUG = tmp.DEBUG_TIMESTAMP = SERVER_CONFIG.debug;
    dumpn = tmp.dumpn;
  }
  modules.httpd = createServer();
  if (SERVER_CONFIG.autoStart)
    modules.httpd.start(SERVER_CONFIG.port);
}()); // 1}}}

