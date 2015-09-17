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
                $('span.debugg').text(
                    "DeviceOrientation: "
                    + ' (' + eventData.gamma.toFixed(1) + ',  ' + eventData.beta.toFixed(1) + ')'
                );
                $('span.debugg21').text(accX.toFixed(2)).css('color', accX > 0 ? 'red' : 'blue');
                $('span.debugg22').text(accY.toFixed(2)).css('color', accY > 0 ? 'red' : 'blue');
            }
        });
    }

    $(document).on("mousewheel", function (event) {
        start(10, 10);
        if (mouseDown) {
            inputmove(10 + event.deltaX * event.deltaFactor / 2, 10 + event.deltaY * event.deltaFactor / 2);
        }

        end();
        // ---
        settings.decelerate = true;
        xpos = prevXPos = mouseDown = false;
    });

    var $this = $('.grid');

// ----
    var DEFAULT_SETTINGS = {
        cursor:          'move',
        decelerate:      true,
        triggerHardware: false,
        y:               true,
        x:               true,
        slowdown:        0.90,
        animationDelay:  15,
        maxvelocity:     40,
        throttleFPS:     60,
    };
    var selectStart = function () {
        return false;
    };
    var capVelocity = function (velocity, max) {
        var newVelocity = velocity;
        if (velocity > 0) {
            if (velocity > max) {
                newVelocity = max;
            }
        } else {
            if (velocity < (0 - max)) {
                newVelocity = (0 - max);
            }
        }
        return newVelocity;
    };
    var settings        = $.extend({}, DEFAULT_SETTINGS),
        xpos,
        prevXPos        = false,
        ypos,
        prevYPos        = false,
        mouseDown       = false,
        throttleTimeout = 1000 / settings.throttleFPS,
        lastMove;

    settings.velocity = 0;
    settings.velocityY = 0;

    var calculateVelocities = function () {
        settings.velocity = capVelocity(prevXPos - xpos, settings.maxvelocity);
        settings.velocityY = capVelocity(prevYPos - ypos, settings.maxvelocity);
    };
    var start = function (clientX, clientY) {
        mouseDown = true;
        settings.velocity = prevXPos = 0;
        settings.velocityY = prevYPos = 0;
        xpos = clientX;
        ypos = clientY;
    };
    var end = function () {
        if (xpos && prevXPos && settings.decelerate === false) {
            // stop immediately
            settings.decelerate = true;
            calculateVelocities();
            xpos = prevXPos = mouseDown = false;
            move($this, settings);
        } else {
            mouseDown = false;
            console.log(xpos && prevXPos && settings.decelerate, xpos, prevXPos, settings.decelerate)
        }
    };
    var inputmove = function (clientX, clientY) {
        if (!lastMove || new Date() > new Date(lastMove.getTime() + throttleTimeout)) {
            lastMove = new Date();

            if (mouseDown && (xpos || ypos)) {
                settings.decelerate = false;
                settings.velocity = settings.velocityY = 0;
                scrollCallback(clientX - xpos, clientY - ypos);
                prevXPos = xpos;
                prevYPos = ypos;
                xpos = clientX;
                ypos = clientY;

                calculateVelocities();
            }
        }
    };
    var stop = function ($scroller, settings) {
        settings.velocity = 0;
        settings.velocityY = 0;
        settings.decelerate = true;
    };
    var decelerateVelocity = function (velocity, slowdown) {
        return Math.floor(Math.abs(velocity)) === 0 ? 0 // is velocity less than 1?
            : velocity * slowdown; // reduce slowdown
    };
    var move = function ($scroller, settings) {
        var scroller = $scroller[0],
            dx       = -settings.velocity,
            dy       = -settings.velocityY;
        if (settings.x && scroller.scrollWidth > 0) {
            if (Math.abs(settings.velocity) > 0) {
                settings.velocity = settings.decelerate ?
                                    decelerateVelocity(settings.velocity, settings.slowdown) : settings.velocity;
            }
        } else {
            settings.velocity = 0;
        }

        if (settings.y && scroller.scrollHeight > 0) {
            if (Math.abs(settings.velocityY) > 0) {
                settings.velocityY = settings.decelerate ?
                                     decelerateVelocity(settings.velocityY, settings.slowdown) : settings.velocityY;
            }
        } else {
            settings.velocityY = 0;
        }
        scrollCallback(dx, dy);

        if (Math.abs(settings.velocity) > 0 || Math.abs(settings.velocityY) > 0) {
            // tick for next movement
            setTimeout(function () {
                move($scroller, settings);
            }, settings.animationDelay);
        } else {
            stop($scroller, settings);
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
            if (mouseDown) {
                touch = e.originalEvent.touches[0];
                inputmove(touch.clientX, touch.clientY);
                if (e.preventDefault) {
                    e.preventDefault();
                }
            }
        },
        inputDown:  function (e) {
            start(e.clientX, e.clientY);
        },
        inputEnd:   function (e) {
            end();
        },
        inputMove:  function (e) {
            if (mouseDown) {
                inputmove(e.clientX, e.clientY);
            }
        },
        scroll:     function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
        },
        inputClick: function (e) {
        },
        // prevent drag and drop images in ie
        dragStart:  function (e) {
        }
    };

    var attachListeners = function ($this, settings) {
        var element = $this[0];
        $this.bind('touchstart', settings.events.touchStart)
            .bind('touchend', settings.events.inputEnd)
            .bind('touchmove', settings.events.touchMove);
        $this
            .mousedown(settings.events.inputDown)
            .mouseup(settings.events.inputEnd)
            .mousemove(settings.events.inputMove);
    };
    attachListeners($this, settings);


});
