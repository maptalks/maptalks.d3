import * as maptalks from 'maptalks';
import * as d3 from 'd3';

const TRANSFORM = maptalks.DomUtil['TRANSFORM'];

function createContainer() {
    const ns = 'http://www.w3.org/2000/svg';
    const paper = document.createElementNS(ns, 'svg');
    paper.style.overflow = '';
    paper.style.position = 'absolute';
    paper.setAttribute('xmlns', ns);
    const defs = document.createElementNS(ns, 'defs');
    paper.appendChild(defs);
    paper.defs = defs;
    return paper;
}

const options = {
    'd3Version'   : 4, // 3, 4
    'container' : 'front', // front, back
    'renderer' : 'canvas', //'dom/canvas'
    'hideWhenZooming' : false
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
export class D3Layer extends maptalks.Layer {

    constructor(id, options) {
        super(id, options);
    }

    /**
     * Whether rendered by HTML5 Canvas2D
     * @return {Boolean}
     */
    isCanvasRender() {
        if (this.options['renderer'] === 'canvas') {
            return true;
        }
        return false;
    }

    prepareToDraw(/*projection*/) {
        return null;
    }

    /**
     * Draw the D3Layer
     * This is an abstract interface method for subclasses to implement.
     * @param  {SVG|Canvas} context    - context for D3 to draw on, possiblly a SVG element or a canvas.
     * @param  {Function} projection   - A D3 projection function to projection geodesic coordinate to 2D point.
     */
    draw(/*context, projection*/) {
        //draw the layer, interface to implement.
        return this;
    }

    /**
     * request layer to redraw
     */
    redraw() {
        //request layer to refresh
        if (this.isCanvasRender()) {
            this._getRenderer().setToRedraw();
        }
        return this;
    }

    getContext() {
        return this._getRenderer().context;
    }

    getGeoProjection() {
        return this._getRenderer().getGeoProjection();
    }
}

D3Layer.mergeOptions(options);

D3Layer.registerRenderer('dom', class {

    constructor(layer) {
        this.layer = layer;
        this._initContainer();
    }

    getMap() {
        return this.layer.getMap();
    }

    needToRedraw() {
        const map = this.getMap();
        const renderer = map._getRenderer();
        return map.isInteracting() || renderer && renderer.isStateChanged();
    }

    render() {
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
            const args = [this.layer.getContext(), this.layer.getGeoProjection()].concat(this._drawContext);
            this.layer.draw.apply(this.layer, args);
            this._drawed = true;
        }
        this._refreshViewBox();
        this.layer.fire('layerload');
        return true;
    }

    drawOnInteracting(e) {
        const map = this.getMap();
        if (map.isZooming() && this._layerContainer.style.display !== 'none' && e && e.matrix) {
            maptalks.DomUtil.setTransformMatrix(this._layerContainer, e.matrix['container']);
        } else if (!(map.isMoving() && !map.getPitch())) {
            this._refreshViewBox();
        }
    }

    setZIndex(z) {
        this._zIndex = z;
        this._layerContainer.style.zIndex = 100 + z;
    }

    getEvents() {
        return {
            'zoomend' : this.onZoomEnd,
            'zoomstart' : this.onZoomStart,
            'moveend' : this._refreshViewBox
        };
    }


    onZoomEnd() {
        this._resetContainer();
        if (this.layer.options['hideWhenZooming'] || !this._canTransform() || this.getMap().domCssMatrix) {
            this._layerContainer.style.display = '';
        }
    }

    onZoomStart() {
        if (this.layer.options['hideWhenZooming'] || !this._canTransform() || this.getMap().domCssMatrix) {
            this._layerContainer.style.display = 'none';
        }
    }


    getGeoProjection() {
        const map = this.getMap();
        if (!this._d3zoom) {
            this._d3zoom = map.getZoom();
        }
        const me = this;
        const d3v = this.layer.options['d3Version'];
        const proj = function (x, y) {
            if (x[0] && x[1]) {
                x = [x[0], x[1]];
            }
            const point = map.coordinateToPoint(new maptalks.Coordinate(x, y), me._d3zoom);
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

    }

    remove() {
        delete this.context;
        maptalks.DomUtil.removeDomNode(this._layerContainer);
        delete this._layerContainer;
        delete this._viewBox;
        delete this._d3zoom;
        delete this.layer;
    }

    _canTransform() {
        return maptalks.Browser.any3d || maptalks.Browser.ie9;
    }

    _getContainerPos() {
        const map = this.getMap(),
            center = map.getCenter(),
            zoom = this._d3zoom || map.getZoom();
        const point = map.coordinateToPoint(center, zoom),
            scale = 1;
        return [point, scale];
    }

    _initContainer() {
        const map = this.getMap();
        this._layerContainer = maptalks.DomUtil.createElOn('div', 'position:absolute;left:0px;top:0px;');
        this.context = createContainer();
        this._layerContainer.appendChild(this.context);
        this._resetContainer();

        const parentContainer = this.layer.options['container'] === 'front' ? map._panels['frontLayer'] : map._panels['backLayer'];
        parentContainer.appendChild(this._layerContainer);
    }

    _resetContainer() {
        this.context.style.transform = '';
        this._refreshViewBox();
    }

    _refreshViewBox() {
        const map = this.getMap();
        const size = map.getSize(),
            res = map._getResolution(),
            d3z = this._d3zoom || map.getZoom(),
            d3res = map._getResolution(d3z),
            scale = res / d3res;
        this.context.setAttribute('width', size.width);
        this.context.setAttribute('height', size.height);
        const point = map.coordinateToPoint(map.getCenter(), d3z);
        this._viewBox = [point.x - size.width * scale / 2, point.y - size.height * scale / 2, size.width * scale, size.height * scale];

        this.context.setAttribute('viewBox', this._viewBox.join(' '));

        const container = this._layerContainer;
        container.style.transform = '';

        if (map.domCssMatrix) {
            const size = map.getSize();
            if (parseInt(container.style.width) !== size['width'] || parseInt(container.style.height) !== size['height']) {
                container.style.width = size['width'] + 'px';
                container.style.height = size['height'] + 'px';
            }
            const matrix = maptalks.Util.join(map.domCssMatrix);
            container.style[TRANSFORM] = 'matrix3D(' + matrix + ')';
        } else {
            maptalks.DomUtil.removeTransform(container);
            if (container.style.width || container.style.height) {
                container.style.width = null;
                container.style.height = null;
            }
        }
        const offset = map.offsetPlatform();
        container.style.left = -offset.x + 'px';
        container.style.top = -offset.y + 'px';
    }


});

D3Layer.registerRenderer('canvas', class extends maptalks.renderer.CanvasRenderer {

    remove() {
        delete this._drawContext;
        super.remove();
    }

    getGeoProjection() {
        const map = this.getMap();
        const proj = function (x, y) {
            if (x[0] && x[1]) {
                x = [x[0], x[1]];
            }
            const point = map.coordinateToContainerPoint(new maptalks.Coordinate(x, y));
            if (this && this.stream) {
                this.stream.point(point.x, point.y);
            }
            return [point.x, point.y];
        };
        const d3v = this.layer.options['d3Version'];
        if (d3v === 3) {
            return proj;
        } else if (d3v === 4) {
            return d3.geoTransform({
                point: proj
            });
        }
        return null;
    }

    draw() {
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
    }

    drawOnInteracting() {
        this.draw();
    }

    _armContext() {
        if (!this.context) {
            return;
        }
        const map = this.getMap();
        this.context.arcInMeter = function (x, y, radius, startAngle, endAngle, anticlockwise) {
            const px = map.distanceToPixel(radius, 0);
            return this.arc(x, y, px['width'], startAngle, endAngle, anticlockwise);
        };
        this.context.arcToInMeter = function (x1, y1, x2, y2, radius) {
            const px = map.distanceToPixel(radius, 0);
            return this.arcTo(x1, y1, x2, y2, px['width']);
        };
        if (this.context.ellipse) {
            this.context.ellispeInMeter = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
                const px = map.distanceToPixel(radiusX, radiusY);
                return this.ellipse(x, y, px['width'], px['height'], rotation, startAngle, endAngle, anticlockwise);
            };
        }
        this.context.rectInMeter = function (x, y, width, height) {
            const px = map.distanceToPixel(width, height);
            return this.rect(x, y, px['width'], px['height']);
        };
    }
});
