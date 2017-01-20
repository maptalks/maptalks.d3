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
    'container': 'front',
    'renderer': 'dom', //'dom/canvas'
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

    D3Layer.prototype.getSize = function getSize() {
        return this.getMap().getSize();
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
        if (!this._drawed) {
            this.layer.draw(this.layer.getContext(), this.layer.getGeoProjection());
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
            'moveend': this._refreshViewBox,
            'resize': this._refreshViewBox,
            'zooming': this.onZooming
        };
    };

    _class.prototype.onZoomEnd = function onZoomEnd() {
        this._resetContainer();
        if (this.layer.options['hideWhenZooming'] || !this._canTransform()) {
            this._layerContainer.style.display = '';
        }
    };

    _class.prototype.onZoomStart = function onZoomStart() {
        if (this.layer.options['hideWhenZooming'] || !this._canTransform()) {
            this._layerContainer.style.display = 'none';
        }
    };

    _class.prototype.onZooming = function onZooming(param) {
        maptalks.DomUtil.setTransformMatrix(this._layerContainer, param.matrix['container']);
    };

    _class.prototype.getGeoProjection = function getGeoProjection() {
        var map = this.getMap();
        if (!this._d3zoom) {
            this._d3zoom = map.getZoom();
        }
        var me = this;
        return function (x, y) {
            if (x[0] && x[1]) {
                x = [x[0], x[1]];
            }
            var point = map.coordinateToPoint(new maptalks.Coordinate(x, y), me._d3zoom);
            if (this && this.stream) {
                this.stream.point(point.x, point.y);
            }
            return [point.x, point.y];
        };
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

        this._layerContainer.style.transform = '';

        var offset = map.offsetPlatform();
        this._layerContainer.style.left = -offset.x + 'px';
        this._layerContainer.style.top = -offset.y + 'px';
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
        return function (x, y) {
            if (x[0] && x[1]) {
                x = [x[0], x[1]];
            }
            var point = map.coordinateToContainerPoint(new maptalks.Coordinate(x, y));
            if (this && this.stream) {
                this.stream.point(point.x, point.y);
            }
            return [point.x, point.y];
        };
    };

    _class2.prototype.draw = function draw() {
        this.prepareCanvas();
        if (!this._predrawed) {
            this._armContext();
            this._drawContext = this.layer.prepareToDraw(this.context, this.layer.getGeoProjection());
            if (!this._drawContext) {
                this._drawContext = [];
            }
            if (!Array.isArray(this._drawContext)) {
                this._drawContext = [this._drawContext];
            }
            this._predrawed = true;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwdGFsa3MuZDMuanMiLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIG1hcHRhbGtzIGZyb20gJ21hcHRhbGtzJztcblxuZnVuY3Rpb24gY3JlYXRlQ29udGFpbmVyKCkge1xuICAgIGNvbnN0IG5zID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgICBjb25zdCBwYXBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucywgJ3N2ZycpO1xuICAgIHBhcGVyLnN0eWxlLm92ZXJmbG93ID0gJyc7XG4gICAgcGFwZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHBhcGVyLnNldEF0dHJpYnV0ZSgneG1sbnMnLCBucyk7XG4gICAgY29uc3QgZGVmcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucywgJ2RlZnMnKTtcbiAgICBwYXBlci5hcHBlbmRDaGlsZChkZWZzKTtcbiAgICBwYXBlci5kZWZzID0gZGVmcztcbiAgICByZXR1cm4gcGFwZXI7XG59XG5cbmNvbnN0IG9wdGlvbnMgPSB7XG4gICAgJ2NvbnRhaW5lcicgOiAnZnJvbnQnLFxuICAgICdyZW5kZXJlcicgOiAnZG9tJywgLy8nZG9tL2NhbnZhcydcbiAgICAnaGlkZVdoZW5ab29taW5nJyA6IGZhbHNlXG59O1xuXG4vKipcbiAqIEBjbGFzc2Rlc2NcbiAqIEJhc2UgbGF5ZXIgdG8gdmlzdWFsaXplIGRhdGEgd2l0aCBbZDNqc117QGxpbmsgaHR0cDovL3d3dy5kM2pzLm9yZ31cbiAqIEBjbGFzc1xuICogQGNhdGVnb3J5IGxheWVyXG4gKiBAZXh0ZW5kcyB7bWFwdGFsa3MuTGF5ZXJ9XG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IGlkIC0gbGF5ZXIncyBpZFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPW51bGxdIC0gY29uc3RydWN0IG9wdGlvbnMsIGluY2x1ZGluZyB0aGUgb3B0aW9ucyBkZWZpbmVkIGluIFttYXB0YWxrcy5MYXllcl17QGxpbmsgbWFwdGFsa3MuTGF5ZXIjb3B0aW9uc31cbiAqL1xuZXhwb3J0IGNsYXNzIEQzTGF5ZXIgZXh0ZW5kcyBtYXB0YWxrcy5MYXllciB7XG5cbiAgICBjb25zdHJ1Y3RvcihpZCwgb3B0aW9ucykge1xuICAgICAgICBzdXBlcihpZCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciByZW5kZXJlZCBieSBIVE1MNSBDYW52YXMyRFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgaXNDYW52YXNSZW5kZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnNbJ3JlbmRlcmVyJ10gPT09ICdjYW52YXMnKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHJlcGFyZVRvRHJhdygvKnByb2plY3Rpb24qLykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEcmF3IHRoZSBEM0xheWVyXG4gICAgICogVGhpcyBpcyBhbiBhYnN0cmFjdCBpbnRlcmZhY2UgbWV0aG9kIGZvciBzdWJjbGFzc2VzIHRvIGltcGxlbWVudC5cbiAgICAgKiBAcGFyYW0gIHtTVkd8Q2FudmFzfSBjb250ZXh0ICAgIC0gY29udGV4dCBmb3IgRDMgdG8gZHJhdyBvbiwgcG9zc2libGx5IGEgU1ZHIGVsZW1lbnQgb3IgYSBjYW52YXMuXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IHByb2plY3Rpb24gICAtIEEgRDMgcHJvamVjdGlvbiBmdW5jdGlvbiB0byBwcm9qZWN0aW9uIGdlb2Rlc2ljIGNvb3JkaW5hdGUgdG8gMkQgcG9pbnQuXG4gICAgICovXG4gICAgZHJhdygvKmNvbnRleHQsIHByb2plY3Rpb24qLykge1xuICAgICAgICAvL2RyYXcgdGhlIGxheWVyLCBpbnRlcmZhY2UgdG8gaW1wbGVtZW50LlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXF1ZXN0IGxheWVyIHRvIHJlZHJhd1xuICAgICAqL1xuICAgIHJlZHJhdygpIHtcbiAgICAgICAgLy9yZXF1ZXN0IGxheWVyIHRvIHJlZnJlc2hcbiAgICAgICAgaWYgKHRoaXMuaXNDYW52YXNSZW5kZXIoKSkge1xuICAgICAgICAgICAgdGhpcy5fZ2V0UmVuZGVyZXIoKS5yZXF1ZXN0TWFwVG9SZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXRDb250ZXh0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0UmVuZGVyZXIoKS5jb250ZXh0O1xuICAgIH1cblxuICAgIGdldFNpemUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldE1hcCgpLmdldFNpemUoKTtcbiAgICB9XG5cbiAgICBnZXRHZW9Qcm9qZWN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0UmVuZGVyZXIoKS5nZXRHZW9Qcm9qZWN0aW9uKCk7XG4gICAgfVxufVxuXG5EM0xheWVyLm1lcmdlT3B0aW9ucyhvcHRpb25zKTtcblxuRDNMYXllci5yZWdpc3RlclJlbmRlcmVyKCdkb20nLCBjbGFzcyB7XG5cbiAgICBjb25zdHJ1Y3RvcihsYXllcikge1xuICAgICAgICB0aGlzLmxheWVyID0gbGF5ZXI7XG4gICAgICAgIHRoaXMuX2luaXRDb250YWluZXIoKTtcbiAgICB9XG5cbiAgICBnZXRNYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxheWVyLmdldE1hcCgpO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9kcmF3ZWQpIHtcbiAgICAgICAgICAgIHRoaXMubGF5ZXIuZHJhdyh0aGlzLmxheWVyLmdldENvbnRleHQoKSwgdGhpcy5sYXllci5nZXRHZW9Qcm9qZWN0aW9uKCkpO1xuICAgICAgICAgICAgdGhpcy5fZHJhd2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxheWVyLmZpcmUoJ2xheWVybG9hZCcpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzZXRaSW5kZXgoeikge1xuICAgICAgICB0aGlzLl96SW5kZXggPSB6O1xuICAgICAgICB0aGlzLl9sYXllckNvbnRhaW5lci5zdHlsZS56SW5kZXggPSAxMDAgKyB6O1xuICAgIH1cblxuICAgIGdldEV2ZW50cygpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICd6b29tZW5kJyA6IHRoaXMub25ab29tRW5kLFxuICAgICAgICAgICAgJ3pvb21zdGFydCcgOiB0aGlzLm9uWm9vbVN0YXJ0LFxuICAgICAgICAgICAgJ21vdmVlbmQnIDogdGhpcy5fcmVmcmVzaFZpZXdCb3gsXG4gICAgICAgICAgICAncmVzaXplJyAgOiB0aGlzLl9yZWZyZXNoVmlld0JveCxcbiAgICAgICAgICAgICd6b29taW5nJyA6IHRoaXMub25ab29taW5nXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgb25ab29tRW5kKCkge1xuICAgICAgICB0aGlzLl9yZXNldENvbnRhaW5lcigpO1xuICAgICAgICBpZiAodGhpcy5sYXllci5vcHRpb25zWydoaWRlV2hlblpvb21pbmcnXSB8fCAhdGhpcy5fY2FuVHJhbnNmb3JtKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2xheWVyQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uWm9vbVN0YXJ0KCkge1xuICAgICAgICBpZiAodGhpcy5sYXllci5vcHRpb25zWydoaWRlV2hlblpvb21pbmcnXSB8fCAhdGhpcy5fY2FuVHJhbnNmb3JtKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2xheWVyQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvblpvb21pbmcocGFyYW0pIHtcbiAgICAgICAgbWFwdGFsa3MuRG9tVXRpbC5zZXRUcmFuc2Zvcm1NYXRyaXgodGhpcy5fbGF5ZXJDb250YWluZXIsIHBhcmFtLm1hdHJpeFsnY29udGFpbmVyJ10pO1xuICAgIH1cblxuICAgIGdldEdlb1Byb2plY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IHRoaXMuZ2V0TWFwKCk7XG4gICAgICAgIGlmICghdGhpcy5fZDN6b29tKSB7XG4gICAgICAgICAgICB0aGlzLl9kM3pvb20gPSBtYXAuZ2V0Wm9vbSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1lID0gdGhpcztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICBpZiAoeFswXSAmJiB4WzFdKSB7XG4gICAgICAgICAgICAgICAgeCA9IFt4WzBdLCB4WzFdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHBvaW50ID0gbWFwLmNvb3JkaW5hdGVUb1BvaW50KG5ldyBtYXB0YWxrcy5Db29yZGluYXRlKHgsIHkpLCBtZS5fZDN6b29tKTtcbiAgICAgICAgICAgIGlmICh0aGlzICYmIHRoaXMuc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHJlYW0ucG9pbnQocG9pbnQueCwgcG9pbnQueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW3BvaW50LngsIHBvaW50LnldO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9jYW5UcmFuc2Zvcm0oKSB7XG4gICAgICAgIHJldHVybiBtYXB0YWxrcy5Ccm93c2VyLmFueTNkIHx8IG1hcHRhbGtzLkJyb3dzZXIuaWU5O1xuICAgIH1cblxuICAgIF9nZXRDb250YWluZXJQb3MoKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IHRoaXMuZ2V0TWFwKCksXG4gICAgICAgICAgICBjZW50ZXIgPSBtYXAuZ2V0Q2VudGVyKCksXG4gICAgICAgICAgICB6b29tID0gdGhpcy5fZDN6b29tIHx8IG1hcC5nZXRab29tKCk7XG4gICAgICAgIGNvbnN0IHBvaW50ID0gbWFwLmNvb3JkaW5hdGVUb1BvaW50KGNlbnRlciwgem9vbSksXG4gICAgICAgICAgICBzY2FsZSA9IDE7XG4gICAgICAgIHJldHVybiBbcG9pbnQsIHNjYWxlXTtcbiAgICB9XG5cbiAgICBfaW5pdENvbnRhaW5lcigpIHtcbiAgICAgICAgY29uc3QgbWFwID0gdGhpcy5nZXRNYXAoKTtcbiAgICAgICAgdGhpcy5fbGF5ZXJDb250YWluZXIgPSBtYXB0YWxrcy5Eb21VdGlsLmNyZWF0ZUVsT24oJ2RpdicsICdwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjBweDt0b3A6MHB4OycpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjcmVhdGVDb250YWluZXIoKTtcbiAgICAgICAgdGhpcy5fbGF5ZXJDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5jb250ZXh0KTtcbiAgICAgICAgdGhpcy5fcmVzZXRDb250YWluZXIoKTtcblxuICAgICAgICBjb25zdCBwYXJlbnRDb250YWluZXIgPSB0aGlzLmxheWVyLm9wdGlvbnNbJ2NvbnRhaW5lciddID09PSAnZnJvbnQnID8gbWFwLl9wYW5lbHNbJ2Zyb250TGF5ZXInXSA6IG1hcC5fcGFuZWxzWydiYWNrTGF5ZXInXTtcbiAgICAgICAgcGFyZW50Q29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX2xheWVyQ29udGFpbmVyKTtcbiAgICB9XG5cbiAgICBfcmVzZXRDb250YWluZXIoKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5zdHlsZS50cmFuc2Zvcm0gPSAnJztcbiAgICAgICAgdGhpcy5fcmVmcmVzaFZpZXdCb3goKTtcbiAgICB9XG5cbiAgICBfcmVmcmVzaFZpZXdCb3goKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IHRoaXMuZ2V0TWFwKCk7XG4gICAgICAgIGNvbnN0IHNpemUgPSBtYXAuZ2V0U2l6ZSgpLFxuICAgICAgICAgICAgcmVzID0gbWFwLl9nZXRSZXNvbHV0aW9uKCksXG4gICAgICAgICAgICBkM3ogPSB0aGlzLl9kM3pvb20gfHwgbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgIGQzcmVzID0gbWFwLl9nZXRSZXNvbHV0aW9uKGQzeiksXG4gICAgICAgICAgICBzY2FsZSA9IHJlcyAvIGQzcmVzO1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0QXR0cmlidXRlKCd3aWR0aCcsIHNpemUud2lkdGgpO1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBzaXplLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IHBvaW50ID0gbWFwLmNvb3JkaW5hdGVUb1BvaW50KG1hcC5nZXRDZW50ZXIoKSwgZDN6KTtcbiAgICAgICAgdGhpcy5fdmlld0JveCA9IFtwb2ludC54IC0gc2l6ZS53aWR0aCAqIHNjYWxlIC8gMiwgcG9pbnQueSAtIHNpemUuaGVpZ2h0ICogc2NhbGUgLyAyLCBzaXplLndpZHRoICogc2NhbGUsIHNpemUuaGVpZ2h0ICogc2NhbGVdO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5zZXRBdHRyaWJ1dGUoJ3ZpZXdCb3gnLCB0aGlzLl92aWV3Qm94LmpvaW4oJyAnKSk7XG5cbiAgICAgICAgdGhpcy5fbGF5ZXJDb250YWluZXIuc3R5bGUudHJhbnNmb3JtID0gJyc7XG5cbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gbWFwLm9mZnNldFBsYXRmb3JtKCk7XG4gICAgICAgIHRoaXMuX2xheWVyQ29udGFpbmVyLnN0eWxlLmxlZnQgPSAtb2Zmc2V0LnggKyAncHgnO1xuICAgICAgICB0aGlzLl9sYXllckNvbnRhaW5lci5zdHlsZS50b3AgPSAtb2Zmc2V0LnkgKyAncHgnO1xuICAgIH1cblxuXG59KTtcblxuRDNMYXllci5yZWdpc3RlclJlbmRlcmVyKCdjYW52YXMnLCBjbGFzcyBleHRlbmRzIG1hcHRhbGtzLnJlbmRlcmVyLkNhbnZhc1JlbmRlcmVyIHtcblxuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2RyYXdDb250ZXh0O1xuICAgICAgICBtYXB0YWxrcy5yZW5kZXJlci5DYW52YXMucHJvdG90eXBlLnJlbW92ZS5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIGdldEdlb1Byb2plY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IHRoaXMuZ2V0TWFwKCk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgaWYgKHhbMF0gJiYgeFsxXSkge1xuICAgICAgICAgICAgICAgIHggPSBbeFswXSwgeFsxXV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwb2ludCA9IG1hcC5jb29yZGluYXRlVG9Db250YWluZXJQb2ludChuZXcgbWFwdGFsa3MuQ29vcmRpbmF0ZSh4LCB5KSk7XG4gICAgICAgICAgICBpZiAodGhpcyAmJiB0aGlzLnN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RyZWFtLnBvaW50KHBvaW50LngsIHBvaW50LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtwb2ludC54LCBwb2ludC55XTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBkcmF3KCkge1xuICAgICAgICB0aGlzLnByZXBhcmVDYW52YXMoKTtcbiAgICAgICAgaWYgKCF0aGlzLl9wcmVkcmF3ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2FybUNvbnRleHQoKTtcbiAgICAgICAgICAgIHRoaXMuX2RyYXdDb250ZXh0ID0gdGhpcy5sYXllci5wcmVwYXJlVG9EcmF3KHRoaXMuY29udGV4dCwgdGhpcy5sYXllci5nZXRHZW9Qcm9qZWN0aW9uKCkpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9kcmF3Q29udGV4dCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RyYXdDb250ZXh0ID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodGhpcy5fZHJhd0NvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZHJhd0NvbnRleHQgPSBbdGhpcy5fZHJhd0NvbnRleHRdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcHJlZHJhd2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGF5ZXIuZHJhdy5hcHBseSh0aGlzLmxheWVyLCBbdGhpcy5jb250ZXh0LCB0aGlzLmxheWVyLmdldEdlb1Byb2plY3Rpb24oKV0uY29uY2F0KHRoaXMuX2RyYXdDb250ZXh0KSk7XG4gICAgICAgIHRoaXMuY29tcGxldGVSZW5kZXIoKTtcbiAgICB9XG5cbiAgICBfYXJtQ29udGV4dCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXAgPSB0aGlzLmdldE1hcCgpO1xuICAgICAgICB0aGlzLmNvbnRleHQuYXJjSW5NZXRlciA9IGZ1bmN0aW9uICh4LCB5LCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpY2xvY2t3aXNlKSB7XG4gICAgICAgICAgICB2YXIgcHggPSBtYXAuZGlzdGFuY2VUb1BpeGVsKHJhZGl1cywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcmMoeCwgeSwgcHhbJ3dpZHRoJ10sIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpY2xvY2t3aXNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmFyY1RvSW5NZXRlciA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5MiwgcmFkaXVzKSB7XG4gICAgICAgICAgICB2YXIgcHggPSBtYXAuZGlzdGFuY2VUb1BpeGVsKHJhZGl1cywgMCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcmNUbyh4MSwgeTEsIHgyLCB5MiwgcHhbJ3dpZHRoJ10pO1xuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5jb250ZXh0LmVsbGlwc2UpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5lbGxpc3BlSW5NZXRlciA9IGZ1bmN0aW9uICh4LCB5LCByYWRpdXNYLCByYWRpdXNZLCByb3RhdGlvbiwgc3RhcnRBbmdsZSwgZW5kQW5nbGUsIGFudGljbG9ja3dpc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHggPSBtYXAuZGlzdGFuY2VUb1BpeGVsKHJhZGl1c1gsIHJhZGl1c1kpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVsbGlwc2UoeCwgeSwgcHhbJ3dpZHRoJ10sIHB4WydoZWlnaHQnXSwgcm90YXRpb24sIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlLCBhbnRpY2xvY2t3aXNlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb250ZXh0LnJlY3RJbk1ldGVyID0gZnVuY3Rpb24gKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgICAgIHZhciBweCA9IG1hcC5kaXN0YW5jZVRvUGl4ZWwod2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWN0KHgsIHksIHB4Wyd3aWR0aCddLCBweFsnaGVpZ2h0J10pO1xuICAgICAgICB9O1xuICAgIH1cbn0pO1xuIl0sIm5hbWVzIjpbImNyZWF0ZUNvbnRhaW5lciIsIm5zIiwicGFwZXIiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInN0eWxlIiwib3ZlcmZsb3ciLCJwb3NpdGlvbiIsInNldEF0dHJpYnV0ZSIsImRlZnMiLCJhcHBlbmRDaGlsZCIsIm9wdGlvbnMiLCJEM0xheWVyIiwiaWQiLCJpc0NhbnZhc1JlbmRlciIsInByZXBhcmVUb0RyYXciLCJkcmF3IiwicmVkcmF3IiwiX2dldFJlbmRlcmVyIiwicmVxdWVzdE1hcFRvUmVuZGVyIiwiZ2V0Q29udGV4dCIsImNvbnRleHQiLCJnZXRTaXplIiwiZ2V0TWFwIiwiZ2V0R2VvUHJvamVjdGlvbiIsIm1hcHRhbGtzIiwibWVyZ2VPcHRpb25zIiwicmVnaXN0ZXJSZW5kZXJlciIsImxheWVyIiwiX2luaXRDb250YWluZXIiLCJyZW5kZXIiLCJfZHJhd2VkIiwiZmlyZSIsInNldFpJbmRleCIsInoiLCJfekluZGV4IiwiX2xheWVyQ29udGFpbmVyIiwiekluZGV4IiwiZ2V0RXZlbnRzIiwib25ab29tRW5kIiwib25ab29tU3RhcnQiLCJfcmVmcmVzaFZpZXdCb3giLCJvblpvb21pbmciLCJfcmVzZXRDb250YWluZXIiLCJfY2FuVHJhbnNmb3JtIiwiZGlzcGxheSIsInBhcmFtIiwic2V0VHJhbnNmb3JtTWF0cml4IiwibWF0cml4IiwibWFwIiwiX2Qzem9vbSIsImdldFpvb20iLCJtZSIsIngiLCJ5IiwicG9pbnQiLCJjb29yZGluYXRlVG9Qb2ludCIsInN0cmVhbSIsImFueTNkIiwiaWU5IiwiX2dldENvbnRhaW5lclBvcyIsImNlbnRlciIsImdldENlbnRlciIsInpvb20iLCJzY2FsZSIsImNyZWF0ZUVsT24iLCJwYXJlbnRDb250YWluZXIiLCJfcGFuZWxzIiwidHJhbnNmb3JtIiwic2l6ZSIsInJlcyIsIl9nZXRSZXNvbHV0aW9uIiwiZDN6IiwiZDNyZXMiLCJ3aWR0aCIsImhlaWdodCIsIl92aWV3Qm94Iiwiam9pbiIsIm9mZnNldCIsIm9mZnNldFBsYXRmb3JtIiwibGVmdCIsInRvcCIsInJlbW92ZSIsIl9kcmF3Q29udGV4dCIsIkNhbnZhcyIsInByb3RvdHlwZSIsImNhbGwiLCJjb29yZGluYXRlVG9Db250YWluZXJQb2ludCIsInByZXBhcmVDYW52YXMiLCJfcHJlZHJhd2VkIiwiX2FybUNvbnRleHQiLCJBcnJheSIsImlzQXJyYXkiLCJhcHBseSIsImNvbmNhdCIsImNvbXBsZXRlUmVuZGVyIiwiYXJjSW5NZXRlciIsInJhZGl1cyIsInN0YXJ0QW5nbGUiLCJlbmRBbmdsZSIsImFudGljbG9ja3dpc2UiLCJweCIsImRpc3RhbmNlVG9QaXhlbCIsImFyYyIsImFyY1RvSW5NZXRlciIsIngxIiwieTEiLCJ4MiIsInkyIiwiYXJjVG8iLCJlbGxpcHNlIiwiZWxsaXNwZUluTWV0ZXIiLCJyYWRpdXNYIiwicmFkaXVzWSIsInJvdGF0aW9uIiwicmVjdEluTWV0ZXIiLCJyZWN0IiwiQ2FudmFzUmVuZGVyZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxBQUVBLFNBQVNBLGVBQVQsR0FBMkI7UUFDakJDLEtBQUssNEJBQVg7UUFDTUMsUUFBUUMsU0FBU0MsZUFBVCxDQUF5QkgsRUFBekIsRUFBNkIsS0FBN0IsQ0FBZDtVQUNNSSxLQUFOLENBQVlDLFFBQVosR0FBdUIsRUFBdkI7VUFDTUQsS0FBTixDQUFZRSxRQUFaLEdBQXVCLFVBQXZCO1VBQ01DLFlBQU4sQ0FBbUIsT0FBbkIsRUFBNEJQLEVBQTVCO1FBQ01RLE9BQU9OLFNBQVNDLGVBQVQsQ0FBeUJILEVBQXpCLEVBQTZCLE1BQTdCLENBQWI7VUFDTVMsV0FBTixDQUFrQkQsSUFBbEI7VUFDTUEsSUFBTixHQUFhQSxJQUFiO1dBQ09QLEtBQVA7OztBQUdKLElBQU1TLFVBQVU7aUJBQ0UsT0FERjtnQkFFQyxLQUZEO3VCQUdRO0NBSHhCOzs7Ozs7Ozs7OztBQWVBLElBQWFDLE9BQWI7OztxQkFFZ0JDLEVBQVosRUFBZ0JGLE9BQWhCLEVBQXlCOzs7Z0RBQ3JCLDJCQUFNRSxFQUFOLEVBQVVGLE9BQVYsQ0FEcUI7Ozs7Ozs7OztzQkFRekJHLGNBVkosNkJBVXFCO1lBQ1QsS0FBS0gsT0FBTCxDQUFhLFVBQWIsTUFBNkIsUUFBakMsRUFBMkM7bUJBQ2hDLElBQVA7O2VBRUcsS0FBUDtLQWRSOztzQkFpQklJLGFBakJKLDBDQWlCa0M7ZUFDbkIsSUFBUDtLQWxCUjs7Ozs7Ozs7OztzQkEyQklDLElBM0JKLDBDQTJCa0M7O2VBRW5CLElBQVA7S0E3QlI7Ozs7Ozs7c0JBbUNJQyxNQW5DSixxQkFtQ2E7O1lBRUQsS0FBS0gsY0FBTCxFQUFKLEVBQTJCO2lCQUNsQkksWUFBTCxHQUFvQkMsa0JBQXBCOztlQUVHLElBQVA7S0F4Q1I7O3NCQTJDSUMsVUEzQ0oseUJBMkNpQjtlQUNGLEtBQUtGLFlBQUwsR0FBb0JHLE9BQTNCO0tBNUNSOztzQkErQ0lDLE9BL0NKLHNCQStDYztlQUNDLEtBQUtDLE1BQUwsR0FBY0QsT0FBZCxFQUFQO0tBaERSOztzQkFtRElFLGdCQW5ESiwrQkFtRHVCO2VBQ1IsS0FBS04sWUFBTCxHQUFvQk0sZ0JBQXBCLEVBQVA7S0FwRFI7OztFQUE2QkMsY0FBN0I7O0FBd0RBYixRQUFRYyxZQUFSLENBQXFCZixPQUFyQjs7QUFFQUMsUUFBUWUsZ0JBQVIsQ0FBeUIsS0FBekI7b0JBRWdCQyxLQUFaLEVBQW1COzs7YUFDVkEsS0FBTCxHQUFhQSxLQUFiO2FBQ0tDLGNBQUw7OztxQkFHSk4sTUFQSixxQkFPYTtlQUNFLEtBQUtLLEtBQUwsQ0FBV0wsTUFBWCxFQUFQO0tBUlI7O3FCQVdJTyxNQVhKLHFCQVdhO1lBQ0QsQ0FBQyxLQUFLQyxPQUFWLEVBQW1CO2lCQUNWSCxLQUFMLENBQVdaLElBQVgsQ0FBZ0IsS0FBS1ksS0FBTCxDQUFXUixVQUFYLEVBQWhCLEVBQXlDLEtBQUtRLEtBQUwsQ0FBV0osZ0JBQVgsRUFBekM7aUJBQ0tPLE9BQUwsR0FBZSxJQUFmOzthQUVDSCxLQUFMLENBQVdJLElBQVgsQ0FBZ0IsV0FBaEI7ZUFDTyxJQUFQO0tBakJSOztxQkFvQklDLFNBcEJKLHNCQW9CY0MsQ0FwQmQsRUFvQmlCO2FBQ0pDLE9BQUwsR0FBZUQsQ0FBZjthQUNLRSxlQUFMLENBQXFCL0IsS0FBckIsQ0FBMkJnQyxNQUEzQixHQUFvQyxNQUFNSCxDQUExQztLQXRCUjs7cUJBeUJJSSxTQXpCSix3QkF5QmdCO2VBQ0Q7dUJBQ1MsS0FBS0MsU0FEZDt5QkFFVyxLQUFLQyxXQUZoQjt1QkFHUyxLQUFLQyxlQUhkO3NCQUlTLEtBQUtBLGVBSmQ7dUJBS1MsS0FBS0M7U0FMckI7S0ExQlI7O3FCQW1DSUgsU0FuQ0osd0JBbUNnQjthQUNISSxlQUFMO1lBQ0ksS0FBS2YsS0FBTCxDQUFXakIsT0FBWCxDQUFtQixpQkFBbkIsS0FBeUMsQ0FBQyxLQUFLaUMsYUFBTCxFQUE5QyxFQUFvRTtpQkFDM0RSLGVBQUwsQ0FBcUIvQixLQUFyQixDQUEyQndDLE9BQTNCLEdBQXFDLEVBQXJDOztLQXRDWjs7cUJBMENJTCxXQTFDSiwwQkEwQ2tCO1lBQ04sS0FBS1osS0FBTCxDQUFXakIsT0FBWCxDQUFtQixpQkFBbkIsS0FBeUMsQ0FBQyxLQUFLaUMsYUFBTCxFQUE5QyxFQUFvRTtpQkFDM0RSLGVBQUwsQ0FBcUIvQixLQUFyQixDQUEyQndDLE9BQTNCLEdBQXFDLE1BQXJDOztLQTVDWjs7cUJBZ0RJSCxTQWhESixzQkFnRGNJLEtBaERkLEVBZ0RxQjt3QkFDYixDQUFpQkMsa0JBQWpCLENBQW9DLEtBQUtYLGVBQXpDLEVBQTBEVSxNQUFNRSxNQUFOLENBQWEsV0FBYixDQUExRDtLQWpEUjs7cUJBb0RJeEIsZ0JBcERKLCtCQW9EdUI7WUFDVHlCLE1BQU0sS0FBSzFCLE1BQUwsRUFBWjtZQUNJLENBQUMsS0FBSzJCLE9BQVYsRUFBbUI7aUJBQ1ZBLE9BQUwsR0FBZUQsSUFBSUUsT0FBSixFQUFmOztZQUVFQyxLQUFLLElBQVg7ZUFDTyxVQUFVQyxDQUFWLEVBQWFDLENBQWIsRUFBZ0I7Z0JBQ2ZELEVBQUUsQ0FBRixLQUFRQSxFQUFFLENBQUYsQ0FBWixFQUFrQjtvQkFDVixDQUFDQSxFQUFFLENBQUYsQ0FBRCxFQUFPQSxFQUFFLENBQUYsQ0FBUCxDQUFKOztnQkFFRUUsUUFBUU4sSUFBSU8saUJBQUosQ0FBc0IsSUFBSS9CLG1CQUFKLENBQXdCNEIsQ0FBeEIsRUFBMkJDLENBQTNCLENBQXRCLEVBQXFERixHQUFHRixPQUF4RCxDQUFkO2dCQUNJLFFBQVEsS0FBS08sTUFBakIsRUFBeUI7cUJBQ2hCQSxNQUFMLENBQVlGLEtBQVosQ0FBa0JBLE1BQU1GLENBQXhCLEVBQTJCRSxNQUFNRCxDQUFqQzs7bUJBRUcsQ0FBQ0MsTUFBTUYsQ0FBUCxFQUFVRSxNQUFNRCxDQUFoQixDQUFQO1NBUko7S0ExRFI7O3FCQXNFSVYsYUF0RUosNEJBc0VvQjtlQUNMbkIsZ0JBQUEsQ0FBaUJpQyxLQUFqQixJQUEwQmpDLGdCQUFBLENBQWlCa0MsR0FBbEQ7S0F2RVI7O3FCQTBFSUMsZ0JBMUVKLCtCQTBFdUI7WUFDVFgsTUFBTSxLQUFLMUIsTUFBTCxFQUFaO1lBQ0lzQyxTQUFTWixJQUFJYSxTQUFKLEVBRGI7WUFFSUMsT0FBTyxLQUFLYixPQUFMLElBQWdCRCxJQUFJRSxPQUFKLEVBRjNCO1lBR01JLFFBQVFOLElBQUlPLGlCQUFKLENBQXNCSyxNQUF0QixFQUE4QkUsSUFBOUIsQ0FBZDtZQUNJQyxRQUFRLENBRFo7ZUFFTyxDQUFDVCxLQUFELEVBQVFTLEtBQVIsQ0FBUDtLQWhGUjs7cUJBbUZJbkMsY0FuRkosNkJBbUZxQjtZQUNQb0IsTUFBTSxLQUFLMUIsTUFBTCxFQUFaO2FBQ0thLGVBQUwsR0FBdUJYLGdCQUFBLENBQWlCd0MsVUFBakIsQ0FBNEIsS0FBNUIsRUFBbUMscUNBQW5DLENBQXZCO2FBQ0s1QyxPQUFMLEdBQWVyQixpQkFBZjthQUNLb0MsZUFBTCxDQUFxQjFCLFdBQXJCLENBQWlDLEtBQUtXLE9BQXRDO2FBQ0tzQixlQUFMOztZQUVNdUIsa0JBQWtCLEtBQUt0QyxLQUFMLENBQVdqQixPQUFYLENBQW1CLFdBQW5CLE1BQW9DLE9BQXBDLEdBQThDc0MsSUFBSWtCLE9BQUosQ0FBWSxZQUFaLENBQTlDLEdBQTBFbEIsSUFBSWtCLE9BQUosQ0FBWSxXQUFaLENBQWxHO3dCQUNnQnpELFdBQWhCLENBQTRCLEtBQUswQixlQUFqQztLQTNGUjs7cUJBOEZJTyxlQTlGSiw4QkE4RnNCO2FBQ1R0QixPQUFMLENBQWFoQixLQUFiLENBQW1CK0QsU0FBbkIsR0FBK0IsRUFBL0I7YUFDSzNCLGVBQUw7S0FoR1I7O3FCQW1HSUEsZUFuR0osOEJBbUdzQjtZQUNSUSxNQUFNLEtBQUsxQixNQUFMLEVBQVo7WUFDTThDLE9BQU9wQixJQUFJM0IsT0FBSixFQUFiO1lBQ0lnRCxNQUFNckIsSUFBSXNCLGNBQUosRUFEVjtZQUVJQyxNQUFNLEtBQUt0QixPQUFMLElBQWdCRCxJQUFJRSxPQUFKLEVBRjFCO1lBR0lzQixRQUFReEIsSUFBSXNCLGNBQUosQ0FBbUJDLEdBQW5CLENBSFo7WUFJSVIsUUFBUU0sTUFBTUcsS0FKbEI7YUFLS3BELE9BQUwsQ0FBYWIsWUFBYixDQUEwQixPQUExQixFQUFtQzZELEtBQUtLLEtBQXhDO2FBQ0tyRCxPQUFMLENBQWFiLFlBQWIsQ0FBMEIsUUFBMUIsRUFBb0M2RCxLQUFLTSxNQUF6QztZQUNNcEIsUUFBUU4sSUFBSU8saUJBQUosQ0FBc0JQLElBQUlhLFNBQUosRUFBdEIsRUFBdUNVLEdBQXZDLENBQWQ7YUFDS0ksUUFBTCxHQUFnQixDQUFDckIsTUFBTUYsQ0FBTixHQUFVZ0IsS0FBS0ssS0FBTCxHQUFhVixLQUFiLEdBQXFCLENBQWhDLEVBQW1DVCxNQUFNRCxDQUFOLEdBQVVlLEtBQUtNLE1BQUwsR0FBY1gsS0FBZCxHQUFzQixDQUFuRSxFQUFzRUssS0FBS0ssS0FBTCxHQUFhVixLQUFuRixFQUEwRkssS0FBS00sTUFBTCxHQUFjWCxLQUF4RyxDQUFoQjs7YUFFSzNDLE9BQUwsQ0FBYWIsWUFBYixDQUEwQixTQUExQixFQUFxQyxLQUFLb0UsUUFBTCxDQUFjQyxJQUFkLENBQW1CLEdBQW5CLENBQXJDOzthQUVLekMsZUFBTCxDQUFxQi9CLEtBQXJCLENBQTJCK0QsU0FBM0IsR0FBdUMsRUFBdkM7O1lBRU1VLFNBQVM3QixJQUFJOEIsY0FBSixFQUFmO2FBQ0szQyxlQUFMLENBQXFCL0IsS0FBckIsQ0FBMkIyRSxJQUEzQixHQUFrQyxDQUFDRixPQUFPekIsQ0FBUixHQUFZLElBQTlDO2FBQ0tqQixlQUFMLENBQXFCL0IsS0FBckIsQ0FBMkI0RSxHQUEzQixHQUFpQyxDQUFDSCxPQUFPeEIsQ0FBUixHQUFZLElBQTdDO0tBckhSOzs7OztBQTJIQTFDLFFBQVFlLGdCQUFSLENBQXlCLFFBQXpCOzs7Ozs7Ozs7c0JBRUl1RCxNQUZKLHFCQUVhO2VBQ0UsS0FBS0MsWUFBWjt5QkFDQSxDQUFrQkMsTUFBbEIsQ0FBeUJDLFNBQXpCLENBQW1DSCxNQUFuQyxDQUEwQ0ksSUFBMUMsQ0FBK0MsSUFBL0M7S0FKUjs7c0JBT0k5RCxnQkFQSiwrQkFPdUI7WUFDVHlCLE1BQU0sS0FBSzFCLE1BQUwsRUFBWjtlQUNPLFVBQVU4QixDQUFWLEVBQWFDLENBQWIsRUFBZ0I7Z0JBQ2ZELEVBQUUsQ0FBRixLQUFRQSxFQUFFLENBQUYsQ0FBWixFQUFrQjtvQkFDVixDQUFDQSxFQUFFLENBQUYsQ0FBRCxFQUFPQSxFQUFFLENBQUYsQ0FBUCxDQUFKOztnQkFFRUUsUUFBUU4sSUFBSXNDLDBCQUFKLENBQStCLElBQUk5RCxtQkFBSixDQUF3QjRCLENBQXhCLEVBQTJCQyxDQUEzQixDQUEvQixDQUFkO2dCQUNJLFFBQVEsS0FBS0csTUFBakIsRUFBeUI7cUJBQ2hCQSxNQUFMLENBQVlGLEtBQVosQ0FBa0JBLE1BQU1GLENBQXhCLEVBQTJCRSxNQUFNRCxDQUFqQzs7bUJBRUcsQ0FBQ0MsTUFBTUYsQ0FBUCxFQUFVRSxNQUFNRCxDQUFoQixDQUFQO1NBUko7S0FUUjs7c0JBcUJJdEMsSUFyQkosbUJBcUJXO2FBQ0V3RSxhQUFMO1lBQ0ksQ0FBQyxLQUFLQyxVQUFWLEVBQXNCO2lCQUNiQyxXQUFMO2lCQUNLUCxZQUFMLEdBQW9CLEtBQUt2RCxLQUFMLENBQVdiLGFBQVgsQ0FBeUIsS0FBS00sT0FBOUIsRUFBdUMsS0FBS08sS0FBTCxDQUFXSixnQkFBWCxFQUF2QyxDQUFwQjtnQkFDSSxDQUFDLEtBQUsyRCxZQUFWLEVBQXdCO3FCQUNmQSxZQUFMLEdBQW9CLEVBQXBCOztnQkFFQSxDQUFDUSxNQUFNQyxPQUFOLENBQWMsS0FBS1QsWUFBbkIsQ0FBTCxFQUF1QztxQkFDOUJBLFlBQUwsR0FBb0IsQ0FBQyxLQUFLQSxZQUFOLENBQXBCOztpQkFFQ00sVUFBTCxHQUFrQixJQUFsQjs7O2FBR0M3RCxLQUFMLENBQVdaLElBQVgsQ0FBZ0I2RSxLQUFoQixDQUFzQixLQUFLakUsS0FBM0IsRUFBa0MsQ0FBQyxLQUFLUCxPQUFOLEVBQWUsS0FBS08sS0FBTCxDQUFXSixnQkFBWCxFQUFmLEVBQThDc0UsTUFBOUMsQ0FBcUQsS0FBS1gsWUFBMUQsQ0FBbEM7YUFDS1ksY0FBTDtLQXBDUjs7c0JBdUNJTCxXQXZDSiwwQkF1Q2tCO1lBQ04sQ0FBQyxLQUFLckUsT0FBVixFQUFtQjs7O1lBR2I0QixNQUFNLEtBQUsxQixNQUFMLEVBQVo7YUFDS0YsT0FBTCxDQUFhMkUsVUFBYixHQUEwQixVQUFVM0MsQ0FBVixFQUFhQyxDQUFiLEVBQWdCMkMsTUFBaEIsRUFBd0JDLFVBQXhCLEVBQW9DQyxRQUFwQyxFQUE4Q0MsYUFBOUMsRUFBNkQ7Z0JBQy9FQyxLQUFLcEQsSUFBSXFELGVBQUosQ0FBb0JMLE1BQXBCLEVBQTRCLENBQTVCLENBQVQ7bUJBQ08sS0FBS00sR0FBTCxDQUFTbEQsQ0FBVCxFQUFZQyxDQUFaLEVBQWUrQyxHQUFHLE9BQUgsQ0FBZixFQUE0QkgsVUFBNUIsRUFBd0NDLFFBQXhDLEVBQWtEQyxhQUFsRCxDQUFQO1NBRko7YUFJSy9FLE9BQUwsQ0FBYW1GLFlBQWIsR0FBNEIsVUFBVUMsRUFBVixFQUFjQyxFQUFkLEVBQWtCQyxFQUFsQixFQUFzQkMsRUFBdEIsRUFBMEJYLE1BQTFCLEVBQWtDO2dCQUN0REksS0FBS3BELElBQUlxRCxlQUFKLENBQW9CTCxNQUFwQixFQUE0QixDQUE1QixDQUFUO21CQUNPLEtBQUtZLEtBQUwsQ0FBV0osRUFBWCxFQUFlQyxFQUFmLEVBQW1CQyxFQUFuQixFQUF1QkMsRUFBdkIsRUFBMkJQLEdBQUcsT0FBSCxDQUEzQixDQUFQO1NBRko7WUFJSSxLQUFLaEYsT0FBTCxDQUFheUYsT0FBakIsRUFBMEI7aUJBQ2pCekYsT0FBTCxDQUFhMEYsY0FBYixHQUE4QixVQUFVMUQsQ0FBVixFQUFhQyxDQUFiLEVBQWdCMEQsT0FBaEIsRUFBeUJDLE9BQXpCLEVBQWtDQyxRQUFsQyxFQUE0Q2hCLFVBQTVDLEVBQXdEQyxRQUF4RCxFQUFrRUMsYUFBbEUsRUFBaUY7b0JBQ3ZHQyxLQUFLcEQsSUFBSXFELGVBQUosQ0FBb0JVLE9BQXBCLEVBQTZCQyxPQUE3QixDQUFUO3VCQUNPLEtBQUtILE9BQUwsQ0FBYXpELENBQWIsRUFBZ0JDLENBQWhCLEVBQW1CK0MsR0FBRyxPQUFILENBQW5CLEVBQWdDQSxHQUFHLFFBQUgsQ0FBaEMsRUFBOENhLFFBQTlDLEVBQXdEaEIsVUFBeEQsRUFBb0VDLFFBQXBFLEVBQThFQyxhQUE5RSxDQUFQO2FBRko7O2FBS0MvRSxPQUFMLENBQWE4RixXQUFiLEdBQTJCLFVBQVU5RCxDQUFWLEVBQWFDLENBQWIsRUFBZ0JvQixLQUFoQixFQUF1QkMsTUFBdkIsRUFBK0I7Z0JBQ2xEMEIsS0FBS3BELElBQUlxRCxlQUFKLENBQW9CNUIsS0FBcEIsRUFBMkJDLE1BQTNCLENBQVQ7bUJBQ08sS0FBS3lDLElBQUwsQ0FBVS9ELENBQVYsRUFBYUMsQ0FBYixFQUFnQitDLEdBQUcsT0FBSCxDQUFoQixFQUE2QkEsR0FBRyxRQUFILENBQTdCLENBQVA7U0FGSjtLQTFEUjs7O0VBQWlENUUsaUJBQUEsQ0FBa0I0RixjQUFuRTs7Ozs7OyJ9
