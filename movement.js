// --- copy paste https://github.com/tkahn/smoothTouchScroll/blob/master/js/source/jquery.kinetic.js
$(document).ready(function ($) {

    $(document).on("mousewheel", function (event) {
        start(10, 10);
        elementFocused = event.target;
        if (mouseDown) {
            inputmove(10 + event.deltaX * event.deltaFactor / 2, 10 + event.deltaY * event.deltaFactor / 2);
        }

        end();
        elementFocused = null;
        // ---
        settings.decelerate = true;
        xpos = prevXPos = mouseDown = false;

        //$('span.debugg').text('x: ' + event.deltaX + ', y: ' + event.deltaY + ', f: ' + event.deltaFactor);
        //console.log('mousewheel', arguments);
    });

    var $this = $('.grid');

    //var scrollCallback = function (dx, dy) {
    //    $('span.debugg').text('x: ' + dx.toFixed(2) + ', y: ' + dy.toFixed(2));
    //    console.log('x: ' + dx.toFixed(2) + ', y: ' + dy.toFixed(2));
    //};

// ----
    var DEFAULT_SETTINGS = {
        cursor:          'move',
        decelerate:      true,
        triggerHardware: false,
        y:               true,
        x:               true,
        slowdown:        0.9,
        animationDelay:  10,
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
        lastMove,
        elementFocused;

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
            console.log(xpos && prevXPos && settings.decelerate, xpos , prevXPos , settings.decelerate)
        }
    };
    window.stopScrollImmediate = end;
    var inputmove = function (clientX, clientY) {
        if (!lastMove || new Date() > new Date(lastMove.getTime() + throttleTimeout)) {
            lastMove = new Date();

            if (mouseDown && (xpos || ypos)) {
                //if (elementFocused) {
                //    $(elementFocused).blur();
                //    elementFocused = null;
                //    $this.focus();
                //}
                settings.decelerate = false;
                settings.velocity = settings.velocityY = 0;
                scrollCallback(clientX - xpos, clientY - ypos);
                prevXPos = xpos;
                prevYPos = ypos;
                xpos = clientX;
                ypos = clientY;

                calculateVelocities();

                //if (typeof settings.moved === 'function') {
                //    settings.moved.call($this, settings);
                //}
            }
        }
    };
    var stop = function ($scroller, settings) {
        settings.velocity = 0;
        settings.velocityY = 0;
        settings.decelerate = true;
        //if (typeof settings.stopped === 'function') {
        //    settings.stopped.call($scroller, settings);
        //}
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

        //setMoveClasses.call($scroller, settings, settings.deceleratingClass);

        //if (typeof settings.moved === 'function') {
        //    settings.moved.call($scroller, settings);
        //}
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
            elementFocused = e.target;
            //if (e.target.nodeName === 'IMG') {
            //    e.preventDefault();
            //}
            //e.stopPropagation();
        },
        inputEnd:   function (e) {
            end();
            elementFocused = null;
            //if (e.preventDefault) {
            //    e.preventDefault();
            //}
        },
        inputMove:  function (e) {
            if (mouseDown) {
                inputmove(e.clientX, e.clientY);
                //if (e.preventDefault) {
                //    e.preventDefault();
                //}
            }
        },
        scroll:     function (e) {
            //if (typeof settings.moved === 'function') {
            //    settings.moved.call($this, settings);
            //}
            if (e.preventDefault) {
                e.preventDefault();
            }
        },
        inputClick: function (e) {
            if (Math.abs(settings.velocity) > 0) {
                e.preventDefault();
                return false;
            }
        },
        // prevent drag and drop images in ie
        dragStart:  function (e) {
            if (elementFocused) {
                return false;
            }
        }
    };

    var attachListeners = function ($this, settings) {
        var element = $this[0];
        //if ($.support.touch) {
            $this.bind('touchstart', settings.events.touchStart)
                .bind('touchend', settings.events.inputEnd)
                .bind('touchmove', settings.events.touchMove);
        //} else {
            $this
                .mousedown(settings.events.inputDown)
                .mouseup(settings.events.inputEnd)
                .mousemove(settings.events.inputMove);
        //}
        // doesn't need with canvas
        //$this
        //    .click(settings.events.inputClick)
        //    .scroll(settings.events.scroll)
        //    .bind("selectstart", selectStart) // prevent selection when dragging
        //    .bind('dragstart', settings.events.dragStart);
    };
    attachListeners($this, settings);


});
