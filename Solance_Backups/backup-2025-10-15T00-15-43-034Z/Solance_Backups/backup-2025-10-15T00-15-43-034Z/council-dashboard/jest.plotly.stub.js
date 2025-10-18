const React = require('react');
function PlotStub(props) {
  return React.createElement('div', { 'data-plotly-stub': true }, props.layout?.title || 'Plotly Heatmap');
}
module.exports = PlotStub;
