function Config() {
    this.path = process.cwd() + "/config." + (process.env.NODE_ENV || "dev");
}

Config.prototype.load = function (file) {
    return require(this.path + "/" + file);
};

module.exports = new Config;