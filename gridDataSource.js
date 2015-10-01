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
                if (data.length < 2) {
                    res.text = "У них не было детей. Они купили овчарку и безумно любили её. через 7 лет у них родился сын... Однажды из детской выбежал пёс, его морда была в крови. Жена взвыла, муж достал ружье и убил пса. войдя в детскую, они увидели спящего сына, а возле кроватки убитую змею…" + "\n" +
                    "Через 7 лет у них родился сын... Однажды из детской выбежал отец, его морда была в крови. Змея взвыла, сын достал жену и убил детскую. Войдя в кроватку, они увидели спящее ружьё и убитого пса…" + "\n" +
"Через 7 псов у них родилась змея... Однажды из отца выбежал пёс, его детская была в жене. Кроватка взвыла, ружьё достало сына и убило 7 лет.";
                } else {
                    res.text = faker.lorem.sentences(6);
                }
                } else {
                    if (data.length === 0 || trueFalse() && trueFalse()) {
                        res.publishState = 'big';
                        res._titlePhoto = '/gallery/___example_title.png';
                    }
                    res._photo = '/' + img();
                }
                return res;
            },
            loadMore:   function (cb) {
                var partialData = [];
                for (var i = 0; i < 4; i++) {
                    var t = this._loadOne();
                    partialData.push(t);
                    data.push(t);
                }
                cb(partialData);//test only
            }
        };

    return res;
});