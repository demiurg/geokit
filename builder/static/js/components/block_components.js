import React from 'react'
import ReactDOM from 'react-dom'

import Map from './Map'


function bindMap(variable_id, dom_element) {
    ReactDOM.render(<Map variable_id={variable_id} />, dom_element);
}

window.bindMap = bindMap;
