module.exports = function(RED) {
    function {{node_name}}(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function (msg) {
            if (!msg.hasOwnProperty('srcFolder')) return;
            if (msg.srcFolder.trim() == '') msg.srcFolder = 'src';

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
            let path = flowFile.delRightMost('/') + '/' + msg.srcFolder;

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
                        if (obj.type == 'template' || obj.type == 'function' || obj.type == 'wp function') {
                            theNodes.push(obj);
                        }
                    });

                    // Narrow the nodes to just the flows and subflows we're interested in
                    let existingFiles = [];
                    let srcNodes = [];
                    theNodes.forEach(function (obj) {
                        if (theIDs.indexOf(obj.z) == -1) return;
                        
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
                        let file = path + '/' + theFolders[theIDs.indexOf(obj.z)] + '/' + fname + ext;
                        let i = 2;

                        // Iterate existing filenames
                        while (existingFiles.indexOf(file) != -1) {
                            file = path + '/' + theFolders[theIDs.indexOf(obj.z)] + '/' + fname + i.toString() + ext;
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
                            onStartFile = onStartFile.delRightMost('.') + '_initialize' + ext;
                            obj.srcFiles.push({
                                id: obj.id,
                                property: 'initialize',
                                file: onStartFile
                            });
                            let onStopFile = file;
                            ext = onStopFile.getRightMost('.');
                            onStopFile = onStopFile.delRightMost('.') + '_finalize' + ext;
                            obj.srcFiles.push({
                                id: obj.id,
                                property: 'finalize',
                                file: onStopFile
                            });
                        } else if (obj.type == 'wp function') {
                            obj.srcFiles.push({
                                id: obj.id,
                                property: 'func',
                                file: file
                            });
                            existingFiles.push(file);
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
                    if (!fs.existsSync(path + '/manifest.json')) return;
                    let mn = JSON.parse(fs.readFileSync(path + '/manifest.json').toString());

                    ff.forEach(function (obj) {
                        mn.forEach(function(item) {
                            if (item.id != obj.id) return;
                            
                            // Update the content from the external file
                            let file = fs.readFileSync(path + '/' + item.file).toString();
                            obj[item.property] = file;
                        });
                    });

                    // Update the flow file
                    fs.writeFileSync(flowFile, JSON.stringify(ff, null, 4));
                } catch(e) {
                    node.error(e);
                }
            }
        });

        // Automatic flow2src on deploys
        if (config.chkAutoFlow2Src) {
            node.receive({action:"flow2src", srcFolder: config.srcFolder});
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
    RED.nodes.registerType('{{node_name}}', {{node_name}});
}
