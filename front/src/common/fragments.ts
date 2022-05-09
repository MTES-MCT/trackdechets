import { gql } from "@apollo/client";

export const statusChangeFragment = gql`
  fragment StatusChange on Form {
    id
    status
  }
`;

export const companyFragment = gql`
  fragment CompanyFragment on FormCompany {
    name
    siret
    vatNumber
    address
    contact
    country
    phone
    mail
  }
`;

export const workSiteFragment = gql`
  fragment WorkSiteFragment on WorkSite {
    name
    address
    city
    postalCode
    infos
  }
`;

export const pickupSiteFragment = gql`
  fragment PickupSiteFragment on PickupSite {
    name
    address
    city
    postalCode
    infos
  }
`;

export const wasteDetailsFragment = gql`
  fragment WasteDetailsFragment on WasteDetails {
    code
    name
    onuCode
    packagingInfos {
      type
      other
      quantity
    }
    quantity
    quantityType
    consistence
    pop
    isDangerous
  }
`;

export const transporterFragment = gql`
  fragment TransporterFragment on Transporter {
    isExemptedOfReceipt
    receipt
    department
    validityLimit
    numberPlate
    customInfo
    mode
    company {
      ...CompanyFragment
    }
  }
  ${companyFragment}
`;

const emitterFragment = gql`
  fragment EmitterFragment on Emitter {
    type
    workSite {
      ...WorkSiteFragment
    }
    company {
      ...CompanyFragment
    }
  }
  ${companyFragment}
  ${workSiteFragment}
`;

const recipientFragment = gql`
  fragment RecipientFragment on Recipient {
    cap
    processingOperation
    isTempStorage
    company {
      ...CompanyFragment
    }
  }
  ${companyFragment}
`;

const traderFragment = gql`
  fragment TraderFragment on Trader {
    receipt
    department
    validityLimit
    company {
      ...CompanyFragment
    }
  }
  ${companyFragment}
`;

const brokerFragment = gql`
  fragment BrokerFragment on Broker {
    receipt
    department
    validityLimit
    company {
      ...CompanyFragment
    }
  }
  ${companyFragment}
`;

export const temporaryStorageDetailFragment = gql`
  fragment TemporaryStorageDetailFragment on TemporaryStorageDetail {
    emittedAt
    emittedAt
    takenOverAt
    takenOverBy
    temporaryStorer {
      quantityType
      quantityReceived
      wasteAcceptationStatus
      wasteRefusalReason
      receivedAt
      receivedBy
    }
    destination {
      company {
        ...CompanyFragment
      }
      cap
      processingOperation
      isFilledByEmitter
    }
    wasteDetails {
      onuCode
      packagingInfos {
        type
        other
        quantity
      }
      quantity
      quantityType
    }
    transporter {
      ...TransporterFragment
    }
  }
  ${companyFragment}
  ${transporterFragment}
`;

export const segmentFragment = gql`
  fragment Segment on TransportSegment {
    id
    readyToTakeOver
    transporter {
      validityLimit
      numberPlate
      isExemptedOfReceipt
      department
      receipt
      company {
        siret
        name
        address
        contact
        mail
        phone
      }
    }
    mode
    takenOverAt
    takenOverBy
    previousTransporterCompanySiret
    segmentNumber
  }
`;

export const staticFieldsFragment = gql`
  fragment StaticFieldsFragment on Form {
    readableId
    customId
    createdAt
    status
    stateSummary {
      packagingInfos {
        type
        other
        quantity
      }
      onuCode
      quantity
      transporterNumberPlate
      transporterCustomInfo
      transporter {
        ...CompanyFragment
      }
      recipient {
        ...CompanyFragment
      }
      emitter {
        ...CompanyFragment
      }
      lastActionOn
    }
  }
  ${companyFragment}
`;

const mutableFieldsFragment = gql`
  fragment MutableFieldsFragment on Form {
    id
    customId
    sentAt
    emittedAt
    emittedBy
    emittedByEcoOrganisme
    takenOverAt
    takenOverBy
    emitter {
      ...EmitterFragment
    }
    recipient {
      ...RecipientFragment
    }
    transporter {
      ...TransporterFragment
    }
    trader {
      ...TraderFragment
    }
    broker {
      ...BrokerFragment
    }
    wasteDetails {
      ...WasteDetailsFragment
    }
    appendix2Forms {
      id
      readableId
      wasteDetails {
        code
        name
        quantity
        packagingInfos {
          type
          other
          quantity
        }
      }
      emitter {
        company {
          name
        }
      }
      recipient {
        company {
          siret
        }
      }
      signedAt
      processingOperationDone
    }
    ecoOrganisme {
      name
      siret
    }
    temporaryStorageDetail {
      ...TemporaryStorageDetailFragment
    }

    currentTransporterSiret
    nextTransporterSiret
    transportSegments {
      ...Segment
    }
  }
  ${traderFragment}
  ${brokerFragment}
  ${transporterFragment}
  ${temporaryStorageDetailFragment}
  ${wasteDetailsFragment}
  ${emitterFragment}
  ${recipientFragment}
  ${segmentFragment}
`;

export const fullFormFragment = gql`
  fragment FullForm on Form {
    ...MutableFieldsFragment
    ...StaticFieldsFragment
  }
  ${mutableFieldsFragment}
  ${staticFieldsFragment}
`;

export const transporterFormFragment = gql`
  fragment TransporterFormFragment on Form {
    ...MutableFieldsFragment
    ...StaticFieldsFragment
    currentTransporterSiret
    nextTransporterSiret
    transportSegments {
      ...Segment
    }
  }
  ${mutableFieldsFragment}
  ${staticFieldsFragment}
  ${segmentFragment}
`;

export const detailFormFragment = gql`
  fragment DetailFormFragment on Form {
    ...TransporterFormFragment
    sentAt
    sentBy
    signedByTransporter
    processedAt
    receivedAt
    receivedBy
    quantityReceived
    wasteAcceptationStatus
    wasteRefusalReason
    signedAt
    processedBy
    processedAt
    processingOperationDescription
    processingOperationDone
    ecoOrganisme {
      siret
      name
    }
    groupedIn {
      id
      readableId
    }
    appendix2Forms {
      readableId
      wasteDetails {
        code
        name
        quantity
      }
      quantityReceived
      signedAt
      emitterPostalCode
    }
  }
  ${transporterFormFragment}
`;
// Dasris

const signatureFragment = gql`
  fragment SignatureFragment on BsdasriSignature {
    date
    author
  }
`;

const dasriEmissionWasteDetailsFragment = gql`
  fragment DasriEmissionWasteDetailsFragment on BsdasriEmission {
    weight {
      value
      isEstimate
    }
    volume
    packagings {
      type
      other
      quantity
      volume
    }
  }
`;

const dasriTransportWasteDetailsFragment = gql`
  fragment DasriTransportWasteDetailsFragment on BsdasriTransport {
    weight {
      value
      isEstimate
    }
    volume
    packagings {
      type
      other
      quantity
      volume
    }
  }
`;
const dasriReceptionWasteDetailsFragment = gql`
  fragment DasriReceptionWasteDetailsFragment on BsdasriReception {
    volume
    packagings {
      type
      other
      quantity
      volume
    }
  }
`;
const initialDasriFragment = gql`
  fragment InitialDasriFragment on InitialBsdasri {
    id
    quantity
    volume
    weight
    takenOverAt
    postalCode
  }
`;

const wasteAcceptationFragment = gql`
  fragment WasteAcceptationFragment on BsdasriWasteAcceptation {
    status
    refusalReason
    refusedWeight
  }
`;

export const dashboardDasriFragment = gql`
  fragment DasriFragment on Bsdasri {
    id
    bsdasriStatus: status
    type
    isDraft
    bsdasriWaste: waste {
      code
    }
    emitter {
      company {
        ...CompanyFragment
      }
      emission {
        isTakenOverWithoutEmitterSignature
        isTakenOverWithSecretCode
      }
    }
    ecoOrganisme {
      siret
      emittedByEcoOrganisme
    }
    transporter {
      company {
        ...CompanyFragment
      }
      customInfo
      transport {
        plates
      }
    }
    destination {
      company {
        ...CompanyFragment
      }
    }
    grouping {
      id
    }
    synthesizing {
      id
    }
    createdAt
    updatedAt
    allowDirectTakeOver
  }
  ${companyFragment}
`;

export const fullDasriFragment = gql`
  fragment DasriFragment on Bsdasri {
    id
    bsdasriStatus: status
    type
    isDraft
    identification {
      numbers
    }
    waste {
      adr
      code
    }
    emitter {
      company {
        ...CompanyFragment
      }
      pickupSite {
        ...PickupSiteFragment
      }
      customInfo

      emission {
        isTakenOverWithoutEmitterSignature
        isTakenOverWithSecretCode

        ...DasriEmissionWasteDetailsFragment

        signature {
          ...SignatureFragment
        }
      }
    }
    ecoOrganisme {
      name
      siret
      emittedByEcoOrganisme
    }
    transporter {
      company {
        ...CompanyFragment
      }
      recepisse {
        number
        department
        validityLimit
      }

      customInfo
      transport {
        mode
        plates
        handedOverAt
        takenOverAt

        ...DasriTransportWasteDetailsFragment

        acceptation {
          ...WasteAcceptationFragment
        }
        signature {
          ...SignatureFragment
        }
      }
    }

    destination {
      company {
        ...CompanyFragment
      }
      customInfo
      reception {
        ...DasriReceptionWasteDetailsFragment

        acceptation {
          ...WasteAcceptationFragment
        }

        signature {
          ...SignatureFragment
        }
        date
      }
      operation {
        weight {
          value
        }
        code
        date
        signature {
          ...SignatureFragment
        }
      }
    }
    grouping {
      ...InitialDasriFragment
    }
    synthesizing {
      ...InitialDasriFragment
    }
    synthesizedIn {
      id
    }
    createdAt
    updatedAt
    allowDirectTakeOver
  }
  ${companyFragment}
  ${signatureFragment}
  ${pickupSiteFragment}

  ${dasriEmissionWasteDetailsFragment}
  ${dasriTransportWasteDetailsFragment}
  ${dasriReceptionWasteDetailsFragment}
  ${wasteAcceptationFragment}
  ${initialDasriFragment}
`;

export const vhuFragment = gql`
  fragment VhuFragment on Bsvhu {
    id
    bsvhuStatus: status
    isDraft
    emitter {
      agrementNumber
      company {
        ...CompanyFragment
      }
    }
    transporter {
      company {
        ...CompanyFragment
      }
      recepisse {
        number
      }
    }
    destination {
      type
      company {
        ...CompanyFragment
      }
      reception {
        date
        quantity
        weight
        acceptationStatus
        refusalReason
      }
      operation {
        date
        code
      }
    }
    wasteCode
    packaging
    quantity
    weight {
      value
      isEstimate
    }
  }
  ${companyFragment}
`;

export const bsdaFragment = gql`
  fragment BsdaFragment on Bsda {
    id
    bsdaType: type
    isDraft
    bsdaStatus: status
    emitter {
      isPrivateIndividual
      company {
        name
        siret
      }
    }
    destination {
      company {
        name
        siret
      }
    }
    worker {
      company {
        name
        siret
      }
    }
    transporter {
      company {
        name
        siret
      }
      customInfo
      transport {
        plates
      }
    }
    waste {
      materialName
    }
    forwardedIn {
      id
    }
    groupedIn {
      id
    }
  }
`;
