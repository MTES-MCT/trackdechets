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

export const GET_FORM = gql`
  query Form($formId: ID) {
    form(id: $formId) {
      id
      emitter {
        type
        pickupSite
        company {
          ...CompanyFragment
        }
      }
      recipient {
        cap
        processingOperation
        company {
          ...CompanyFragment
        }
      }
      transporter {
        receipt
        department
        validityLimit
        contact
        numberPlate
        company {
          ...CompanyFragment
        }
      }
      wasteDetails {
        code
        name
        onuCode
        packagings
        otherPackaging
        numberOfPackages
        quantity
        quantityType
      }
    }
  }
  ${fragments.company}
`;

export const SAVE_FORM = gql`
  mutation SaveForm($formInput: FormInput!) {
    saveForm(formInput: $formInput) {
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
      }
      wasteDetails {
        code
        name
        quantity
      }
    }
  }
`;
