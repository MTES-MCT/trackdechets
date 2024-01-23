import { gql } from "graphql-tag";

export const INCOMING_WASTES = gql`
  query IncomingWastes(
    $sirets: [String!]!
    $where: WasteRegistryWhere
    $first: Int
    $after: ID
    $last: Int
    $before: ID
  ) {
    incomingWastes(
      sirets: $sirets
      where: $where
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          id
          initialEmitterCompanySiret
          initialEmitterCompanyName
          initialEmitterCompanyAddress
          initialEmitterPostalCodes
          emitterCompanySiret
        }
      }
    }
  }
`;

export const OUTGOING_WASTES = gql`
  query OutgoingWastes(
    $sirets: [String!]!
    $where: WasteRegistryWhere
    $first: Int
    $after: ID
    $last: Int
    $before: ID
  ) {
    outgoingWastes(
      sirets: $sirets
      where: $where
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          id
        }
      }
    }
  }
`;

export const TRANSPORTED_WASTES = gql`
  query TransportedWastes(
    $sirets: [String!]!
    $where: WasteRegistryWhere
    $first: Int
    $after: ID
    $last: Int
    $before: ID
  ) {
    transportedWastes(
      sirets: $sirets
      where: $where
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          id
        }
      }
    }
  }
`;

export const MANAGED_WASTES = gql`
  query ManagedWastes(
    $sirets: [String!]!
    $where: WasteRegistryWhere
    $first: Int
    $after: ID
    $last: Int
    $before: ID
  ) {
    managedWastes(
      sirets: $sirets
      where: $where
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          id
        }
      }
    }
  }
`;

export const ALL_WASTES = gql`
  query AllWastes(
    $sirets: [String!]!
    $where: WasteRegistryWhere
    $first: Int
    $after: ID
    $last: Int
    $before: ID
  ) {
    allWastes(
      sirets: $sirets
      where: $where
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          id
          emitterCompanySiret
          transporterCompanySiret
          destinationCompanySiret
        }
      }
    }
  }
`;

export const WASTES_REGISTRY_CSV = gql`
  query WastesRegistryCsv(
    $registryType: WasteRegistryType!
    $sirets: [String!]!
    $where: WasteRegistryWhere
  ) {
    wastesRegistryCsv(
      registryType: $registryType
      sirets: $sirets
      where: $where
    ) {
      token
      downloadLink
    }
  }
`;

export const WASTES_REGISTRY_XLS = gql`
  query WastesRegistryXls(
    $registryType: WasteRegistryType!
    $sirets: [String!]!
    $where: WasteRegistryWhere
  ) {
    wastesRegistryXls(
      registryType: $registryType
      sirets: $sirets
      where: $where
    ) {
      token
      downloadLink
    }
  }
`;
