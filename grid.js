requirejs([
    'jquery',
    'movementMouse',
    'movementGyro',
    'movement',
    'gridView',
    'gridDataSource',
    'fontLoader!MuseoSansRegular',
], function ($, movementMouse, movementGyro, movement, gridView, dataSource) {
    dataSource.loadMore(function (data) {
    });
    $(document).ready(function () {
        var $element = $('.grid'),
            element  = $element[0],
            changeSize = function() {
                element.width = document.body.clientWidth;
                element.height = document.body.clientHeight - 80;
                $element.trigger('resize-el');
            };//canvas
        changeSize();
        var grid = gridView(element, {scale: 200, debugFPS: true, debugText: false});
        grid.batchAdd(dataSource.getAllData());

        $(window).resize(function() {
            changeSize();
            grid.resize();
        });
        $('.add').click(function () {
            grid.removeAll();
            grid.batchAdd(dataSource.getAllData());
        });
        $('.addn').click(function () {
            dataSource.loadMore(function (partialData) {
                grid.batchAdd(partialData);
            });
        });
        $('.redraw').click(function () {
            grid.redrawItems();
        });
        $('.animate').click(function () {
            grid.toggleAnimation();
        });
        grid.toggleAnimation(true);
        var moveCallback = movement($element, grid.scrollCallback).manualScrollCallback;
        movementMouse($element, moveCallback, grid.resizeCallback);
        movementGyro(moveCallback);
        window.xxX = grid.resizeCallback;//debug remove
    });

});