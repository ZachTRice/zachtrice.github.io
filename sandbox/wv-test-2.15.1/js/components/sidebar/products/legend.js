import React from 'react';
import PropTypes from 'prop-types';
import util from '../../../util/util';
import { drawPaletteOnCanvas } from '../../../palettes/util';
import lodashIsEqual from 'lodash/isEqual';
import lodashIsNumber from 'lodash/isNumber';

class Legend extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isRunningData: props.isRunningData,
      colorHex: props.colorHex,
      isHoveringCanvas: props.isHoveringCanvas,
      legends: props.legends,
      width: this.props.width
    };
  }
  componentWillReceiveProps(props) {
    if (!lodashIsEqual(props.legends, this.state.legends)) {
      this.setState({ legends: props.legends });
    } else {
      let setState = false;
      if (props.isRunningData !== this.state.isRunningData) {
        setState = true;
      }
      if (props.colorHex !== this.state.colorHex) {
        setState = true;
      }
      if (setState) {
        this.setState({
          isRunningData: props.isRunningData,
          colorHex: props.colorHex
        });
      }
    }
  }
  componentDidMount() {
    this.updateCanvas();
  }
  componentDidUpdate() {
    this.updateCanvas();
  }
  /**
   * Get percent of selected point position in parent
   */
  getPercent(len, index) {
    var segmentWidth;
    var location;
    const { width } = this.state;
    if (len < 250) {
      segmentWidth = width / len;
      location = segmentWidth * index + 0.5 * segmentWidth;
      return lodashIsNumber(location / width) ? location / width : 0;
    } else {
      return lodashIsNumber(index / len) ? index / len : 0;
    }
  }
  /**
   * OnMouseMove get correct canvas Data
   * @param {Object} canvas | Element
   * @param {Object} e | Event Object
   */
  onHoverColorbar(canvas, e) {
    e.preventDefault();
    e.stopPropagation();
    var boundingRec = e.target.getBoundingClientRect();
    var x = e.clientX - boundingRec.left;
    var y = e.clientY - boundingRec.top;
    var rgba = canvas.current.getContext('2d').getImageData(x, y, 1, 1).data;
    var hex = util.rgbaToHex(rgba[0], rgba[1], rgba[2]);

    this.setState({
      colorHex: hex
    });
  }
  /**
   * On Mouse Enter update State
   * @param {*} e
   */
  onMouseEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      isRunningData: true,
      isHoveringLegend: true
    });
  }
  /**
   * Find wanted legend object from Hex
   * @param {Object} legend
   * @param {String} hex
   * @param {Number} acceptableDifference
   */
  getLegendObject(legend, hex, acceptableDifference) {
    var units = legend.units || '';
    for (var i = 0, len = legend.colors.length; i < len; i++) {
      if (util.hexColorDelta(legend.colors[i], hex) < acceptableDifference) {
        // If the two colors are close
        return {
          label: legend.tooltips[i] + ' ' + units,
          len: len,
          index: i
        };
      }
    }
    return null;
  }
  /**
   * Update state on MouseOut
   */
  hideValue(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      isRunningData: false,
      isHoveringLegend: false
    });
  }
  /**
   * Style Canvas bases on updates to legend or canvas-width
   */
  updateCanvas() {
    const { checkerBoardPattern, height, width } = this.props;
    const { legends } = this.state;

    legends.forEach((colorMap, index) => {
      if (colorMap.type === 'continuous' || colorMap.type === 'discrete') {
        let ctxStr = 'canvas_' + index;
        if (this[ctxStr]) {
          let newWidth = this[ctxStr].current.getBoundingClientRect().width;
          if (newWidth !== this.state.width) {
            // If scrollbar appears canvas width changes.
            // This value is needed for calculating running data offsets
            this.setState({ width: newWidth });
          }
          drawPaletteOnCanvas(
            this[ctxStr].current.getContext('2d'),
            checkerBoardPattern,
            colorMap.colors,
            width,
            height
          );
        }
      }
    });
  }
  /**
   * Redraw canvas with selected colormap
   * @param {*} ctxStr | String of wanted cavnas
   * @param {*} checkerBoardPattern | Background for canvas threshold
   * @param {*} colors | array of color values
   */
  drawOnCanvas(ctx, checkerBoardPattern, colors) {
    const { height, width } = this.props;
    ctx.fillStyle = checkerBoardPattern;
    ctx.fillRect(0, 0, width, height);

    if (colors) {
      var bins = colors.length;
      var binWidth = width / bins;
      var drawWidth = Math.ceil(binWidth);
      colors.forEach((color, i) => {
        ctx.fillStyle = util.hexToRGBA(color);
        ctx.fillRect(Math.floor(binWidth * i), 0, drawWidth, height);
      });
    }
  }
  /**
   * @param {Number} index | Selected label Index
   * @param {Number} boxWidth | Width of Each label box
   * @param {Number} textWidth | Label width
   * @param {Number} width | Case width
   */
  getClassLabelStyle(index, boxWidth, textWidth, width, rowEndIndex) {
    var halfTextWidth = textWidth / 2 || 0;
    var xOffset = boxWidth * (index - rowEndIndex) + boxWidth / 2 || 0;

    if (halfTextWidth > xOffset) {
      return { textAlign: 'left', visibility: 'visible' };
    } else if (xOffset + halfTextWidth > width) {
      return { textAlign: 'right', visibility: 'visible' };
    }
    return {
      marginLeft: xOffset - halfTextWidth + 'px',
      visibility: 'visible',
      textAlign: 'left'
    };
  }
  /**
   * @param {Number} xOffset | X px Location of running-data
   * @param {Number} textWidth | px width of text calculated with canvas
   * @param {Number} width | Case width
   */
  getRunningLabelStyle(xOffset, textWidth, width) {
    if (!xOffset || !textWidth || !width) return { left: '0' };
    var halfTextWidth = textWidth / 2 || 0;
    if (halfTextWidth > xOffset) {
      return { left: '0' };
    } else if (xOffset + halfTextWidth > width) {
      return { right: '0' };
    }
    return { left: xOffset - halfTextWidth + 'px' };
  }
  /**
   * Render scale-type legends
   * @param {Object} legend
   * @param {Number} index
   * @param {Boolean} isMoreThanOneColorBar
   */
  renderScale(legend, index, isMoreThanOneColorBar) {
    const { layer, width, getPalette } = this.props;
    const { isRunningData, colorHex, isHoveringLegend } = this.state;
    const palette = getPalette(layer.id, index);
    var percent, textWidth, xOffset, legendObj;
    var toolTipLength = legend.tooltips.length;
    if (isRunningData && colorHex && this.state.width > 0) {
      legendObj = this.getLegendObject(legend, colorHex, 5); // {label,len,index}
      if (legendObj) {
        percent = this.getPercent(legendObj.len, legendObj.index);
        textWidth = util.getTextWidth(legendObj.label, 'Lucida Sans');
        xOffset = this.state.width * percent;
      }
    }

    var min = legend.minLabel || legend.tooltips[0];
    var max = legend.maxLabel || legend.tooltips[toolTipLength];
    min = palette.min ? legend.tooltips[palette.min] : min;
    max = palette.max ? legend.tooltips[palette.max] : max;

    min = legend.units ? min + ' ' + legend.units : min;
    max = legend.units ? max + ' ' + legend.units : max;
    return (
      <div
        className={
          legendObj ? 'wv-running wv-palettes-legend' : 'wv-palettes-legend'
        }
        id={layer.id + '_' + legend.id + '_' + index}
        key={layer.id + '_' + legend.id + '_' + index}
      >
        {isMoreThanOneColorBar ? (
          <div className="wv-palettes-title">{legend.title}</div>
        ) : (
          ''
        )}
        <div className="colorbar-case">
          <canvas
            className="wv-palettes-colorbar"
            id={layer.id + '-' + legend.id + index + 'colorbar'}
            width={width}
            height={12}
            ref={this['canvas_' + index]}
            onMouseEnter={this.onMouseEnter.bind(this)}
            onMouseLeave={this.hideValue.bind(this)}
            onMouseMove={this.onHoverColorbar.bind(
              this,
              this['canvas_' + index]
            )}
          />
          <div
            className="wv-running-bar"
            style={{
              left: isHoveringLegend ? 0 : xOffset,
              visibility: legendObj && !isHoveringLegend ? 'visible' : 'hidden'
            }}
          />
        </div>
        <div className="wv-palettes-min">{min}</div>
        <div className="wv-palettes-max"> {max}</div>
        <span
          className="wv-running-label"
          style={
            isRunningData
              ? this.getRunningLabelStyle(xOffset, textWidth, this.state.width)
              : { display: 'none' }
          }
        >
          {legendObj ? legendObj.label : ''}
        </span>
      </div>
    );
  }
  /**
   * Update label & Location on Mousemove
   * @param {String} color | Hex
   * @param {Object} e | Event Object
   */
  onMove(color, e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ colorHex: color });
  }
  /**
   * Render a legend of class type
   * @param {Object} legend | Legend Object
   * @param {Number} index | Legend Index
   */
  renderClasses(legend, index) {
    const { isRunningData, colorHex } = this.state;
    const { width } = this.props;
    const boxWidth = 17; // width (13) + margin (4)
    const len = legend.colors.length;
    const maxInRow = Math.round((this.state.width - 8) / boxWidth);
    var rowEndIndex = 0;
    var isEndOfRow = false;
    var legendObj, textWidth;
    if (isRunningData && colorHex) {
      legendObj = this.getLegendObject(legend, colorHex, 5); // {label,len,index}
      if (legendObj) {
        textWidth = util.getTextWidth(legendObj.label, 'Lucida Sans');
      }
    }
    return (
      <div
        className={
          legendObj
            ? 'wv-running wv-palettes-legend wv-palettes-classes'
            : 'wv-palettes-legend wv-palettes-classes'
        }
        key={legend.id + '_' + index}
      >
        {legend.colors.map((color, index) => {
          rowEndIndex = isEndOfRow ? index : rowEndIndex;
          isEndOfRow = index === maxInRow - 1 || index === len - 1;
          return (
            <React.Fragment key={legend.id + '-color-' + index}>
              <span
                className={
                  legendObj && legendObj.index === index
                    ? 'wv-active wv-palettes-class'
                    : 'wv-palettes-class'
                }
                style={{ backgroundColor: util.hexToRGBA(color) }}
                onMouseMove={this.onMove.bind(this, color)}
                onMouseEnter={this.onMouseEnter.bind(this)}
                onMouseLeave={this.hideValue.bind(this)}
                dangerouslySetInnerHTML={{ __html: '&nbsp' }}
              />
              {isEndOfRow ? (
                <div className="wv-running-category-label-case">
                  {isRunningData &&
                  legendObj &&
                  (legendObj.index >= rowEndIndex && // legend is in this row
                    legendObj.index <= index) ? (
                      <span
                        className="wv-running-category-label"
                        style={this.getClassLabelStyle(
                          legendObj.index,
                          boxWidth,
                          textWidth,
                          width,
                          rowEndIndex
                        )}
                      >
                        {legendObj ? legendObj.label : ''}
                      </span>
                    ) : (
                      ''
                    )}
                </div>
              ) : (
                ''
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
  /**
   * Loop through colormaps and render correct legend type
   */
  renderLegends() {
    const { legends } = this.state;
    return legends.map((colorMap, index) => {
      if (colorMap.type === 'continuous' || colorMap.type === 'discrete') {
        this['canvas_' + index] = React.createRef();
        return this.renderScale(colorMap, index, legends.length > 1);
      } else if (colorMap.type === 'classification') {
        return this.renderClasses(colorMap, index);
      }
    });
  }
  render() {
    const { paletteId, layer } = this.props;
    const { isHoveringLegend } = this.state;
    if (!layer.palette) return;
    return (
      <div
        className={
          isHoveringLegend
            ? 'active-lengend wv-palettes-panel'
            : 'wv-palettes-panel'
        }
        datalayer={layer.id}
        id={paletteId + '_panel'}
      >
        {this.renderLegends()}
      </div>
    );
  }
}
Legend.defaultProps = {
  isRunningData: false,
  isHoveringLegend: false,
  isRunningDataEnabled: true,
  width: 235,
  height: 12
};
Legend.propTypes = {
  paletteId: PropTypes.string,
  layer: PropTypes.object,
  checkerBoardPattern: PropTypes.object,
  isHoveringLegend: PropTypes.bool,
  isRunningDataEnabled: PropTypes.bool,
  getPalette: PropTypes.func,
  legends: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  isRunningData: PropTypes.bool,
  isHoveringCanvas: PropTypes.bool,
  colorHex: PropTypes.string
};

export default Legend;
