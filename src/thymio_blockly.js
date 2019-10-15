var Blockly = require('@mobsya/node-blockly/browser');
var alertify = require('alertifyjs');


import $ from 'jquery';
window.jQuery = $;
window.$ = $;

import {createClient, Node, NodeStatus, ProgrammingLanguage} from '@mobsya/thymio-api'

var workspace = null;

let client = undefined
let selectedNode = undefined
let preferredNodeId = undefined


$().ready(function() {
    var params = {}
    if( location.hash && location.hash.length ) {
        const hash = decodeURIComponent(location.hash.substr(1));
        hash.split('&').map(hk => {
            let temp = hk.split('=');
            params[temp[0]] = temp[1]
        });
    }
    preferredNodeId = params["device"];
    const connectionUrl = params["ws"] || "ws://localhost:8597"
    console.log(`${connectionUrl} : ${preferredNodeId}`)

    //TODO: handle switch deconnection
    client = createClient(connectionUrl);
    client.onNodesChanged = async (nodes) => {
        //Iterate over the nodes
        for (let node of nodes) {
            console.log(`${node.id} : ${node.name} ${node.typeAsString}  ${node.statusAsString}`)
            // Select the first non busy node
            if((!selectedNode || !selectedNode.isReady)
                && node.status == NodeStatus.available && (!preferredNodeId || preferredNodeId == node.id.toString())) {
                try {
                    selectedNode = node
                    await node.lock()
                } catch(e) {
                    console.log("Unable to lock the node")
                }
            }
        }
        update_overlay_status()
    }
    start()
    update_overlay_status()
})

function start() {
    workspace = Blockly.inject('blocklyDiv', {
        comments: true,
        disable: true,
        collapse: true,
        grid: {
            spacing: 25,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        maxBlocks: Infinity,
        media: 'media/',
        readOnly: false,
        realtime: false,
        rtl: false,
        scrollbars: true,
        toolbox: $('#toolbox')[0],
                               zoom: {
                                   controls: true,
                               wheel: true,
                               startScale: 1.0,
                               maxScale: 4,
                               minScale: .25,
                               scaleSpeed: 1.1
                               },
    });

    Blockly.alert = function(message, callback) {
        console.log('Alert: ' + message);
        alertify.alert("Blockly", message, callback);
    };

    /** Override Blockly.confirm() with custom implementation. */
    Blockly.confirm = function(message, callback) {
        alertify.confirm("Blockly", message, () =>  callback(true), () =>  callback(false));
    };

    /** Override Blockly.prompt() with custom implementation. */
    Blockly.prompt = function(message, defaultValue, callback) {
        console.log('Prompt: ' + message);
        alertify.prompt("Blockly", message, defaultValue
        , function(evt, value) { callback(value) }
        , function() { callback(null) });
    }



    workspace.addChangeListener(updateCode);
    //to load code and block from a aesl file using drag and drop
    var importExport = $('#importExport');
    importExport.ondragover = function() {
        this.className = 'hover';
        return false;
    };
    let loadFile = function(fileLoadedEvent, name) {
        newDoc();
        var textFromFileLoaded = fileLoadedEvent.target.result;
        var parser, xmlDoc
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(textFromFileLoaded, "text/xml");
        xmlDoc = xmlDoc.getElementsByTagName("node")[0].childNodes[1];
        xmlDoc = xmlDoc.getElementsByTagName("ThymioBlockly")[0];
        Blockly.Xml.domToWorkspace(workspace, xmlDoc.getElementsByTagName("xml")[0]);
        var fileLoaded = document.getElementById("fileLoaded");
        var showFileName = document.getElementById("showFileName");
        fileLoaded.value = name;
        showFileName.innerHTML = name;
    }

    importExport.ondrop = function(e) {
        this.className = '';
        e.preventDefault();
        let fileToLoad = e.dataTransfer.files[0]
        if (fileToLoad != null) {
            let fileReader = new FileReader();
            fileReader.onload = function(fileLoadedEvent) {
                loadFile(fileLoadedEvent, fileToLoad.name)
            }
            fileReader.readAsText(fileToLoad, "UTF-8");
        }
        return false;
    };
    //to load code and block from a aesl file
    let input = $("#open-doc");
    input.on('change', function () {
        var fileToLoad = $("#open-doc").prop('files')[0];
        console.log(fileToLoad)
        if (fileToLoad != null) {
            newDoc();
            var fileReader = new FileReader();
            fileReader.onload = function(fileLoadedEvent) {
                loadFile(fileLoadedEvent, fileToLoad.name)
            }
            fileReader.readAsText(fileToLoad, "UTF-8");
        }
    })
    //to close overlay
    $('#overlay-msg').click( function() {
        $('#overlay').hide()
    });
    $('#overlay').click( function() {
        $('#overlay').hide()
    });
    $('#closeAbout').click( function(event) {
        event.preventDefault();
        $('#tab-overlay').hide()
    });

    //to open about us tab
    $('#info-btn').click( function(event) {
        event.preventDefault();
        $('#tab-overlay').show()
    });

    $('#new-doc').click(newDoc);
    $('#save-doc').click(saveFile);
    $('#play').click(run);
    $('#stop').click(stop);
}

function update_overlay_status() {
    if(selectedNode && selectedNode.isReady) {
        $('#th-connection-info').hide()
        $('#th-connection-status').removeClass("disconnected").addClass("connected") 
    } else {
        $('#th-connection-info').show()
        $('#th-connection-status').removeClass("connected").addClass("disconnected")
    }
}

function updateCode() {
    var output = $('#importExport')[0];
    output.value = Blockly['AESL'].workspaceToCode(workspace);
    if(selectedNode)
        selectedNode.setScratchPad(output.value, ProgrammingLanguage.Aseba)
}

async function send_code(code) {
    if(selectedNode && selectedNode.isReady) {
        try {
            await selectedNode.sendAsebaProgram(code)
            await selectedNode.runProgram()
        } catch (e) {
            console.log(e, code)
        }
    }
}

async function run() {
    updateCode()
    var code = $('#importExport').val()
    await send_code(code)
}

async  function stop() {
    await send_code(`
        motor.left.target = 0
        motor.right.target = 0
    `)
}

function newDoc() {
    workspace.clear();
    var input = document.getElementById("open-doc");
    input.value = null;
    var fileLoaded = document.getElementById("fileLoaded");
    fileLoaded.value = "";
    var showFileName = document.getElementById("showFileName");
    showFileName.innerHTML = "";
    var importExport = document.getElementById("importExport");
    importExport.value = "";
}

// Todo provide a more robust implementation
// https://www.npmjs.com/package/file-saver
//https://api.jquery.com/jQuery.parseXML/
function saveFile() {
    var code = $("#importExport").val()
    var xml = Blockly.Xml.workspaceToDom(workspace);
    var textToSave = '<!DOCTYPE aesl-source>\n<network>\n\n<!--list of global events-->\n\n<!--list of constants-->\n\n<!--show keywords state-->\n<keywords flag="true"/>\n\n\<!--node thymio-II-->\n<node nodeId="51938" name="thymio-II">\n\n' +
        code + '\n\n<toolsPlugins>\n<ThymioBlockly>\n' +
        Blockly.Xml.domToPrettyText(xml) + '\n</ThymioBlockly>\n</toolsPlugins>\n</node>\n\n</network>';
    var textToSaveAsBlob = new Blob([textToSave], {});
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    var fileNameToSaveAs = document.getElementById("fileLoaded").value;
    if (fileNameToSaveAs == '') {
        fileNameToSaveAs = 'untitled.aesl';
    }
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = (event) => document.body.removeChild(event.target);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    var isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g);
    if (isIE) {
        window.navigator.msSaveOrOpenBlob(textToSaveAsBlob, fileNameToSaveAs);
    } else {
        downloadLink.click();
    }
}
