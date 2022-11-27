# node-red-flow2src
Now you can easily see git diff, use CLI editors, or third-party IDEs like Visual Studio Code to leverage Co-Pilot with Node-RED. This node will write template and function node source code properties to a src sub-folder adjacent to the project's flows file; and merge changes back into your flows when you're done editing.

# How to Use flow2src
Simply include the flow2src node on one of your project's flows. When enabling [Node-RED's project mode](https://nodered.org/docs/user-guide/projects/), the files can be easily managed within Node-RED itself. See the screenshot below for reference:

1) Include the flow2src node on one of your flows and open its property sheet.
2) Click the "Flow-to-Src" button; flow2src will generate files. 
3) Click Node-RED's "Refresh changes" button in the history tab. 

![screenshot of node-maker](https://raw.github.com/steveorevo/node-red-flow2src/main/images/flow2src.jpg)

By default, flow2src will look for all flows and subflows for template and function nodes and create a src folder. Within the src folder are a number of subfolders of the same name as your flow tabs and subfolders. Source code files with properly named
extensions (i.e. .js, .html, .json, .css, etc.) are within the folders. The filename extensions are derived from the node type (i.e. function node creates .js files) or the syntax highlight mode setting for [template nodes](https://nodered.org/docs/user-guide/nodes#template). You can override the filename extension by explicitly naming your node with an extension. Nodes that share the same name within a given flow will automatically be iterated, i.e. function_1.js, function_2.js, etc.

### Files in this repo
The files in the folder contain the typical files needed to make a Node-RED node; that is a package.json, the flow2src subfolder, and accompanying JavaScript and HTML files. These files were created using an automated process; via [Node Maker](https://github.com/Steveorevo/node-maker). Node Maker allows you to automate the creation of a Node-RED node pacakge using a set of Node-RED subflows; that flow itself is stored in the flow2src.json file and can be used to build the initial flow2src node. 

Lastly, the circle of self-authoring is complete as flow2src has been used to better manage the source code for flow2src itself; and will continue to be used to test and author its own source code. This makes source code management easier; flow2src was executed as apart of the aforementioned Node Maker flow and the src subfolder contains the custom template node used to create the flow2src node. 
