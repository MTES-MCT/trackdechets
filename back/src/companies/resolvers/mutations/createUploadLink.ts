import { getPutSignedUrl } from "../../../common/s3";
import {
  MutationResolvers,
  MutationCreateUploadLinkArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { UserInputError } from "apollo-server-express";

const SUPPORTED_FORMATS = [
  "image/jpg",
  "image/jpeg",
  "image/gif",
  "image/png",
  "application/pdf"
];

function validateArgs(args: MutationCreateUploadLinkArgs) {
  if (!SUPPORTED_FORMATS.includes(args.fileType)) {
    throw new UserInputError("Format de fichier non supporté");
  }
  return args;
}

const createUploadLinkResolver: MutationResolvers["createUploadLink"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const { fileName, fileType } = validateArgs(args);
  const timestamp = new Date().getTime();
  const computedFileName = [user.id, timestamp, fileName].join("-");
  const url = await getPutSignedUrl(computedFileName, fileType);
  return {
    signedUrl: url,
    key: computedFileName
  };
};

export default createUploadLinkResolver;
