define([
//    'jquery',
//    'lodash',
//    'jquery.mousewheel',
    'gyro'
], function (gyro) {

    var warningCounter = 0;

    return function (scrollCallback, options) {
        var orientation = null;
        var accCount          = 0,
            accX              = 0,
            accY              = 0,
            maxAngle          = options.maxAngle || 45,
            accuracyAngle     = options.accuracyAngle || 25,
            freezing          = options.freezing || 0.90,
            lastX             = 0,
            lastY             = 0,
            gravityThreshold  = options.gravityThreshold || 45,
            gravityMultiplier = options.gravityMultiplier || 0.5,
            multiplier        = options.multiplier || 7,
            frequency         = options.frequency || 200;

        gyro.frequency = frequency;
        var trackingCallback = function (eventData) {
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
            //
            var t;
            switch (orientation) {
                case 180:
                    // Portrait (Upside-down)
                    x = -x;
                    y = -y;
                    break;
                case -90:
                    // Landscape (Clockwise)
                    t = x;
                    x = -y;
                    y = t;
                    break;
                case 90:
                    // Landscape  (Counterclockwise)
                    t = -x;
                    x = y;
                    y = t;
                    break;
            }
            //
            var factrorX = Math.abs(accX - x) / accuracyAngle;//accuracyAngle грудусов погрешность
            if (factrorX < 1) {//если маленькая погрешность, углы медленно текут
                factrorX = freezing;
            } else {
                factrorX = freezing / factrorX;//углы шустренько меняются
            }
            accX = accX * factrorX + x * (1 - factrorX);
            var factrorY = Math.abs(accY - y) / accuracyAngle;//accuracyAngle грудусов погрешность
            if (factrorY < 1) {//если маленькая погрешность, углы медленно текут
                factrorY = freezing;
            } else {
                factrorY = freezing / factrorY;//углы шустренько меняются
            }
            accY = accY * factrorY + y * (1 - factrorY);
            if (orientation !== window.orientation) {
                gyro.stopTracking();
                orientation = window.orientation;
                setTimeout(function () {
                    gyro.startTracking(trackingCallback);
                }, 1000);
                accCount = 0;
                return;
            }
            if (accCount <= 2) {
                gyro.calibrate();
            } else {
                if (accX > maxAngle) {
                    accX = maxAngle;
                }
                if (accX < -maxAngle) {
                    accX = -maxAngle;
                }
                if (accY > maxAngle) {
                    accY = maxAngle;
                }
                if (accY < -maxAngle) {
                    accY = -maxAngle;
                }
                //$('span.debugg').text(
                //    "DeviceOrientation: "
                //    + ' (' + x.toFixed(1) + ',  ' + y.toFixed(1) + ')'
                //);
                //$('span.debugg21').text(accX.toFixed(2)).css('color', accX > 0 ? 'red' : 'blue');
                //$('span.debugg22').text(accY.toFixed(2)).css('color', accY > 0 ? 'red' : 'blue');
                if (!scrollCallback) {
                    return;//hack
                }
                var diffX = lastX - accX,
                    diffY = lastY - accY;
                if (gravityThreshold < maxAngle) {
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
                }

                scrollCallback(diffX * multiplier, diffY * multiplier);

                lastX = accX;
                lastY = accY;
            }
        };
        gyro.startTracking(trackingCallback);

        if (warningCounter++ > 1) {
            console.warn("Gyro, maybe, does not support more than one tracking callback ( you start " + warningCounter + 'callbacks)');
        }
    };
});
