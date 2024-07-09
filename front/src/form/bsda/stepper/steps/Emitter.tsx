import React from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "../../../common/components/company/CompanySelector";
import { Bsda, BsdaType, BsdaPickupSite } from "@td/codegen-ui";
import WorkSite from "../../../common/components/work-site/WorkSite";
import BsdaEcoOrganismes from "../../components/eco-organismes/EcoOrganismes";
import { getInitialCompany } from "../../../../Apps/common/data/initialState";

export function Emitter({ disabled }) {
  const { values, handleChange, setFieldValue } = useFormikContext<Bsda>();

  const isBsdaSuite = [BsdaType.Gathering, BsdaType.Reshipment].includes(
    values?.type as BsdaType
  );

  if (isBsdaSuite && !values.emitter?.company?.siret) {
    return (
      <div className="notification notification--error">
        Veuillez sélectionner les bordereaux à associer avant de compléter
        l'émetteur.
      </div>
    );
  }

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      {isBsdaSuite ? (
        <div className="notification">
          Vous effectuez un groupement ou une réexpédition. L'entreprise
          émettrice est obligatoirement la vôtre:{" "}
          {values.emitter?.company?.name} - {values.emitter?.company?.siret}
        </div>
      ) : (
        <div className="form__row">
          <label>
            <Field
              disabled={disabled}
              type="checkbox"
              name="emitter.isPrivateIndividual"
              className="td-checkbox"
              onChange={e => {
                handleChange(e);
                setFieldValue("emitter.company", getInitialCompany());
              }}
            />
            Le MOA ou le détenteur est un particulier
          </label>
        </div>
      )}

      {values.emitter?.isPrivateIndividual &&
        values.type === BsdaType.OtherCollections && (
          <div className="notification notification--warning tw-mt-6">
            Si le particulier est en charge du transport direct vers l'exutoire,
            merci de bien vouloir utiliser un bordereau de collecte en
            déchèterie.
          </div>
        )}

      {values.emitter?.isPrivateIndividual || isBsdaSuite ? (
        <>
          <div className="form__row">
            {values.emitter?.isPrivateIndividual ? (
              <label>
                Nom et prénom
                <Field
                  type="text"
                  name="emitter.company.name"
                  className="td-input"
                  disabled={disabled}
                />
              </label>
            ) : (
              <label>
                Personne à contacter
                <Field
                  type="text"
                  name="emitter.company.contact"
                  placeholder="NOM Prénom"
                  className="td-input"
                  disabled={disabled}
                />
              </label>
            )}
          </div>
          <div className="form__row">
            <label>
              Adresse
              <Field
                type="text"
                name="emitter.company.address"
                className="td-input"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Téléphone
              <Field
                type="text"
                name="emitter.company.phone"
                className="td-input td-input--small"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Mail
              <Field
                type="text"
                name="emitter.company.mail"
                className="td-input td-input--medium"
                disabled={disabled}
              />
            </label>
          </div>
        </>
      ) : (
        <CompanySelector
          disabled={disabled}
          name="emitter.company"
          heading="Entreprise émettrice"
        />
      )}

      {!isBsdaSuite && (
        <WorkSite
          switchLabel="Je souhaite ajouter une adresse de chantier ou de collecte"
          headingTitle="Adresse chantier"
          designation="du chantier ou lieu de collecte"
          getInitialEmitterWorkSiteFn={getInitialEmitterPickupSite}
          disabled={disabled}
          modelKey="pickupSite"
        />
      )}

      <BsdaEcoOrganismes name="ecoOrganisme" />
    </>
  );
}

export function getInitialEmitterPickupSite(
  pickupSite?: BsdaPickupSite | null
) {
  return {
    name: pickupSite?.name ?? "",
    address: pickupSite?.address ?? "",
    city: pickupSite?.city ?? "",
    postalCode: pickupSite?.postalCode ?? "",
    infos: pickupSite?.infos ?? ""
  };
}
