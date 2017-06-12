function Cache() {
    global.session = [];
}

Cache.prototype.add = function (key, value) {
    global.session[key] = value;
};

Cache.prototype.del = function (key) {
    if (undefined != global.session[key]) {
        delete global.session[key]
    }
};

Cache.prototype.all = function () {
    console.log(global.session);
    return global.session;
};

Cache.prototype.get = function (key) {
    return this.alive(key) ? global.session[key] : null;
};

Cache.prototype.alive = function (key) {
    return global.session[key] != undefined;
};

module.exports = new Cache;