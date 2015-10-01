requirejs([
    'jquery',
    'movementMouse',
    'movementGyro',
    'movement',
    'gridView',
    'gridDataSource',
], function ($, movementMouse, movementGyro, movement, gridView, dataSource) {
    dataSource.loadMore(function (data) {
    });
    $(document).ready(function () {
        var element = document.getElementsByClassName('grid')[0];//canvas
        element.width = document.body.clientWidth;
        element.height = document.body.clientHeight - 80;

        var grid = gridView(element, {});
        grid.batchAdd(dataSource.getAllData());

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
    });

});