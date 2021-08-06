import * as React from "react";
import { gql, useMutation } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  BsffFicheInterventionInput,
  CompanyInput,
  Mutation,
  MutationCreateFicheInterventionBsffArgs,
} from "generated/graphql/types";
import { Modal, RedErrorMessage } from "common/components";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import CompanySelector from "form/common/components/company/CompanySelector";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import { NotificationError } from "common/components/Error";

const CREATE_BSFF_FICHE_INTERVENTION = gql`
  mutation CreateBsffFicheIntervention($input: BsffFicheInterventionInput!) {
    createFicheInterventionBsff(input: $input) {
      id
    }
  }
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
    kilos: yup.number().required(),
    postalCode: yup.string().required(),
    detenteur: detenteurSchema,
    operateur: operateurSchema,
  }
);

interface AddFicheInterventionModalProps {
  initialOperateurCompany: BsffFicheInterventionInput["operateur"]["company"];
  onClose: () => void;
}

function AddFicheInterventionModal({
  initialOperateurCompany,
  onClose,
}: AddFicheInterventionModalProps) {
  const [createFicheIntervention, { loading, error }] = useMutation<
    Mutation["createFicheInterventionBsff"],
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
          kilos: 0,
          numero: "",
          detenteur: {
            company: getInitialCompany(),
          },
          operateur: {
            company: initialOperateurCompany,
          },
          postalCode: "",
        }}
        onSubmit={values =>
          createFicheIntervention({
            variables: {
              input: values,
            },
          })
        }
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
                name="kilos"
              />
              <RedErrorMessage name="kilos" />
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
  initialOperateurCompany: BsffFicheInterventionInput["operateur"]["company"];
}

export function FicheInterventionList({
  initialOperateurCompany,
}: FicheInterventionListProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <h4 className="form__section-heading">Fiche(s) d'intervention</h4>
      <button
        type="button"
        className="btn btn--outline-primary"
        onClick={() => setIsModalOpen(true)}
      >
        Ajouter une fiche d'intervention
      </button>
      {isModalOpen && (
        <AddFicheInterventionModal
          initialOperateurCompany={initialOperateurCompany}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
