import type { BsffPickupSiteInput } from "@td/codegen-ui";
import type { ZodBsff } from "../schema";

const trimOrNull = (value?: string | null) => value?.trim() || null;

/**
 * Builds the persisted pickup site without clearing the values kept in the
 * form when a user switches between address modes.
 */
export function buildBsffPickupSiteInput(
  values: ZodBsff
): BsffPickupSiteInput | null {
  if (!values.pickupSiteEnabled) return null;

  const site = values.emitter?.pickupSite;
  if (!site) return null;

  if (values.pickupSiteManualMode) {
    return {
      name: trimOrNull(site.name),
      address: null,
      street: trimOrNull(site.street),
      address2: trimOrNull(site.address2),
      postalCode: trimOrNull(site.postalCode),
      city: trimOrNull(site.city),
      infos: trimOrNull(site.infos)
    };
  }

  return {
    name: trimOrNull(site.name),
    address: trimOrNull(site.address),
    street: null,
    address2: null,
    postalCode: null,
    city: null,
    infos: null
  };
}

export function isManualBsffPickupSite(
  site: BsffPickupSiteInput | null | undefined
): boolean {
  return Boolean(
    site?.street ||
      site?.address2 ||
      site?.postalCode ||
      site?.city ||
      site?.infos
  );
}
