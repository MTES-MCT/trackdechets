import { FormResolvers } from "../../../generated/graphql/types";
import { expandTemporaryStorageFromDb } from "../../form-converter";
import { prisma } from "../../../generated/prisma-client";

const temporaryStorageDetailsResolver: FormResolvers["temporaryStorageDetail"] = async form => {
  const temporaryStorageDetail = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();

  return temporaryStorageDetail
    ? expandTemporaryStorageFromDb(temporaryStorageDetail)
    : null;
};

export default temporaryStorageDetailsResolver;
