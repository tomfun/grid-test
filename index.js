$(document).ready(
    function () {
        var grid = $('.grid').packery({
            itemSelector: '.grid-item',
            columnWidth: 200,
            rowHeight: 200,
            gutter: 0,
            isHorizontal: true
        });
        var onAdded = function (elem) {
            grid.packery( 'appended', elem )//prepended support; remove too
                // layout
                .packery();
        };
        var count = 6;
        $('.add').click(function(ev) {
            ev.preventDefault();
            var trueFalse = function() {
                return Math.random() > .5;
                },
                choices = ['grid-item--width2', 'grid-item--height2'],
                classes = 'grid-item';
            if (trueFalse()) {
                classes += ' ' + choices[1];
            }
            if (trueFalse()) {
                classes += ' ' + choices[0];
            }
            var e = $('<div/>').text(++count).addClass(classes);
            grid.append(e);
            onAdded(e);
        });
    }
);

