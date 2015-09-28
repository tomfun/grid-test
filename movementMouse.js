$(document).ready(function ($) {
    var $this      = $('.grid'),
        lastX,
        lastY,
        posX       = null,
        posY       = null,
        freezing   = 0.9999,
        threshold  = 50,
        multiplier = -0.2;
    var gridWidth  = $this.width(),
        gridHeight = $this.height();//todo
    var freezingInv   = 1 - freezing,
        scrollByMouse = function () {
            if (posX !== null && posY !== null && Math.abs(posY - lastY) < threshold && Math.abs(posX - lastX) < threshold) {
                return;
            }
            var diffX = (lastX - posX) * freezingInv,
                diffY = (lastY - posY) * freezingInv;
            window.scrollHack(diffX * multiplier, diffY * multiplier);
            posX += diffX;
            posY += diffY;
        },
        started       = null;
    $this.on("mousewheel", function (event) {
        event.preventDefault();
        window.scrollHack(event.deltaX * event.deltaFactor, event.deltaY * event.deltaFactor);
    });

    $this.on("mousemove", function (event) {
        lastY = event.clientY - gridHeight / 2;
        lastX = event.clientX - gridWidth / 2;
        if (!started) {
            setInterval(scrollByMouse, 200);
        }
    });

    //------------- Zoom ------------------
    var state        = null,
        centerX,
        centerY,
        curZoom      = 1,
        zoomOutState = 0.94,
        q            = 0.99,
        movingStart  = function (newState) {
            var wasState = state;
            state = !!newState;
            if (wasState === null) {
                moving();
            }
        },
        moving       = function () {
            if (state === null) {
                return;
            }
            if (state) {
                if (Math.round((zoomOutState - curZoom) * 100) >= 0) {
                    state = null;
                    return;
                }
                curZoom *= q;
            } else {
                if (Math.round(curZoom * 100) >= 100) {
                    state = null;
                    return;
                }
                curZoom /= q;
            }
            window.xxX(curZoom);
            setTimeout(function() {
                window.requestAnimationFrame(moving);
            }, 3);
        };
    $this.on('mousedown', function (e) {
        centerX = e.clientX;
        centerY = e.clientY;
        movingStart(true);
    });
    $this.on('mouseup', function (e) {
        movingStart();
    });
    $this.on('mouseout', function (e) {
        movingStart();
    });
});
