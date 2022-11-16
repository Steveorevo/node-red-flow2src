# node-red-flow2src
This node will write template and function node source code properties to a src sub-folder adjacent to the project's flows file. 

This project was created based on a discussions in the Node-RED forum topic [Node-RED CLI tool for easier source code management](https://discourse.nodered.org/t/node-red-cli-tool-for-easier-source-code-management/70508/5)

![screenshot of node-maker](https://raw.github.com/steveorevo/node-red-flow2src/main/images/flow2src.jpg)

### Files in this repo
The files in the folder contain the typical files needed to make a Node-RED node; that is a package.json, the flow2src subfolder, and accompanying JavaScript and HTML files. These files were created using an automated process; via [Node Maker](https://github.com/Steveorevo/node-maker). Node Maker allows you to automate the creation of a Node-RED node pacakge using a set of Node-RED subflows; that flow itself is stored in the flow2src.json file and can be used to build the initial flow2src node. 

Lastly, the circle of self-authoring is complete as flow2src has been used to better manage the source code for flow2src itself; and will continue to be used to test and author its own source code. This makes source code management easier; flow2src was executed as apart of the aforementioned Node Maker flow and the src subfolder contains the custom template node used to create the flow2src node. 
