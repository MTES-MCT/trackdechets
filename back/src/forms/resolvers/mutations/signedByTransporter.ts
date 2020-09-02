import {
  MutationResolvers,
  MutationSignedByTransporterArgs,
  MutationMarkAsCollectedArgs
} from "../../../generated/graphql/types";
import { UserInputError } from "apollo-server-express";
import markAsCollected from "./markAsCollected";

function validateArgs(args: MutationSignedByTransporterArgs) {
  if (args.signingInfo.signedByTransporter === false) {
    throw new UserInputError(
      "Le transporteur doit signer pour valider l'enlèvement."
    );
  }

  if (args.signingInfo.signedByProducer === false) {
    throw new UserInputError(
      "Le producteur doit signer pour valider l'enlèvement."
    );
  }
  return args;
}

const signedByTransporterResolver: MutationResolvers["signedByTransporter"] = async (
  parent,
  args,
  context
) => {
  const { id, signingInfo } = validateArgs(args);

  // signedByTransporter and signedByProducer are tied to Trackdéchets UI checkboxes
  // and do not make sense for API consumers. We got rid of it when we migrated from
  // signedByTransporter (now deprecated) to markAsCollected
  const { signedByTransporter, signedByProducer, ...rest } = signingInfo;

  const markAsCollectedArgs: MutationMarkAsCollectedArgs = {
    id,
    collectedInfo: rest
  };

  return markAsCollected(parent, markAsCollectedArgs, context);
};

export default signedByTransporterResolver;
