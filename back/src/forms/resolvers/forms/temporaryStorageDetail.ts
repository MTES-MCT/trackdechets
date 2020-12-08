import prisma from "src/prisma";
import { FormResolvers } from "../../../generated/graphql/types";
import { expandTemporaryStorageFromDb } from "../../form-converter";

const temporaryStorageDetailsResolver: FormResolvers["temporaryStorageDetail"] = async form => {
  const temporaryStorageDetail = await prisma.form
    .findUnique({ where: { id: form.id } })
    .temporaryStorageDetail();

  return temporaryStorageDetail
    ? expandTemporaryStorageFromDb(temporaryStorageDetail)
    : null;
};

export default temporaryStorageDetailsResolver;
