import { gql } from "graphql-tag";

export const fullBspaoh = gql`
  fragment FullBspaoh on Bspaoh {
    id
    status
    isDraft
    createdAt
    updatedAt
    isDuplicateOf
    waste {
      code
      adr
      packagings {
        id
        type
        volume
        containerNumber
        identificationCodes
        consistence
        quantity
        acceptation
      }
    }
    emitter {
      company {
        siret
        name
        phone
        address
        contact
      }
      customInfo
      emission {
        detail {
          quantity
          weight {
            value
            isEstimate
          }
        }
        signature {
          date
          author
        }
      }
    }
    transporter {
      id
      company {
        siret
        name
        address
        mail
        phone
      }
      customInfo
      recepisse {
        number
        department
        validityLimit
        isExempted
      }
      transport {
        mode
        plates
        takenOverAt
        signature {
          date
          author
        }
      }
    }
    destination {
      company {
        siret
        name
        phone
        address
        contact
      }
      customInfo
      cap
      handedOverToDestination {
        date
        signature {
          author
          date
        }
      }
      reception {
        date
        detail {
          quantity
          receivedWeight {
            value
          }
          refusedWeight {
            value
          }
          acceptedWeight {
            value
          }
        }
        acceptation {
          status
          refusalReason
        }
        signature {
          date
          author
        }
      }

      operation {
        code
        date
        signature {
          date
          author
        }
      }
    }
  }
`;
