// set of unique dates in data set
function set_dates(data_set) {
  var result_dates = [], prev;
  var dateLen = data_set.length;
  data_set.sort(function (a,b){
    return new Date(a.scan_date) - new Date(b.scan_date);
  });
  for (i = 0; i < dateLen; i++) {
    if (data_set[i].scan_date != prev) {
        result_dates.push(data_set[i].scan_date);
    }
    prev = data_set[i].scan_date;
  }
  return result_dates
};

// set of unique computer names in data set
function set_names(data_set) {
  var result_names = [], prev;
  var nameLen = data_set.length;
  data_set.sort(function (a,b){
    if(a.computer_name < b.computer_name) return -1;
    if(a.computer_name > b.computer_name) return 1;
    return 0;
  });
  for (i = 0; i < nameLen; i++) {
    if (data_set[i].computer_name != prev) {
      result_names.push(data_set[i].computer_name);
    }
    prev = data_set[i].computer_name;
  }
  return result_names
};

// set the state for each computer_name in name_set, for each scan_date in date_set.
// states will be used to populate the sankey.stack and sankey.setData
function set_state(data_set, dates, names, factor) {
  var result_states = [];
  var transitions = [];
  var sumTransitions = [];
  var result_transition = [];
  var dateLen = dates.length;
  var nameLen = names.length;
  var index = 0;
  var state = "";
  var prev_state = "";
  var curr_state = "";
  var colour = "";
  var prev_index = 0;
  var curr_index = 0;
  for (i = 0; i < dateLen; i++) {
    for (j = 0; j < nameLen; j++) {
      index = data_set.findIndex(function (element){
        return element.scan_date === dates[i] && element.computer_name === names[j];
      });
      if (index >= 0) {
        if (data_set[index].malwares_found == 0) {state = "Clean"}
            if (data_set[index].malwares_found != 0 &&
          data_set[index].malwares_found == data_set[index].malwares_quarantined) {state = "Cleaned"}
        if (data_set[index].malwares_found > data_set[index].malwares_quarantined) {state = "Compromised"}
        if (data_set[index].error_code == "SCAN_ERROR") {state = "Failed"}
        result_states.push({scan_date:dates[i],
                  computer_name:names[j],
                  scan_state: state,
                  malwares_found: data_set[index].malwares_found,
                  malwares_quarantined: data_set[index].malwares_quarantined
                  });
      } //end of if index >= 0
      else {
        state = "Disconnected";
        result_states.push({scan_date:dates[i],
                  computer_name:names[j],
                  scan_state: state,
                  malwares_found: undefined,
                  malwares_quarantined: undefined
                  });
      } //end else

      if (i > 0) {
              prev_index = result_states.findIndex(function (element){
                  return element.scan_date === dates[i-1] && element.computer_name === names[j];
              });
        curr_index = result_states.findIndex(function (element){
                  return element.scan_date === dates[i] && element.computer_name === names[j];
              });
              prev_state = result_states[prev_index].scan_state+[i-1];
              curr_state = result_states[curr_index].scan_state+[i];
              switch (curr_state.substring(0,curr_state.length-1)) {
                  case "Compromised":
            colour = "red";
            break;
          case "Cleaned":
            colour = "blue";
            break;
          case "Failed":
            colour = "grey";
            break;
          case "Disconnected":
            colour = "black";
            break;
          case "Clean":
            colour = "green";
            break;
          default: "orange"
        }
        transitions.push({prev_state: prev_state,
                                  computer_count: 1 * (factor/100),
                                  curr_state: curr_state,
                                  colour: colour
                                });
      }//end if i > 0
    } //end for j
  } //end for i

  sumTransitions = count_transitions(transitions);

  for (k=0; k < sumTransitions.length; k++) {
    for (m=0; m < 4; m++) {
      result_transition.push([
                  sumTransitions[k].key,
                  sumTransitions[k].values[m].values[0].value.computer_count,
                  sumTransitions[k].values[m].key,
                  sumTransitions[k].values[m].values[0].key
                  ]);
    }
  }
  return result_transition;
}; //end set_state function

// summarize counts by state by day
function count_transitions(data_set, handling) {
  var sumData = d3.nest()
    .key(function(d) {return d.prev_state;})
    .key(function(d) {return d.curr_state;})
    .key(function(d) {return d.colour;})
    .rollup(function(values) {return {computer_count: d3.sum(values, function(d) {return +d.computer_count})}})
    .entries(data_set);

  return sumData;
} //end count_states function
