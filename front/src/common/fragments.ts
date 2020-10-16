import gql from "graphql-tag";

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

export const wasteDetailsFragment = gql`
  fragment WasteDetailsFragment on WasteDetails {
    code
    name
    onuCode
    packagings
    otherPackaging
    numberOfPackages
    quantity
    quantityType
    consistence
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
    }
    wasteDetails {
      onuCode
      packagings
      otherPackaging
      numberOfPackages
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
      packagings
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
    wasteDetails {
      ...WasteDetailsFragment
    }
    appendix2Forms {
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

export const transporterFormFragment = gql`
  fragment TransporterFormFragment on Form {
    ...MutableFieldsFragment
    ...StaticFieldsFragment
    currentTransporterSiret
    nextTransporterSiret
    transportSegments {
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
  }
  ${mutableFieldsFragment}
  ${staticFieldsFragment}
`;

export const segmentFragment = gql`
  fragment Segment on TransportSegment {
    id
  }
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
    wasteAcceptationStatus
    wasteRefusalReason
    signedAt
    processedBy
    processedAt
    ecoOrganisme {
      siret
      name
    }
  }
  ${transporterFormFragment}
`;
