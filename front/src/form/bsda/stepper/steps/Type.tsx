import { gql, useQuery } from "@apollo/client";
import { InlineError } from "Apps/common/Components/Error/Error";
import { BsdaPicker } from "form/bsda/components/bsdaPicker/BsdaPicker";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { Field, useField, useFormikContext } from "formik";
import {
  Bsda,
  BsdaType,
  CompanyType,
  Query,
  QueryCompanyInfosArgs,
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
    title: "la collecte d'amiante sur un chantier",
    value: BsdaType.OtherCollections,
  },
  {
    title:
      "le groupement de déchets entreposés sur un site relevant de la rubrique 2718 (ou 2710-1)",
    value: BsdaType.Gathering,
  },
  {
    title: "la réexpédition après entreposage provisoire",
    value: BsdaType.Reshipment,
  },
];
const DECHETTERIE_OPTIONS = [
  {
    title: "la collecte en déchèterie relevant de la rubrique 2710-1",
    value: BsdaType.Collection_2710,
  },
];

export function Type({ disabled }: Props) {
  const { setFieldValue } = useFormikContext<Bsda>();
  const [{ value: type }] = useField<BsdaType>("type");
  const [{ value: id }] = useField<string>("id");
  const { siret } = useParams<{ siret: string }>();

  const { data, loading, error } = useQuery<
    Pick<Query, "companyInfos">,
    QueryCompanyInfosArgs
  >(COMPANY_INFOS, {
    variables: { siret },
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    if (type !== BsdaType.Gathering) {
      setFieldValue("grouping", []);
    }
    if (type !== BsdaType.Reshipment) {
      setFieldValue("forwarding", null);
    }
    if ([BsdaType.Reshipment, BsdaType.Gathering].includes(type)) {
      setFieldValue("worker.company", getInitialCompany());
    }
    if (type === BsdaType.Collection_2710) {
      setFieldValue("destination.company.siret", data?.companyInfos.siret);
      setFieldValue("destination.company.address", data?.companyInfos.address);
      setFieldValue("destination.company.name", data?.companyInfos.name);
      setFieldValue("worker.company", getInitialCompany());
      setFieldValue("transporter.company", getInitialCompany());
    }
  }, [type, setFieldValue, data]);

  if (loading) return <p>Loading...</p>;
  if (error) return <InlineError apolloError={error} />;

  const typeOptions = data?.companyInfos.companyTypes?.includes(
    "WASTE_CENTER" as CompanyType
  )
    ? [...COMMON_OPTIONS, ...DECHETTERIE_OPTIONS]
    : COMMON_OPTIONS;

  return (
    <>
      <h4 className="form__section-heading">Type de BSDA</h4>

      <div className="form__row">
        <p>J'édite un BSDA pour :</p>
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
      <div className="tw-mt-4">
        {BsdaType.Gathering === type && (
          <BsdaPicker name="grouping" bsdaId={id} />
        )}
        {BsdaType.Reshipment === type && (
          <BsdaPicker name="forwarding" bsdaId={id} />
        )}
      </div>
    </>
  );
}
