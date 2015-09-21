// --- copy paste https://github.com/tkahn/smoothTouchScroll/blob/master/js/source/jquery.kinetic.js
$(document).ready(function ($) {
    //if (gyro.hasFeature('deviceorientation')) {//машина поддерживает детект положение (повороты)
    //    $('span.debugg').text("deviceorientation is supported");
    var accCount          = 0,
        accX              = 0,
        accY              = 0,
        freezing          = 0.90,
        lastX             = 0,
        lastY             = 0,
        gravityThreshold  = 30,
        gravityMultiplier = 0.5,
        multiplier        = 20,
        frequency         = 200,
        freezingShleyf    = 1;
    var shleyfIndex = 0,
        shleyfX,
        shleyfY,
        shleyf      = function () {
            $('span.debugg21').text((shleyfX / freezingShleyf).toFixed(2)).css('color', '');
            $('span.debugg22').text((shleyfY / freezingShleyf).toFixed(2)).css('color', '');
            window.scrollHack(shleyfX / freezingShleyf, shleyfY / freezingShleyf);
            if (shleyfIndex++ < freezingShleyf) {
                setTimeout(shleyf, frequency / (freezingShleyf + 1));
            } else {
                shleyfIndex = 0;
                shleyfX = 0;
                shleyfY = 0;
                //$('span.debugg').text(
                //    "~~@#$%~~" + Math.random().toFixed(2)
                //);
            }
        };
    gyro.frequency = frequency;
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
        var factrorX = Math.abs(accX - x) / 30;//30 грудусов погрешность
        if (factrorX < 1) {//если маленькая погрешность, углы медленно текут
            factrorX = freezing;
        } else {
            factrorX = freezing / factrorX;//углы шустренько меняются
        }
        accX = accX * factrorX + x * (1 - factrorX);
        var factrorY = Math.abs(accY - y) / 30;//30 грудусов погрешность
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
            //    + ' (' + x.toFixed(1) + ',  ' + y.toFixed(1) + ')'
            //);
            //$('span.debugg21').text(accX.toFixed(2)).css('color', accX > 0 ? 'red' : 'blue');
            //$('span.debugg22').text(accY.toFixed(2)).css('color', accY > 0 ? 'red' : 'blue');
            if (!window.scrollHack) {
                return;//hack
            }
            var diffX = lastX - accX,
                diffY = lastY - accY;
            if (accX > gravityThreshold) {
                diffX -= (accX - gravityThreshold) * gravityMultiplier;
            }
            if (accX < -gravityThreshold) {
                diffX -= (accX + gravityThreshold) * gravityMultiplier;
            }
            if (accY > gravityThreshold) {
                diffY -= (accY - gravityThreshold) * gravityMultiplier;
            }
            if (accY < -gravityThreshold) {
                diffY -= (accY + gravityThreshold) * gravityMultiplier;
            }
            shleyfX = diffX * multiplier;
            shleyfY = diffY * multiplier;
            shleyf();
            lastX = accX;
            lastY = accY;
        }
    });
    //}

});
