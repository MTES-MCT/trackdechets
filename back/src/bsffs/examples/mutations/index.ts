import path from "path";
import { readFileSync } from "fs";

function loadMutation(name: string) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

export default {
  createFicheIntervention: loadMutation("createFicheIntervention"),
  createBsff: loadMutation("createBsff")
};
