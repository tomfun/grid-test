// --- copy paste https://github.com/tkahn/smoothTouchScroll/blob/master/js/source/jquery.kinetic.js
$(document).ready(function ($) {
    if (gyro.hasFeature('deviceorientation')) {//машина поддерживает детект положение (повороты)
        $('span.debugg').text("deviceorientation is supported");
        var accCount = 0,
            accX     = 0,
            accY     = 0,
            freezing = 0.8;
        gyro.startTracking(function (eventData) {
            // call our orientation event handler
            if (eventData.gamma === null) {
                gyro.stopTracking();
            }
            accCount++;
            var x = eventData.gamma;
            //if (x < 0) {
            //    x += 180;//x - угол, от 0 до 180, теперь
            //}
            var y = eventData.beta;//угол от -180 до +180
            var factrorX = Math.abs(accX - x) / 10;//10 грудусов погрешность
            if (factrorX < 1) {//если маленькая погрешность, углы медленно текут
                factrorX = freezing;
            } else {
                factrorX = freezing / factrorX;//углы шустренько меняются
            }
            accX = accX * factrorX + x * (1 - factrorX);
            var factrorY = Math.abs(accY - y) / 10;//10 грудусов погрешность
            if (factrorY < 1) {//если маленькая погрешность, углы медленно текут
                factrorY = freezing;
            } else {
                factrorY = freezing / factrorY;//углы шустренько меняются
            }
            accY = accY * factrorY + y * (1 - factrorY);
            if (accCount === 1) {
                gyro.calibrate();
            } else {
                //$('span.debugg').text(
                //    "DeviceOrientation: "
                //    + ' (' + eventData.gamma.toFixed(1) + ',  ' + eventData.beta.toFixed(1) + ')'
                //);
                //$('span.debugg21').text(accX.toFixed(2)).css('color', accX > 0 ? 'red' : 'blue');
                //$('span.debugg22').text(accY.toFixed(2)).css('color', accY > 0 ? 'red' : 'blue');

                //shift(accX - , accY - );
            }
        });
    }
    var $this = $('.grid');

    $this.on("mousewheel", function (event) {
        event.preventDefault();
        shift(event.deltaX * event.deltaFactor, event.deltaY * event.deltaFactor);
    });


// ---------------------------
    Math.sign = Math.sign || function (x) {
            x = +x; // преобразуем в число
            if (x === 0 || isNaN(x)) {
                return x;
            }
            return x > 0 ? 1 : -1;
        };

    var DEFAULT_SETTINGS = {
        cursor:             'move',
        decelerateDistance: 0.03,
        maxvelocity:        60,//max is = 4 * maxvelocity
        speedDivide:        0.3,
        speedPow:           1.1,
        throttleFPS:        60,
        movingNow:          false,
    };
    var settings        = $.extend({}, DEFAULT_SETTINGS),
        xPos,
        xPosEnd,
        yPos,
        yPosEnd,
        mouseDown       = 0,
        throttleTimeout = 1000 / settings.throttleFPS,
        lastMouseMove,
        lastMove;
    settings.velocity = 0;

    var start = function (clientX, clientY) {
        settings.velocity = 0;
        xPosEnd = xPos = clientX;
        yPosEnd = yPos = clientY;
        mouseDown++;
    };
    var end = function () {
        mouseDown = 0;
        xPosEnd = Math.round(xPosEnd + (xPosEnd - xPos) * settings.velocity * settings.decelerateDistance);
        yPosEnd = Math.round(yPosEnd + (yPosEnd - yPos) * settings.velocity * settings.decelerateDistance);
    };
    var shift     = function (dx, dy) {
            if (!xPos && !xPosEnd || isNaN(xPos)) {
                xPos = xPosEnd = 0;
            }
            if (!yPos && !yPosEnd || isNaN(yPos)) {
                yPos = yPosEnd = 0;
            }
            xPosEnd += dx;
            yPosEnd += dy;
            moveOn(settings);
            //scrollCallback(dx, dy);
        },
        inputmove = function (clientX, clientY) {
            if (mouseDown) {
                if (!lastMouseMove || new Date() > new Date(lastMouseMove.getTime() + throttleTimeout)) {
                    lastMouseMove = new Date();
                    shift(clientX - xPosEnd, clientY - yPosEnd);
                }
            }
        };
    var moveOn = function (settings) {
            if (!settings.movingNow) {
                settings.movingNow = true;
                lastMove = new Date();
                move(settings);
            }
        },
        screw  = function (dx) {
            var speed = Math.pow(dx, settings.speedPow) / settings.speedDivide,
                now   = new Date(),
                diff  = now - lastMove;
            settings.velocity = diff * speed / 1000;
            if (settings.velocity > (settings.maxvelocity * 4)) {
                settings.velocity = settings.maxvelocity * 4;
            }
            lastMove = now;
            if (settings.velocity > settings.maxvelocity) {
                return settings.maxvelocity;
            }
            return settings.velocity;
        },
        validateApply = function (dr, r, m) {
            var tmp = r * m;
            //tmp = Math.sign(tmp) * Math.round(Math.abs(tmp));
            if (Math.abs(tmp) < Math.abs(dr)) {
                return tmp;
            }
            return dr;
        };
    var move = function () {
        if (!settings.movingNow) {
            return;
        }
        var now           = new Date(),
            dx            = xPosEnd - xPos,
            dy            = yPosEnd - yPos,
            r             = dx * dx + dy * dy,
            c             = Math.sign(dx) * Math.sqrt(dx * dx / r),
            s             = Math.sign(dy) * Math.sqrt(dy * dy / r);
        if (now > new Date(lastMove.getTime() + throttleTimeout)) {

            if (isFinite(r) && r > 0 && !isNaN(r)) {
                r = screw(Math.sqrt(r));
                dx = validateApply(dx, r, c);
                dy = validateApply(dy, r, s);
                var ddx = Math.round(xPos + dx) - Math.round(xPos),
                    ddy = Math.round(yPos + dy) - Math.round(yPos);
                xPos += dx;
                yPos += dy;
                if (ddx || ddy) {
                    scrollCallback(ddx, ddy);
                }
            }
        }
        if (Math.abs(xPosEnd - xPos) <= 0.6 && Math.abs(yPosEnd - yPos) <= 0.6) {
            settings.movingNow = false;
        } else {
            var timeOut = Math.ceil(throttleTimeout - (new Date() - now));
            setTimeout(move, timeOut);
        }
    };


    settings.events = {
        touchStart: function (e) {
            var touch;
            touch = e.originalEvent.touches[0];
            start(touch.clientX, touch.clientY);
            e.stopPropagation();
        },
        touchMove:  function (e) {
            var touch;
            touch = e.originalEvent.touches[0];
            inputmove(touch.clientX, touch.clientY);
            if (e.preventDefault) {
                e.preventDefault();
            }
        },
        inputDown:  function (e) {
            start(e.clientX, e.clientY);
        },
        inputEnd:   function (e) {
            inputmove(e.clientX, e.clientY);
            end();
        },
        inputMove:  function (e) {
            inputmove(e.clientX, e.clientY);
        },
    };

    var attachListeners = function ($this, settings) {
        var element = $this[0];
        $this.bind('touchstart', settings.events.touchStart)
            .bind('touchend', settings.events.inputEnd)
            .bind('touchmove', settings.events.touchMove);
        $this
            .mousedown(settings.events.inputDown)
            .mouseout(settings.events.inputEnd)
            .mousemove(settings.events.inputMove);
        document.body.addEventListener('mouseup', settings.events.inputEnd);
    };
    attachListeners($this, settings);


});
