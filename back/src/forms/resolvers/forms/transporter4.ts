import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandBsddTransporterFromDB } from "../../converter";

const transporter4Resolver: FormResolvers["transporter4"] = async form => {
  const transporter4 = await prisma.form
    .findUnique({
      where: { id: form.id }
    })
    .transporter4();

  return transporter4 ? expandBsddTransporterFromDB(transporter4) : null;
};

export default transporter4Resolver;
