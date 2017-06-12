function Cache() {
    global.body = [];
}

Cache.prototype.add = function (key, value) {
    global.body[key] = value;
};

Cache.prototype.del = function (key) {
    if (undefined != global.body[key]) {
        delete global.body[key]
    }
};

Cache.prototype.all = function () {
    console.log(body);
    return global.body;
};

Cache.prototype.get = function (key) {
    return this.alive(key) ? global.body[key] : null;
};

Cache.prototype.alive = function (key) {
    return global.body[key] != undefined;
};

module.exports = new Cache;