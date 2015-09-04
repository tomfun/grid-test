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
            scale                        = 50,
            contextWidth                 = 3600,
            contextHeight                = 2000,
            debugGreed                   = true,
            debugPolar                   = true,
            debugCropImage                   = true,
            maximumRadius                = 2850536294,//principal maximusm radius 285053629418320 ! on my machine
            epsilonCaltulationFromRadius = function (r) {
                return 180 * Math.asin(1 / r) / 2.01 / Math.PI;//1/Math.sin(epsilon  / (180 / Math.PI /2.01)) ==== radius
            },
            epsilon                      = epsilonCaltulationFromRadius(maximumRadius),
            drawGreed                    = function () {
                ctx.lineWidth = 2;
                ctx.strokeStyle = "rgb(150, 150, 255)";
                ctx.beginPath();
                ctx.setLineDash([4, 32]);
                for (var i = 0; i < contextWidth; i += scale) {
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, contextHeight);
                }
                for (i = 0; i < contextHeight; i += scale) {
                    ctx.moveTo(0, i);
                    ctx.lineTo(contextWidth, i);
                }
                ctx.stroke();
                ctx.beginPath();
                ctx.setLineDash([8, 24]);
                ctx.moveTo(0, contextHeight / 2);
                ctx.lineTo(contextWidth, contextHeight / 2);
                ctx.moveTo(contextWidth / 2, 0);
                ctx.lineTo(contextWidth / 2, contextHeight);
                ctx.stroke();

                ctx.lineDashOffset = 4;
                ctx.strokeStyle = "rgb(255, 50, 50)";
                ctx.beginPath();
                ctx.setLineDash([4, 32]);
                for (var i = 0; i < contextWidth; i += scale) {
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, contextHeight);
                }
                for (i = 0; i < contextHeight; i += scale) {
                    ctx.moveTo(0, i);
                    ctx.lineTo(contextWidth, i);
                }
                ctx.stroke();
                ctx.beginPath();
                ctx.setLineDash([8, 24]);
                ctx.moveTo(0, contextHeight / 2);
                ctx.lineTo(contextWidth, contextHeight / 2);
                ctx.moveTo(contextWidth / 2, 0);
                ctx.lineTo(contextWidth / 2, contextHeight);
                ctx.stroke();
            },
            drawPolar                    = function () {
                ctx.strokeStyle = "rgb(255, 50, 50)";
                ctx.beginPath();
                var maxRadius = contextHeight > contextWidth ? contextHeight : contextWidth;
                maxRadius = transformToMap(maxRadius);
                for (var i = 0; i < maxRadius; i++) {
                    ctx.arc(contextWidth / 2, contextHeight / 2, transformFromMap(i), 0, 2 * Math.PI);
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
                                    if (gridMap[i][j]) {
                                        phi += dphi;
                                        x = Math.round(r * Math.cos(toRad(phi)));
                                        y = Math.round(r * Math.sin(toRad(phi)));
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
                            dphi = 90;
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
            setNewOrigin                 = function (x, y, width, height) {
                for (var i = x; i < x + width; i++) {
                    for (var j = y; j < y + height; j++) {
                        if (gridMap.hasOwnProperty(i)) {
                            gridMap[i][j] = true;
                        } else {
                            gridMap[i] = {};
                            gridMap[i][j] = true;
                        }
                    }
                }
            },
            drawImage                    = function (image, x, y, width, height) {
                //  simple variant
                //var ptrn = ctx.createPattern(image, 'no-repeat');
                //ctx.fillStyle = ptrn;
                //ctx.fillRect(transformFromMap(pos.x) + 900, transformFromMap(pos.y) + 500, width, height);

                //  draw with resize
                //drawImage(img, x, y, width, height);
                //ctx.drawImage(image, transformFromMap(pos.x) + 1800, transformFromMap(pos.y) + 1000, width, height);

                //  draw with resize & clip
                //drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
                var dProportion = width / height,
                    sProportion = image.width / image.height,
                    iWidth,
                    iHeight,
                    scale;
                if (dProportion > sProportion) {
                    scale = width / image.width;
                    iWidth = image.width;
                    iHeight = iWidth / dProportion;
                } else {
                    scale = height / image.height;
                    iHeight = image.height;
                    iWidth = iHeight * dProportion;
                }
                if (debugCropImage) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    ctx.drawImage(
                        image,
                        x,
                        y,
                        image.width * scale,
                        image.height * scale
                    );
                    ctx.restore();
                }
                ctx.drawImage(
                    image,
                    0,
                    0,
                    iWidth,
                    iHeight,
                    x,
                    y,
                    width,
                    height
                );
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
                setNewOrigin(pos.x, pos.y, transformToMap(width), transformToMap(height));
                var image = new Image();
                ctx.fillRect(
                    transformFromMap(pos.x) + contextWidth / 2,
                    transformFromMap(pos.y) + contextHeight / 2,
                    width,
                    height
                );
                image.addEventListener('load', function () {
                    drawImage(image,
                        transformFromMap(pos.x) + contextWidth / 2,
                        transformFromMap(pos.y) + contextHeight / 2,
                        width,
                        height
                    );
                    onLoaded();
                }, false);
                image.src = '/' + img();
                onAdded();
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
        $('.add').click(addNewItem);
        $('.addn').click(addNewItems);

        // debug -----------
        if (debugGreed) {
            drawGreed();
        }
        if (debugPolar) {
            drawPolar();
        }
        //var image = new Image();
        //image.addEventListener('load', function () {
        //    drawImage(image,
        //        contextWidth / 2,
        //        contextHeight / 2,
        //        300,
        //        50
        //    );
        //}, false);
        //image.src = '/gallery/55cc61805e93d.jpg';
    }
);

