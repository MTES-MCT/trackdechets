import React, { useMemo } from "react";
import { AllCompanyType } from "../../utils";
import { CompanyType } from "@td/codegen-ui";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps,
  CompanyTypeInputValues
} from "./CompanyTypeForm";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import SelectWithSubOptions from "../../../../common/Components/SelectWithSubOptions/SelectWithSubOptions";
import { GET_ECO_ORGANISMES } from "../../../../../form/registry/common/EcoOrganismes";
import { useQuery } from "@apollo/client";

type EcoOrganismesPartnersFormProps = {
  companyType: AllCompanyType;
  inputProps?: CompanyTypeInputProps;
  inputValues: CompanyTypeInputValues;
  inputErrors?: CompanyTypeInputErrors;
};

const EcoOrganismesPartnersForm = ({
  companyType,
  inputProps,
  inputValues,
  inputErrors
}: EcoOrganismesPartnersFormProps) => {
  const { data, loading } = useQuery(GET_ECO_ORGANISMES, {
    variables: {
      handleBsvhu: true
    }
  });

  const onChange = (selected: { label: string; value: string }[]) => {
    inputProps?.ecoOrganismePartnersIds?.onChange(selected.map(s => s.value));
  };

  const options = useMemo(() => {
    if (!data?.ecoOrganismes) return [];

    return data.ecoOrganismes.map(
      (eo: { id: string; name: string; siret: string }) => ({
        label: `${eo.name} (${
          eo.name === "RECYCLER MON VEHICULE" ? "SI" : "ÉO"
        })`,
        value: eo.id
      })
    );
  }, [data]);

  const selectedOptions = useMemo(() => {
    if (loading || !data?.ecoOrganismes) return [];

    return options
      .filter(o =>
        (inputValues.ecoOrganismePartnersIds ?? []).includes(o.value)
      )
      .map(o => ({ label: o.label, value: o.value }));
  }, [inputValues, options, data, loading]);

  if (companyType === CompanyType.WasteVehicles) {
    return (
      <Highlight>
        <div className="fr-pb-2w">
          <div>
            Éco-organismes (ÉO) ou Systèmes individuels (SI) (optionnel)
          </div>
          {loading && (
            <div>
              <i>Chargement des éco-organismes...</i>
            </div>
          )}
          {!loading && options.length === 0 && (
            <div>Aucun éco-organisme disponible.</div>
          )}
          {!loading && options.length > 0 && (
            <div>
              <SelectWithSubOptions
                options={options}
                selected={selectedOptions}
                onChange={onChange}
              />
            </div>
          )}
          {inputErrors?.ecoOrganismePartnersIds && (
            <div className="fr-error-text">
              {inputErrors?.ecoOrganismePartnersIds}
            </div>
          )}
        </div>
      </Highlight>
    );
  }

  return null;
};

export default React.memo(EcoOrganismesPartnersForm);
