const Agenda = require('agenda');

const _ = require("lodash");
const assert = require('assert');
const uuidv4 = require('uuid/v4');

const load_blueprints_script = './load_blueprints.js';
const load_procedures_script = './load_procedures.js';

var blueprintRepository = {};

const STEP_TYPE_INVALID = 0;
const STEP_TYPE_PROC = 1;
const STEP_TYPE_BREAK_ARRAY = 2;

/* 
  .: Initialization :.
*/

const mongoConnectionString = 'mongodb://127.0.0.1/agenda';
var agenda = new Agenda({db: {address: mongoConnectionString}});

agenda.on('ready', function() {
  var proceduresRepository = require(load_procedures_script)(agenda);
  blueprintRepository = require(load_blueprints_script)(agenda);

  console.log("Lodaded %d blueprints.", _.size(blueprintRepository));
  console.log("Lodaded %d procedures.", _.size(proceduresRepository));

  agenda.start();
});

/* 
	.: Envelope Object Structure :. 
	
	{
    uuid: "", // unique identifier to the event, changes within the orchestration only when child events are spawned
		blueprint: "blueprint.name", // name of the orchestration the envelope is running.
		params: {}, // params passed from the configuration to the procedure, changes every proc call throughout the orchestration run
		step: 0, // current step this envelope has progressed through the orchestration/blueprint 
		data: {} // current data from the envelope
	}

  .: Blueprint Steps :.

    Every event starts on step 0 (starter) then it progresses through the 'procs' 

*/

/*
  .: Parameter resolving :.

    params: 
      specific_parameter_1: "foobar" # raw string or any other primitive value
      specific_parameter_2: { ~filter: "1" } # indicate agendex to fetch from filter
      specific_parameter_3: { ~data } # fetch from data itself
      specific_parameter_4: { ~xpath: { ~source: ~data, ~path: "/bookstore/book/title" } }
      specific_parameter_4: { ~jpath: { ~source: { ~filter: 1 }, ~path: { ~data } } }
*/

function execute(envelope, blueprint_name, step) {
  if(!envelope.uuid) {
    envelope.uuid = uuidv4();
    console.log("Assigning uuid %s to new event %s.", envelope.uuid, blueprint_name);
  }

  // event cannot go back to starter procedure.
  assert.notEqual(step, 0);

  var blueprint = blueprintRepository[blueprint_name];
  // blueprint must exist
  assert(blueprint);

  // because the starter proc does not count as a
  // step in the 'steps' array, we must subtract one
  var actual_step = step - 1;
  var blueprint_step = blueprint.steps[actual_step];
  // step must be valid within the blueprint context
  assert(blueprint_step);

  // cleaning up
  envelope.params = {}; 

  var step_type = getStepType(blueprint_step);  
  if(step_type == STEP_TYPE_BREAK_ARRAY) {
    assert(_.isArray(envelope.data));

    // keeping in record the old uuid
    envelope.parent_uuid = envelope.uuid;
    var whole_data = envelope.data; 
    whole_data.forEach(function(obj) {
      // assigning new uuid to this new descending event
      envelope.uuid = uuidv4();
      // breaking the portion for this call
      envelope.data = obj;

      console.log("Descending new event %s->%s (%s) to next proc.", envelope.parent_uuid, envelope.uuid, envelope.blueprint);
      // do the magic
      execute(envelope, envelope.blueprint, step + 1);
    });
  } else if(step_type == STEP_TYPE_PROC) {
    console.log("Dispatching event %s (%s) to proc %s.", envelope.uuid, envelope.blueprint, blueprint_step.proc);

    envelope.blueprint = blueprint_name;
    envelope.step = step;
    envelope.params = blueprint_step.params;

    agenda.now(blueprint_step.proc, envelope);    
  } else {
    console.log("Execute resolving led to unknown step type.");
  }
}

function getStepType(blueprint_step) {
  if(_.isString(blueprint_step)) {
    if(blueprint_step == "break-array") {
      return STEP_TYPE_BREAK_ARRAY;
    }
  } else if(_.isObject(blueprint_step)) {
    return STEP_TYPE_PROC;
  }
  return STEP_TYPE_INVALID;
}

agenda.on('complete', function(job) {
  console.log("Completed job %s.", job.attrs.name);

  var envelope = job.attrs.data;
  var blueprint = blueprintRepository[envelope.blueprint];  

  var step_before = envelope.step; 
  var actual_step_before = step_before - 1; // proc array step

  var step_after = step_before + 1;
  var actual_step_after = actual_step_before + 1; // proc array step

  console.log(envelope);
  var next_step = blueprint.steps[actual_step_after];
  if(next_step) {
    execute(envelope, blueprint.name, step_after);
  } else {
    console.log("Event %s (%s) is finished.", envelope.uuid, envelope.blueprint);
  }
});

function graceful() {
  agenda.stop(function() {
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);