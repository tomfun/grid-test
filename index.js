$(document).ready(
    function () {
        var grid    = document.getElementsByClassName('grid')[0],
            ctx     = grid.getContext('2d'),
            gridMap = {};

        ctx.fillStyle = "rgb(200,0,0)";
        ctx.fillRect(10, 10, 55, 50);

        ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
        ctx.fillRect(30, 30, 55, 50);

        var onAdded = function (elem) {
        };
        var count            = 0,
            scale            = 50,
            transformToMap   = function (n) {
                return Math.round(n / scale);
            },
            transformFromMap = function (n) {
                return n * scale;
            },
            getNewOrigin     = function (width, height) {
                var x     = 0,
                    y     = 0,
                    r     = 0,
                    phi   = 0,
                    dphi  = 90,
                    toRad = function (n) {
                        return n * 2 * Math.PI / 360;
                    };
                debugger;
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
                    if (phi > -dphi + 360.00000001) {
                        phi = 0;
                        r++;
                        if (r === 1) {
                            dphi = 90;
                        } else {
                            dphi = 180 * Math.asin(1 / r) / 1.9 / Math.PI;
                        }
                    }
                } while (true);
                return {
                    x: x,
                    y: y
                };
            },
            setNewOrigin     = function (x, y, width, height) {
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
            addNewItem       = function (ev) {
                //ev.preventDefault();
                var trueFalse = function () {
                        return Math.random() > .5;
                    },
                    img       = function () {
                        return imgs[count % imgs.length];
                    },
                    color = function() {
                        return "rgba(200, 0, " + Math.floor(200 * (0.275 + Math.random())) + ", 0.5)";
                    },
                    width     = scale,
                    height    = scale,
                    pos;
                ctx.fillStyle = color();
                if (trueFalse()) {
                    ctx.fillStyle = color();
                    height = scale * 2;
                }
                if (trueFalse()) {
                    ctx.fillStyle = color();
                    width = scale * 2;
                }
                pos = getNewOrigin(transformToMap(width), transformToMap(height));
                setNewOrigin(pos.x, pos.y, transformToMap(width), transformToMap(height));
                var image = new Image();
                ctx.fillRect(transformFromMap(pos.x) + 900, transformFromMap(pos.y) + 500, width, height);
                image.onload = function () {
                    //var ptrn = ctx.createPattern(image, 'no-repeat');
                    //ctx.fillStyle = ptrn;
                    //ctx.fillRect(transformFromMap(pos.x) + 900, transformFromMap(pos.y) + 500, width, height);
                    //  context.drawImage(img,x,y,width,height);
                    ctx.drawImage(image, transformFromMap(pos.x) + 900, transformFromMap(pos.y) + 500, width, height);
                };
                image.src = '/' + img();
                onAdded();
                count++;
            },
            addNewItems      = function (n) {
                if (!n) {
                    n = 10;
                }
                for (var faker = 0; faker < 10; faker++) {
                    addNewItem();
                }
            };
        $('.add').click(addNewItem);
        $('.addn').click(addNewItems);
    }
);

