import React from 'react';
import ReactDOM from 'react-dom';

import LayerDownload from './LayerDownload';


function bindLayerDownload(layer, dom_element) {
    ReactDOM.render(<LayerDownload layer={layer} />, dom_element);
}

window.bindLayerDownload = bindLayerDownload;
