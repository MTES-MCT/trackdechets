import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { extractPostalCode } from "../../../utils";
import { expandFormFromDb } from "../../form-converter";

const appendix2FormsResolver: FormResolvers["appendix2Forms"] = async form => {
  const appendix2Forms = await prisma.form
    .findUnique({ where: { id: form.id } })
    .appendix2Forms();
  return appendix2Forms.map(f => {
    const form = expandFormFromDb(f);
    return {
      id: form.id,
      readableId: form.readableId,
      wasteDetails: form.wasteDetails,
      emitter: form.emitter,
      emitterPostalCode: extractPostalCode(form.emitter?.company?.address),
      signedAt: form.signedAt,
      quantityReceived: form.quantityReceived,
      processingOperationDone: form.processingOperationDone
    };
  });
};

export default appendix2FormsResolver;
