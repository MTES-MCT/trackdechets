import {
  Form,
  User,
  EcoOrganisme,
  TemporaryStorageDetail,
  TransportSegment
} from "../generated/prisma-client";

/**
 * A Prisma Form with linked objects
 */
export type FullForm = Form & { owner: User } & {
  ecoOrganisme: EcoOrganisme;
} & {
  temporaryStorage: TemporaryStorageDetail;
} & { transportSegments: TransportSegment[] };
