"use strict";
function objectAssign(target) {
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments[_i];
    }
    if (sources) {
        sources.forEach(function (source) {
            for (var key in source) {
                target[key] = source[key];
            }
        });
    }
    return target;
}
exports.objectAssign = objectAssign;
//# sourceMappingURL=utils.js.map