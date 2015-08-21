# sync-config
JSON and YAML configuration file loader with synchronization.

Tool to load a (configuration) file and monitor the resulting object for changes,
which will then be automatically saved back to the file. Supports JSON and YAML
files.

## Usage
Use the library like this:
```bash
npm install --save sync-config
```

```javascript
var load = require('sync-config')(options);
```

Load a configuration file:

```javascript
var myConfig = load('path/to/myConfig.yaml');
```

## Configuration

Providing an options object is not required. The following options can be set:
* `indentationSpaces` - Indentation spaces used for saving (default: `4`)
* `inlineLevel` 8,  - YAML depth level to start inlining properties (default `8`)
* `flushmilliseconds` - Target write interval in milliseconds. Any write will open a gathering window of this size. Due to the single threaded nature of Node.js the actual window can vary. (default: `5000`)
* `doubleFireGracePeriod` - Small grace period to discard double 'change' events on the tracked file, in ms. (default: `50`)

## Notes

This library is not meant for highly volatile or nested objects, it blunty
writes each time a top level change occurs, no intelligence in that.

## License
This project is licensed as [LGPLv3](http://www.gnu.org/licenses/lgpl-3.0.html), the license file is included in the project directory.

Copyright 2015 [Stefan Hamminga](stefan@prjct.net) - [prjct.net](https://prjct.net)
