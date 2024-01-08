import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { object, string } from "yup";
import {
  CompanyPrivate,
  UserRole,
  MutationUpdateCompanyArgs
} from "@td/codegen-ui";

type Props = {
  company: CompanyPrivate;
};

AccountFieldCompanyContactWebsite.fragments = {
  company: gql`
    fragment AccountFieldCompanyWebsiteFragment on CompanyPrivate {
      id
      website
      userRole
    }
  `
};

const UPDATE_WEBSITE = gql`
  mutation UpdateCompany($id: String!, $website: String) {
    updateCompany(id: $id, website: $website) {
      id
      website
      userRole
    }
  }
`;

const yupSchema = object().shape({
  website: string().url()
});

export default function AccountFieldCompanyContactWebsite({ company }: Props) {
  const fieldName = "website";
  const fieldLabel = "Site web";

  return company.userRole === UserRole.Admin ? (
    <AccountField
      name={fieldName}
      label={fieldLabel}
      value={company.website}
      renderForm={toggleEdition => (
        <AccountFormSimpleInput<Partial<MutationUpdateCompanyArgs>>
          name="website"
          type="url"
          value={company.website}
          placeHolder={fieldLabel}
          mutation={UPDATE_WEBSITE}
          mutationArgs={{ id: company.id }}
          yupSchema={yupSchema}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  ) : (
    <AccountFieldNotEditable
      name={fieldName}
      label={fieldLabel}
      value={company.website}
    />
  );
}
