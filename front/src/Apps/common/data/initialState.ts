import {
  BsdaTransporterInput,
  BsffTransporterInput,
  FormCompany,
  TransportMode
} from "@td/codegen-ui";

export const initialTransporter: BsdaTransporterInput | BsffTransporterInput = {
  transport: {
    mode: TransportMode.Road,
    plates: []
  },
  recepisse: { isExempted: false },
  company: getInitialCompany()
};
/**
 * Computes initial values for a company fields in Formik's form
 * by merging defaults with current state of the draft BSD (if any)
 */

export function getInitialCompany(company?: FormCompany | null) {
  return {
    orgId: company?.orgId ?? "",
    siret: company?.siret ?? "",
    name: company?.name ?? "",
    address: company?.address ?? "",
    contact: company?.contact ?? "",
    mail: company?.mail ?? "",
    phone: company?.phone ?? "",
    vatNumber: company?.vatNumber ?? "",
    country: company?.country ?? "",
    omiNumber: company?.omiNumber ?? ""
  };
}
