import React from 'react'
import ReactDOM from 'react-dom'

import Map from './Map'
import Graph from './Graph'
import Table from './Table'


function bindMap(variable, color_ramp, dom_element) {
    ReactDOM.render(<Map variable_id={variable.id} variable_name={variable.name} color_ramp={color_ramp} />, dom_element);
}

function bindGraph(variable, dom_element) {
    ReactDOM.render(<Graph variable_id={variable.id} variable_name={variable.name} />, dom_element);
}

function bindTable(variable, dom_element) {
    ReactDOM.render(<Table variable_id={variable.id} variable_name={variable.name} />, dom_element);
}

window.bindMap = bindMap;
window.bindGraph = bindGraph;
window.bindTable = bindTable;
