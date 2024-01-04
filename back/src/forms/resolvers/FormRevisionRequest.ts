import { getBsddFromActivityEvents } from "../../activity-events/bsdd";
import {
  FormRevisionRequest,
  FormRevisionRequestResolvers
} from "../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  expandBsddRevisionRequestContent,
  expandableFormIncludes,
  expandFormFromDb
} from "../converter";

const formRevisionRequestResolvers: FormRevisionRequestResolvers = {
  approvals: async parent => {
    const approvals = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .approvals();

    return approvals ?? [];
  },
  content: parent => {
    return expandBsddRevisionRequestContent(parent as any);
  },
  authoringCompany: async parent => {
    const authoringCompany = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .authoringCompany();

    if (!authoringCompany) {
      throw new Error(
        `FormRevisionRequest ${parent.id} has no authoring company.`
      );
    }
    return authoringCompany;
  },
  form: async (
    parent: FormRevisionRequest & { bsddId: string },
    _,
    { dataloaders }
  ) => {
    const fullBsdd = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .bsdd({ include: expandableFormIncludes });

    if (!fullBsdd) {
      throw new Error(`FormRevisionRequest ${parent.id} has no form.`);
    }
    const bsdd = await getBsddFromActivityEvents(
      {
        bsddId: parent.bsddId,
        at: parent.createdAt
      },
      { dataloader: dataloaders.events }
    );

    return expandFormFromDb({
      ...fullBsdd,
      ...bsdd,
      forwardedIn: fullBsdd.forwardedIn,
      transporters: fullBsdd.transporters
    });
  }
};

export default formRevisionRequestResolvers;
