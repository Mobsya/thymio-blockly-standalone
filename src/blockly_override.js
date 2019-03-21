'use strict';
var Blockly = require('@mobsya/node-blockly/browser');

Blockly.Names.prototype.safeName_ = function(name) {
  if (!name) {
    name = 'unnamed';
  } else {
    name=name.replace(/ /g, '_').replace(/[^\àâäèéêëîïöôœùûüÿçÀÂÄÈÉÊËÎÏÖÔŒÙÛÜŸÇ_.]+/g, '_');
    if ('0123456789'.indexOf(name[0]) != -1) {
      name = '_' + name;
    }
    if ('.'.indexOf(name[0]) != -1) {
      name = name.substr(1);
    }
  }
  return name;
};

