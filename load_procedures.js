// this script loads procedures from the constant specified
// folder into agenda, provided with its argument
// luis gustavo miki sao paulo 2017

const fs = require('fs'); 

const proceduresFolder = './procs/';

module.exports = function(agenda) {
  var procs = getProcsList();
  var repository = [];

  procs.forEach(function (jb) {
    loadProc(agenda, proceduresFolder + jb);
    repository.push(jb);
  });

  return repository;
}

function getProcsList() {
  return fs.readdirSync(proceduresFolder);
}

function loadProc(agenda, file_path) {
  require(file_path)(agenda);
}