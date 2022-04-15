import { gql, useQuery } from "@apollo/client";
import { InlineError } from "common/components/Error";

import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { Field, useField, useFormikContext } from "formik";
import {
  Bsdasri,
  BsdasriType,
  Query,
  QueryCompanyInfosArgs,
  CompanyType,
} from "generated/graphql/types";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";

type Props = { disabled: boolean };

const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      siret
      name
      address
      companyTypes
    }
  }
`;

const COMMON_OPTIONS = [
  {
    title: "simple",
    value: BsdasriType.Simple,
  },
  {
    title: "de groupement",
    value: BsdasriType.Grouping,
  },
];
const TRANSPORTER_OPTIONS = [
  {
    title: "de synthèse",
    value: BsdasriType.Synthesis,
  },
];

const ALL_OPTIONS = [...COMMON_OPTIONS, ...TRANSPORTER_OPTIONS];

const getTypeOptions = (data, isUpdating) => {
  // Only tranporters can create synthesis dasris
  if (isUpdating) {
    return ALL_OPTIONS;
  }
  return data?.companyInfos?.companyTypes?.includes(CompanyType.Transporter)
    ? ALL_OPTIONS
    : COMMON_OPTIONS;
};

export function Type({ disabled }: Props) {
  const { setFieldValue } = useFormikContext<Bsdasri>();
  const [{ value: type }] = useField<BsdasriType>("type");
  const { siret } = useParams<{ siret: string }>();
  const { id } = useParams<{ id: string }>();

  const { data, loading, error } = useQuery<
    Pick<Query, "companyInfos">,
    QueryCompanyInfosArgs
  >(COMPANY_INFOS, {
    variables: { siret },
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    if (type === BsdasriType.Simple) {
      setFieldValue("grouping", []);
      setFieldValue("synthesizing", []);
    }
    if (type === BsdasriType.Grouping) {
      setFieldValue("emitter.company.siret", data?.companyInfos.siret);
      setFieldValue("emitter.company.address", data?.companyInfos.address);
      setFieldValue("emitter.company.name", data?.companyInfos.name);
      setFieldValue("synthesizing", []);
    }
    if (type === BsdasriType.Synthesis) {
      setFieldValue("emitter.company.siret", data?.companyInfos.siret);
      setFieldValue("emitter.company.address", data?.companyInfos.address);
      setFieldValue("emitter.company.name", data?.companyInfos.name);
      setFieldValue("transporter.company.siret", data?.companyInfos.siret);
      setFieldValue("transporter.company.address", data?.companyInfos.address);
      setFieldValue("transporter.company.name", data?.companyInfos.name);
      setFieldValue("grouping", []);
    }
  }, [type, setFieldValue, data]);

  if (loading) return <p>Loading...</p>;
  if (error) return <InlineError apolloError={error} />;

  const typeOptions = getTypeOptions(data, !!id);

  return (
    <>
      <h4 className="form__section-heading">Type de BSDASRI</h4>

      <div className="form__row">
        <p>J'édite un BSDASRI :</p>
      </div>

      <div className="form__row">
        {typeOptions.map(option => (
          <Field
            key={option.value}
            disabled={disabled}
            name="type"
            id={option.value}
            label={option.title}
            component={RadioButton}
          />
        ))}
      </div>
    </>
  );
}
