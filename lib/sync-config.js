/* configuration file loader

Tool to load a (configuration) file and monitor the resulting object for changes,
which will be automatically saved back to the file.

Supports JSON and YAML files.

This tool is not meant for highly volatile or nested objects, it blunty writes
each time a top level change occurs, no intelligence in that.

Returns NULL on errors

*/

var LoadConfig = {};

LoadConfig.defaults = {
  indentationSpaces: 4, // see JSON.stringify
  inlineLevel: 8, // YAML depth to start inlining properties
  flushmilliseconds: 5000, // Target write interval. Any write will open a gathering window of this size. Due to the nature of Node.js the actual window can be stretched.
  doubleFireGracePeriod: 50, //ms grace period to discard double 'change' events on the tracked file
};

//===== Implementation =========================================================

LoadConfig.load = function ( configFilePath, options ) {
  "use strict";

  var fs            = require('fs');
  var path          = require('path');
  var YAML          = require('yamljs');
  var deepCopy      = require('deep-copy-tools');
  //var xml2js        = require('xml2js');

  if (!options) { options = {}; }
  // Match anything after the . and then strip the . from the result
  var extension = configFilePath.match(/\.[^\.]+$/i)[0].replace(/^\./, "");
  // Not sure if we need it, it's just in case
  var _path = path.join(configFilePath);

  // Default return value
  var config = null;
  var loader = null;
  var saver = null;

  switch(extension.toLowerCase()) {
    case "yaml":
    case "yml":
      loader = function(file) { return YAML.load(file); };
      saver = function(_change) {
        return YAML.stringify(_change[_change.length - 1].object, options.inlineLevel || LoadConfig.defaults.inlineLevel, options.indentationSpaces || LoadConfig.defaults.indentationSpaces);
      };
      break;
    case "json":
      loader = function(file) { return require(file); };
      //config = require(_path);
      saver = function(_change) {
        return JSON.stringify(_change[_change.length - 1].object, null, options.indentationSpaces || LoadConfig.defaults.indentationSpaces);
      };
      break;
    // case "xml":
    //   loader =
    //   saver = function(_change) {};
    //   break;
    default:
      console.log("ERROR, can't determine filetype for config file '" + configFile + "'");
      return config;
  }

  config = loader(_path);

  // Software side monitoring of object changes
  var mon = null;
  var running = false;
  var reading = false;
  var writing = false;
  if (config instanceof Array) {
    mon = Array.observe;
  } else if (config instanceof Object) {
    mon = Object.observe;
  }
  mon(config, function(change) {
    if (!running && !reading) {
      running = true;
      setTimeout(function() {
        try {
          writing = true;
          fs.writeFile(_path, saver(change), function() { writing = false; });
        } catch (e) {
          console.log("ERROR: Unable to write configuration changes to file: '" + _path + "': ", e);
        }
        //console.log(_path, ":\n", YAML.stringify(change[change.length - 1].object, options.inlineLevel || LoadConfig.defaults.inlineLevel, options.indentationSpaces || LoadConfig.defaults.indentationSpaces));
        running = false;
      }, options.flushmilliseconds || LoadConfig.defaults.flushmilliseconds);
    }
  });
  // Disk side monitoring of file changes, if feasible
  fs.watch(_path, function(event) {
    if (!writing && !reading && event === 'change') {
      reading = true;
      setTimeout(function() {
        deepCopy.sync(loader(_path), config);
        // config = loader(_path);
        console.log("INFO: Configuration updated from disk:\t'" + _path + "'");
        reading = false;
      }, options.doubleFireGracePeriod || LoadConfig.defaults.doubleFireGracePeriod);
    }
  });
  return config;
};

module.exports = function (config) {
  if (config) {
    LoadConfig.config = {
      indentationSpaces: config.indentationSpaces || LoadConfig.defaults.indentationSpaces,
      inlineLevel: config.inlineLevel || LoadConfig.defaults.inlineLevel,
      flushmilliseconds: config.flushmilliseconds || LoadConfig.defaults.flushmilliseconds,
      doubleFireGracePeriod: config.doubleFireGracePeriod || LoadConfig.defaults.doubleFireGracePeriod
    };
  } else {
    LoadConfig.config = LoadConfig.defaults;
  }

  return LoadConfig.load;
};
