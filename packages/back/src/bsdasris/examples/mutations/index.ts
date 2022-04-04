import { readFileSync } from "fs";
import path from "path";

function loadMutation(name: string) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

export default {
  createBsdasri: loadMutation("createBsdasri"),
  updateBsdasri: loadMutation("updateBsdasri"),
  signBsdasri: loadMutation("signBsdasri"),
  signBsdasriEmissionWithSecretCode: loadMutation(
    "signBsdasriEmissionWithSecretCode"
  )
};
