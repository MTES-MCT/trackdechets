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
    consistence
    pop
  }
`;

export const transporterFragment = gql`
  fragment TransporterFragment on Transporter {
    isExemptedOfReceipt
    receipt
    department
    validityLimit
    numberPlate
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

export const staticFieldsFragment = gql`
  fragment StaticFieldsFragment on Form {
    readableId
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
    }
    ecoOrganisme {
      name
      siret
    }
    temporaryStorageDetail {
      ...TemporaryStorageDetailFragment
    }
  }

  ${traderFragment}
  ${brokerFragment}
  ${transporterFragment}
  ${temporaryStorageDetailFragment}
  ${wasteDetailsFragment}
  ${emitterFragment}
  ${recipientFragment}
`;

export const fullFormFragment = gql`
  fragment FullForm on Form {
    ...MutableFieldsFragment
    ...StaticFieldsFragment
  }
  ${mutableFieldsFragment}
  ${staticFieldsFragment}
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

const wasteAcceptationFragment = gql`
  fragment WasteAcceptationFragment on BsdasriWasteAcceptation {
    status
    refusalReason
    refusedWeight
  }
`;
export const dasriFragment = gql`
  fragment DasriFragment on Bsdasri {
    id
    bsdasriStatus: status
    type
    isDraft
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
    isDraft
    bsdaStatus: status
    emitter {
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
    }
    waste {
      materialName
    }
  }
`;
