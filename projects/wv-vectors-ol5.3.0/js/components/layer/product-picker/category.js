import React from 'react';
import PropTypes from 'prop-types';

/*
 * A scrollable list of layers
 * @class LayerList
 * @extends React.Component
 */
class Category extends React.Component {
  render() {
    const {
      category,
      measurementConfig,
      drawMeasurements,
      hasMeasurementSource,
      categoryType
    } = this.props;
    const bgImage = category.image
      ? 'images/wv.layers/categories/' + category.image
      : '';
    const categoryBgImage = bgImage
      ? {
        backgroundImage: `url(${bgImage})`
      }
      : {};

    return (
      <div
        key={category.id}
        className={
          'layer-category layer-category' + interestCssName(categoryType)
        }
        id={category.id}
      >
        <div className="category-background-cover" style={categoryBgImage}>
          <div className="category-background-cover">
            <h3>
              <a
                className="layer-category-name"
                alt={category.title}
                onClick={() => drawMeasurements(category)}
              >
                {category.title}
              </a>
            </h3>
            <ul>
              {category.measurements
                .filter(measurement =>
                  hasMeasurementSource(measurementConfig[measurement])
                )
                .slice(0, 7)
                .map((measurement, index) => {
                  const current = measurementConfig[measurement];
                  if (measurement in measurementConfig === false) {
                    throw new Error(
                      'in category',
                      category.title,
                      'unknown measurement',
                      measurement
                    );
                  }
                  if (measurementConfig[measurement] === undefined) {
                    throw new Error(
                      "Error: Measurement '" +
                        measurement +
                        "' stated in category '" +
                        category.title +
                        "' does not exist " +
                        'in measurement list!'
                    );
                  }
                  return index === 6 ? (
                    <li
                      className="layer-category-item"
                      key={category.id + index}
                    >
                      <a
                        className="layer-category-name"
                        onClick={() => drawMeasurements(category)}
                      >
                        ...
                      </a>
                    </li>
                  ) : (
                    <li
                      className="layer-category-item"
                      key={category.id + index}
                      id={
                        'layer-category-item-' + category.id + '-' + current.id
                      }
                    >
                      <a
                        className="layer-category-name"
                        onClick={() =>
                          drawMeasurements(category, current.id, index)
                        }
                      >
                        {current.title}
                      </a>{' '}
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}
var interestCssName = function(name) {
  if (name === 'hazards and disasters') {
    return 'legacy';
  } else {
    return name;
  }
};
Category.propTypes = {
  category: PropTypes.object,
  measurementConfig: PropTypes.object,
  drawMeasurements: PropTypes.func,
  hasMeasurementSource: PropTypes.func,
  categoryType: PropTypes.string
};

export default Category;
