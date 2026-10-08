import { ZodBsff } from "../schema";

// RG1 : verrouillage strictement limité aux champs listés "Est importé depuis FF = OUI"
// et "Verrouillé après import = OUI".
// On ne verrouille pas le reste du formulaire, même après import FF.
const FLUIDES_FRIGORIGENES_LOCKED_FIELDS = new Set([
  "waste.code",
  "weight.value",
  "packagings.*.type",
  "packagings.*.weight",
  "packagings.*.numero",
  "ficheInterventions.*.numero",
  "ficheInterventions.*.holderType",
  "ficheInterventions.*.detenteur.company.siret",
  "ficheInterventions.*.detenteur.company.contact",
  "ficheInterventions.*.isExempted"
]);

export function hasFluidesFrigorigenesImport(
  formValues?: Partial<ZodBsff>
): boolean {
  return !!formValues?.fluidesFrigorigenesImport?.selectedInterventionIds
    ?.length;
}

export function isFluidesFrigorigenesLockedField(
  formValues: Partial<ZodBsff> | undefined,
  fieldName: string
): boolean {
  if (!hasFluidesFrigorigenesImport(formValues)) return false;
  return FLUIDES_FRIGORIGENES_LOCKED_FIELDS.has(fieldName);
}
