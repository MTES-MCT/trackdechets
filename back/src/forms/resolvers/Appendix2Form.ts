import { ForbiddenError } from "apollo-server-express";
import { Appendix2FormResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import { isFormContributor } from "../permissions";

const appendix2FormResolvers: Appendix2FormResolvers = {
  emitter: async (parent, _, { user }) => {
    const form = await prisma.form.findUnique({ where: { id: parent.id } });
    if (!(await isFormContributor(user, form))) {
      throw new ForbiddenError(
        "Vous ne pouvez pas accéder au champ `emitter` de cette annexe 2"
      );
    }
    return parent.emitter;
  }
};

export default appendix2FormResolvers;
