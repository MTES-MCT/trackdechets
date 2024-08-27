import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import CompanyTypeForm from "./CompanyTypeForm";
import { useState } from "react";
import { AllCompanyType } from "../../utils";

const SimpleCompanyTypeForm = () => {
  const [companyTypes, setCompanyTypes] = useState<AllCompanyType[]>([]);
  const [ecoOrganismeAgreements, setEcoOrganismeAgreements] = useState<
    string[]
  >([]);
  const [hasSubSectionThree, setHasSubSectionThree] = useState(false);

  const handleToggle = (v: AllCompanyType, checked: boolean) => {
    if (checked) {
      setCompanyTypes([...companyTypes, v]);
    } else {
      setCompanyTypes(companyTypes.filter(t => t !== v));
    }
  };
  return (
    <CompanyTypeForm
      inputValues={{
        companyTypes,
        workerCertification: { hasSubSectionThree },
        ecoOrganismeAgreements
      }}
      handleToggle={handleToggle}
      inputProps={{
        ecoOrganismeAgreements: {
          value: index => {
            return {
              onChange: e =>
                setEcoOrganismeAgreements(
                  ecoOrganismeAgreements.map((a, idx) => {
                    if (idx === index) {
                      return e.currentTarget.value;
                    }
                    return a;
                  })
                )
            };
          },
          push: v => setEcoOrganismeAgreements([...ecoOrganismeAgreements, v]),
          remove: idx =>
            setEcoOrganismeAgreements(
              ecoOrganismeAgreements.filter((_, i) => i !== idx)
            )
        },
        workerCertification: {
          hasSubSectionThree: {
            checked: hasSubSectionThree,
            onChange: e => setHasSubSectionThree(e.currentTarget.checked)
          }
        }
      }}
    />
  );
};

const meta: Meta<typeof SimpleCompanyTypeForm> = {
  title: "COMPONENTS/FORMS/CompanyTypeForm",
  component: SimpleCompanyTypeForm
};

type Story = StoryObj<typeof SimpleCompanyTypeForm>;

export const Primary: Story = {};

export default meta;
