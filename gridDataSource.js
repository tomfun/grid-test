define([
    'jquery',
    'lodash',
    'faker',
], function ($, _, faker) {
    var options,
        data                     = [],
        applyOptionsToLoadedData = function (opt) {
            //todo
        },
        res                      = {
            getOptions: function () {
                return _.extend({}, options);
            },
            setOptions: function (opt) {
                applyOptionsToLoadedData(opt);
                return this.getAllData();
            },
            getAllData: function () {
                return data;
            },
            _loadOne:   function () {//faker
                var trueFalse = function () {
                        return Math.random() > .5;
                    },
                    img       = function () {
                        return imgs[data.length % imgs.length];
                    },
                    color     = function () {
                        return "rgba(200, 0, " + Math.floor(200 * (0.275 + Math.random())) + ", 0.5)";
                    };
                var res = {
                    'publishState': 'small',
                    'userName':     faker.name.findName(),
                };
                if (data.length !== 0 && trueFalse() && trueFalse()) {
                    res.publishState = 'normal';
                    res.ico = '/tw_ico.svg';
                    res.text = faker.lorem.sentence();
                } else {
                    if (data.length === 0 || trueFalse() && trueFalse()) {
                        res.publishState = 'big';
                        res._titlePhoto = '/Снимок экрана - 01.10.2015 - 14:55:32';
                    }
                    res._photo = '/' + img();
                }
                return res;
            },
            loadMore:   function (cb) {
                var partialData = [];
                for (var i = 0; i < 10; i++) {
                    var t = this._loadOne();
                    partialData.push(t);
                    data.push(t);
                }
                cb(partialData);//test only
            }
        };

    return res;
});