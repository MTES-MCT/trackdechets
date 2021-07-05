/* eslint @typescript-eslint/no-var-requires: "off" */
const { readFileSync } = require("fs");
const path = require("path");

function loadMutation(name) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

module.exports = {
  createBsdasri: loadMutation("createBsdasri"),
  updateBsdasri: loadMutation("updateBsdasri"),
  signBsdasri: loadMutation("signBsdasri")
};
