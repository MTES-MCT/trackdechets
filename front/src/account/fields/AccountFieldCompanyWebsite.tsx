import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { object, string } from "yup";
import {
  CompanyPrivate,
  UserRole,
  MutationUpdateCompanyArgs,
} from "src/generated/graphql/types";

type Props = {
  company: CompanyPrivate;
};

AccountFielCompanyContactWebsite.fragments = {
  company: gql`
    fragment AccountFieldCompanyWebsiteFragment on CompanyPrivate {
      id
      siret
      website
      userRole
    }
  `,
};

const UPDATE_WEBSITE = gql`
  mutation UpdateCompany($siret: String!, $website: String) {
    updateCompany(siret: $siret, website: $website) {
      id
      siret
      website
    }
  }
`;

const yupSchema = object().shape({
  website: string().url(),
});

export default function AccountFielCompanyContactWebsite({ company }: Props) {
  const fieldName = "website";
  const fieldLabel = "Site web";

  return (
    <>
      {company.userRole === UserRole.Admin ? (
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
              mutationArgs={{ siret: company.siret }}
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
      )}
    </>
  );
}
