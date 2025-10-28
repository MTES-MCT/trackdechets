import { Company, Prisma } from "@td/prisma";
import type {
  OutgoingWasteLine,
  IncomingTexsLine,
  IncomingWasteLine,
  RegistryLookupResolvers,
  SsdLine,
  OutgoingTexsLine,
  ManagedLine,
  TransportedLine
} from "@td/codegen-back";
import { GraphQLContext } from "../../types";
import { getTypeFromLookup } from "./queries/utils/registryLookup.util";

type ParentType = Prisma.RegistryLookupGetPayload<{
  include: {
    registrySsd: true;
    registryIncomingWaste: true;
    registryIncomingTexs: true;
    registryOutgoingWaste: true;
    registryOutgoingTexs: true;
    registryTransported: true;
    registryManaged: true;
  };
}>;

export const RegistryLookup: Omit<
  RegistryLookupResolvers<GraphQLContext, ParentType>,
  "reportFor" | "reportAs"
> & {
  reportFor: (
    parent: ParentType,
    args: unknown,
    context: GraphQLContext
  ) => Promise<Company | null>;
  reportAs: (
    parent: ParentType,
    args: unknown,
    context: GraphQLContext
  ) => Promise<Company | null>;
} = {
  publicId: parent => parent.readableId,
  type: parent => getTypeFromLookup(parent),
  ssd: parent => (parent.registrySsd as SsdLine) ?? undefined,
  incomingWaste: parent =>
    (parent.registryIncomingWaste as IncomingWasteLine) ?? null,
  incomingTexs: parent =>
    (parent.registryIncomingTexs as IncomingTexsLine) ?? null,
  outgoingWaste: parent =>
    (parent.registryOutgoingWaste as OutgoingWasteLine) ?? null,
  outgoingTexs: parent =>
    (parent.registryOutgoingTexs as OutgoingTexsLine) ?? null,
  managedWaste: parent => (parent.registryManaged as ManagedLine) ?? null,
  transportedWaste: parent =>
    (parent.registryTransported as TransportedLine) ?? null,
  reportFor: async (parent, _, context) => {
    const company = await context.dataloaders.companies.load(parent.siret);
    return company;
  },
  reportAs: async (parent, _, context) => {
    if (!parent.reportAsSiret) {
      return null;
    }
    const company = await context.dataloaders.companies.load(
      parent.reportAsSiret
    );
    return company;
  }
};
