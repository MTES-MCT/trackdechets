import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandBsddTransporterFromDB } from "../../converter";

const transporter2Resolver: FormResolvers["transporter2"] = async form => {
  const transporter2 = await prisma.form
    .findUnique({
      where: { id: form.id }
    })
    .transporter2();

  return transporter2 ? expandBsddTransporterFromDB(transporter2) : null;
};

export default transporter2Resolver;
