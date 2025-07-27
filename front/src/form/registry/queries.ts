import gql from "graphql-tag";

export const GET_SSD_REGISTRY_LOOKUP = gql`
  query GetSsdRegistryLookup(
    $siret: String!
    $type: RegistryImportType!
    $publicId: ID!
  ) {
    registryLookup(siret: $siret, type: $type, publicId: $publicId) {
      publicId
      ssd {
        publicId
        reportForCompanySiret
        reportAsCompanySiret
        weightValue
        weightIsEstimate
        volume
        useDate
        dispatchDate
        wasteCode
        wasteDescription
        wasteCodeBale
        secondaryWasteCodes
        secondaryWasteDescriptions
        product
        processingDate
        processingEndDate
        destinationCompanyType
        destinationCompanyOrgId
        destinationCompanyName
        destinationCompanyAddress
        destinationCompanyPostalCode
        destinationCompanyCity
        destinationCompanyCountryCode
        operationCode
        operationMode
        administrativeActReference
      }
    }
  }
`;

export const GET_INCOMING_WASTE_REGISTRY_LOOKUP = gql`
  query GetIncomingWasteRegistryLookup(
    $siret: String!
    $type: RegistryImportType!
    $publicId: ID!
  ) {
    registryLookup(siret: $siret, type: $type, publicId: $publicId) {
      publicId
      incomingWaste {
        publicId
        reportAsCompanySiret
        reportForCompanySiret
        wasteDescription
        wasteCode
        wasteCodeBale
        wastePop
        wasteIsDangerous
        receptionDate
        weighingHour
        weightValue
        weightIsEstimate
        volume
        initialEmitterCompanyType
        initialEmitterCompanyOrgId
        initialEmitterCompanyName
        initialEmitterCompanyAddress
        initialEmitterCompanyPostalCode
        initialEmitterCompanyCity
        initialEmitterCompanyCountryCode
        initialEmitterMunicipalitiesInseeCodes
        emitterCompanyType
        emitterCompanyOrgId
        emitterCompanyName
        emitterCompanyAddress
        emitterCompanyPostalCode
        emitterCompanyCity
        emitterCompanyCountryCode
        emitterPickupSiteName
        emitterPickupSiteAddress
        emitterPickupSitePostalCode
        emitterPickupSiteCity
        emitterPickupSiteCountryCode
        ecoOrganismeSiret
        ecoOrganismeName
        brokerCompanySiret
        brokerCompanyName
        brokerRecepisseNumber
        traderCompanySiret
        traderCompanyName
        traderRecepisseNumber
        operationCode
        operationMode
        noTraceability
        ttdImportNumber
        movementNumber
        nextOperationCode
        isDirectSupply

        transporter1TransportMode
        transporter1CompanyType
        transporter1CompanyOrgId
        transporter1RecepisseIsExempted
        transporter1RecepisseNumber
        transporter1CompanyName
        transporter1CompanyAddress
        transporter1CompanyPostalCode
        transporter1CompanyCity
        transporter1CompanyCountryCode

        transporter2TransportMode
        transporter2CompanyType
        transporter2CompanyOrgId
        transporter2RecepisseIsExempted
        transporter2RecepisseNumber
        transporter2CompanyName
        transporter2CompanyAddress
        transporter2CompanyPostalCode
        transporter2CompanyCity
        transporter2CompanyCountryCode

        transporter3TransportMode
        transporter3CompanyType
        transporter3CompanyOrgId
        transporter3RecepisseIsExempted
        transporter3RecepisseNumber
        transporter3CompanyName
        transporter3CompanyAddress
        transporter3CompanyPostalCode
        transporter3CompanyCity
        transporter3CompanyCountryCode

        transporter4TransportMode
        transporter4CompanyType
        transporter4CompanyOrgId
        transporter4RecepisseIsExempted
        transporter4RecepisseNumber
        transporter4CompanyName
        transporter4CompanyAddress
        transporter4CompanyPostalCode
        transporter4CompanyCity
        transporter4CompanyCountryCode

        transporter5TransportMode
        transporter5CompanyType
        transporter5CompanyOrgId
        transporter5RecepisseIsExempted
        transporter5RecepisseNumber
        transporter5CompanyName
        transporter5CompanyAddress
        transporter5CompanyPostalCode
        transporter5CompanyCity
        transporter5CompanyCountryCode
      }
    }
  }
`;

export const GET_OUTGOING_WASTE_REGISTRY_LOOKUP = gql`
  query GetOutgoingWasteRegistryLookup(
    $siret: String!
    $type: RegistryImportType!
    $publicId: ID!
  ) {
    registryLookup(siret: $siret, type: $type, publicId: $publicId) {
      publicId
      outgoingWaste {
        publicId

        reportForCompanySiret
        reportForPickupSiteName
        reportForPickupSiteAddress
        reportForPickupSitePostalCode
        reportForPickupSiteCity
        reportForPickupSiteCountryCode

        reportAsCompanySiret

        wasteDescription
        wasteCode
        wasteCodeBale
        wastePop
        wasteIsDangerous
        dispatchDate
        weightValue
        weightIsEstimate
        volume

        initialEmitterCompanyType
        initialEmitterCompanyOrgId
        initialEmitterCompanyName
        initialEmitterCompanyAddress
        initialEmitterCompanyPostalCode
        initialEmitterCompanyCity
        initialEmitterCompanyCountryCode
        initialEmitterMunicipalitiesInseeCodes

        destinationCompanyType
        destinationCompanyOrgId
        destinationCompanyName
        destinationCompanyAddress
        destinationCompanyCity
        destinationCompanyPostalCode
        destinationCompanyCountryCode
        destinationDropSiteAddress
        destinationDropSitePostalCode
        destinationDropSiteCity
        destinationDropSiteCountryCode

        operationCode
        operationMode
        gistridNumber
        movementNumber

        ecoOrganismeSiret
        ecoOrganismeName

        brokerCompanySiret
        brokerCompanyName
        brokerRecepisseNumber

        traderCompanySiret
        traderCompanyName
        traderRecepisseNumber

        isDirectSupply

        transporter1TransportMode
        transporter1CompanyType
        transporter1CompanyOrgId
        transporter1RecepisseIsExempted
        transporter1RecepisseNumber
        transporter1CompanyName
        transporter1CompanyAddress
        transporter1CompanyPostalCode
        transporter1CompanyCity
        transporter1CompanyCountryCode

        transporter2TransportMode
        transporter2CompanyType
        transporter2CompanyOrgId
        transporter2RecepisseIsExempted
        transporter2RecepisseNumber
        transporter2CompanyName
        transporter2CompanyAddress
        transporter2CompanyPostalCode
        transporter2CompanyCity
        transporter2CompanyCountryCode

        transporter3TransportMode
        transporter3CompanyType
        transporter3CompanyOrgId
        transporter3RecepisseIsExempted
        transporter3RecepisseNumber
        transporter3CompanyName
        transporter3CompanyAddress
        transporter3CompanyPostalCode
        transporter3CompanyCity
        transporter3CompanyCountryCode

        transporter4TransportMode
        transporter4CompanyType
        transporter4CompanyOrgId
        transporter4RecepisseIsExempted
        transporter4RecepisseNumber
        transporter4CompanyName
        transporter4CompanyAddress
        transporter4CompanyPostalCode
        transporter4CompanyCity
        transporter4CompanyCountryCode

        transporter5TransportMode
        transporter5CompanyType
        transporter5CompanyOrgId
        transporter5RecepisseIsExempted
        transporter5RecepisseNumber
        transporter5CompanyName
        transporter5CompanyAddress
        transporter5CompanyPostalCode
        transporter5CompanyCity
        transporter5CompanyCountryCode
      }
    }
  }
`;

export const GET_INCOMING_TEXS_REGISTRY_LOOKUP = gql`
  query GetIncomingTexsRegistryLookup(
    $siret: String!
    $type: RegistryImportType!
    $publicId: ID!
  ) {
    registryLookup(siret: $siret, type: $type, publicId: $publicId) {
      publicId
      incomingTexs {
        publicId
        reportAsCompanySiret
        reportForCompanySiret
        wasteDescription
        wasteCode
        wasteCodeBale
        wastePop
        wasteIsDangerous
        receptionDate
        weightValue
        weightIsEstimate
        volume
        wasteDap
        parcelInseeCodes
        parcelNumbers
        parcelCoordinates
        sisIdentifier
        initialEmitterCompanyType
        initialEmitterCompanyOrgId
        initialEmitterCompanyName
        initialEmitterCompanyAddress
        initialEmitterCompanyPostalCode
        initialEmitterCompanyCity
        initialEmitterCompanyCountryCode
        initialEmitterMunicipalitiesInseeCodes
        emitterCompanyType
        emitterCompanyOrgId
        emitterCompanyName
        emitterCompanyAddress
        emitterCompanyPostalCode
        emitterCompanyCity
        emitterCompanyCountryCode
        emitterPickupSiteName
        emitterPickupSiteAddress
        emitterPickupSitePostalCode
        emitterPickupSiteCity
        emitterPickupSiteCountryCode
        ecoOrganismeSiret
        ecoOrganismeName
        brokerCompanySiret
        brokerCompanyName
        brokerRecepisseNumber
        traderCompanySiret
        traderCompanyName
        traderRecepisseNumber
        operationCode
        operationMode
        noTraceability
        ttdImportNumber
        movementNumber
        nextOperationCode
        isUpcycled
        destinationParcelInseeCodes
        destinationParcelNumbers
        destinationParcelCoordinates
        isDirectSupply

        transporter1TransportMode
        transporter1CompanyType
        transporter1CompanyOrgId
        transporter1RecepisseIsExempted
        transporter1RecepisseNumber
        transporter1CompanyName
        transporter1CompanyAddress
        transporter1CompanyPostalCode
        transporter1CompanyCity
        transporter1CompanyCountryCode

        transporter2TransportMode
        transporter2CompanyType
        transporter2CompanyOrgId
        transporter2RecepisseIsExempted
        transporter2RecepisseNumber
        transporter2CompanyName
        transporter2CompanyAddress
        transporter2CompanyPostalCode
        transporter2CompanyCity
        transporter2CompanyCountryCode

        transporter3TransportMode
        transporter3CompanyType
        transporter3CompanyOrgId
        transporter3RecepisseIsExempted
        transporter3RecepisseNumber
        transporter3CompanyName
        transporter3CompanyAddress
        transporter3CompanyPostalCode
        transporter3CompanyCity
        transporter3CompanyCountryCode

        transporter4TransportMode
        transporter4CompanyType
        transporter4CompanyOrgId
        transporter4RecepisseIsExempted
        transporter4RecepisseNumber
        transporter4CompanyName
        transporter4CompanyAddress
        transporter4CompanyPostalCode
        transporter4CompanyCity
        transporter4CompanyCountryCode

        transporter5TransportMode
        transporter5CompanyType
        transporter5CompanyOrgId
        transporter5RecepisseIsExempted
        transporter5RecepisseNumber
        transporter5CompanyName
        transporter5CompanyAddress
        transporter5CompanyPostalCode
        transporter5CompanyCity
        transporter5CompanyCountryCode

        texsAnalysisFiles {
          id
          originalFileName
        }
      }
    }
  }
`;

export const GET_OUTGOING_TEXS_REGISTRY_LOOKUP = gql`
  query GetOutgoingTexsRegistryLookup(
    $siret: String!
    $type: RegistryImportType!
    $publicId: ID!
  ) {
    registryLookup(siret: $siret, type: $type, publicId: $publicId) {
      publicId
      outgoingTexs {
        publicId

        reportForCompanySiret
        reportForPickupSiteName
        reportForPickupSiteAddress
        reportForPickupSitePostalCode
        reportForPickupSiteCity
        reportForPickupSiteCountryCode

        reportAsCompanySiret

        wasteDescription
        wasteCode
        wasteCodeBale
        wastePop
        wasteIsDangerous
        dispatchDate
        weightValue
        weightIsEstimate
        volume
        wasteDap

        initialEmitterCompanyType
        initialEmitterCompanyOrgId
        initialEmitterCompanyName
        initialEmitterCompanyAddress
        initialEmitterCompanyPostalCode
        initialEmitterCompanyCity
        initialEmitterCompanyCountryCode
        initialEmitterMunicipalitiesInseeCodes
        parcelInseeCodes
        parcelNumbers
        parcelCoordinates
        sisIdentifier

        destinationCompanyType
        destinationCompanyOrgId
        destinationCompanyName
        destinationCompanyAddress
        destinationCompanyCity
        destinationCompanyPostalCode
        destinationCompanyCountryCode
        destinationDropSiteAddress
        destinationDropSitePostalCode
        destinationDropSiteCity
        destinationDropSiteCountryCode

        operationCode
        operationMode
        gistridNumber
        movementNumber

        ecoOrganismeSiret
        ecoOrganismeName

        brokerCompanySiret
        brokerCompanyName
        brokerRecepisseNumber

        traderCompanySiret
        traderCompanyName
        traderRecepisseNumber

        isDirectSupply
        destinationParcelInseeCodes
        destinationParcelNumbers
        destinationParcelCoordinates
        isUpcycled

        transporter1TransportMode
        transporter1CompanyType
        transporter1CompanyOrgId
        transporter1RecepisseIsExempted
        transporter1RecepisseNumber
        transporter1CompanyName
        transporter1CompanyAddress
        transporter1CompanyPostalCode
        transporter1CompanyCity
        transporter1CompanyCountryCode

        transporter2TransportMode
        transporter2CompanyType
        transporter2CompanyOrgId
        transporter2RecepisseIsExempted
        transporter2RecepisseNumber
        transporter2CompanyName
        transporter2CompanyAddress
        transporter2CompanyPostalCode
        transporter2CompanyCity
        transporter2CompanyCountryCode

        transporter3TransportMode
        transporter3CompanyType
        transporter3CompanyOrgId
        transporter3RecepisseIsExempted
        transporter3RecepisseNumber
        transporter3CompanyName
        transporter3CompanyAddress
        transporter3CompanyPostalCode
        transporter3CompanyCity
        transporter3CompanyCountryCode

        transporter4TransportMode
        transporter4CompanyType
        transporter4CompanyOrgId
        transporter4RecepisseIsExempted
        transporter4RecepisseNumber
        transporter4CompanyName
        transporter4CompanyAddress
        transporter4CompanyPostalCode
        transporter4CompanyCity
        transporter4CompanyCountryCode

        transporter5TransportMode
        transporter5CompanyType
        transporter5CompanyOrgId
        transporter5RecepisseIsExempted
        transporter5RecepisseNumber
        transporter5CompanyName
        transporter5CompanyAddress
        transporter5CompanyPostalCode
        transporter5CompanyCity
        transporter5CompanyCountryCode

        texsAnalysisFiles {
          id
          originalFileName
        }
      }
    }
  }
`;

export const GET_TRANSPORTED_REGISTRY_LOOKUP = gql`
  query GetTransportedRegistryLookup(
    $siret: String!
    $type: RegistryImportType!
    $publicId: ID!
  ) {
    registryLookup(siret: $siret, type: $type, publicId: $publicId) {
      publicId
      transportedWaste {
        publicId

        reportAsCompanySiret

        reportForCompanySiret
        reportForTransportMode
        reportForTransportIsWaste
        reportForRecepisseIsExempted
        reportForRecepisseNumber
        reportForTransportAdr
        reportForTransportOtherTmdCode
        reportForTransportPlates

        wasteDescription
        wasteCode
        wasteCodeBale
        wastePop
        wasteIsDangerous

        collectionDate
        unloadingDate
        weightValue
        weightIsEstimate
        volume

        emitterCompanyType
        emitterCompanyOrgId
        emitterCompanyName
        emitterCompanyAddress
        emitterCompanyPostalCode
        emitterCompanyCity
        emitterCompanyCountryCode

        emitterPickupSiteName
        emitterPickupSiteAddress
        emitterPickupSitePostalCode
        emitterPickupSiteCity
        emitterPickupSiteCountryCode

        destinationCompanyType
        destinationCompanyOrgId
        destinationCompanyName
        destinationCompanyAddress
        destinationCompanyCity
        destinationCompanyPostalCode
        destinationCompanyCountryCode

        destinationDropSiteAddress
        destinationDropSitePostalCode
        destinationDropSiteCity
        destinationDropSiteCountryCode

        gistridNumber
        movementNumber

        ecoOrganismeSiret
        ecoOrganismeName

        brokerCompanySiret
        brokerCompanyName
        brokerRecepisseNumber

        traderCompanySiret
        traderCompanyName
        traderRecepisseNumber
      }
    }
  }
`;

export const GET_MANAGED_REGISTRY_LOOKUP = gql`
  query GetManagedRegistryLookup(
    $siret: String!
    $type: RegistryImportType!
    $publicId: ID!
  ) {
    registryLookup(siret: $siret, type: $type, publicId: $publicId) {
      publicId
      managedWaste {
        publicId

        reportAsCompanySiret
        reportForCompanySiret

        wasteDescription
        wasteCode
        wasteCodeBale
        wastePop
        wasteIsDangerous
        managingStartDate
        managingEndDate
        weightValue
        weightIsEstimate
        volume
        wasteDap

        initialEmitterCompanyType
        initialEmitterCompanyOrgId
        initialEmitterCompanyName
        initialEmitterCompanyAddress
        initialEmitterCompanyPostalCode
        initialEmitterCompanyCity
        initialEmitterCompanyCountryCode
        initialEmitterMunicipalitiesInseeCodes

        parcelInseeCodes
        parcelNumbers
        parcelCoordinates
        sisIdentifier

        tempStorerCompanyType
        tempStorerCompanyOrgId
        tempStorerCompanyName
        tempStorerCompanyAddress
        tempStorerCompanyCity
        tempStorerCompanyPostalCode
        tempStorerCompanyCountryCode

        destinationCompanyType
        destinationCompanyOrgId
        destinationCompanyName
        destinationCompanyAddress
        destinationCompanyCity
        destinationCompanyPostalCode
        destinationCompanyCountryCode

        destinationDropSiteAddress
        destinationDropSitePostalCode
        destinationDropSiteCity
        destinationDropSiteCountryCode

        isUpcycled

        destinationParcelInseeCodes
        destinationParcelNumbers
        destinationParcelCoordinates

        gistridNumber
        movementNumber
        operationCode
        operationMode

        emitterCompanyType
        emitterCompanyOrgId
        emitterCompanyName
        emitterCompanyAddress
        emitterCompanyPostalCode
        emitterCompanyCity
        emitterCompanyCountryCode

        emitterPickupSiteName
        emitterPickupSiteAddress
        emitterPickupSitePostalCode
        emitterPickupSiteCity
        emitterPickupSiteCountryCode

        ecoOrganismeSiret
        ecoOrganismeName

        isDirectSupply

        transporter1TransportMode
        transporter1CompanyType
        transporter1CompanyOrgId
        transporter1RecepisseIsExempted
        transporter1RecepisseNumber
        transporter1CompanyName
        transporter1CompanyAddress
        transporter1CompanyPostalCode
        transporter1CompanyCity
        transporter1CompanyCountryCode

        transporter2TransportMode
        transporter2CompanyType
        transporter2CompanyOrgId
        transporter2RecepisseIsExempted
        transporter2RecepisseNumber
        transporter2CompanyName
        transporter2CompanyAddress
        transporter2CompanyPostalCode
        transporter2CompanyCity
        transporter2CompanyCountryCode

        transporter3TransportMode
        transporter3CompanyType
        transporter3CompanyOrgId
        transporter3RecepisseIsExempted
        transporter3RecepisseNumber
        transporter3CompanyName
        transporter3CompanyAddress
        transporter3CompanyPostalCode
        transporter3CompanyCity
        transporter3CompanyCountryCode

        transporter4TransportMode
        transporter4CompanyType
        transporter4CompanyOrgId
        transporter4RecepisseIsExempted
        transporter4RecepisseNumber
        transporter4CompanyName
        transporter4CompanyAddress
        transporter4CompanyPostalCode
        transporter4CompanyCity
        transporter4CompanyCountryCode

        transporter5TransportMode
        transporter5CompanyType
        transporter5CompanyOrgId
        transporter5RecepisseIsExempted
        transporter5RecepisseNumber
        transporter5CompanyName
        transporter5CompanyAddress
        transporter5CompanyPostalCode
        transporter5CompanyCity
        transporter5CompanyCountryCode
      }
    }
  }
`;

export const ADD_TO_SSD_REGISTRY = gql`
  mutation AddToSsdRegistry($lines: [SsdLineInput!]!) {
    addToSsdRegistry(lines: $lines) {
      stats {
        errors
        skipped
        insertions
        edits
        cancellations
      }
      errors {
        issues {
          path
          message
        }
      }
    }
  }
`;

export const ADD_TO_INCOMING_WASTE_REGISTRY = gql`
  mutation AddToIncomingWasteRegistry($lines: [IncomingWasteLineInput!]!) {
    addToIncomingWasteRegistry(lines: $lines) {
      stats {
        errors
        skipped
        insertions
        edits
        cancellations
      }
      errors {
        issues {
          path
          message
        }
      }
    }
  }
`;

export const ADD_TO_OUTGOING_WASTE_REGISTRY = gql`
  mutation AddToOutgoingWasteRegistry($lines: [OutgoingWasteLineInput!]!) {
    addToOutgoingWasteRegistry(lines: $lines) {
      stats {
        errors
        skipped
        insertions
        edits
        cancellations
      }
      errors {
        issues {
          path
          message
        }
      }
    }
  }
`;

export const ADD_TO_INCOMING_TEXS_REGISTRY = gql`
  mutation AddToIncomingTexsRegistry($lines: [IncomingTexsLineInput!]!) {
    addToIncomingTexsRegistry(lines: $lines) {
      stats {
        errors
        skipped
        insertions
        edits
        cancellations
      }
      errors {
        issues {
          path
          message
        }
      }
    }
  }
`;

export const ADD_TO_OUTGOING_TEXS_REGISTRY = gql`
  mutation AddToOutgoingTexsRegistry($lines: [OutgoingTexsLineInput!]!) {
    addToOutgoingTexsRegistry(lines: $lines) {
      stats {
        errors
        skipped
        insertions
        edits
        cancellations
      }
      errors {
        issues {
          path
          message
        }
      }
    }
  }
`;

export const ADD_TO_TRANSPORTED_REGISTRY = gql`
  mutation AddToTransportedRegistry($lines: [TransportedLineInput!]!) {
    addToTransportedRegistry(lines: $lines) {
      stats {
        errors
        skipped
        insertions
        edits
        cancellations
      }
      errors {
        issues {
          path
          message
        }
      }
    }
  }
`;

export const ADD_TO_MANAGED_REGISTRY = gql`
  mutation AddToManagedRegistry($lines: [ManagedLineInput!]!) {
    addToManagedRegistry(lines: $lines) {
      stats {
        errors
        skipped
        insertions
        edits
        cancellations
      }
      errors {
        issues {
          path
          message
        }
      }
    }
  }
`;
