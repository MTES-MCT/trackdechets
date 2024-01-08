import { gql, useQuery } from "@apollo/client";
import { InlineError } from "../../../Apps/common/Components/Error/Error";

import { Field, useField, useFormikContext } from "formik";
import {
  Bsdasri,
  BsdasriType,
  Query,
  QueryCompanyInfosArgs,
  CompanyType
} from "@td/codegen-ui";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import Tooltip from "../../../common/components/Tooltip";

type Props = { disabled: boolean };

const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      orgId
      siret
      vatNumber
      name
      address
      companyTypes
      transporterReceipt {
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;

const COMMON_OPTIONS = [
  {
    title: "simple",
    explanation:
      "Bordereau nécessaire à la collecte initiale chez un producteur/détenteur",
    value: BsdasriType.Simple
  },
  {
    title: "de groupement",
    explanation:
      "Bordereau qui permet de grouper les BSDASRI simples et les déchets associés depuis un site relevant de la rubrique ICPE 2718",

    value: BsdasriType.Grouping
  }
];
const TRANSPORTER_OPTIONS = [
  {
    title: "de synthèse",

    explanation: `Bordereau qui permet de faire la synthèse de BSDASRI simples qui ont été pris en charge
      par le collecteur au statut "collecté" pour simplifier la prise en charge par le destinataire
      - ce bordereau ne peut être établi que par un collecteur/transporteur`,

    value: BsdasriType.Synthesis
  }
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
    fetchPolicy: "no-cache"
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
      setFieldValue(
        "transporter.company.vatNumber",
        data?.companyInfos.vatNumber
      );
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
        <p id="type-radio-group">J'édite un BSDASRI :</p>
      </div>

      <div
        className="form__row"
        role="radiogroup"
        aria-labelledby="type-radio-group"
      >
        {typeOptions.map(option => (
          <label className="tw-block tw-flex tw-items-start" key={option.value}>
            <Field
              type="radio"
              disabled={disabled}
              name="type"
              id={option.value}
              value={option.value}
              className="td-radio"
            />
            {option.title}
            <Tooltip msg={option.explanation} />
          </label>
        ))}
      </div>
    </>
  );
}
