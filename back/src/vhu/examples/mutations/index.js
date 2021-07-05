/* eslint @typescript-eslint/no-var-requires: "off" */
const { readFileSync } = require("fs");
const path = require("path");

function loadMutation(name) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

module.exports = {
  createBsvhu: loadMutation("createBsvhu"),
  updateBsvhu: loadMutation("updateBsvhu"),
  signBsvhu: loadMutation("signBsvhu")
};
