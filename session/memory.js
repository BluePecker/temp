function Cache() {
    console.log("++ new cache ++");
    this.list = [];
}

Cache.prototype.add = function (key, value) {
    this.list[key] = value;
};

Cache.prototype.del = function (key) {
    if (undefined != this.list[key]) {
        delete this.list[key]
    }
};

Cache.prototype.all = function () {
    return this.list;
};

Cache.prototype.get = function (key) {
    return this.alive(key) ? this.list[key] : null;
};

Cache.prototype.alive = function (key) {
    return this.list[key] != undefined;
};

module.exports = new Cache;