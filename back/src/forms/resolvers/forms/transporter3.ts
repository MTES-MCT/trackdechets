import { FormResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { expandBsddTransporterFromDB } from "../../converter";

const transporter3Resolver: FormResolvers["transporter3"] = async form => {
  const transporter3 = await prisma.form
    .findUnique({
      where: { id: form.id }
    })
    .transporter3();

  return transporter3 ? expandBsddTransporterFromDB(transporter3) : null;
};

export default transporter3Resolver;
