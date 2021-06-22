/* eslint @typescript-eslint/no-var-requires: "off" */
const { readFileSync } = require("fs");
const path = require("path");

function loadMutation(name) {
  return readFileSync(path.join(__dirname, `${name}.gql`), "utf-8");
}

module.exports = {
  createForm: loadMutation("createForm"),
  markAsSealed: loadMutation("markAsSealed"),
  signedByTransporter: loadMutation("signedByTransporter"),
  markAsReceived: loadMutation("markAsReceived"),
  markAsProcessed: loadMutation("markAsProcessed"),
  markAsTempStored: loadMutation("markAsTempStored"),
  markAsResealed: loadMutation("markAsResealed"),
  prepareSegment: loadMutation("prepareSegment"),
  markSegmentAsReadyToTakeOver: loadMutation("markSegmentAsReadyToTakeOver"),
  takeOverSegment: loadMutation("takeOverSegment"),
  importPaperForm: loadMutation("importPaperForm")
};
