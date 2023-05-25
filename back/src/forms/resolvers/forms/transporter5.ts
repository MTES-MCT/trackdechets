import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandBsddTransporterFromDB } from "../../converter";

const transporter5Resolver: FormResolvers["transporter5"] = async form => {
  const transporter5 = await prisma.form
    .findUnique({
      where: { id: form.id }
    })
    .transporter5();

  return transporter5 ? expandBsddTransporterFromDB(transporter5) : null;
};

export default transporter5Resolver;
