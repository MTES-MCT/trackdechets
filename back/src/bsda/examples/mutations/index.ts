import path from "path";
import { readFileSync } from "fs";

function loadMutation(name: string) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

export default {
  createBsda: loadMutation("createBsda"),
  updateBsda: loadMutation("updateBsda"),
  publishBsda: loadMutation("publishBsda"),
  signBsda: loadMutation("signBsda"),
  createBsdaTransporter: loadMutation("createBsdaTransporter"),
  updateBsdaTransporter: loadMutation("updateBsdaTransporter")
};
