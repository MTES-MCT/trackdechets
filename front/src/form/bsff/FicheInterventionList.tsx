import { gql, useMutation } from "@apollo/client";
import { Modal, RedErrorMessage } from "common/components";
import { NotificationError } from "Apps/common/Components/Error/Error";
import { IconClose } from "common/components/Icons";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import CompanySelector from "form/common/components/company/CompanySelector";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { Field, Form, Formik, useFormikContext } from "formik";
import {
  BsffDetenteurInput,
  BsffFicheIntervention,
  BsffFicheInterventionInput,
  CompanyInput,
  Mutation,
  MutationCreateFicheInterventionBsffArgs,
} from "generated/graphql/types";
import * as React from "react";
import * as yup from "yup";
import { FicheInterventionFragment } from "Apps/common/queries/fragments";

const CREATE_BSFF_FICHE_INTERVENTION = gql`
  mutation CreateBsffFicheIntervention($input: BsffFicheInterventionInput!) {
    createFicheInterventionBsff(input: $input) {
      ...FicheInterventionFragment
    }
  }
  ${FicheInterventionFragment}
`;

const companySchema: yup.SchemaOf<CompanyInput> = yup.object({
  address: yup.string().required("L'adresse de l'établissement est requis"),
  contact: yup.string().required("Le contact de l'établissement est requis"),
  mail: yup.string().required("L'email de contact est requis"),
  name: yup.string().required("Le nom de l'établissement est requis"),
  phone: yup
    .string()
    .required("Le numéro de téléphone de l'établissement est requis"),
  siret: yup.string().required("Le numéro SIRET de l'établissement est requis"),
  vatNumber: yup.string().nullable(),
  country: yup.string().notRequired().nullable(),
  omiNumber: yup.string().nullable(),
  orgId: yup.string().nullable(),
});
const detenteurSchema: yup.SchemaOf<BsffFicheInterventionInput["detenteur"]> =
  yup.object({
    isPrivateIndividual: yup.boolean().required(),
    company: yup.object().when("isPrivateIndividual", {
      is: false,
      then: () => companySchema,
      otherwise: schema =>
        schema.shape({
          name: yup
            .string()
            .ensure()
            .required("Le nom du détenteur est requis"),
          address: yup
            .string()
            .ensure()
            .required("L'adresse du détenteur est requise"),
          mail: yup.string().nullable().notRequired(),
          phone: yup.string().nullable().notRequired(),
        }),
    }),
  });
const operateurSchema: yup.SchemaOf<BsffFicheInterventionInput["operateur"]> =
  yup.object({
    company: companySchema,
  });
const ficheInterventionSchema: yup.SchemaOf<BsffFicheInterventionInput> =
  yup.object({
    numero: yup.string().required(),
    weight: yup.number().required(),
    postalCode: yup.string().required(),
    detenteur: detenteurSchema,
    operateur: operateurSchema,
  });

interface AddFicheInterventionModalProps {
  initialOperateurCompany: BsffFicheInterventionInput["operateur"]["company"];
  onAddFicheIntervention: (ficheIntervention: BsffFicheIntervention) => void;
  onClose: () => void;
}

type Values = BsffFicheInterventionInput & {
  detenteur: BsffDetenteurInput & { isPrivateIndividual: boolean };
};

function AddFicheInterventionModal({
  initialOperateurCompany,
  onAddFicheIntervention,
  onClose,
}: AddFicheInterventionModalProps) {
  const [createFicheIntervention, { loading, error }] = useMutation<
    Pick<Mutation, "createFicheInterventionBsff">,
    MutationCreateFicheInterventionBsffArgs
  >(CREATE_BSFF_FICHE_INTERVENTION);

  return (
    <Modal
      ariaLabel="Ajouter une fiche d'intervention"
      onClose={onClose}
      isOpen
    >
      <h2 className="td-modal-title">Ajouter une fiche d'intervention</h2>

      <div className="notification">
        Reportez ici certaines des informations d'une fiche d'intervention
        (formulaire 15497*03) dans Trackdéchets. L'ajout d'une fiche
        d'intervention permet d'identifier le détenteur d'un équipement afin que
        celui-ci ait accès au suivi du bordereau.
      </div>

      <Formik<Values>
        initialValues={{
          weight: 0,
          numero: "",
          detenteur: {
            isPrivateIndividual: false,
            company: getInitialCompany(),
          },
          operateur: {
            company: initialOperateurCompany,
          },
          postalCode: "",
        }}
        onSubmit={async values => {
          const { data } = await createFicheIntervention({
            variables: {
              input: values,
            },
          });

          if (data) {
            onAddFicheIntervention(data.createFicheInterventionBsff);
            onClose();
          }
        }}
        validationSchema={ficheInterventionSchema}
      >
        {({ values }) => (
          <Form>
            <div className="form__row">
              <label>
                N° fiche d'intervention
                <Field className="td-input" name="numero" />
                <RedErrorMessage name="numero" />
              </label>
            </div>

            <div className="form__row">
              <label>
                Quantité de fluide retiré en kg
                <Field
                  component={NumberInput}
                  className="td-input"
                  name="weight"
                />
                <RedErrorMessage name="weight" />
              </label>
            </div>

            <div className="form__row">
              <label>
                Code postal du lieu de collecte
                <Field className="td-input" name="postalCode" />
                <RedErrorMessage name="postalCode" />
              </label>
            </div>

            <IsPrivateIndividualCheckbox />
            {!values.detenteur.isPrivateIndividual &&
              values.detenteur?.company && (
                <CompanySelector
                  heading="Détenteur de l'équipement"
                  name="detenteur.company"
                  skipFavorite={true}
                />
              )}

            {values.detenteur.isPrivateIndividual && <PrivateIndividual />}

            {error && <NotificationError apolloError={error} />}

            <div className="td-modal-actions">
              <button className="btn btn--outline-primary" onClick={onClose}>
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                <span>{loading ? "Ajout en cours..." : "Ajouter"}</span>
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

function IsPrivateIndividualCheckbox() {
  const { values, setFieldValue } = useFormikContext<Values>();

  React.useEffect(() => {
    setFieldValue("detenteur.company", getInitialCompany());
  }, [values.detenteur?.isPrivateIndividual, setFieldValue]);

  return (
    <div className="form__row">
      <label>
        <Field
          type="checkbox"
          name="detenteur.isPrivateIndividual"
          className="td-checkbox"
        />
        Le détenteur de l'équipement est un particulier
      </label>
    </div>
  );
}

function PrivateIndividual() {
  return (
    <>
      <h4 className="form__section-heading">Détenteur de l'équipement</h4>
      <div className="form__row">
        <label>
          Nom et prénom
          <Field
            type="text"
            name="detenteur.company.name"
            className="td-input"
          />
        </label>
        <RedErrorMessage name="detenteur.company.name" />
      </div>
      <div className="form__row">
        <label>
          Adresse
          <Field
            type="text"
            name="detenteur.company.address"
            className="td-input"
          />
        </label>
        <RedErrorMessage name="detenteur.company.address" />
      </div>
      <div className="form__row">
        <label>
          Téléphone (optionnel)
          <Field
            type="text"
            name="detenteur.company.phone"
            className="td-input td-input--small"
          />
        </label>
        <RedErrorMessage name="detenteur.company.phone" />
      </div>
      <div className="form__row">
        <label>
          Mail (optionnel)
          <Field
            type="text"
            name="detenteur.company.mail"
            className="td-input td-input--medium"
          />
        </label>
        <RedErrorMessage name="detenteur.company.mail" />
      </div>
    </>
  );
}

interface FicheInterventionListProps {
  max?: number;
  ficheInterventions: BsffFicheIntervention[];
  initialOperateurCompany: BsffFicheInterventionInput["operateur"]["company"];
  onAddFicheIntervention: (ficheIntervention: BsffFicheIntervention) => void;
  onRemoveFicheIntervention: (ficheIntervention: BsffFicheIntervention) => void;
  disabled: boolean;
}

export function FicheInterventionList({
  max = Infinity,
  ficheInterventions,
  initialOperateurCompany,
  onAddFicheIntervention,
  onRemoveFicheIntervention,
  disabled,
}: FicheInterventionListProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <h4 className="form__section-heading">
        Détenteur(s) du ou des équipements
      </h4>

      {ficheInterventions.map(ficheIntervention => (
        <div
          key={ficheIntervention.id}
          className="tw-border-2 tw-border-gray-400 tw-border-solid tw-rounded-md tw-px-4 tw-py-2 tw-mb-2"
        >
          <div className="tw-flex tw-mb-4 tw-items-end">
            <div className="tw-w-11/12 tw-flex">
              <div className="tw-w-1/4 tw-px-2">
                <label>
                  Numéro fiche d'intervention
                  <input
                    type="text"
                    className="td-input"
                    value={ficheIntervention.numero}
                    disabled
                  />
                </label>
              </div>
              <div className="tw-w-1/4 tw-px-2">
                <label>
                  Détenteur
                  <input
                    type="text"
                    className="td-input"
                    value={ficheIntervention.detenteur?.company?.name ?? ""}
                    disabled
                  />
                </label>
              </div>
              <div className="tw-w-1/4 tw-px-2">
                <label>
                  Quantité de fluide en kg
                  <input
                    type="text"
                    className="td-input"
                    value={ficheIntervention.weight}
                    disabled
                  />
                </label>
              </div>

              <div className="tw-w-1/4 tw-px-2">
                <label>
                  Code postal du lieu de collecte
                  <input
                    type="text"
                    className="td-input"
                    value={ficheIntervention.postalCode}
                    disabled
                  />
                </label>
              </div>
            </div>
            {!disabled && (
              <div className="tw-px-2">
                <button
                  type="button"
                  onClick={() => onRemoveFicheIntervention(ficheIntervention)}
                >
                  <IconClose />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          className="btn btn--outline-primary"
          onClick={() => {
            companySchema
              .validate(initialOperateurCompany)
              .then(() => {
                if (ficheInterventions.length >= max) {
                  window.alert(
                    `Vous ne pouvez pas ajouter plus de ${max} fiche(s) d'intervention avec ce type de BSFF.`
                  );
                  return;
                }

                setIsModalOpen(true);
              })
              .catch(e => {
                window.alert(
                  `Veuillez compléter les champs de l'opérateur avant l'ajout d'une fiche d'intervention.`
                );
                return;
              });
          }}
        >
          Ajouter une fiche d'intervention
        </button>
      )}

      {isModalOpen && (
        <AddFicheInterventionModal
          initialOperateurCompany={initialOperateurCompany}
          onAddFicheIntervention={onAddFicheIntervention}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
