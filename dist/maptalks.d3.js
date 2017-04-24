/*!
 * maptalks.d3 v0.1.0
 * LICENSE : MIT
 * (c) 2016-2017 maptalks.org
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks'], factory) :
	(factory((global.maptalks = global.maptalks || {}),global.maptalks));
}(this, (function (exports,maptalks) { 'use strict';

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var TRANSFORM = maptalks.DomUtil['TRANSFORM'];

function createContainer() {
    var ns = 'http://www.w3.org/2000/svg';
    var paper = document.createElementNS(ns, 'svg');
    paper.style.overflow = '';
    paper.style.position = 'absolute';
    paper.setAttribute('xmlns', ns);
    var defs = document.createElementNS(ns, 'defs');
    paper.appendChild(defs);
    paper.defs = defs;
    return paper;
}

var options = {
    'd3Version': 4, // 3, 4
    'container': 'front', // front, back
    'renderer': 'canvas', //'dom/canvas'
    'hideWhenZooming': false
};

/**
 * @classdesc
 * Base layer to visualize data with [d3js]{@link http://www.d3js.org}
 * @class
 * @category layer
 * @extends {maptalks.Layer}
 * @param {String|Number} id - layer's id
 * @param {Object} [options=null] - construct options, including the options defined in [maptalks.Layer]{@link maptalks.Layer#options}
 */
var D3Layer = function (_maptalks$Layer) {
    _inherits(D3Layer, _maptalks$Layer);

    function D3Layer(id, options) {
        _classCallCheck(this, D3Layer);

        return _possibleConstructorReturn(this, _maptalks$Layer.call(this, id, options));
    }

    /**
     * Whether rendered by HTML5 Canvas2D
     * @return {Boolean}
     */


    D3Layer.prototype.isCanvasRender = function isCanvasRender() {
        if (this.options['renderer'] === 'canvas') {
            return true;
        }
        return false;
    };

    D3Layer.prototype.prepareToDraw = function prepareToDraw() /*projection*/{
        return null;
    };

    /**
     * Draw the D3Layer
     * This is an abstract interface method for subclasses to implement.
     * @param  {SVG|Canvas} context    - context for D3 to draw on, possiblly a SVG element or a canvas.
     * @param  {Function} projection   - A D3 projection function to projection geodesic coordinate to 2D point.
     */


    D3Layer.prototype.draw = function draw() /*context, projection*/{
        //draw the layer, interface to implement.
        return this;
    };

    /**
     * request layer to redraw
     */


    D3Layer.prototype.redraw = function redraw() {
        //request layer to refresh
        if (this.isCanvasRender()) {
            this._getRenderer().requestMapToRender();
        }
        return this;
    };

    D3Layer.prototype.getContext = function getContext() {
        return this._getRenderer().context;
    };

    D3Layer.prototype.getGeoProjection = function getGeoProjection() {
        return this._getRenderer().getGeoProjection();
    };

    return D3Layer;
}(maptalks.Layer);

D3Layer.mergeOptions(options);

D3Layer.registerRenderer('dom', function () {
    function _class(layer) {
        _classCallCheck(this, _class);

        this.layer = layer;
        this._initContainer();
    }

    _class.prototype.getMap = function getMap() {
        return this.layer.getMap();
    };

    _class.prototype.render = function render() {
        if (!this._predrawn) {
            this._drawContext = this.layer.prepareToDraw(this.context, this.layer.getGeoProjection());
            if (!this._drawContext) {
                this._drawContext = [];
            }
            if (!Array.isArray(this._drawContext)) {
                this._drawContext = [this._drawContext];
            }
            this._predrawn = true;
        }
        if (!this._drawed) {
            var args = [this.layer.getContext(), this.layer.getGeoProjection()].concat(this._drawContext);
            this.layer.draw.apply(this.layer, args);
            this._drawed = true;
        }
        this.layer.fire('layerload');
        return true;
    };

    _class.prototype.setZIndex = function setZIndex(z) {
        this._zIndex = z;
        this._layerContainer.style.zIndex = 100 + z;
    };

    _class.prototype.getEvents = function getEvents() {
        return {
            'zoomend': this.onZoomEnd,
            'zoomstart': this.onZoomStart,
            'moving': this.onMoving,
            'moveend': this._refreshViewBox,
            'resize': this._refreshViewBox,
            'zooming': this.onZooming,
            'pitch': this._refreshViewBox,
            'rotate': this._refreshViewBox
        };
    };

    _class.prototype.onMoving = function onMoving() {
        if (this.getMap().getPitch()) {
            this._refreshViewBox();
        }
    };

    _class.prototype.onZoomEnd = function onZoomEnd() {
        this._resetContainer();
        if (this.layer.options['hideWhenZooming'] || !this._canTransform() || this.getMap().domCssMatrix) {
            this._layerContainer.style.display = '';
        }
    };

    _class.prototype.onZoomStart = function onZoomStart() {
        if (this.layer.options['hideWhenZooming'] || !this._canTransform() || this.getMap().domCssMatrix) {
            this._layerContainer.style.display = 'none';
        }
    };

    _class.prototype.onZooming = function onZooming(param) {
        if (this._layerContainer.style.display !== 'none') {
            maptalks.DomUtil.setTransformMatrix(this._layerContainer, param.matrix['container']);
        }
    };

    _class.prototype.getGeoProjection = function getGeoProjection() {
        var map = this.getMap();
        if (!this._d3zoom) {
            this._d3zoom = map.getZoom();
        }
        var me = this;
        var d3v = this.layer.options['d3Version'];
        var proj = function proj(x, y) {
            if (x[0] && x[1]) {
                x = [x[0], x[1]];
            }
            var point = map.coordinateToPoint(new maptalks.Coordinate(x, y), me._d3zoom);
            if (this && this.stream) {
                this.stream.point(point.x, point.y);
            }
            return [point.x, point.y];
        };
        if (d3v === 3) {
            return proj;
        } else if (d3v === 4) {
            return d3.geoTransform({
                point: proj
            });
        }
        return null;
    };

    _class.prototype.remove = function remove() {
        delete this.context;
        maptalks.DomUtil.removeDomNode(this._layerContainer);
        delete this._layerContainer;
        delete this._viewBox;
        delete this._d3zoom;
        delete this.layer;
    };

    _class.prototype._canTransform = function _canTransform() {
        return maptalks.Browser.any3d || maptalks.Browser.ie9;
    };

    _class.prototype._getContainerPos = function _getContainerPos() {
        var map = this.getMap(),
            center = map.getCenter(),
            zoom = this._d3zoom || map.getZoom();
        var point = map.coordinateToPoint(center, zoom),
            scale = 1;
        return [point, scale];
    };

    _class.prototype._initContainer = function _initContainer() {
        var map = this.getMap();
        this._layerContainer = maptalks.DomUtil.createElOn('div', 'position:absolute;left:0px;top:0px;');
        this.context = createContainer();
        this._layerContainer.appendChild(this.context);
        this._resetContainer();

        var parentContainer = this.layer.options['container'] === 'front' ? map._panels['frontLayer'] : map._panels['backLayer'];
        parentContainer.appendChild(this._layerContainer);
    };

    _class.prototype._resetContainer = function _resetContainer() {
        this.context.style.transform = '';
        this._refreshViewBox();
    };

    _class.prototype._refreshViewBox = function _refreshViewBox() {
        var map = this.getMap();
        var size = map.getSize(),
            res = map._getResolution(),
            d3z = this._d3zoom || map.getZoom(),
            d3res = map._getResolution(d3z),
            scale = res / d3res;
        this.context.setAttribute('width', size.width);
        this.context.setAttribute('height', size.height);
        var point = map.coordinateToPoint(map.getCenter(), d3z);
        this._viewBox = [point.x - size.width * scale / 2, point.y - size.height * scale / 2, size.width * scale, size.height * scale];

        this.context.setAttribute('viewBox', this._viewBox.join(' '));

        var container = this._layerContainer;
        container.style.transform = '';

        if (map.domCssMatrix) {
            var _size = map.getSize();
            if (parseInt(container.style.width) !== _size['width'] || parseInt(container.style.height) !== _size['height']) {
                container.style.width = _size['width'] + 'px';
                container.style.height = _size['height'] + 'px';
            }
            var matrix = maptalks.Util.join(map.domCssMatrix);
            container.style[TRANSFORM] = 'matrix3D(' + matrix + ')';
        } else {
            maptalks.DomUtil.removeTransform(container);
            if (container.style.width || container.style.height) {
                container.style.width = null;
                container.style.height = null;
            }
        }
        var offset = map.offsetPlatform();
        container.style.left = -offset.x + 'px';
        container.style.top = -offset.y + 'px';
    };

    return _class;
}());

D3Layer.registerRenderer('canvas', function (_maptalks$renderer$Ca) {
    _inherits(_class2, _maptalks$renderer$Ca);

    function _class2() {
        _classCallCheck(this, _class2);

        return _possibleConstructorReturn(this, _maptalks$renderer$Ca.apply(this, arguments));
    }

    _class2.prototype.remove = function remove() {
        delete this._drawContext;
        maptalks.renderer.Canvas.prototype.remove.call(this);
    };

    _class2.prototype.getGeoProjection = function getGeoProjection() {
        var map = this.getMap();
        var proj = function proj(x, y) {
            if (x[0] && x[1]) {
                x = [x[0], x[1]];
            }
            var point = map.coordinateToContainerPoint(new maptalks.Coordinate(x, y));
            if (this && this.stream) {
                this.stream.point(point.x, point.y);
            }
            return [point.x, point.y];
        };
        var d3v = this.layer.options['d3Version'];
        if (d3v === 3) {
            return proj;
        } else if (d3v === 4) {
            return d3.geoTransform({
                point: proj
            });
        }
    };

    _class2.prototype.draw = function draw() {
        this.prepareCanvas();
        if (!this._predrawn) {
            this._armContext();
            this._drawContext = this.layer.prepareToDraw(this.context, this.layer.getGeoProjection());
            if (!this._drawContext) {
                this._drawContext = [];
            }
            if (!Array.isArray(this._drawContext)) {
                this._drawContext = [this._drawContext];
            }
            this._predrawn = true;
        }

        this.layer.draw.apply(this.layer, [this.context, this.layer.getGeoProjection()].concat(this._drawContext));
        this.completeRender();
    };

    _class2.prototype._armContext = function _armContext() {
        if (!this.context) {
            return;
        }
        var map = this.getMap();
        this.context.arcInMeter = function (x, y, radius, startAngle, endAngle, anticlockwise) {
            var px = map.distanceToPixel(radius, 0);
            return this.arc(x, y, px['width'], startAngle, endAngle, anticlockwise);
        };
        this.context.arcToInMeter = function (x1, y1, x2, y2, radius) {
            var px = map.distanceToPixel(radius, 0);
            return this.arcTo(x1, y1, x2, y2, px['width']);
        };
        if (this.context.ellipse) {
            this.context.ellispeInMeter = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
                var px = map.distanceToPixel(radiusX, radiusY);
                return this.ellipse(x, y, px['width'], px['height'], rotation, startAngle, endAngle, anticlockwise);
            };
        }
        this.context.rectInMeter = function (x, y, width, height) {
            var px = map.distanceToPixel(width, height);
            return this.rect(x, y, px['width'], px['height']);
        };
    };

    return _class2;
}(maptalks.renderer.CanvasRenderer));

exports.D3Layer = D3Layer;

Object.defineProperty(exports, '__esModule', { value: true });

})));
