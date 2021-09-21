import * as React from "react";
import { gql, useMutation } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  BsffFicheIntervention,
  BsffFicheInterventionInput,
  CompanyInput,
  Mutation,
  MutationCreateFicheInterventionBsffArgs,
} from "generated/graphql/types";
import { Modal, RedErrorMessage } from "common/components";
import { IconClose } from "common/components/Icons";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import CompanySelector from "form/common/components/company/CompanySelector";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { NotificationError } from "common/components/Error";
import { FicheInterventionFragment } from "./utils/queries";

const CREATE_BSFF_FICHE_INTERVENTION = gql`
  mutation CreateBsffFicheIntervention($input: BsffFicheInterventionInput!) {
    createFicheInterventionBsff(input: $input) {
      ...FicheInterventionFragment
    }
  }
  ${FicheInterventionFragment}
`;

const companySchema: yup.SchemaOf<CompanyInput> = yup.object({
  address: yup.string().required(),
  contact: yup.string().required(),
  mail: yup.string().required(),
  name: yup.string().required(),
  phone: yup.string().required(),
  siret: yup.string().required(),
  vatNumber: yup.string().nullable(),
});
const detenteurSchema: yup.SchemaOf<
  BsffFicheInterventionInput["detenteur"]
> = yup.object({
  company: companySchema,
});
const operateurSchema: yup.SchemaOf<
  BsffFicheInterventionInput["operateur"]
> = yup.object({
  company: companySchema,
});
const ficheInterventionSchema: yup.SchemaOf<BsffFicheInterventionInput> = yup.object(
  {
    numero: yup.string().required(),
    weight: yup.number().required(),
    postalCode: yup.string().required(),
    detenteur: detenteurSchema,
    operateur: operateurSchema,
  }
);

interface AddFicheInterventionModalProps {
  initialOperateurCompany: BsffFicheInterventionInput["operateur"]["company"];
  onAddFicheIntervention: (ficheIntervention: BsffFicheIntervention) => void;
  onClose: () => void;
}

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

      <Formik<BsffFicheInterventionInput>
        initialValues={{
          weight: 0,
          numero: "",
          detenteur: {
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
              Quantité de fluide en kilos
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

          <CompanySelector
            heading="Détenteur de l'équipement"
            name="detenteur.company"
          />

          <CompanySelector heading="Opérateur" name="operateur.company" />

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
      </Formik>
    </Modal>
  );
}

interface FicheInterventionListProps {
  max?: number;
  ficheInterventions: BsffFicheIntervention[];
  initialOperateurCompany: BsffFicheInterventionInput["operateur"]["company"];
  onAddFicheIntervention: (ficheIntervention: BsffFicheIntervention) => void;
  onRemoveFicheIntervention: (ficheIntervention: BsffFicheIntervention) => void;
}

export function FicheInterventionList({
  max = Infinity,
  ficheInterventions,
  initialOperateurCompany,
  onAddFicheIntervention,
  onRemoveFicheIntervention,
}: FicheInterventionListProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <h4 className="form__section-heading">Fiche(s) d'intervention</h4>

      {ficheInterventions.map(ficheIntervention => (
        <div
          key={ficheIntervention.id}
          className="tw-border-2 tw-border-gray-400 tw-border-solid tw-rounded-md tw-px-4 tw-py-2 tw-mb-2"
        >
          <div className="tw-flex tw-mb-4 tw-items-end">
            <div className="tw-w-11/12 tw-flex">
              <div className="tw-w-1/3 tw-px-2">
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
              <div className="tw-w-1/3 tw-px-2">
                <label>
                  Quantité fluides en kilo(s)
                  <input
                    type="text"
                    className="td-input"
                    value={ficheIntervention.weight}
                    disabled
                  />
                </label>
              </div>

              <div className="tw-w-1/3 tw-px-2">
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
            <div className="tw-px-2">
              <button
                type="button"
                onClick={() => onRemoveFicheIntervention(ficheIntervention)}
              >
                <IconClose />
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn btn--outline-primary"
        onClick={() => {
          if (ficheInterventions.length >= max) {
            window.alert(
              `Vous ne pouvez pas ajouter plus de ${max} fiche(s) d'intervention avec ce type de BSFF.`
            );
            return;
          }

          setIsModalOpen(true);
        }}
      >
        Ajouter une fiche d'intervention
      </button>

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
