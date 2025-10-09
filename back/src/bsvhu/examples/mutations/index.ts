import { readFileSync } from "fs";
import path from "path";

function loadMutation(name) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

export default {
  createBsvhu: loadMutation("createBsvhu"),
  updateBsvhu: loadMutation("updateBsvhu"),
  signBsvhu: loadMutation("signBsvhu"),
  createBsvhuTransporter: loadMutation("createBsvhuTransporter"),
  updateBsvhuTransporter: loadMutation("updateBsvhuTransporter")
};
