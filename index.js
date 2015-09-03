$(document).ready(
    function () {
        var grid = $('.grid').packery({
            itemSelector: '.grid-item',
            columnWidth:  200,
            rowHeight:    200,
            gutter:       0,
            isHorizontal: true
        });
        var onAdded = function (elem) {
            grid.packery('appended', elem)//prepended support; remove too
                // layout
                .packery();
        };
        var count = 0,
            addNewItem = function (ev) {
                //ev.preventDefault();
                var trueFalse = function () {
                        return Math.random() > .5;
                    },
                    img = function() {
                        return imgs[count % imgs.length];
                    },
                    choices   = ['grid-item--width2', 'grid-item--height2'],
                    classes   = 'grid-item';
                //if (trueFalse()) {
                //    classes += ' ' + choices[1];
                //}
                if (trueFalse()) {
                    classes += ' ' + choices[0];
                }
                var t = $('<div class="inner"/>').text(++count).css('background', 'url(' + img() + ')').css('height', '100%'),
                    e = $('<div/>').addClass(classes).append(t);
                grid.append(e);
                onAdded(e);
            },
            addNewItems = function(n) {
                if (!n) {
                    n = 10;
                }
                for(var faker = 0; faker < 10; faker++) {
                    addNewItem();
                }
            };
        $('.add').click(addNewItem);
        $('.addn').click(addNewItems);
    }
);

