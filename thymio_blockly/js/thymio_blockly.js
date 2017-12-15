goog.require('goog.dom');
goog.require('goog.net.XhrIo');
goog.require('goog.structs.Map');
goog.require('goog.Uri.QueryData');
goog.require('goog.net.XhrManager');
'use strict';
var workspace = null;
var connected = false;
var mgr = null;

function start() {
    var toolbox = document.getElementById('toolbox');
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
        toolbox: toolbox,
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 4,
            minScale: .25,
            scaleSpeed: 1.1
        },
    });
    //to change code in the textarea real time
    if (Blockly.Realtime.isEnabled()) {
        enableRealtimeSpecificUi();
    }
    workspace.addChangeListener(updateCode);
    //to load code and block from a aesl file using drag and drop
    var importExport = document.getElementById('importExport');
    importExport.ondragover = function() {
        this.className = 'hover';
        return false;
    };
    importExport.ondrop = function(e) {
        this.className = '';
        e.preventDefault();
        var fileToLoad = e.dataTransfer.files[0],
            fileReader = new FileReader();
        fileReader.onload = function(fileLoadedEvent) {
            newDoc();
            var textFromFileLoaded = fileLoadedEvent.target.result;
            var parser, xmlDoc
            if (window.DOMParser) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(textFromFileLoaded, "text/xml");
            } else {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(textFromFileLoaded);
            }
            var aeslLoaded = document.getElementById('importExport');
            aeslLoaded = xmlDoc.getElementsByTagName("node")[0].childNodes[0].nodeValue;
            xmlDoc = xmlDoc.getElementsByTagName("node")[0].childNodes[1];
            xmlDoc = xmlDoc.getElementsByTagName("ThymioBlockly")[0];
            console.log(xmlDoc.getElementsByTagName("xml")[0]);
            Blockly.Xml.domToWorkspace(workspace, xmlDoc.getElementsByTagName("xml")[0]);
            var fileLoaded = document.getElementById("fileLoaded");
            var showFileName = document.getElementById("showFileName");
            fileLoaded.value = fileToLoad.name;
            showFileName.innerHTML = fileToLoad.name;
        };
        fileReader.readAsText(fileToLoad, "UTF-8");
        return false;
    };
    //to load code and block from a aesl file
    var input = document.getElementById("open-doc");
    input.onchange = function() {
        var fileToLoad = document.getElementById("open-doc").files[0];
        if (fileToLoad != null) {
            newDoc();
            var fileReader = new FileReader();
            fileReader.onload = function(fileLoadedEvent) {
                var textFromFileLoaded = fileLoadedEvent.target.result;
                var parser, xmlDoc
                if (window.DOMParser) {
                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(textFromFileLoaded, "text/xml");
                } else {
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = false;
                    xmlDoc.loadXML(textFromFileLoaded);
                }
                var aeslLoaded = document.getElementById('importExport');
                aeslLoaded = xmlDoc.getElementsByTagName("node")[0].childNodes[0].nodeValue;
                xmlDoc = xmlDoc.getElementsByTagName("node")[0].childNodes[1];
                xmlDoc = xmlDoc.getElementsByTagName("ThymioBlockly")[0];
                Blockly.Xml.domToWorkspace(workspace, xmlDoc.getElementsByTagName("xml")[0]);
                var fileLoaded = document.getElementById("fileLoaded");
                var showFileName = document.getElementById("showFileName");
                fileLoaded.value = fileToLoad.name;
                showFileName.innerHTML = fileToLoad.name;
            };
            fileReader.readAsText(fileToLoad, "UTF-8");
        }
    }
    //to close overlay
    document.getElementById('overlay-msg')
        .addEventListener('click', function(event) {
            document.getElementById("overlay").style.display = "none";
        });
    document.getElementById('overlay')
        .addEventListener('click', function(event) {
            document.getElementById("overlay").style.display = "none";
        });

    mgr = new goog.net.XhrManager(2, null, 0, 2);
    //to test if Thymio is connected from the start 
    mgr.send('testCon', 'http://localhost:3000/nodes/', 'GET', null, null, null, function(e) {
        var response = this.getResponseText();
        if (response != '' && response != '[]') {
            response = response.substring(1, response.length - 1);
            console.log(response);
            response = JSON.parse(response);
            if (response.connected == 1) {
                connected = true;
                testConnection();
                console.log('connected');
            } else {
                connected = false;
            }
        } else {
            connected = false;
        }
        if (!connected) {
            console.log('not connected');
        }
    });
}

function testConnection() {
    console.log('testConnection');
    setTimeout(function() {
        mgr.abort('testCon');
        mgr.send('testCon', 'http://localhost:3000/nodes/', 'GET', null, null, null, function(e) {
            if (connected) {
                var response = this.getResponseText();
                if (response != '' && response != '[]') {
                    response = response.substring(1, response.length - 1);
                    response = JSON.parse(response);
                    if (response.connected == 1) {
                        testConnection();
                    } else {
                        connected = false;
                    }
                } else {
                    connected = false;
                }
                if (!connected) {
                    console.log('lost connection');
                    document.getElementById("overlay").style.display = "block";
                }
            }
        });
    }, 5000);
}

function toCode(lang) {
    var output = document.getElementById('importExport');
    output.value = Blockly[lang].workspaceToCode(workspace);
}

function updateCode(event) {
    toCode('AESL');
}

function run() {
    toCode('AESL');
    var code = document.getElementById('importExport').value.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    var aesl = '<!DOCTYPE aesl-source> \
		<network> \
		<keywords flag="true"/> \
		<node nodeId="1" name="thymio-II"> ' +
        code +
        '</node> \
		</network>';
    var payload = 'file=' + aesl;
    mgr.abort('testCon');
    mgr.send('testCon', 'http://localhost:3000/nodes/', 'GET', null, null, null, function(e) {
        var response = this.getResponseText();
        if (this.getResponseText() != '' && this.getResponseText() != '[]') {
            response = response.substring(1, response.length - 1);
            console.log(response);
            response = JSON.parse(response);
            if (response.connected == 1) {
                console.log("ok");
                if (!connected) {
                    connected = true;
                    testConnection();
                }
                mgr.abort('run');
                if (code != '') {
                    mgr.send('run', 'http://localhost:3000/nodes/thymio-II', 'PUT', aesl, null, null, function(e) {
                        console.log('Received response.');
                    });
                }
            }
        }
        if (!connected) {
            console.log("ko");
            document.getElementById("overlay").style.display = "block";
        }
    });
}

function stop() {
    var aesl = '<!DOCTYPE aesl-source> \
		<network> \
		<keywords flag="true"/> \
		<node nodeId="1" name="thymio-II"> \
		motor.left.target = 0 \
		motor.right.target = 0 \
		</node> \
		</network>';
    var payload = 'file=' + aesl;
    mgr.abort('testCon');
    mgr.send('testCon', 'http://localhost:3000/nodes/', 'GET', null, null, null, function(e) {
        var response = this.getResponseText();
        if (this.getResponseText() != '' && this.getResponseText() != '[]') {
            response = response.substring(1, response.length - 1);
            console.log(response);
            response = JSON.parse(response);
            if (response.connected == 1) {
                console.log("ok");
                if (!connected) {
                    connected = true;
                    testConnection();
                }
                mgr.abort('run');
                mgr.send('run', 'http://localhost:3000/nodes/thymio-II', 'PUT', aesl, null, null, function(e) {
                    console.log('Received response.');
                });
            }
        }
        if (!connected) {
            console.log("ko");
            document.getElementById("overlay").style.display = "block";
        }
    });
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

function saveFile() {
    var code = document.getElementById("importExport").value.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
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
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    var isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g);
    if (isIE) {
        window.navigator.msSaveOrOpenBlob(textToSaveAsBlob, fileNameToSaveAs);
    } else {
        downloadLink.click();
    }
}

function destroyClickedElement(event) {
    document.body.removeChild(event.target);
}
