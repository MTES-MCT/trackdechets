import {
  Consistence,
  EmitterType,
  Form,
  FormCompany,
  FormEcoOrganisme,
  FormInput,
  QuantityType,
  TemporaryStorageDetail,
  Trader,
  Broker,
  WorkSite,
  TransportMode
} from "codegen-ui";

/**
 * Computes initial values for trader fields in Formik's form
 * by merging defaults with current state of the draft BSD (if any)
 */
export function getInitialTrader(trader?: Trader | null) {
  return {
    receipt: trader?.receipt ?? "",
    department: trader?.department ?? "",
    validityLimit: trader?.validityLimit ?? null,
    company: getInitialCompany(trader?.company)
  };
}

/**
 * Computes initial values for broker fields in Formik's form
 * by merging defaults with current state of the draft BSD (if any)
 */
export function getInitialBroker(broker?: Broker | null) {
  return {
    receipt: broker?.receipt ?? "",
    department: broker?.department ?? "",
    validityLimit: broker?.validityLimit ?? null,
    company: getInitialCompany(broker?.company)
  };
}

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

/**
 * Computes initial values for a temporary storage detail fields in Formik's form
 * by merging defaults with current state of the draft BSD (if any)
 */
export function getInitialTemporaryStorageDetail(
  temporaryStorageDetail?: TemporaryStorageDetail | null
) {
  return {
    destination: {
      company: getInitialCompany(temporaryStorageDetail?.destination?.company),
      cap: temporaryStorageDetail?.destination?.cap ?? "",
      processingOperation:
        temporaryStorageDetail?.destination?.processingOperation ?? ""
    }
  };
}

/**
 * Computes initial values for an emitter work site fields in Formik's form
 * by merging defaults with current state of the draft BSD (if any)
 */
export function getInitialEmitterWorkSite(workSite?: WorkSite | null) {
  return {
    name: workSite?.name ?? "",
    address: workSite?.address ?? "",
    city: workSite?.city ?? "",
    postalCode: workSite?.postalCode ?? "",
    infos: workSite?.infos ?? ""
  };
}

/**
 * Computes initial values for an eco-organisme fields in Formik's form
 * by merging defaults with current state of the draft BSD (if any)
 */
export function getInitialEcoOrganisme(ecoOrganisme?: FormEcoOrganisme | null) {
  return {
    siret: ecoOrganisme?.siret ?? "",
    name: ecoOrganisme?.name ?? ""
  };
}

/**
 * Computes initial values for Form.intermediaries
 */
export function getInitialIntermediaries(intermediaries?: FormCompany[]) {
  return intermediaries
    ? intermediaries.map(company => ({
        orgId: company?.orgId ?? "",
        siret: company?.siret ?? "",
        name: company?.name ?? "",
        address: company?.address ?? "",
        contact: company?.contact ?? "",
        mail: company?.mail ?? "",
        phone: company?.phone ?? "",
        vatNumber: company?.vatNumber ?? "",
        country: company?.country ?? ""
      }))
    : [];
}

/**
 * Computes initial values of Formik's form by merging
 * default values to the current draft form (if any)
 * @param f current BSD
 */
export function getInitialState(f?: Form | null): FormInput {
  return {
    id: f?.id ?? null,
    customId: f?.customId ?? "",
    emitter: {
      pickupSite: null, // deprecated
      type: f?.emitter?.type ?? EmitterType.Producer,
      workSite: f?.emitter?.workSite
        ? getInitialEmitterWorkSite(f?.emitter?.workSite)
        : null,
      company: getInitialCompany(f?.emitter?.company),
      isForeignShip: f?.emitter?.isForeignShip ?? false,
      isPrivateIndividual: f?.emitter?.isPrivateIndividual ?? false
    },
    recipient: {
      cap: f?.recipient?.cap ?? "",
      processingOperation: f?.recipient?.processingOperation ?? "",
      isTempStorage: f?.recipient?.isTempStorage ?? false,
      company: getInitialCompany(f?.recipient?.company)
    },
    transporter: {
      isExemptedOfReceipt: f?.transporter?.isExemptedOfReceipt ?? false,
      numberPlate: f?.transporter?.numberPlate ?? "",
      customInfo: f?.transporter?.customInfo ?? null,
      company: getInitialCompany(f?.transporter?.company),
      mode: f?.transporter?.mode ?? TransportMode.Road
    },
    trader: f?.trader
      ? {
          receipt: f?.trader?.receipt ?? "",
          department: f?.trader?.department ?? "",
          validityLimit: f?.trader?.validityLimit ?? null,
          company: getInitialCompany(f?.trader?.company)
        }
      : null,
    broker: f?.broker
      ? {
          receipt: f?.broker?.receipt ?? "",
          department: f?.broker?.department ?? "",
          validityLimit: f?.broker?.validityLimit ?? null,
          company: getInitialCompany(f?.broker?.company)
        }
      : null,
    wasteDetails: {
      code: f?.wasteDetails?.code ?? "",
      name: f?.wasteDetails?.name ?? "",
      onuCode: f?.wasteDetails?.onuCode ?? "",
      packagingInfos: f?.wasteDetails?.packagingInfos ?? [],
      quantity: f?.wasteDetails?.quantity ?? null,
      quantityType: f?.wasteDetails?.quantityType ?? QuantityType.Estimated,
      consistence: f?.wasteDetails?.consistence ?? Consistence.Solid,
      pop: f?.wasteDetails?.pop ?? false,
      isDangerous: f?.wasteDetails?.isDangerous ?? false,
      parcelNumbers: f?.wasteDetails?.parcelNumbers ?? [],
      analysisReferences: f?.wasteDetails?.analysisReferences ?? [],
      landIdentifiers: f?.wasteDetails?.landIdentifiers ?? [],
      packagings: null, // deprecated
      otherPackaging: null, // deprecated
      numberOfPackages: null // deprecated
    },
    grouping: f?.grouping ?? [],
    ecoOrganisme: f?.ecoOrganisme
      ? getInitialEcoOrganisme(f?.ecoOrganisme)
      : null,
    temporaryStorageDetail: f?.temporaryStorageDetail
      ? getInitialTemporaryStorageDetail(f?.temporaryStorageDetail)
      : null,
    intermediaries: getInitialIntermediaries(f?.intermediaries)
  };
}
