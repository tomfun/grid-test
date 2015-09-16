$(document).ready(
    function () {
        var grid = document.getElementsByClassName('grid')[0];
        grid.width = document.body.clientWidth - 30;
        grid.height = document.body.clientHeight - 90;
        var
            ctx     = grid.getContext('2d'),
            gridMap = {};
        ctx.fillStyle = "rgb(200,0,0)";
        ctx.fillRect(10, 10, 55, 50);

        ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
        ctx.fillRect(30, 30, 55, 50);

        // -------- constants & data
        var count                        = 0,
            scale                        = 80,//px per block (width and height)
            contextWidth                 = grid.width,
            contextHeight                = grid.height,
            viewCenterX                  = contextWidth / 2,
            viewCenterY                  = contextHeight / 2,
            debugGreed                   = false,
            debugPolar                   = false,
            debugHighlightHole           = false,
            debugCropImage               = false,
            mirroring                    = false,
            maximumRadius                = 2850536294,//principal maximum radius 285053629418320 ! on my machine
            duplicateHoleSize            = [[1, 1],],//w x h
            duplicateSquareSize          = [[2, 2], [1, 1],],

            info                         = {//pinned only, not duplicates
                left:       0,
                right:      0,
                top:        0,
                bottom:     0,
                radius:     0,
                radius2:    0,
                itemsCount: 0,
            },
            usedDuplicates               = [],
            recalculateInfo              = function () {
                var left       = 0, right = 0, top = 0, bottom = 0,
                    maxRadius2 = 0, radius = 0, itemsCount = 0;
                var find = function () {
                    // находим максимальный радиус
                    eachOrigin(function (origin) {
                        var x = origin.data.positionOnMap.x,
                            y = origin.data.positionOnMap.y,
                            t = x;
                        if (!origin.pinned) {
                            return;
                        }
                        itemsCount++;
                        var r = x * x + y * y;
                        if (r > maxRadius2) {
                            maxRadius2 = r;
                        }
                        x += transformToMap(origin.data.width);
                        r = x * x + y * y;
                        if (r > maxRadius2) {
                            maxRadius2 = r;
                        }
                        y += transformToMap(origin.data.height);
                        r = t * t + y * y;
                        if (r > maxRadius2) {
                            maxRadius2 = r;
                        }
                        r = x * x + y * y;
                        if (r > maxRadius2) {
                            maxRadius2 = r;
                        }
                    });
                    radius = Math.ceil(Math.sqrt(maxRadius2));
                    var i,
                        j;
                    left = radius;
                    right = -radius;
                    top = radius;
                    bottom = -radius;
                    for (i = -radius; i <= radius; i++) {
                        for (j = -radius; j <= radius; j++) {
                            //делаем квадрат
                            if (hasItem(i, j)) {
                                if (i < left) {
                                    left = i;
                                }
                                if (i > right) {
                                    right = i;
                                }
                                if (j < top) {
                                    top = j;
                                }
                                if (j > bottom) {
                                    bottom = j;
                                }
                            }
                        }
                    }
                    right++;
                    bottom++;
                };
                find();

                info.left = left;
                info.right = right;
                info.top = top;
                info.bottom = bottom;
                info.radius = radius;
                info.radius2 = maxRadius2;
                info.itemsCount = itemsCount;
            },
            epsilonCalculationFromRadius = function (r) {
                return 180 * Math.asin(1 / r) / 2.01 / Math.PI;// 1/Math.sin(epsilon  / (180 / Math.PI /2.01)) ==== radius
            },
            epsilon                      = epsilonCalculationFromRadius(maximumRadius),
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
                hideHoles();
            },
            onLoaded                     = function (elem) {
                if (debugGreed) {
                    drawGreed();
                }
                if (debugPolar) {
                    drawPolar();
                }
            },
            onAnimationEnd               = function () {
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
                    },
                    placeFree,
                    find  = function () {
                        for (var i = x; i < x + width; i++) {
                            for (var j = y; j < y + height; j++) {
                                if (gridMap.hasOwnProperty(i)) {
                                    if (gridMap[i].hasOwnProperty(j)) {
                                        if (gridMap[i][j].pinned) {
                                            return false;
                                        }
                                    }
                                }
                            }
                        }
                        return true;
                    };
                do {
                    if (!(placeFree = find())) {
                        phi += dphi;
                        x = Math.round(r * Math.cos(toRad(phi)) - width / 2);
                        y = Math.round(r * Math.sin(toRad(phi)) - height / 2);
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
                            dphi = epsilonCalculationFromRadius(r);
                        }
                        if (r > maximumRadius) {
                            throw 'Limit exceeds';
                        }
                    }
                } while (true);
                var rX = x, rY = y, maxRadius = function (x, y, max) {
                        var t = x,
                            r = x * x + y * y;
                        if (r > max) {
                            max = r;
                        }
                        x += width;
                        r = x * x + y * y;
                        if (r > max) {
                            max = r;
                        }
                        y += height;
                        r = t * t + y * y;
                        if (r > max) {
                            max = r;
                        }
                        r = x * x + y * y;
                        if (r > max) {
                            max = r;
                        }
                        return max;
                    },
                    rR = maxRadius(x, y, 0);
                if (r >= 2) {
                    while (phi < -dphi + 360 + epsilon) {
                        if (find()) {
                            if (maxRadius(x, y, 0) < rR) {
                                rX = x;
                                rY = y;
                                rR = maxRadius(x, y, 0);
                            }
                        }
                        phi += dphi;
                        x = Math.round(r * Math.cos(toRad(phi)) - width / 2);
                        y = Math.round(r * Math.sin(toRad(phi)) - height / 2);
                    }
                }
                return {
                    x: rX,
                    y: rY
                };
            },
            hasItem                      = function (x, y) {
                return gridMap.hasOwnProperty(x) && gridMap[x].hasOwnProperty(y);
            },
            setNewOrigin                 = function (x, y, additionalData, isDuplicate) {
                var newOrigin = {data: additionalData};
                newOrigin.duplicate = !!isDuplicate;
                newOrigin.pinned = !isDuplicate;
                for (var i = x; i < x + transformToMap(additionalData.width); i++) {
                    for (var j = y; j < y + transformToMap(additionalData.height); j++) {
                        if (gridMap.hasOwnProperty(i)) {
                            if (gridMap[i][j] && gridMap[i][j].duplicate) {
                                var duplicateData = gridMap[i][j].data,
                                    usedDuplicatesIndex;
                                if ((usedDuplicatesIndex = usedDuplicates.indexOf(duplicateData)) !== -1) {
                                    usedDuplicates.splice(usedDuplicatesIndex, 1);
                                }
                                eachOrigin(function (origin, remX, remY) {
                                    if (origin.data === duplicateData) {
                                        delete gridMap[remX][remY];
                                    }
                                }, true);
                            }
                            gridMap[i][j] = newOrigin;
                        } else {
                            gridMap[i] = {};
                            gridMap[i][j] = newOrigin;
                        }
                    }
                }
            },
            eachOrigin                   = function (cb, all) {
                var processed = [];
                for (var x in gridMap) {
                    for (var y in gridMap[x]) {
                        if (all || processed.indexOf(gridMap[x][y].data) === -1) {
                            processed.push(gridMap[x][y].data);
                            cb(gridMap[x][y], x, y);
                        }
                    }
                }
            },
            hideHoles                    = function () {
                recalculateInfo();
                var find = function () {
                    //функция поиска дыр на карте
                    var res = [];
                    if (info.radius2 < 8 || info.itemsCount < 4) {
                        return [];//дыр тоже нет
                    }
                    if (debugHighlightHole) {
                        ctx.strokeStyle = "rgb(150, 10, 10)";
                        ctx.lineDashOffset = 0;
                        ctx.setLineDash([]);
                        ctx.beginPath();
                        ctx.arc(viewCenterX, viewCenterY, transformFromMap(Math.sqrt(info.radius2)), 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    var i,
                        j;
                    //фильтруем от пустоты без соседей
                    var checkMask        = {},
                        inCheckMask      = function (x, y) {
                            return checkMask.hasOwnProperty(x + ',' + y);
                        },
                        searchHole       = function (x, y) {
                            checkMask[x + ',' + y] = true;
                            if (x * x + y * y > info.radius2) {
                                return false;//not a closed hole
                            }
                            if (hasItem(x, y) && gridMap[x][y].pinned) {
                                return true;//has neighbour
                            }
                            return (inCheckMask(x - 1, y) || searchHole(x - 1, y))
                                && (inCheckMask(x + 1, y) || searchHole(x + 1, y))
                                && (inCheckMask(x, y - 1) || searchHole(x, y - 1))
                                && (inCheckMask(x, y + 1) || searchHole(x, y + 1));
                        },
                        isEmptyPointHole = function (hole) {
                            checkMask = {};
                            var x = hole.x,
                                y = hole.y;
                            return (!hasItem(x, y) || !gridMap[x][y].pinned)
                                && searchHole(x - 1, y)
                                && searchHole(x + 1, y)
                                && searchHole(x, y - 1)
                                && searchHole(x, y + 1);
                        };

                    for (i = info.left; i < info.right; i++) {
                        for (j = info.top; j < info.bottom; j++) {
                            if ((i + .5) * (i + .5) + (j + .5) * (j + .5) < info.radius2//карйние элементы не считаются дырявыми
                                && (!hasItem(i, j) || !gridMap[i][j].pinned)) {//ищем соседей (не дубли, а реальные)
                                var hole = {x: i, y: j};
                                hole.real = !!isEmptyPointHole(hole);
                                res.push(hole);
                            } else {
                                if (!hasItem(i, j)) {
                                    res.push({x: i, y: j, squaring: true});
                                    if (debugHighlightHole) {
                                        ctx.fillRect(
                                            viewCenterX + transformFromMap(i),
                                            viewCenterY + transformFromMap(j),
                                            scale,
                                            scale
                                        );
                                    }
                                }
                            }
                        }
                    }

                    return res;
                };

                var holes = find(),
                    //usedDuplicates = [],
                    holeKey;
                if (debugHighlightHole) {
                    for (holeKey in holes) {
                        if (holes.hasOwnProperty(holeKey)) {
                            if (holes[holeKey].squaring) {
                                ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
                            } else {
                                if (!holes[holeKey].real) {
                                    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                                } else {
                                    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                                }
                            }

                            ctx.fillRect(
                                viewCenterX + transformFromMap(holes[holeKey].x),
                                viewCenterY + transformFromMap(holes[holeKey].y),
                                scale,
                                scale
                            );
                        }
                    }
                }
                var findForDuplicating = function (newX, newY, dontLookAtUsed) {
                        // в этой функции мы ищем элементы которые будем дублировать
                        var check = function (x, y) {//подходит ли элемент для дублирования
                            return hasItem(x, y) && gridMap[x][y].pinned
                                && (newX !== x && newY !== y)
                                && (newX + 1 !== x && newY !== y)
                                && (newX !== x && newY + 1 !== y)
                                && (newX + 1 !== x && newY + 1 !== y)
                                && (newX - 1 !== x && newY !== y)
                                && (newX !== x && newY - 1 !== y)
                                && (newX - 1 !== x && newY - 1 !== y)
                                && (dontLookAtUsed || usedDuplicates.indexOf(gridMap[x][y].data) === -1);
                        };
                        if (dontLookAtUsed) {//чистый рандом, уже всё равно
                            var i = (info.right - info.left) * (info.bottom - info.top);
                            while (i--) {
                                var a = random(info.left, info.right),
                                    b = random(info.top, info.bottom);
                                if (check(a, b)) {
                                    return gridMap[a][b];
                                }

                            }
                        }
                        for (var i = info.left; i < info.right; i++) {//любой подходящий
                            for (var j = info.top; j < info.bottom; j++) {
                                if (check(i, j)) {
                                    return gridMap[i][j];
                                }
                            }
                        }
                    },
                    debugDrawDuplicate = function (x, y, w, h, originalOrigin) {
                        ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
                        ctx.fillRect(x, y, w, h);
                        ctx.beginPath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgba(255, 50, 0, 0.7)';
                        ctx.rect(x, y, w, h);
                        ctx.stroke();
                        ctx.font = "20px Georgia";
                        ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
                        ctx.fillText(
                            '' + originalOrigin.data.positionOnMap.x + ', ' + originalOrigin.data.positionOnMap.y,
                            x,
                            y + 20
                        );
                    },
                    createDuplicate    = function (origin, newX, newY, sizes) {
                        if (!gridMap.hasOwnProperty(newX)) {
                            gridMap[newX] = {};
                        }
                        for (var sizeKey in sizes) {
                            if (!sizes.hasOwnProperty(sizeKey) || sizes[sizeKey].length !== 2) {
                                continue;
                            }
                            var newWidth  = sizes[sizeKey][0],
                                newHeight = sizes[sizeKey][1],
                                canInsert = true;
                            if (newWidth > info.right - newX || newHeight > info.bottom - newY) {
                                continue;
                            }
                            for (var i = 0; i < newWidth; i++) {
                                for (var j = 0; j < newHeight; j++) {
                                    if (!(canInsert = canInsert && !hasItem(newX + i, newY + j)/* || !gridMap[x][y].pinned*/)) {
                                        i = newWidth;
                                        j = newHeight;
                                    }
                                }
                            }
                            if (!canInsert) {
                                continue;//нельзя вставить дубликат в эту точку с таким размером
                            }
                            if (debugHighlightHole) {
                                // в отладке не создаём дубликат
                                debugDrawDuplicate(
                                    viewCenterX + transformFromMap(newX),
                                    viewCenterY + transformFromMap(newY),
                                    scale * newWidth,
                                    scale * newHeight,
                                    origin
                                );
                            } else {
                                // создаём дубликат, и помещаем его в сетку
                                var data = createData(origin.data.imageSrc, {
                                    x: newX,
                                    y: newY
                                }, origin.data.color, scale * newWidth, scale * newHeight, true);
                                setNewOrigin(newX, newY, data, true);
                            }
                            return sizes[sizeKey];
                        }
                        return false;
                    };
                var filledHoleKeys = [];
                for (holeKey in holes) {
                    if (holes.hasOwnProperty(holeKey) && filledHoleKeys.indexOf(holeKey) === -1) {
                        var x = holes[holeKey].x,
                            y = holes[holeKey].y;
                        if (hasItem(x, y) && gridMap[x][y].duplicate) {
                            continue;
                        }
                        var sizes = holes[holeKey].real ? duplicateHoleSize : duplicateSquareSize;
                        var replace = findForDuplicating(x, y) || findForDuplicating(x, y, true);
                        if (replace) {
                            var insertedSize = createDuplicate(replace, x, y, sizes);
                            if (insertedSize) {
                                usedDuplicates.push(replace.data);//стараемся не использовать теже карточки для дубликатов
                                for (var i = x; i < x + insertedSize[0]; i++) {
                                    for (var j = y; j < y + insertedSize[1]; j++) {
                                        for (var filledHoleKey in holes) {
                                            if (holes.hasOwnProperty(filledHoleKey)
                                                && filledHoleKeys.indexOf(filledHoleKey) === -1
                                                && holes[filledHoleKey].x == i
                                                && holes[filledHoleKey].y == j
                                            ) {
                                                filledHoleKeys.push(filledHoleKey);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
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
            createData                   = function (image, pos, color, width, height, dontCallOnLoad) {
                var img = image ? (new Image()) : false,
                    res = {
                        imageSrc:       image,//src
                        image:          img,
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
                        },
                        setImageSrc:    function (src) {
                            if (!src) {
                                src = this.imageSrc;
                                this.image.src = src;
                                this.imageSrc = src;
                            }
                            img.addEventListener('load', function () {
                                initImage(res);
                                drawImage(res);
                                if (!dontCallOnLoad) {
                                    onLoaded(res);
                                }
                            }, false);
                        }
                    };
                if (image) {
                    res.setImageSrc();
                }
                return res;
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
                if (!image) {
                    return;
                }
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
                //if (trueFalse()) {
                //    height *= 2;
                //}
                //if (trueFalse()) {
                //    height *= 2;
                //}
                //if (trueFalse()) {
                //    width *= 2;
                //}
                //if (trueFalse()) {
                //    width *= 2;
                //}
                if (trueFalse()) {
                    width *= 2;
                    height *= 2;
                }
                pos = getNewOrigin(transformToMap(width), transformToMap(height));
                var image = new Image(),
                    data  = createData('/' + img(), pos, ctx.fillStyle, width, height);
                setNewOrigin(pos.x, pos.y, data);
                ctx.fillRect(
                    data.x,
                    data.y,
                    width,
                    height
                );
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
            },
            mirroredData                 = function (data, cb) {
                if (!mirroring) {
                    cb(data, data.x, data.y, 0, 0);
                    return;
                }
                var boxWidth  = info.right - info.left,
                    boxHeight = info.bottom - info.top,
                    inArea    = function (p, size, viewSize) {
                        var t1 = p,
                            t2 = p + size;
                        return (t1 >= 0 && t1 <= viewSize) || (t2 >= 0 && t2 <= viewSize);
                    };
                boxWidth = transformFromMap(boxWidth);
                boxHeight = transformFromMap(boxHeight);
                var wasX = data.x,
                    wasY = data.y;
                data.x = data.x % boxWidth - boxWidth;
                for (; data.x < contextWidth; data.x += boxWidth) {
                    data.y = wasY % boxHeight - boxHeight;
                    for (; data.y < contextHeight; data.y += boxHeight) {
                        if (inArea(data.x, data.width, contextWidth) && inArea(data.y, data.height, contextHeight)) {
                            cb(data, wasX, wasY, boxWidth, boxHeight);
                        }
                    }
                }
                data.x = wasX;
                data.y = wasY;
            };
        var drawItem       = function (data) {
                var realDraw = function (data) {
                    if (data.getImage() && data.imageState) {
                        drawImage(data);
                    } else {
                        ctx.fillStyle = data.color;
                        ctx.fillRect(
                            data.x,
                            data.y,
                            data.width,
                            data.height
                        );
                    }
                };
                mirroredData(data, realDraw);
            },
            redrawItems    = function (filter) {
                ctx.clearRect(0, 0, contextWidth, contextHeight);
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
            animationNow   = false,
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
                            if (diff <= 0.5) {
                                drawItem(data);//todo
                                continue;//todo: draw old state
                            }
                            if (data.imageState.move === 'right') {
                                var maxX = data.getImage().width - data.imageState.clipW;
                                if (data.imageState.x < maxX) {
                                    data.imageState.x += diff;
                                    if (data.imageState.x > maxX) {
                                        data.imageState.x = maxX;
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
                                var maxY = data.getImage().height - data.imageState.clipH;
                                if (data.imageState.y < maxY) {
                                    data.imageState.y += diff;
                                    if (data.imageState.y > maxY) {
                                        data.imageState.y = maxY;
                                    }
                                } else {
                                    data.imageState.move = 'top';
                                }
                            }
                            if (data.imageState.move === 'top') {
                                if (data.imageState.y > 0) {
                                    data.imageState.y -= diff;
                                    if (data.imageState.y < 0) {
                                        data.imageState.y = 0;
                                    }
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
            window.stopScrollImmediate();
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

                ctx.font = "20px Georgia";
                ctx.fillStyle = 'rgba(200, 100, 255, 0.3)';
                ctx.fillText(
                    '' + origin.data.positionOnMap.x + ', ' + origin.data.positionOnMap.y,
                    viewCenterX + transformFromMap(origin.data.positionOnMap.x),
                    viewCenterY + transformFromMap(origin.data.positionOnMap.y) + 20
                );
                ctx.fillText(
                    "" + origin.data.width / scale + 'x' + origin.data.height / scale
                    + (origin.duplicate ? ' d' : ''),
                    viewCenterX + transformFromMap(origin.data.positionOnMap.x),
                    viewCenterY + transformFromMap(origin.data.positionOnMap.y) + 40
                );

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
            //console.log('x: ' + dx.toFixed(2) + ', y: ' + dy.toFixed(2));
            var wasAnimation = animationOn;
            animationOn = false;
            while (animationNow) {
                console.log('interlocked!');
            }
            viewCenterX += dx;
            viewCenterY += dy;
            var boxWidth  = info.right - info.left,
                boxHeight = info.bottom - info.top;
            boxWidth = transformFromMap(boxWidth);
            boxHeight = transformFromMap(boxHeight);
            viewCenterX = contextWidth / 2 + (viewCenterX - contextWidth / 2) % boxWidth;
            viewCenterY = contextHeight / 2 + (viewCenterY - contextHeight / 2) % boxHeight;

            eachOrigin(function (origin) {
                var data = origin.data;
                data.x = transformFromMap(data.positionOnMap.x) + viewCenterX;
                data.y = transformFromMap(data.positionOnMap.y) + viewCenterY;
            });
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
)
;

