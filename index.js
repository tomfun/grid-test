$(document).ready(
    function () {
        var grid = $('.grid').masonry({
            // options
            itemSelector: '.grid-item',
            columnWidth:  200,
            isFitWidth: true,
            //isOriginLeft: false,
            //isOriginTop: false,

        });
        var onAdded = function (elem) {
            grid.masonry( 'appended', elem )
                // layout
                .masonry();
        };
        var count = 6;
        $('.add').click(function() {
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

