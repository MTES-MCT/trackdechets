import path from "path";
import { readFileSync } from "fs";

function loadMutation(name: string) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

export default {
  createFicheIntervention: loadMutation("createFicheIntervention"),
  createBsff: loadMutation("createBsff"),
  signBsff: loadMutation("signBsff"),
  updateBsff: loadMutation("updateBsff"),
  updateBsffPackaging: loadMutation("updateBsffPackaging"),
  createBsffTransporter: loadMutation("createBsffTransporter"),
  updateBsffTransporter: loadMutation("updateBsffTransporter")
};
