module.exports = function(RED) {
    function flow2src(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function (msg) {
            if (!msg.hasOwnProperty('srcFolder')) return;
            if (msg.srcFolder.trim() == '') msg.srcFolder = 'src';
            if (!msg.hasOwnProperty('subflowFolder') || msg.subflowFolder.trim() == '') {
                msg.subflowFolder = msg.srcFolder;
            }

            // String manipulation functions
            (function () {
                String.prototype.delRightMost = function(sFind) {
                    for (var i = this.length; i >= 0; i = i - 1) {
                        var f = this.indexOf(sFind, i);
                        if (f != -1) {
                            return this.substring(0, f);
                            break;
                        }
                    }
                    return this;
                };
                String.prototype.getRightMost = function(sFind) {
                    for (var i = this.length; i >= 0; i = i - 1) {
                        var f = this.indexOf(sFind, i);
                        if (f != -1) {
                            return this.substring(f + sFind.length, f + sFind.length + this.length);
                        }
                    }
                    return this;
                };
                String.prototype.delLeftMost = function(sFind) {
                    for (var i = 0; i < this.length; i = i + 1) {
                        var f = this.indexOf(sFind, i);
                        if (f != -1) {
                            return this.substring(f + sFind.length, f + sFind.length + this.length);
                            break;
                        }
                    }
                    return this;
                };
                String.prototype.getLeftMost = function(sFind) {
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

            // Get the flowFile
            const fs = require('fs');
            let flowFile = RED.settings.userDir;
            try{
                if (RED.settings.get('editorTheme').projects.enabled) {
                    let project = RED.settings.get('projects').activeProject;
                    let package_json = flowFile + '/projects/' + project + '/package.json';

                    // Read the package.json for the flowfile
                    let pk = JSON.parse(fs.readFileSync(package_json).toString());
                    flowFile += '/projects/' + project + '/' + pk['node-red']['settings']['flowFile'];
                } else {
                    flowFile += '/' + RED.settings.flowFile;
                }
            } catch(e) {
                node.error(e);
                return;
            }

            // Read and parse the flow file
            let ff = JSON.parse(fs.readFileSync(flowFile).toString());
            let basePath = flowFile.delRightMost('/');
            let flowPath = basePath + '/' + msg.srcFolder;
            let subflowPath = basePath + '/' + msg.subflowFolder;

            // Write the relevant flow properties to the src folder
            if (msg.action == 'flow2src') {
                try {

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
                    let idMap = {};
                    ff.forEach(function (obj) {

                        // Check for matching flows
                        if (obj.type == 'tab') {
                            if (incFlows != null) {
                                if (incFlows.indexOf(obj.label) == -1) {
                                    return;
                                }
                            }
                            idMap[obj.id] = { folder: obj.label.replace(/[^a-z0-9]/gi, '_'), subflow: false };
                        }

                        // Check for matching subflows
                        if (obj.type == 'subflow') {
                            if (incSubflows != null) {
                                if (incSubflows.indexOf(obj.name) == -1) {
                                    return;
                                }
                            }
                            idMap[obj.id] = { folder: obj.name.replace(/[^a-z0-9]/gi, '_'), subflow: true };
                        }
                        // Gather nodes and templates
                        if (obj.type == 'template' || obj.type == 'ui-template' || obj.type == 'function' || obj.type == 'wp function') {
                            theNodes.push(obj);
                        }
                    });

                    // Narrow the nodes to just the flows and subflows we're interested in
                    let existingFiles = [];
                    let srcNodes = [];
                    theNodes.forEach(function (obj) {
                        if (!idMap.hasOwnProperty(obj.z)) return;
                        let info = idMap[obj.z];

                        // Determine the filename extension
                        let ext = '';
                        if (obj.type == 'template') {
                            ext = obj.format.toLowerCase();
                            if (ext == 'handlebars' || ext == 'text') {
                                ext = '';
                            }
                            if (ext == 'javascript') {
                                ext = 'js';
                            }
                            if (ext != '') {
                                ext = '.' + ext;
                            }
                        }
                        if (obj.type == 'ui-template') {
                            ext = '.html';
                        }
                        if (obj.type == 'function') {
                            ext = '.js';
                        }
                        if (obj.type == 'wp function') {
                            ext = '.php';
                        }
                        let fname = obj.name.replace(/[^a-z0-9]/gi, '_');
                        if (fname == '') {
                            fname = 'untitled';
                        }

                        // Use existing extension in filename
                        if (fname.indexOf('.') != -1) {
                            ext = '.' + fname.getRightMost('.');
                            fname = fname.delRightMost('.');
                        }
                        let base = info.subflow ? subflowPath : flowPath;
                        let file = base + '/' + info.folder + '/' + fname + ext;
                        let i = 2;

                        // Iterate existing filenames
                        while (existingFiles.indexOf(file) != -1) {
                            file = base + '/' + info.folder + '/' + fname + i.toString() + ext;
                            i++;
                        }
                        obj.srcFiles = [];
                        if (obj.type == 'template') {
                            obj.srcFiles.push({
                                id: obj.id,
                                property: 'template',
                                file: file,
                                subflow: info.subflow
                            });
                            existingFiles.push(file);
                        } else if (obj.type == 'ui-template') {
                            obj.srcFiles.push({
                                id: obj.id,
                                property: 'format',
                                file: file
                            });
                            existingFiles.push(file);
                        } else if (obj.type == 'function') {
                            obj.srcFiles.push({
                                id: obj.id,
                                property: 'func',
                                file: file,
                                subflow: info.subflow
                            });
                            existingFiles.push(file);

                            // Record function On Start and On Stop too
                            let onStartFile = file;
                            ext = onStartFile.getRightMost('.');
                            onStartFile = onStartFile.delRightMost('.') + '_initialize' + ext;
                            obj.srcFiles.push({
                                id: obj.id,
                                property: 'initialize',
                                file: onStartFile,
                                subflow: info.subflow
                            });
                            let onStopFile = file;
                            ext = onStopFile.getRightMost('.');
                            onStopFile = onStopFile.delRightMost('.') + '_finalize' + ext;
                            obj.srcFiles.push({
                                id: obj.id,
                                property: 'finalize',
                                file: onStopFile,
                                subflow: info.subflow
                            });
                        } else if (obj.type == 'wp function') {
                            obj.srcFiles.push({
                                id: obj.id,
                                property: 'func',
                                file: file,
                                subflow: info.subflow
                            });
                            existingFiles.push(file);
                        }
                        srcNodes.push(obj);
                    });

                    // Remove prior src folders
                    fs.rmSync(flowPath, { recursive: true, force: true });
                    if (subflowPath !== flowPath) {
                        fs.rmSync(subflowPath, { recursive: true, force: true });
                    }
                    fs.mkdirSync(flowPath, { recursive: true, mode: 0o777 });
                    if (subflowPath !== flowPath) {
                        fs.mkdirSync(subflowPath, { recursive: true, mode: 0o777 });
                    }

                    // Write the nodes to the src folder and record the manifest
                    let manifest = [];
                    srcNodes.forEach(function (obj) {
                        obj.srcFiles.forEach(function (sF) {

                            // Create the src path
                            let sFPath = sF.file.delRightMost('/');
                            if (!fs.existsSync(sFPath)) {
                                fs.mkdirSync(sFPath, { recursive: true, mode: 0o777 });
                            }

                            // Write the given file
                            if (obj[sF.property] != '') {
                                fs.writeFileSync(sF.file, obj[sF.property], { mode: 0o666 });
                                let base = sF.subflow ? subflowPath : flowPath;
                                sF.file = sF.file.delLeftMost(base + '/');
                                manifest.push(sF);
                            }
                        });
                    });

                    // Write the manifest to the src folder
                    fs.mkdirSync(flowPath, { recursive: true, mode: 0o777 });
                    fs.writeFileSync(flowPath + '/manifest.json', JSON.stringify(manifest, null, 4), { mode: 0o666 });
                    node.status({ fill: "green", shape: "dot", text: "updated files" });
                    setTimeout(function() {
                        node.status({});
                    }, 5000);
                } catch(e) {
                    node.error(e);
                }
            }

            // Read src folder and update the flow
            if (msg.action == 'src2flow') {
                try {

                    // Load the manifest
                    if (!fs.existsSync(flowPath + '/manifest.json')) return;
                    let mn = JSON.parse(fs.readFileSync(flowPath + '/manifest.json').toString());

                    ff.forEach(function (obj) {
                        mn.forEach(function(item) {
                            if (item.id != obj.id) return;
                            
                            // Update the content from the external file
                            let base = item.subflow ? subflowPath : flowPath;
                            let file = fs.readFileSync(base + '/' + item.file).toString();
                            obj[item.property] = file;
                        });
                    });

                    // Update the flow file
                    fs.writeFileSync(flowFile, JSON.stringify(ff, null, 4), { mode: 0o666 });
                } catch(e) {
                    node.error(e);
                }
            }
        });

        // Automatic flow2src on deploys
        if (config.chkAutoFlow2Src) {
            node.receive({action:"flow2src", srcFolder: config.srcFolder, subflowFolder: config.subflowFolder});
        }
    }
    RED.httpAdmin.post("/flow2src/:id", RED.auth.needsPermission("inject.write"), function (req, res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                if (req.body) {
                    node.receive(req.body);
                } else {
                    node.receive();
                }
                res.sendStatus(200);
            } catch (err) {
                res.sendStatus(500);
                node.error(RED._("flow2src.failed", { error: err.toString() }));
            }
        } else {
            res.sendStatus(404);
        }
    });
    RED.nodes.registerType('flow2src', flow2src);
}
