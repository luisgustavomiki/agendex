// this script loads blueprints from the constant specified
// folder into agenda, provided with its argument
// luis gustavo miki sao paulo 2017

const yaml = require('js-yaml');
const fs = require('fs'); 

const blueprintsFolder = './blueprints/';

module.exports = function(agenda) {
  var blueprints = getBlueprintsList();
  var repository = {};

  blueprints.forEach(function (bp) {
    // schedule starting jobs for all blueprints
    var bp_obj = loadBlueprint(agenda, blueprintsFolder + bp);

    repository[bp_obj.name] = bp_obj; 
  });

  return repository;
}

function getBlueprintsList() {
  return fs.readdirSync(blueprintsFolder);
}

function loadBlueprint(agenda, file_path) {
  var blueprint = yaml.safeLoad(fs.readFileSync(file_path, 'utf8'));

  if(blueprint.enabled) {
    if(blueprint.starter.method === 'polling') {
      var envelope = { 
        blueprint: blueprint.name, 
        params: blueprint.starter.params,
        step: 0,
        filters: {}
      };

      agenda.every(blueprint.starter.every, blueprint.starter.proc, envelope);
    }
  }

  return blueprint;
}