module.exports = function(RED) {
    function flow2src(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function (msg) {
            
            // String manipulation functions
            (function () {
                String.prototype.delRightMost = function (sFind) {
                    for (var i = this.length; i >= 0; i = i - 1) {
                        var f = this.indexOf(sFind, i);
                        if (f != -1) {
                            return this.substring(0, f);
                            break;
                        }
                    }
                    return this;
                };
                String.prototype.getRightMost = function (sFind) {
                    for (var i = this.length; i >= 0; i = i - 1) {
                        var f = this.indexOf(sFind, i);
                        if (f != -1) {
                            return this.substring(f + sFind.length, f + sFind.length + this.length);
                        }
                    }
                    return this;
                };
                String.prototype.delLeftMost = function (sFind) {
                    for (var i = 0; i < this.length; i = i + 1) {
                        var f = this.indexOf(sFind, i);
                        if (f != -1) {
                            return this.substring(f + sFind.length, f + sFind.length + this.length);
                            break;
                        }
                    }
                    return this;
                };
                String.prototype.getLeftMost = function (sFind) {
                    for (var i = 0; i < this.length; i = i + 1) {
                        var f = this.indexOf(sFind, i);
                        if (f != -1) {
                            return this.substring(0, f);
                            break;
                        }
                    }
                    return this;
                };
            })();

            try {

                // Get the flowFile
                let flowFile = RED.settings.userDir;
                if (RED.settings.get('editorTheme').projects.enabled) {
                    let project = RED.settings.get('projects').activeProject;
                    flowFile += '/projects/' + project + '/flow.json';
                } else {
                    flowFile += '/' + RED.settings.flowFile;
                }

                // Read and parse the flow file
                const fs = require('fs');
                let ff = JSON.parse(fs.readFileSync(flowFile).toString());

                // Gather flows and subflows as an array
                let incFlows = [];
                if (config.incFlows.trim() != '*') {
                    incFlows = config.incFlows.split(',').map(function (f) { return f.trim() });
                } else {
                    incFlows = null;
                }
                let incSubflows = [];
                if (config.incSubflows.trim() != '*') {
                    incSubflows = config.incSubflows.split(',').map(function (f) { return f.trim() });
                } else {
                    incSubflows = null;
                }

                // Gather flow ids, folder safe names, and nodes for analysis in a single pass
                let theNodes = [];
                let theFolders = [];
                let theIDs = [];
                ff.forEach(function (obj) {

                    // Check for matching flows
                    if (obj.type == 'tab') {
                        if (incFlows != null) {
                            if (incFlows.indexOf(obj.label) == -1) {
                                return;
                            }
                        }
                        theFolders.push(obj.label.replace(/[^a-z0-9]/gi, '_'));
                        theIDs.push(obj.id);
                    }

                    // Check for matching subflows
                    if (obj.type == 'subflow') {
                        if (incSubflows != null) {
                            if (incSubflows.indexOf(obj.name) == -1) {
                                return;
                            }
                        }
                        theFolders.push(obj.name.replace(/[^a-z0-9]/gi, '_'));
                        theIDs.push(obj.id);
                    }
                    // Gather nodes and templates
                    if (obj.type == 'template' || obj.type == 'function') {
                        theNodes.push(obj);
                    }
                });

                // Narrow the nodes to just the flows and subflows we're interested in
                let path = flowFile.delRightMost('/') + '/src';
                let existingFiles = [];
                let srcNodes = [];
                theNodes.forEach(function (obj) {
                    if (theIDs.indexOf(obj.z) == -1) return;

                    // Determine the filename extension
                    let ext = 'js';
                    if (obj.type == 'template') {
                        ext = obj.format.toLowerCase();
                        if (ext == 'handlebars' || ext == 'text') {
                            ext = '';
                        }
                        if (ext == 'javascript') {
                            ext = 'js';
                        }
                    }
                    let fname = obj.name;
                    if (fname == '') {
                        fname = 'untitled';
                    }
                    let file = path + '/' + theFolders[theIDs.indexOf(obj.z)] + '/' + fname + '.' + ext;
                    let i = 2;

                    // Iterate existing filenames
                    while (existingFiles.indexOf(file) != -1) {
                        file = path + '/' + theFolders[theIDs.indexOf(obj.z)] + '/' + fname + i.toString() + '.' + ext;
                        i++;
                    }
                    obj.srcFiles = [];
                    if (obj.type == 'template') {
                        obj.srcFiles.push({
                            id: obj.id,
                            property: 'template',
                            file: file
                        });
                        existingFiles.push(file);
                    } else if (obj.type == 'function') {
                        obj.srcFiles.push({
                            id: obj.id,
                            property: 'func',
                            file: file
                        });
                        existingFiles.push(file);

                        // Record function On Start and On Stop too
                        let onStartFile = file;
                        ext = onStartFile.getRightMost('.');
                        onStartFile = onStartFile.delRightMost('.') + '_initialize.' + ext;
                        obj.srcFiles.push({
                            id: obj.id,
                            property: 'initialize',
                            file: onStartFile
                        });
                        let onStopFile = file;
                        ext = onStopFile.getRightMost('.');
                        onStopFile = onStopFile.delRightMost('.') + '_finalize.' + ext;
                        obj.srcFiles.push({
                            id: obj.id,
                            property: 'finalize',
                            file: onStopFile
                        });
                    }
                    srcNodes.push(obj);
                });

                // Remove prior src folder
                fs.rmSync(path, { recursive: true, force: true });

                // Write the nodes to the src folder and record the manifest
                let manifest = [];
                srcNodes.forEach(function (obj) {
                    obj.srcFiles.forEach(function (sF) {

                        // Create the src path
                        let sFPath = sF.file.delRightMost('/');
                        if (!fs.existsSync(sFPath)) {
                            fs.mkdirSync(sFPath, { recursive: true });
                        }

                        // Write the given file
                        if (obj[sF.property] != '') {
                            fs.writeFileSync(sF.file, obj[sF.property]);
                            sF.file = sF.file.delLeftMost(path + '/');
                            manifest.push(sF);
                        }
                    });
                });

                // Write the manifest to the src folder
                fs.writeFileSync(path + '/manifest.json', JSON.stringify(manifest, null, 4));
            } catch (e) {
                node.error(e);
            }
        });
    }
    RED.nodes.registerType('flow2src', flow2src);
}