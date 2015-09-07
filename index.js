$(document).ready(
    function () {
        var grid    = document.getElementsByClassName('grid')[0],
            ctx     = grid.getContext('2d'),
            gridMap = {};

        ctx.fillStyle = "rgb(200,0,0)";
        ctx.fillRect(10, 10, 55, 50);

        ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
        ctx.fillRect(30, 30, 55, 50);

        // -------- constants & data
        var count                        = 0,
            scale                        = 100,//px per block (width and height)
            contextWidth                 = grid.width,
            contextHeight                = grid.height,
            viewCenterX                  = contextWidth / 2,
            viewCenterY                  = contextHeight / 2,
            debugGreed                   = false,
            debugPolar                   = false,
            debugCropImage               = false,
            maximumRadius                = 2850536294,//principal maximum radius 285053629418320 ! on my machine
            epsilonCaltulationFromRadius = function (r) {
                return 180 * Math.asin(1 / r) / 2.01 / Math.PI;// 1/Math.sin(epsilon  / (180 / Math.PI /2.01)) ==== radius
            },
            epsilon                      = epsilonCaltulationFromRadius(maximumRadius),
            drawGreed                    = function () {
                var verticalLine   = function (x) {
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, contextHeight);
                    },
                    horizontalLine = function (y) {
                        ctx.moveTo(0, y);
                        ctx.lineTo(contextWidth, y);
                    },
                    drawGrid       = function () {
                        for (var i = viewCenterX % scale; i < contextWidth; i += scale) {
                            verticalLine(i);
                        }
                        for (i = viewCenterY % scale; i < contextHeight; i += scale) {
                            horizontalLine(i);
                        }
                    };
                ctx.lineWidth = 2;
                ctx.strokeStyle = "rgb(150, 150, 255)";
                ctx.beginPath();
                ctx.setLineDash([4, 32]);
                drawGrid();
                ctx.stroke();
                ctx.beginPath();
                ctx.setLineDash([8, 24]);
                verticalLine(viewCenterX);
                horizontalLine(viewCenterY);
                ctx.stroke();

                ctx.lineDashOffset = 4;
                ctx.strokeStyle = "rgb(255, 50, 50)";
                ctx.beginPath();
                ctx.setLineDash([4, 32]);
                drawGrid();
                ctx.stroke();
                ctx.beginPath();
                ctx.setLineDash([8, 24]);
                verticalLine(viewCenterX);
                horizontalLine(viewCenterY);
                ctx.stroke();
            },
            drawPolar                    = function () {
                ctx.strokeStyle = "rgb(255, 50, 50)";
                ctx.beginPath();
                var maxRadius = contextHeight > contextWidth ? contextHeight : contextWidth;
                maxRadius = transformToMap(maxRadius);
                for (var i = 0; i < maxRadius; i++) {
                    ctx.arc(viewCenterX, viewCenterY, transformFromMap(i), 0, 2 * Math.PI);
                }
                ctx.stroke();
            },
            onAdded                      = function (elem) {
                if (debugGreed) {
                    drawGreed();
                }
                if (debugPolar) {
                    drawPolar();
                }
            },
            onLoaded                     = function (elem) {
                if (debugGreed) {
                    drawGreed();
                }
                if (debugPolar) {
                    drawPolar();
                }
            },
            onAnimationEnd = function () {
                if (debugGreed) {
                    drawGreed();
                }
                if (debugPolar) {
                    drawPolar();
                }
            },
            transformToMap               = function (n) {
                return Math.round(n / scale);
            },
            transformFromMap             = function (n) {
                return n * scale;
            },
            getNewOrigin                 = function (width, height) {
                if (maximumRadius > 285053629418320) {
                    throw 'Radius too long';
                }
                var x     = 0,
                    y     = 0,
                    r     = 0,
                    phi   = 0,
                    dphi  = 90,
                    toRad = function (n) {
                        return n * 2 * Math.PI / 360;
                    };
                do {
                    var placeFree = true;
                    for (var i = x; i < x + width; i++) {
                        for (var j = y; j < y + height; j++) {
                            if (gridMap.hasOwnProperty(i)) {
                                if (gridMap[i].hasOwnProperty(j)) {
                                    if (gridMap[i][j].pinned) {
                                        phi += dphi;
                                        x = Math.round(r * Math.cos(toRad(phi)) - 0.5 - width / 2);
                                        y = Math.round(r * Math.sin(toRad(phi)) - 0.5 - height / 2);
                                        i = x + width;
                                        j = y + height;
                                        placeFree = false;
                                    }
                                }
                            }
                        }
                    }
                    if (placeFree) {
                        break;
                    }
                    if (phi > -dphi + 360 + epsilon) {
                        phi = 0;
                        r++;
                        if (r === 1) {
                            dphi = 60;
                        } else {
                            dphi = epsilonCaltulationFromRadius(r);
                        }
                        if (r > maximumRadius) {
                            throw 'Limit exceeds';
                        }
                    }
                } while (true);
                return {
                    x: x,
                    y: y
                };
            },
            setNewOrigin                 = function (x, y, width, height, additionalData) {
                for (var i = x; i < x + width; i++) {
                    for (var j = y; j < y + height; j++) {
                        if (gridMap.hasOwnProperty(i)) {
                            gridMap[i][j] = {pinned: true, data: additionalData};
                        } else {
                            gridMap[i] = {};
                            gridMap[i][j] = {pinned: true, data: additionalData};
                        }
                    }
                }
            },
            eachOrigin                   = function (cb, all) {
                var processed = [];
                for (var x in gridMap) {
                    for (var y in gridMap[x]) {
                        if (all || processed.indexOf(gridMap[x][y].data) === -1) {
                            cb(gridMap[x][y]);
                            processed.push(gridMap[x][y].data);
                        }
                    }
                }
            },
            random                       = function (min, max) {
                return min + Math.round(Math.random() * (max - min));
            },
            initImage                    = function (data) {
                var image       = data.image,
                    dProportion = data.width / data.height,
                    sProportion = image.width / image.height,
                    iWidth,
                    iHeight,
                    scale;
                if (dProportion > sProportion) {
                    scale = data.width / image.width;
                    iWidth = image.width;
                    iHeight = iWidth / dProportion;
                } else {
                    scale = data.height / image.height;
                    iHeight = image.height;
                    iWidth = iHeight * dProportion;
                }

                var randomStateX = random(0, image.width - iWidth),
                    randomStateY = random(0, image.height - iHeight);
                data.imageState = {
                    x:     randomStateX,
                    y:     randomStateY,
                    clipW: iWidth,
                    clipH: iHeight,
                    scale: scale,
                    move:  false
                };
            },
            cacheImage                   = function (data) {
                if (!data.imageBuffer && data.image) {
                    data.imageBuffer = document.createElement('canvas');
                    data.imageBuffer.width = data.image.width * data.imageState.scale;
                    data.imageBuffer.height = data.image.height * data.imageState.scale;
                    data.imageBuffer.getContext('2d').drawImage(data.image, 0, 0, data.imageBuffer.width, data.imageBuffer.height);
                    delete data.image;
                    data.imageState.x *= data.imageState.scale;
                    data.imageState.y *= data.imageState.scale;
                    data.imageState.clipW *= data.imageState.scale;
                    data.imageState.clipH *= data.imageState.scale;
                    data.imageState.scale = 1;
                }
            },
            createData                   = function (image, pos, color, width, height) {
                return {
                    image:          image,
                    x:              transformFromMap(pos.x) + viewCenterX,
                    y:              transformFromMap(pos.y) + viewCenterY,
                    color:          color,
                    positionOnMap:  pos,
                    width:          width,
                    height:         height,
                    getImage:       function () {
                        if (this.image) {
                            return this.image;
                        }
                        if (this.imageBuffer) {
                            return this.imageBuffer;
                        }
                    },
                    getImageWidth:  function () {
                        return this.getImage() ? this.getImage().width : null;
                    },
                    getImageHeight: function () {
                        return this.getImage() ? this.getImage().height : null;
                    }
                };
            },
            drawImage                    = function (data) {
                //  simple variant
                //var ptrn = ctx.createPattern(image, 'no-repeat');
                //ctx.fillStyle = ptrn;
                //ctx.fillRect(transformFromMap(pos.x) + 900, transformFromMap(pos.y) + 500, width, height);

                //  draw with resize
                //drawImage(img, x, y, width, height);
                //ctx.drawImage(image, transformFromMap(pos.x) + 1800, transformFromMap(pos.y) + 1000, width, height);

                //  draw with resize & clip
                //drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
                cacheImage(data);
                var image = data.imageBuffer;
                if (debugCropImage) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    ctx.drawImage(
                        image,
                        data.x - data.imageState.x/* * data.imageState.scale*/,
                        data.y - data.imageState.y/* * data.imageState.scale*/,
                        image.width/* * data.imageState.scale*/,
                        image.height/* * data.imageState.scale*/
                    );
                    ctx.globalAlpha = 0.9;
                }
                ctx.drawImage(
                    image,
                    data.imageState.x,
                    data.imageState.y,
                    data.imageState.clipW,
                    data.imageState.clipH,
                    data.x,
                    data.y,
                    data.width,
                    data.height
                );
                if (debugCropImage) {
                    ctx.restore();
                }
            },
            addNewItem                   = function (ev) {
                //ev.preventDefault();
                var trueFalse = function () {
                        return Math.random() > .5;
                    },
                    img       = function () {
                        return imgs[count % imgs.length];
                    },
                    color     = function () {
                        return "rgba(200, 0, " + Math.floor(200 * (0.275 + Math.random())) + ", 0.5)";
                    },
                    width     = scale,
                    height    = scale,
                    pos;
                ctx.fillStyle = color();
                if (trueFalse()) {
                    height = scale * 2;
                }
                if (trueFalse()) {
                    height *= 2;
                }
                if (trueFalse()) {
                    width = scale * 2;
                }
                if (trueFalse()) {
                    width *= 2;
                }
                pos = getNewOrigin(transformToMap(width), transformToMap(height));
                var image = new Image(),
                    data  = createData(image, pos, ctx.fillStyle, width, height);
                setNewOrigin(pos.x, pos.y, transformToMap(width), transformToMap(height), data);
                ctx.fillRect(
                    data.x,
                    data.y,
                    width,
                    height
                );
                image.addEventListener('load', function () {
                    initImage(data);
                    drawImage(data);
                    onLoaded(data);
                }, false);
                image.src = '/' + img();
                onAdded(data);
                count++;
            },
            addNewItems                  = function (n) {
                if (!n) {
                    n = 10;
                }
                for (var faker = 0; faker < 10; faker++) {
                    addNewItem();
                }
            };
        var drawItem       = function (data) {
                ctx.fillStyle = data.color;
                ctx.fillRect(
                    data.x,
                    data.y,
                    data.width,
                    data.height
                );
                drawImage(data);
            },
            redrawItems    = function (filter) {
                var drawed = [];
                for (var x in gridMap) {
                    for (var y in gridMap[x]) {
                        if (drawed.indexOf(gridMap[x][y].data) === -1) {
                            if (filter === undefined || filter(x, y)) {
                                drawItem(gridMap[x][y].data);
                                drawed.push(gridMap[x][y].data);
                            }
                        }
                    }
                }
            },
            animationOn    = false,
            animationNow = false;
            viewPortFilter = function (data) {
                return true;
            },
            animationSpeed = 8, //px per second
            animate        = function () {
                if (!animationOn) {
                    return;
                }
                animationNow = true;
                var drawed = [];
                ctx.clearRect(0, 0, contextWidth, contextHeight);
                for (var x in gridMap) {
                    for (var y in gridMap[x]) {
                        if (drawed.indexOf(gridMap[x][y].data) === -1) {
                            var data = gridMap[x][y].data;
                            if (!data.getImage() || !data.imageState || !viewPortFilter(gridMap[x][y])) {
                                drawItem(data);//todo
                                //drawed.push(gridMap[x][y].data);
                                continue;
                            }
                            if (data.imageState.move === false) {
                                if (data.getImage().width - data.imageState.clipW) {
                                    data.imageState.move = 'right';
                                }
                                if (data.getImage().height - data.imageState.clipH) {
                                    data.imageState.move = 'bottom';
                                }
                            }
                            var time = (new Date()).getTime(),
                                oldTime,
                                diff;
                            if (!data.imageState.animationState) {
                                data.imageState.animationState = time;
                                continue;
                            }
                            oldTime = data.imageState.animationState;
                            diff = Math.round((time - oldTime) * animationSpeed / 1000);
                            if (diff <= 0) {
                                drawItem(data);//todo
                                continue;//todo: draw old state
                            }
                            if (data.imageState.move === 'right') {
                                if (data.imageState.x < data.getImage().width - data.imageState.clipW) {
                                    data.imageState.x += diff;
                                    if (data.imageState.x > data.getImage().width - data.imageState.clipW) {
                                        data.imageState.x = data.getImage().width - data.imageState.clipW;
                                    }
                                } else {
                                    data.imageState.move = 'left';
                                }
                            }
                            if (data.imageState.move === 'left') {
                                if (data.imageState.x > 0) {
                                    data.imageState.x -= diff;
                                    if (data.imageState.x < 0) {
                                        data.imageState.x = 0;
                                    }
                                } else {
                                    data.imageState.move = 'right';
                                }
                            }


                            if (data.imageState.move === 'bottom') {
                                if (data.imageState.y < data.getImage().height - data.imageState.clipH) {
                                    data.imageState.y++;
                                } else {
                                    data.imageState.move = 'top';
                                }
                            }
                            if (data.imageState.move === 'top') {
                                if (data.imageState.y > 0) {
                                    data.imageState.y--;
                                } else {
                                    data.imageState.move = 'bottom';
                                }
                            }
                            data.imageState.animationState = time;
                            drawItem(data);
                            drawed.push(gridMap[x][y].data);
                        }
                    }
                }
                onAnimationEnd();
                animationNow = false;
                window.requestAnimationFrame(animate);
                //if ( !window.requestAnimationFrame ) {
                //
                //    window.requestAnimationFrame = ( function() {
                //
                //        return window.webkitRequestAnimationFrame ||
                //            window.mozRequestAnimationFrame ||
                //            window.oRequestAnimationFrame ||
                //            window.msRequestAnimationFrame ||
                //            function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
                //                window.setTimeout( callback, 1000 / 60 );
                //            };
                //
                //    }());
                //
                //}
            };
        var eventedCallbacks = {},
            filterByCoord    = function (x, y, cb) {
                eachOrigin(function (origin) {
                    var data = origin.data;
                    if (y >= data.y && y <= data.y + data.height && x >= data.x && x <= data.x + data.width) {
                        cb(origin);
                    }
                });
            };
        grid.addEventListener('mouseover', function (e) {
            console.log('in', e);
        });

        grid.addEventListener("mouseout", function (e) {
            console.log('out', e);
        });

        grid.addEventListener("click", function (e) {
            if (!eventedCallbacks.hasOwnProperty('click')) {
                return;
            }
            filterByCoord(e.layerX, e.layerY, function (origin) {
                for (var i in eventedCallbacks.click) {
                    eventedCallbacks.click[i](e, origin, e.layerX, e.layerY);
                }
            });
        });
        grid.addEventListener("mousedown", function (e) {
            if (!eventedCallbacks.hasOwnProperty('mousedown')) {
                return;
            }
            filterByCoord(e.layerX, e.layerY, function (origin) {
                for (var i in eventedCallbacks.mousedown) {
                    eventedCallbacks.mousedown[i](e, origin, e.layerX, e.layerY);
                }
            });
        });
        grid.addEventListener("mousemove", function (e) {
            if (!eventedCallbacks.hasOwnProperty('mousemove')) {
                return;
            }
            filterByCoord(e.layerX, e.layerY, function (origin) {
                for (var i in eventedCallbacks.mousemove) {
                    eventedCallbacks.mousemove[i](e, origin, e.layerX, e.layerY);
                }
            });
        });

        // Events --------------

        eventedCallbacks.click = [
            function (e, origin, x, y) {
                ctx.fillStyle = "rgba(0, 50, 0, 0.2)";
                ctx.strokeStyle = "rgb(50, 10, 10)";
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.stroke();
                var data = origin.data;
                ctx.fillRect(data.x, data.y, data.width, data.height);
            }
        ];

        eventedCallbacks.mousemove = [
            function (e, origin, x, y) {
                ctx.fillStyle = "rgba(10, 0, 0, 0.01)";
                var data = origin.data;
                if (y >= data.y && y <= data.y + data.height && x >= data.x && x <= data.x + data.width) {
                    ctx.fillRect(data.x, data.y, data.width, data.height);
                }
                ctx.strokeStyle = "rgba(50, 10, 10, 0.3)";
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        ];

        $('.add').click(addNewItem);
        $('.addn').click(addNewItems);
        $('.redraw').click(function () {
            redrawItems();
        });
        $('.animate').click(function () {
            animationOn = !animationOn;
            window.requestAnimationFrame(animate);
        });
        // scroll
        window.scrollCallback = function (dx, dy) {
            $('span.debugg').text('x: ' + dx.toFixed(2) + ', y: ' + dy.toFixed(2));
            console.log('x: ' + dx.toFixed(2) + ', y: ' + dy.toFixed(2));
            var wasAnimation = animationOn;
            animationOn = false;
            while(animationNow) {
                console.log('interlocked!');
            }
            eachOrigin(function (origin) {
                var data = origin.data;
                data.y += dy;
                data.x += dx;
            });
            viewCenterX += dx;
            viewCenterY += dy;
            animationOn = wasAnimation;
        };

        // debug -----------
        if (debugGreed) {
            drawGreed();
        }
        if (debugPolar) {
            drawPolar();
        }

    }
);

