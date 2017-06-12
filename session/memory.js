var session = [];

function Cache() {
    console.log("++ new cache ++");
    session = [];
}

Cache.prototype.add = function (key, value) {
    session[key] = value;
};

Cache.prototype.del = function (key) {
    if (undefined != session[key]) {
        delete session[key]
    }
};

Cache.prototype.all = function () {
    return session;
};

Cache.prototype.get = function (key) {
    return this.alive(key) ? session[key] : null;
};

Cache.prototype.alive = function (key) {
    return session[key] != undefined;
};

module.exports = new Cache;