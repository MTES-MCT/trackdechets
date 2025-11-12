import React, { useContext, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { pluralize } from "@td/constants";
import {
  BsdaConsistence,
  BsdaType,
  Query,
  QueryCompanyInfosArgs,
  CompanyType
} from "@td/codegen-ui";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import WasteRadioGroup from "../../../../Forms/Components/WasteRadioGoup/WasteRadioGroup";
import { WasteCodeSelector } from "../../../../../form/registry/common/WasteCodeSelector";
import RhfPackagingList from "../../../../Forms/Components/PackagingList/RhfPackagingList";
import { bsdaPackagingTypes } from "../../../../Forms/Components/PackagingList/helpers";
import { RhfTagsInputWrapper } from "../../../../Forms/Components/TagsInput/TagsInputWrapper";
import NonScrollableInput from "../../../../common/Components/NonScrollableInput/NonScrollableInput";
import SelectableWasteTableWrapper from "../components/SelectableWasteTableWrapper";
import { InlineError } from "../../../../common/Components/Error/Error";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import {
  getInitialCompany,
  initialTransporter
} from "../../../../common/data/initialState";

const BSDA_COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      siret
      name
      address
      companyTypes
    }
  }
`;

const WasteBsda = ({ errors }) => {
  const { siret } = useParams<{ siret: string }>();
  const methods = useFormContext();
  const { register, setValue, watch } = methods;

  const { data, loading, error } = useQuery<
    Pick<Query, "companyInfos">,
    QueryCompanyInfosArgs
  >(BSDA_COMPANY_INFOS, {
    variables: { siret },
    fetchPolicy: "no-cache"
  });

  const id = watch("id", null);
  const waste = watch("waste", {});
  const sealedFields = useContext(SealedFieldsContext);
  const bsdaType = watch("type");
  const weight = watch("weight", {});
  const packagings = watch("packagings", {});

  useEffect(() => {
    if (bsdaType !== BsdaType.Gathering) {
      setValue("grouping", []);
    }
    if (bsdaType !== BsdaType.Reshipment) {
      setValue("forwarding", null);
    }
    if ([BsdaType.Reshipment, BsdaType.Gathering].includes(bsdaType)) {
      setValue("worker.company", getInitialCompany());
    }
    if (bsdaType === BsdaType.Collection_2710) {
      setValue("destination.company.siret", data?.companyInfos.siret);
      setValue("destination.company.address", data?.companyInfos.address);
      setValue("destination.company.name", data?.companyInfos.name);
      setValue("worker.company", getInitialCompany());
      // Nettoie les données transporteurs en gardant quand même un
      // transporteur vide par défaut au cas où on repasse sur un autre type
      // de BSDA. Un clean sera fait au moment de la soumission du formulaire
      // pour s'assurer que `transporters: []` en cas de collecte en déchetterie.
      setValue("transporters", [initialTransporter]);
    }
  }, [bsdaType, setValue, data]);

  const isWasteCenter = data?.companyInfos.companyTypes?.includes(
    "WASTE_CENTER" as CompanyType
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <InlineError apolloError={error} />;

  const isDechetterie = bsdaType === BsdaType.Collection_2710;
  const sealNumbersLength = waste?.sealNumbers.length ?? 0;

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col">
        <WasteRadioGroup
          title="Type de bordereau"
          legend="J'édite un BSDA pour :"
          disabled={sealedFields.includes("type")}
          options={[
            {
              label: "La collecte d'amiante sur un chantier",
              nativeInputProps: {
                ...register("type"),
                value: BsdaType.OtherCollections
              }
            },
            {
              label:
                "Le groupement de déchets entreposés sur un site relevant de la rubrique 2718 (ou 2710-1)",
              nativeInputProps: {
                ...register("type"),
                value: BsdaType.Gathering
              }
            },
            {
              label: "La réexpédition après entreposage provisoire",
              nativeInputProps: {
                ...register("type"),
                value: BsdaType.Reshipment
              }
            },
            ...(isWasteCenter
              ? [
                  {
                    label: "La collecte en déchetterie",
                    nativeInputProps: {
                      ...register("type"),
                      value: BsdaType.Collection_2710
                    }
                  }
                ]
              : [])
          ]}
        />
      </div>

      <div className="fr-col">
        {bsdaType === BsdaType.Gathering && (
          <>
            <Alert
              description="Sélectionnez des BSDA ayant le même code déchet et le même
                        exutoire"
              severity="info"
              small
              className="fr-mb-2w"
            />
            <SelectableWasteTableWrapper type={bsdaType} bsdaId={id} />
          </>
        )}

        {bsdaType === BsdaType.Reshipment && (
          <>
            <SelectableWasteTableWrapper type={bsdaType} bsdaId={id} />

            <Alert
              description="Vous effectuez une réexpédition. Les informations sur le déchet ont été automatiquement reportées et ne sont pas modifiables."
              severity="info"
              small
              className="fr-mt-2w"
            />
          </>
        )}

        {bsdaType !== BsdaType.Reshipment && (
          <>
            <h4 className="fr-h4 fr-mt-4w">Déchet</h4>

            <WasteCodeSelector name={"waste.code"} methods={methods} />

            <Select
              className="fr-col-md-8 fr-mt-1w"
              label="Code famille"
              nativeSelectProps={{
                ...register("waste.familyCode")
              }}
            >
              <option value="...">Sélectionnez une valeur...</option>
              <option value="1">
                1 - amiante pur utilisé en bourrage ou en sac
              </option>
              <option value="2">
                2 - amiante mélangé dans des poudres ou des produits minéraux
                sans liaison forte
              </option>
              <option value="3">
                3 - amiante intégré dans des liquides ou des solutions
                visqueuses
              </option>
              <option value="4">4 - amiante tissé ou tressé</option>
              <option value="5">5 - amiante en feuilles ou en plaques</option>
              <option value="6">6 - amiante lié à des matériaux inertes</option>
              <option value="7">
                7 - amiante noyé dans une résine ou une matière plastique
              </option>
              <option value="8">
                8 - amiante dans des matériels et équipements
              </option>
              <option value="9">
                9 - tous les matériaux contaminés susceptibles d'émettre des
                fibres
              </option>
            </Select>

            <Input
              className="fr-col-md-8"
              label="Dénomination usuelle"
              nativeInputProps={{
                ...register("waste.materialName")
              }}
            />

            <ToggleSwitch
              label={
                <span>
                  Le déchet contient des{" "}
                  <a
                    className="fr-link force-external-link-content force-underline-link"
                    href="https://www.ecologique-solidaire.gouv.fr/polluants-organiques-persistants-pop"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    polluants organiques persistants
                  </a>
                </span>
              }
              checked={Boolean(waste.pop)}
              onChange={(checked: boolean) => {
                setValue("waste.pop", checked);
              }}
              className="fr-mt-4w"
            />

            <ToggleSwitch
              label="Le déchet est soumis à l'ADR"
              checked={Boolean(waste.isSubjectToADR)}
              onChange={(checked: boolean) => {
                setValue("waste.isSubjectToADR", checked);
              }}
              className="fr-mt-4w"
            />

            <Input
              className="fr-col-md-8 fr-mt-4w"
              label="Mention au titre des règlements RID, ADNR, IMDG (optionnel)"
              nativeInputProps={{
                ...register("waste.nonRoadRegulationMention")
              }}
            />

            <h4 className="fr-h4 fr-mt-4w">Conditionnement</h4>
            <RhfPackagingList
              fieldName="packagings"
              packagingTypes={bsdaPackagingTypes}
            />

            <h4 className="fr-h4 fr-mt-4w">Consistance</h4>

            <RadioButtons
              orientation="horizontal"
              options={[
                {
                  label: "Solide",
                  nativeInputProps: {
                    onChange: () =>
                      setValue("waste.consistence", BsdaConsistence.Solide),

                    checked: waste.consistence === BsdaConsistence.Solide
                  }
                },
                {
                  label: "Pulvérulent",
                  nativeInputProps: {
                    onChange: () =>
                      setValue(
                        "waste.consistence",
                        BsdaConsistence.Pulverulent
                      ),

                    checked: waste.consistence === BsdaConsistence.Pulverulent
                  }
                },
                {
                  label: "Pâteux",
                  nativeInputProps: {
                    onChange: () =>
                      setValue("waste.consistence", BsdaConsistence.Pateux),

                    checked: waste.consistence === BsdaConsistence.Pateux
                  }
                },
                {
                  label: "Autre",
                  nativeInputProps: {
                    onChange: () =>
                      setValue("waste.consistence", BsdaConsistence.Other),

                    checked: waste.consistence === BsdaConsistence.Other
                  }
                }
              ]}
            />

            {waste.consistence === BsdaConsistence.Other && (
              <Input
                className="fr-col-md-8 fr-mt-4w"
                label="Si Autre, préciser :"
                nativeInputProps={{
                  ...register("waste.consistenceDescription")
                }}
              />
            )}

            <h4 className="fr-h4 fr-mt-4w">Quantité remise</h4>

            <div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
              <Input
                className="fr-col-md-3"
                label="En nombre"
                disabled={true}
                nativeInputProps={{
                  value: sealNumbersLength
                }}
              />

              <div className="fr-col-md-3">
                <NonScrollableInput
                  label="Poids total en tonnes"
                  disabled={sealedFields.includes("weight.value")}
                  nativeInputProps={{
                    inputMode: "decimal",
                    step: "0.1",
                    type: "number",
                    ...register("weight.value")
                  }}
                />

                <p className="fr-info-text fr-mt-5v">
                  Soit {(weight.value || 0) * 1000} kg
                </p>
              </div>

              <div className="fr-col-md-6">
                <RadioButtons
                  legend="Cette quantité est"
                  disabled={sealedFields.includes("weight.isEstimate")}
                  orientation="horizontal"
                  state={errors?.weight?.isEstimate && "error"}
                  stateRelatedMessage={
                    (errors?.weight?.isEstimate?.message as string) ?? ""
                  }
                  options={[
                    {
                      label: "Réelle",
                      nativeInputProps: {
                        onChange: () => setValue("weight.isEstimate", false),

                        checked: weight.isEstimate === false
                      }
                    },
                    {
                      label: "Estimée",
                      nativeInputProps: {
                        onChange: () => setValue("weight.isEstimate", true),
                        checked: weight.isEstimate === true
                      }
                    }
                  ]}
                />
              </div>
            </div>

            {!isDechetterie && (
              <>
                <h4 className="fr-h4 fr-mt-4w">Numéros de scellés</h4>

                <RhfTagsInputWrapper
                  label="Numéros"
                  fieldName={"waste.sealNumbers"}
                />

                <p className="fr-info-text">
                  Vous avez saisi {sealNumbersLength}{" "}
                  {pluralize("numéro", sealNumbersLength)} pour{" "}
                  {Number(packagings.length ?? 0)}{" "}
                  {pluralize("conditionnement", packagings.length ?? 0)}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default WasteBsda;
