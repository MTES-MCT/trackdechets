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
        reportForCompanySiret: reportForSiret
        reportAsCompanySiret: reportAsSiret
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
        destinationCompanyType: destinationType
        destinationCompanyOrgId: destinationOrgId
        destinationCompanyName: destinationName
        destinationCompanyAddress: destinationAddress
        destinationCompanyPostalCode: destinationPostalCode
        destinationCompanyCity: destinationCity
        destinationCompanyCountryCode: destinationCountryCode
        operationCode
        operationMode
        administrativeActReference
      }
    }
  }
`;
