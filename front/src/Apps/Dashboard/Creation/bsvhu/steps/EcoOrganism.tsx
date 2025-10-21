import React, { useEffect, useState, useContext, useMemo } from "react";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { useFormContext } from "react-hook-form";
import Select from "@codegouvfr/react-dsfr/Select";
import { ZodBsvhu } from "../schema";
import {
  BsvhuEcoOrganismeInput,
  Query,
  QueryCompanyInfosArgs
} from "@td/codegen-ui";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import { useQuery, gql, useLazyQuery } from "@apollo/client";
import { capitalize } from "../../../../../common/helper";

const COMPANY_INFOS = gql`
  query CompanyInfos($siret: String!) {
    companyInfos(siret: $siret) {
      orgId
      siret
      vatNumber
      ecoOrganismePartnersIds
    }
  }
`;

const GET_ECO_ORGANISMES = gql`
  {
    ecoOrganismes(handleBsvhu: true) {
      id
      name
      siret
      address
      handleBsvhu
    }
  }
`;

const EcoOrganism = () => {
  const [selectedEcoOrg, setSelectedEcoOrg] =
    useState<BsvhuEcoOrganismeInput>();
  const { register, watch, setValue, formState, clearErrors } =
    useFormContext<ZodBsvhu>(); // retrieve all hook methods
  const sealedFields = useContext(SealedFieldsContext);
  const { data } = useQuery<Pick<Query, "ecoOrganismes">>(GET_ECO_ORGANISMES);

  // On récupère l'entreprise de destination. On a besoin des ecoOrganismePartnersIds pour filtrer la liste des éco-organismes
  const [getDestinationCompanyInfos, { data: destinationCompany }] =
    useLazyQuery<Pick<Query, "companyInfos">, QueryCompanyInfosArgs>(
      COMPANY_INFOS,
      {
        fetchPolicy: "no-cache"
      }
    );

  // On récupère l'entreprise émettrice. On a besoin des ecoOrganismePartnersIds pour filtrer la liste des éco-organismes
  const [getEmitterCompanyInfos, { data: emitterCompany }] = useLazyQuery<
    Pick<Query, "companyInfos">,
    QueryCompanyInfosArgs
  >(COMPANY_INFOS, {
    fetchPolicy: "no-cache"
  });

  console.log("destinationCompany", destinationCompany);
  console.log("emitterCompany", emitterCompany);

  // Fetch destination and emitter company info
  const destination = watch("destination");
  const emitter = watch("emitter");

  // Fetch destination company info
  useEffect(() => {
    if (destination?.company?.siret) {
      getDestinationCompanyInfos({
        variables: { siret: destination?.company?.siret }
      });
    }
  }, [destination?.company?.siret, getDestinationCompanyInfos]);

  // Fetch emitter company info
  useEffect(() => {
    if (emitter?.company?.siret) {
      getEmitterCompanyInfos({
        variables: { siret: emitter?.company?.siret }
      });
    }
  }, [emitter?.company?.siret, getEmitterCompanyInfos]);

  // On regroupe les ecoOrganismePartnersIds de la destination et de l'émetteur
  const ecoOrganismePartnersIds = useMemo(() => {
    return Array.from(
      new Set([
        ...(destinationCompany?.companyInfos?.ecoOrganismePartnersIds || []),
        ...(emitterCompany?.companyInfos?.ecoOrganismePartnersIds || [])
      ])
    );
  }, [destinationCompany, emitterCompany]);

  const ecoOrganisme = watch("ecoOrganisme");
  const hasEcoOrganisme = ecoOrganisme.hasEcoOrganisme;

  const onChangeEcoOrganisme = e => {
    const ecoOrgSelected = data?.ecoOrganismes.find(
      ecoOrg => ecoOrg.siret === e.currentTarget.value
    );
    if (ecoOrgSelected?.name) {
      clearErrors("ecoOrganisme.siret");
      setSelectedEcoOrg(ecoOrgSelected);
      setValue("ecoOrganisme.name", ecoOrgSelected.name);
    } else {
      setSelectedEcoOrg(undefined);
      setValue("ecoOrganisme.siret", "");
      setValue("ecoOrganisme.name", "");
    }
  };

  const onToggleEcoOrganisme = checked => {
    if (checked) {
      setValue("ecoOrganisme.hasEcoOrganisme", true);
    } else {
      setValue("ecoOrganisme.siret", "");
      setValue("ecoOrganisme.name", "");
      setValue("ecoOrganisme.hasEcoOrganisme", false);
    }
  };

  useEffect(() => {
    if (ecoOrganisme?.siret && !hasEcoOrganisme) {
      setValue("ecoOrganisme.hasEcoOrganisme", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h4 className="fr-h4">Éco-organisme ou système individuel</h4>

      <ToggleSwitch
        label="Présence d'un éco-organisme ou système individuel"
        checked={!!hasEcoOrganisme}
        showCheckedHint={false}
        onChange={onToggleEcoOrganisme}
        disabled={sealedFields.includes(`ecoOrganisme.siret`)}
      />

      {hasEcoOrganisme && (
        <>
          <Select
            label="Nom de l'éco-organisme ou système individuel"
            nativeSelectProps={{
              ...register("ecoOrganisme.siret"),
              onChange: onChangeEcoOrganisme
            }}
            state={formState.errors.ecoOrganisme?.siret && "error"}
            stateRelatedMessage={formState.errors.ecoOrganisme?.siret?.message}
            disabled={sealedFields.includes(`ecoOrganisme.siret`)}
            className="fr-mt-2w"
          >
            <option value="">
              Sélectionner un éco-organisme ou système individuel
            </option>

            {data?.ecoOrganismes
              ?.map(ecoOrg => {
                // Si la destination ou l'émétteur a des ecoOrganismePartnersIds, on ne montre que ceux-ci
                if (ecoOrganismePartnersIds?.length) {
                  if (!ecoOrganismePartnersIds.includes(ecoOrg.id)) {
                    return null;
                  }
                }

                return (
                  <option
                    key={ecoOrg.siret}
                    value={ecoOrg.siret}
                    defaultValue={ecoOrganisme?.siret || ""}
                  >
                    {`${ecoOrg.siret} - ${capitalize(ecoOrg.name)}`}
                  </option>
                );
              })
              .filter(Boolean)}
          </Select>

          <input
            hidden
            value={selectedEcoOrg?.name || ""}
            defaultValue={ecoOrganisme?.name || ""}
            {...register("ecoOrganisme.name")}
          />
        </>
      )}
    </>
  );
};

export default EcoOrganism;
