const Module = require("module");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.includes("codegen")) {
    console.log("Resolving:", request);
    console.log("From:", parent?.filename);
  }

  return originalResolve.call(this, request, parent, isMain, options);
};
