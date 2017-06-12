function Cache() {
    this.body = [];
}

Cache.prototype.add = function (key, value) {
    this.body[key] = value;
};

Cache.prototype.del = function (key) {
    if (undefined != this.body[key]) {
        delete this.body[key]
    }
};

Cache.prototype.all = function () {
    console.log(this.body);
    return this.body;
};

Cache.prototype.get = function (key) {
    return this.alive(key) ? this.body[key] : null;
};

Cache.prototype.alive = function (key) {
    return this.body[key] != undefined;
};

module.exports = new Cache;