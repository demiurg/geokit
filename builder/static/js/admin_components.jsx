function bindLayerDownload(layer, dom_element) {
    ReactDOM.render(<LayerDownload layer={layer} />, dom_element);
}

function bindTableDownload(table, dom_element) {
    ReactDOM.render(<TableDownload table={table} />, dom_element);
}

window.bindLayerDownload = bindLayerDownload;
window.bindTableDownload = bindTableDownload;