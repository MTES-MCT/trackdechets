import {
  findInitialDetenteurCompletion,
  hasBsffInitialValue as present
} from "@td/constants";
export { getDetenteurKey, uniqueDetenteurs } from "@td/constants";

type InitialDetenteurInput = {
  isPrivateIndividual?: boolean | null;
  company?: {
    siret?: string | null;
    name?: string | null;
    address?: string | null;
    contact?: string | null;
    phone?: string | null;
    mail?: string | null;
  } | null;
};

/** RG10: complete missing source fields, without changing source identities/count. */
export function completeInitialDetenteurs(
  initial: InitialDetenteurInput[],
  submitted: InitialDetenteurInput[] = [],
  allInitial: InitialDetenteurInput[] = initial
): InitialDetenteurInput[] {
  return initial.map(holder => {
    const completion = findInitialDetenteurCompletion(
      holder,
      allInitial,
      submitted
    );
    const company = { ...holder.company };
    for (const field of [
      "siret",
      "name",
      "address",
      "contact",
      "phone",
      "mail"
    ] as const) {
      if (!present(company[field]) && present(completion?.company?.[field])) {
        company[field] = completion?.company?.[field];
      }
    }
    return {
      isPrivateIndividual: present(holder.isPrivateIndividual)
        ? holder.isPrivateIndividual
        : completion?.isPrivateIndividual,
      company
    };
  });
}
