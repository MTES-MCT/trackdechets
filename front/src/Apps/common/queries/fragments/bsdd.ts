import { gql } from "@apollo/client";
import { companyFragment } from "./company";

export const workSiteFragment = gql`
  fragment WorkSiteFragment on WorkSite {
    name
    address
    city
    postalCode
    infos
  }
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
    isPrivateIndividual
    isForeignShip
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

export const wasteDetailsFragment = gql`
  fragment WasteDetailsFragment on WasteDetails {
    code
    name
    isSubjectToADR
    onuCode
    nonRoadRegulationMention
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
    parcelNumbers {
      city
      postalCode
      prefix
      section
      number
      x
      y
    }
    analysisReferences
    landIdentifiers
    sampleNumber
  }
`;

export const transporterFragment = gql`
  fragment TransporterFragment on Transporter {
    id
    isExemptedOfReceipt
    receipt
    department
    validityLimit
    numberPlate
    customInfo
    mode
    takenOverAt
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
      quantityRefused
      quantityAccepted
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
      nonRoadRegulationMention
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
    customId
    createdAt
    status
    stateSummary {
      packagingInfos {
        type
        other
        quantity
      }
      isSubjectToADR
      onuCode
      nonRoadRegulationMention
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
    receivedBy
    receivedAt
    emitter {
      ...EmitterFragment
    }
    recipient {
      ...RecipientFragment
    }
    transporter {
      ...TransporterFragment
    }
    transporters {
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
    grouping {
      quantity
      form {
        id
        readableId
        status
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
            orgId
            name
            siret
          }
          isPrivateIndividual
        }
        transporter {
          company {
            orgId
            siret
          }
        }
        recipient {
          company {
            siret
            orgId
          }
        }
        signedAt
        quantityReceived
        quantityAccepted
        quantityGrouped
        processingOperationDone
      }
    }
    quantityGrouped
    quantityReceived
    ecoOrganisme {
      name
      siret
    }
    temporaryStorageDetail {
      destination {
        company {
          siret
          orgId
        }
      }
    }
    temporaryStorageDetail {
      ...TemporaryStorageDetailFragment
    }
    currentTransporterSiret
    nextTransporterSiret
    intermediaries {
      ...CompanyFragment
    }
  }
  ${traderFragment}
  ${brokerFragment}
  ${transporterFragment}
  ${temporaryStorageDetailFragment}
  ${wasteDetailsFragment}
  ${emitterFragment}
  ${recipientFragment}
  ${companyFragment}
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
  }
  ${mutableFieldsFragment}
  ${staticFieldsFragment}
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
    quantityRefused
    quantityAccepted
    wasteAcceptationStatus
    wasteRefusalReason
    signedAt
    processedBy
    processedAt
    processingOperationDescription
    processingOperationDone
    destinationOperationMode
    ecoOrganisme {
      siret
      name
    }
    groupedIn {
      quantity
      form {
        id
        readableId
        status
      }
    }
    grouping {
      quantity
      form {
        status
        readableId
        takenOverAt
        emitter {
          type
          workSite {
            name
            infos
          }
        }
        wasteDetails {
          code
          name
          quantity
        }
        quantityReceived
        quantityRefused
        quantityAccepted
        signedAt
        emitterPostalCode
      }
    }
    quantityGrouped
    hasCiterneBeenWashedOut
    citerneNotWashedOutReason
    intermediaries {
      ...CompanyFragment
    }
    nextDestination {
      company {
        ...CompanyFragment
      }
      processingOperation
      notificationNumber
    }
  }
  ${transporterFormFragment}
  ${companyFragment}
`;

export const statusChangeFragment = gql`
  fragment StatusChange on Form {
    id
    status
  }
`;

// This fragment query only the fields required for dashboard and workflow action button
// Would you need to query more fields, pay attention sub resolvers which
// might make unwanted db queries
export const dashboardFormFragment = gql`
  fragment DashboardFormFragment on Form {
    id
    readableId
    customId
    sentAt
    emittedAt
    emittedBy
    emittedByEcoOrganisme
    takenOverAt
    status
    quantityReceived
    wasteDetails {
      code
      name
      packagingInfos {
        type
        other
        quantity
      }
      quantity
    }
    emitter {
      type
      isPrivateIndividual
      company {
        siret
        name
        omiNumber
      }
      workSite {
        name
      }
      isPrivateIndividual
      isForeignShip
    }
    recipient {
      company {
        siret
        orgId
        name
      }
      isTempStorage
      cap
    }
    transporter {
      id
      company {
        siret
        orgId
        name
      }
      numberPlate
      customInfo
    }
    transporters {
      id
      company {
        orgId
      }
      numberPlate
      customInfo
      takenOverAt
      mode
    }
    ecoOrganisme {
      siret
      name
    }
    stateSummary {
      quantity
      transporterCustomInfo
      transporterNumberPlate
      transporter {
        siret
        name
      }
      recipient {
        siret
        name
      }
      emitter {
        siret
        name
      }
      transporterNumberPlate
      lastActionOn
    }
    temporaryStorageDetail {
      destination {
        company {
          siret
          orgId
          address
          name
          contact
          phone
          mail
        }
        cap
        processingOperation
      }
      transporter {
        id
        company {
          siret
          orgId
          vatNumber
          address
          name
          contact
          phone
          mail
        }
        numberPlate
        customInfo
        mode
      }
      wasteDetails {
        packagingInfos {
          type
          other
          quantity
        }
        quantity
        quantityType
      }
    }
    grouping {
      quantity
      form {
        id
        readableId
        status
        takenOverAt
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
            orgId
            name
            siret
          }
          isPrivateIndividual
        }
        transporter {
          company {
            orgId
            siret
          }
        }
        recipient {
          company {
            siret
            orgId
          }
        }
        signedAt
        quantityReceived
        quantityGrouped
        processingOperationDone
      }
    }
    currentTransporterSiret
    nextTransporterSiret
    intermediaries {
      ...CompanyFragment
    }
    trader {
      ...TraderFragment
    }
    broker {
      ...BrokerFragment
    }
    metadata {
      latestRevision {
        id
        status
        authoringCompany {
          siret
          name
        }
        approvals {
          approverSiret
          status
        }
      }
    }
  }
  ${traderFragment}
  ${companyFragment}
  ${brokerFragment}
`;
