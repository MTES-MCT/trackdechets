import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  getFormOrFormNotFound,
  getFormTransporterOrNotFound,
  getTransporters
} from "../../database";
import { checkCanUpdate } from "../../permissions";

const deleteFormTransporterResolver: MutationResolvers["deleteFormTransporter"] =
  async (parent, { id }, context) => {
    const user = checkIsAuthenticated(context);

    const transporter = await getFormTransporterOrNotFound({ id });

    // TODO this should be done in a transaction
    if (transporter.formId) {
      const form = await getFormOrFormNotFound({ id: transporter.formId });
      const transporters = await getTransporters({ id: form.id });
      await checkCanUpdate(user, form, {
        id: form.id,
        transporters: transporters.map(t => t.id).filter(tid => tid !== id)
      });
      for (const nextTransporter of transporters.filter(
        t => t.number > transporter.number
      )) {
        // decrement next transporter numbering
        await prisma.bsddTransporter.update({
          where: { id: nextTransporter.id },
          data: { number: nextTransporter.number - 1 }
        });
      }
    }

    await prisma.bsddTransporter.delete({ where: { id } });

    return id;
  };

export default deleteFormTransporterResolver;
