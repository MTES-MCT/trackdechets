import type { BsffEmitterInput } from "@td/codegen-ui";

export type BsffPickupSite = {
  name?: string | null;
  address?: string | null;
  addressComplement?: string | null;
  postalCode?: string | null;
  city?: string | null;
  infos?: string | null;
};

type WithPickupSite = {
  pickupSite?: BsffPickupSite | null;
};

// Compatibility boundary to remove once TRA-18515 exposes pickupSite in GraphQL.
export type BsffEmitterInputWithPickupSite = BsffEmitterInput & WithPickupSite;

export const getBsffPickupSite = (emitter: unknown) =>
  (emitter as WithPickupSite | null | undefined)?.pickupSite;
