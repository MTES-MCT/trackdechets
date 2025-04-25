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
