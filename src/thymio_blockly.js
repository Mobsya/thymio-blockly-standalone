var Blockly = require('@mobsya/node-blockly/browser');

import $ from 'jquery';
window.jQuery = $;
window.$ = $;

import {Client,Node} from '@mobsya/thymio-api'

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
    client = new Client(connectionUrl);
    client.on_nodes_changed = async (nodes) => {
        //Iterate over the nodes
        for (let node of nodes) {
            console.log(`${node.id} : ${node.name} ${node.type_str}  ${node.status_str}`)
            // Select the first non busy node
            if((!selectedNode || !selectedNode.ready)
                && node.status == Node.Status.available && (!preferredNodeId || preferredNodeId == node.id)) {
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
        media: '../media/',
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
    input.onchange = function() {
        var fileToLoad = $("#open-doc").files[0];
        if (fileToLoad != null) {
            newDoc();
            var fileReader = new FileReader();
            fileReader.onload = function(fileLoadedEvent) {
                loadFile(fileLoadedEvent, fileToLoad.name)
            }
            fileReader.readAsText(fileToLoad, "UTF-8");
        }
    }
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
    if(selectedNode && selectedNode.ready)
        $('#overlay').hide()
    else
        $('#overlay').show()
}

function updateCode() {
    var output = $('#importExport')[0];
    output.value = Blockly['AESL'].workspaceToCode(workspace);
}

async function send_code(code) {
    if(selectedNode && selectedNode.ready) {
        try {
            await selectedNode.send_aseba_program(code)
            await selectedNode.run_aseba_program()
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
    var code = $("importExport").text().html()
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
