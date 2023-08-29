import path from "path";
import { readFileSync } from "fs";

function loadMutation(name: string) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

export default {
  createFormTransporter: loadMutation("createFormTransporter"),
  updateFormTransporter: loadMutation("updateFormTransporter"),
  createForm: loadMutation("createForm"),
  updateForm: loadMutation("updateForm"),
  markAsSealed: loadMutation("markAsSealed"),
  signEmissionForm: loadMutation("signEmissionForm"),
  signTransportForm: loadMutation("signTransportForm"),
  markAsReceived: loadMutation("markAsReceived"),
  markAsProcessed: loadMutation("markAsProcessed"),
  markAsTempStored: loadMutation("markAsTempStored"),
  markAsResealed: loadMutation("markAsResealed"),
  prepareSegment: loadMutation("prepareSegment"),
  markSegmentAsReadyToTakeOver: loadMutation("markSegmentAsReadyToTakeOver"),
  takeOverSegment: loadMutation("takeOverSegment"),
  importPaperForm: loadMutation("importPaperForm")
};
