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
      customId
      emitter {
        type
        pickupSite {
          name
          address
          city
          postalCode
          infos
        }
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
        isExemptedOfReceipt
        receipt
        department
        validityLimit
        numberPlate
        company {
          ...CompanyFragment
        }
      }
      trader {
        receipt
        department
        validityLimit
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
        consistence
      }
      appendix2Forms {
        readableId
      }
    }
  }
  ${fragments.company}
`;

export const SAVE_FORM = gql`
  mutation SaveForm($formInput: FormInput!) {
    saveForm(formInput: $formInput) {
      id
      customId
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
      }
      wasteDetails {
        code
        name
        quantity
      }
      quantityReceived
    }
  }
`;
