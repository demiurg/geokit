import React from 'react'
import ReactDOM from 'react-dom'

import Map from './Map'
import Graph from './Graph'


function bindMap(variable_id, dom_element) {
    ReactDOM.render(<Map variable_id={variable_id} />, dom_element);
}

function bindGraph(variable_id, dom_element) {
    ReactDOM.render(<Graph variable_id={variable_id} />, dom_element);
}

window.bindMap = bindMap;
window.bindGraph = bindGraph;
