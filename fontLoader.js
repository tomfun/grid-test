define([], function () {
    //waitForWebfonts = function (fonts, callback) {
    //    var loadedFonts = 0;
    //    for (var i = 0, l = fonts.length; i < l; ++i) {
    //        waitFont(fonts[i]);
    //    }
    //};
    /**
     * http://stackoverflow.com/questions/4383226/using-jquery-to-know-when-font-face-fonts-are-loaded
     */
    return {
        load: function (fontName, parentRequire, callback, config) {
            var loadedFonts = 1,
                fonts       = [fontName],
                waitFont    = function (font) {
                    var node = document.createElement('span');
                    // Characters that vary significantly among different fonts
                    node.innerHTML = 'giItT1WQy@!-/#';
                    // Visible - so we can measure it - but not on the screen
                    node.style.position = 'absolute';
                    node.style.left = '-10000px';
                    node.style.top = '-10000px';
                    // Large font size makes even subtle changes obvious
                    node.style.fontSize = '300px';
                    // Reset any font properties
                    node.style.fontFamily = 'sans-serif';
                    node.style.fontVariant = 'normal';
                    node.style.fontStyle = 'normal';
                    node.style.fontWeight = 'normal';
                    node.style.letterSpacing = '0';
                    document.body.appendChild(node);
                    if (node.style.fontFamily === fontName) {
                        node.style.fontFamily = 'arial';
                    }

                    // Remember width with no applied web font
                    var width = node.offsetWidth;

                    node.style.fontFamily = fontName;

                    var interval;

                    var checkFont = function () {
                        // Compare current width with original width
                        if (node && node.offsetWidth !== width) {
                            ++loadedFonts;
                            node.parentNode.removeChild(node);
                            node = null;
                        }

                        // If all fonts have been loaded
                        if (loadedFonts >= fonts.length) {
                            if (interval) {
                                clearInterval(interval);
                            }
                            if (loadedFonts >= fonts.length) {
                                callback();
                                return true;
                            }
                        }
                    };

                    if (!checkFont()) {
                        interval = setTimeout(checkFont, 50);
                    }
                };
            waitFont();
            //waitForWebfonts([fontName], cb);
        }
    };
});