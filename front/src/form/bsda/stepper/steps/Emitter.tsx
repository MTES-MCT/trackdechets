import React from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsda, BsdaType, BsdaPickupSite } from "generated/graphql/types";
import WorkSite from "form/common/components/work-site/WorkSite";

export function Emitter({ disabled }) {
  const { values } = useFormikContext<Bsda>();

  const isGroupement = values?.type === BsdaType.Gathering;
  const isEntreposageProvisoire = values?.type === BsdaType.Reshipment;

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      {isGroupement || isEntreposageProvisoire ? (
        <div className="notification">
          Vous effectuez un groupement ou entreposage provisoire. L'entreprise
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
            />
            Le MO ou le détenteur est un particulier
          </label>
        </div>
      )}

      {values.emitter?.isPrivateIndividual ||
      isGroupement ||
      isEntreposageProvisoire ? (
        <>
          <div className="form__row">
            <label>
              Nom et prénom
              <Field
                type="text"
                name="emitter.company.name"
                className="td-input td-input"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Adresse
              <Field
                type="text"
                name="emitter.company.address"
                className="td-input td-input"
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

      <WorkSite
        switchLabel="Je souhaite ajouter une adresse de chantier ou de collecte"
        headingTitle="Adresse chantier"
        designation="du chantier ou lieu de collecte"
        getInitialEmitterWorkSiteFn={getInitialEmitterPickupSite}
        disabled={disabled}
        modelKey="pickupSite"
      />
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
    infos: pickupSite?.infos ?? "",
  };
}
