import { gql } from "@apollo/client";
import { detailFormFragment, fullDasriFragment } from "./fragments";

// full fledged bsd to display in detailled views
export const GET_DETAIL_FORM = gql`
  query Form($id: ID) {
    form(id: $id) {
      ...DetailFormFragment
    }
  }
  ${detailFormFragment}
`;

export const GET_DETAIL_DASRI = gql`
  query Bsdasri($id: ID!) {
    bsdasri(id: $id) {
      ...DasriFragment
    }
  }
  ${fullDasriFragment}
`;

export const GET_DETAIL_DASRI_WITH_METADATA = gql`
  query Bsdasri($id: ID!) {
    bsdasri(id: $id) {
      ...DasriFragment
      metadata {
        errors {
          message
          requiredFor
        }
      }
    }
  }
  ${fullDasriFragment}
`;

export const GET_DASRI_METADATA = gql`
  query Bsdasri($id: ID!) {
    bsdasri(id: $id) {
      metadata {
        errors {
          message
          requiredFor
        }
      }
    }
  }
`;

export const GET_BSDS = gql`
  query GetBsds(
    $after: String
    $first: Int
    $clue: String
    $where: BsdWhere
    $orderBy: OrderBy
  ) {
    bsds(
      after: $after
      first: $first
      clue: $clue
      where: $where
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          readableId
          status
          isDraft
          type
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
          waste {
            code
            description
          }
          transporter {
            company {
              name
              siret
            }
            numberPlate
            customInfo
          }
          bsda {
            type
            wasteMaterialName
            worker {
              company {
                name
                siret
              }
            }
          }
          bsdasri {
            type
            groupingCount
            emitterAllowDirectTakeOver
          }
          bsdd {
            currentTransporterSiret
            nextTransporterSiret
            lastSegment {
              id
              takenOver
              readyToTakeOver
              previousTransporterCompanySiret
            }
            temporaryStorage {
              recipientIsTempStorage
              transporterCompanySiret
              destinationCompanySiret
            }
            stateSummary {
              transporterCustomInfo
              transporterNumberPlate
              recipientName
            }
          }
        }
      }

      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;
