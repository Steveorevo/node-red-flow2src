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

### How to install
You can install flow2src via [Node-RED's built in palette manager](https://nodered.org/docs/user-guide/editor/palette/manager) and searching for `node-red-flow2src`

or 

Run the following command in your Node-RED user directory (typically ~/.node-red):

    npm install @steveorevo/node-red-flow2src

The flow2src node will appear in the palette under the common group.

### Building
The emerge node was built using the same author's [Node-Maker](https://github.com/steveorevo/node-maker) project. Included in this repo is the flow2src.json file containing the flow needed to build flow2src. Simply import this flow into Node-RED and click the associated inject button. The current version of node-red-flow2src folder will appear in your Node-RED's node_modules folder. 

#### Support the creator
You can help Steveorevo's open source development endeavors by donating any amount. Your donation, no matter how large or small helps pay for his time and resources to create MIT and GPL licensed projects that you and the world can benefit from. Click the link below to donate today :)
<div>
         

[<kbd> <br> Donate to this Project <br> </kbd>][KBD]


</div>


<!---------------------------------------------------------------------------->

[KBD]: https://steveorevo.com/donate

https://steveorevo.com/donate
