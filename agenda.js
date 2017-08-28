const Agenda = require('agenda');

const yaml = require('js-yaml');
const fs = require('fs'); 
const _ = require("underscore");

const blueprintsFolder = './blueprints/';
const procsFolder = './procs/';

var blueprintsList = {};

const mongoConnectionString = 'mongodb://127.0.0.1/agenda';
var agenda = new Agenda({db: {address: mongoConnectionString}});

function getBlueprintsList() {
	return fs.readdirSync(blueprintsFolder);
}

function getProcsList() {
	return fs.readdirSync(procsFolder);
}

function loadBlueprint(file_path) {
  var blueprint = yaml.safeLoad(fs.readFileSync(file_path, 'utf8'));

  blueprintsList[blueprint.name] = blueprint;

  if(blueprint.starter.method === 'polling') {
    var envelope = { 
      blueprint: blueprint.name, 
      params: blueprint.starter.params,
      step: 0
    };

  	agenda.every(blueprint.starter.every, blueprint.starter.proc, envelope);
  }
}

function loadProc(file_path) {
  require(file_path)(agenda);
}


agenda.on('ready', function() {
  var procs = getProcsList();

  procs.forEach(function (jb) {
    loadProc(procsFolder + jb);
  });

  var blueprints = getBlueprintsList();

  blueprints.forEach(function (bp) {
  	// schedule starting jobs for all blueprints
  	loadBlueprint(blueprintsFolder + bp);
  });

  agenda.start();
});

agenda.on('complete', function(job) {
  var envelope = job.attrs.data;
  var blueprint = blueprintsList[envelope.blueprint];  
  var procs = blueprint.procs;

  console.log("THIS STEP -> " + envelope.step);

  if(procs && procs[envelope.step]) {
    envelope.step++;

    if(_.isString(procs[envelope.step-1])) {
      if(procs[envelope.step-1] == "break-array") {
        if(_.isArray(envelope.data)) {
          var whole_data = envelope.data; 
          whole_data.forEach(function(obj) {
            envelope.data = obj;

            // This is not -1 because "break-array" is not actually a proc
            console.log("sending from break-array to " + procs[envelope.step].proc);
            agenda.now(procs[envelope.step].proc, envelope);  
          });
        }
      }
    } else {
      console.log("(bp) %s - followup from %s (%d)", envelope.blueprint, getCurrentProcFromJob(envelope), envelope.step);
      agenda.now(procs[envelope.step-1].proc, envelope);  
    }
  } else {
    console.log("(bp) %s - end from %s (%d)", envelope.blueprint, getCurrentProcFromJob(envelope), envelope.step);
  }
});

// Get the Proc name from the specified blueprint &
// step specified within the envelope
function getCurrentProcFromJob(envelope) {
  var blueprint = blueprintsList[envelope.blueprint];
  if(envelope.step == 0) {
    return blueprint.starter.proc;
  } else {
    // for cases like "break-array" which the proc spec
    // is not a whole object but only a string
    if(_.isString(blueprint.procs[envelope.step-1])) {
      return blueprint.procs[envelope.step-1];
    } else {
      return blueprint.procs[envelope.step-1].proc;
    }
  }
}

function graceful() {
  agenda.stop(function() {
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);