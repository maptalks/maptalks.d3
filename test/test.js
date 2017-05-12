describe('D3Layer', function () {
    var container, map;
    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            center : [0, 0],
            zoom : 17
        });
    });

    afterEach(function () {
        map.remove();
        maptalks.DomUtil.removeDomNode(container);
    });

    function getCanvasD3Layer() {
        var d3Layer = new maptalks.D3Layer('d', { renderer : 'canvas' });
        d3Layer.prepareToDraw = function () {
            var polygon = {
                coordinates : [[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]],
                type : 'Polygon'
            };
            return polygon;
        };
        d3Layer.draw = function (context, projection, polygon) {
            var path = d3.geoPath()
                .projection(projection).context(context);
            context.fillStyle = '#f00';
            context.beginPath();
            path(polygon);
            context.fill();
        };
        return d3Layer;
    }

    function getDomD3Layer() {
        var d3Layer = new maptalks.D3Layer('d', { renderer : 'dom' });
        d3Layer.prepareToDraw = function () {
            var polygon = {
                coordinates : [[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]],
                type : 'Polygon'
            };
            return polygon;
        };
        d3Layer.draw = function (context, projection, polygon) {
            var svg = d3.select(context);
            var path = d3.geoPath()
                .projection(projection);
            svg.append('g')
            .selectAll('path')
              .data([polygon])
            .enter().append('path')
              .style('fill', function () { return '#ff0000'; })
              .attr('d', path);

        };
        return d3Layer;
    }

    it('added to map as an empty layer with canvas renderer', function (done) {
        new maptalks.D3Layer('d', { renderer : 'canvas' }).addTo(map);
        done();
    });

    it('added to map as an empty layer with dom renderer', function (done) {
        new maptalks.D3Layer('d', { renderer : 'dom' }).addTo(map);
        done();
    });

    it('should display when added to map with dom renderer', function (done) {
        var d3Layer = getDomD3Layer();
        d3Layer.on('layerload', function () {
            var panels = map.getPanels();
            var layerContainer = panels['frontLayer'].childNodes[0];
            expect(layerContainer.childNodes[0].nodeName).to.be.eql('svg');
            expect(layerContainer.childNodes[0].childNodes[1].tagName).to.be.eql('g');
            done();
        });
        map.addLayer(d3Layer);
    });

    it('should display when added to map', function (done) {
        var d3Layer = getCanvasD3Layer();
        d3Layer.on('layerload', function () {
            expect(d3Layer).to.be.painted();
            done();
        });
        map.addLayer(d3Layer);

    });

    it('should display if added again after removed', function (done) {
        var layer = getCanvasD3Layer();
        layer.once('layerload', function () {
            expect(layer).to.be.painted();
            map.removeLayer(layer);
            layer.once('layerload', function () {
                expect(layer).to.be.painted();
                done();
            });
            map.addLayer(layer);
        });
        map.addLayer(layer);
    });

    it('should display after zooming', function (done) {
        var layer = getCanvasD3Layer();
        layer.once('layerload', function () {
            map.on('zoomend', function () {
                map.on('frameend', function () {
                    expect(layer).to.be.painted();
                    done();
                });
            });
            map.zoomIn();
        });
        map.addLayer(layer);
    });


    it('should show', function (done) {
        var layer = getCanvasD3Layer();
        layer.config('visible', false);
        layer.once('add', function () {
            expect(layer).not.to.be.painted();
            layer.once('layerload', function () {
                expect(layer).to.be.painted();
                done();
            });
            layer.show();
        });
        map.addLayer(layer);
    });

    it('should hide', function (done) {
        var layer = getCanvasD3Layer();
        layer.once('layerload', function () {
            expect(layer).to.be.painted();
            layer.once('hide', function () {
                expect(layer).not.to.be.painted();
                done();
            });
            layer.hide();
        });
        map.addLayer(layer);
    });
});
