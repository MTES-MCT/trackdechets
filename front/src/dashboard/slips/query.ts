import gql from "graphql-tag";

const fragments = {
  company: gql`
    fragment CompanyFragment on FormCompany {
      name
      siret
      address
      contact
      phone
      mail
    }
  `
};

export const GET_SLIPS = gql`
  query GetSlips($siret: String) {
    forms(siret: $siret) {
      id
      readableId
      createdAt
      status
      emitter {
        company {
          name
          siret
        }
      }
      recipient {
        company {
          name
          siret
        }
        processingOperation
        isTempStorage
      }
      wasteDetails {
        code
        name
        quantity
      }
      quantityReceived
      temporaryStorageDetail {
        destination {
          company {
            ...CompanyFragment
          }
          cap
          processingOperation
        }
        wasteDetails {
          code
          name
          quantity
        }
        transporter {
          isExemptedOfReceipt
          receipt
          department
          validityLimit
          numberPlate
          company {
            ...CompanyFragment
          }
        }
      }
    }
  }
  ${fragments.company}
`;
