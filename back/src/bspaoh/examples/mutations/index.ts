import { readFileSync } from "fs";
import path from "path";

function loadMutation(name: string) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

export default {
  createBspaoh: loadMutation("createBspaoh"),
  createDraftBspaoh: loadMutation("createDraftBspaoh"),
  publishBspaoh: loadMutation("publishBspaoh"),
  updateBspaoh: loadMutation("updateBspaoh"),
  signBspaoh: loadMutation("signBspaoh")
};
