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
});
