import React from "react";
import { RedErrorMessage, ActionButton } from "common/components";
import * as yup from "yup";
import Loader from "common/components/Loaders";
import * as queryString from "query-string";
import { Formik, Field, Form } from "formik";
import {
  Mutation,
  Query,
  Bsdasri,
  MutationSignBsdasriArgs,
  QueryBsdasriArgs,
  BsdasriSignatureType,
  BsdasriStatus,
} from "generated/graphql/types";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Link, generatePath } from "react-router-dom";
import routes from "common/routes";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";

import { IconCheckCircle1 } from "common/components/Icons";

import { NotificationError } from "common/components/Error";
import { GET_DASRI_METADATA } from "common/queries";
const SIGN_BSDASRI = gql`
  mutation SignBsdasri($id: ID!, $input: BsdasriSignatureInput!) {
    signBsdasri(id: $id, input: $input) {
      id
      status
    }
  }
`;

const validationSchema = (form: Bsdasri) =>
  yup.object({
    author: yup.string().nullable().required("Le nom du signataire est requis"),
  });

const settings: {
  [id: string]: {
    label: string;
    signatureType: BsdasriSignatureType;
    validationText: string;
  };
} = {
  [BsdasriStatus.Initial]: {
    label: "Signature producteur",
    signatureType: BsdasriSignatureType.Emission,
    validationText:
      "En signant, je confirme la remise du déchet au transporteur. La signature est horodatée.",
  },

  [BsdasriStatus.SignedByProducer]: {
    label: "Signature transporteur",
    signatureType: BsdasriSignatureType.Transport,
    validationText:
      "En signant, je confirme l'emport du déchet. La signature est horodatée.",
  },
  [BsdasriStatus.Sent]: {
    label: "Signature reception",
    signatureType: BsdasriSignatureType.Reception,
    validationText:
      "En signant, je confirme la réception des déchets pour la quantité indiquée dans ce bordereau. La signature est horodatée.",
  },

  [BsdasriStatus.Received]: {
    label: "Signature traitement",
    signatureType: BsdasriSignatureType.Operation,
    validationText:
      "En signant, je confirme le traitement des déchets pour la quantité indiquée dans ce bordereau. La signature est horodatée.",
  },
};

export default function SignBsdasri({
  form,
  siret,
  signatureType,
}: WorkflowActionProps & { signatureType: BsdasriSignatureType }) {
  const config = settings[form["bsdasriStatus"]];

  return (
    <TdModalTrigger
      ariaLabel={config.label}
      trigger={open => (
        <ActionButton icon={<IconCheckCircle1 size="24px" />} onClick={open}>
          {config.label}
        </ActionButton>
      )}
      modalContent={close => {
        return (
          <SignModalBsdasri
            form={form}
            signatureType={signatureType}
            close={close}
            siret={siret}
          />
        );
      }}
    />
  );
}

const UpdateLink = ({
  siret,
  formId,
  stepName = null,
}: {
  siret: string;
  formId: string;
  stepName: string | null;
}) => {
  const baseUrl = generatePath(routes.dashboard.bsdasris.edit, {
    siret,
    id: formId,
  });
  const url = !!stepName
    ? `${baseUrl}?${queryString.stringify({ step: stepName })}`
    : baseUrl;
  return (
    <Link to={url} className="btn btn--primary">
      Mettre le bordereau à jour pour le signer
    </Link>
  );
};

function SignModalBsdasri({
  form,
  signatureType,
  siret,
  close,
}: {
  form: Bsdasri;
  siret: string;
  signatureType: BsdasriSignatureType;
  close: () => void;
}) {
  const config = settings[form["bsdasriStatus"]];

  const [signBsdasri, { error }] = useMutation<
    Pick<Mutation, "signBsdasri">,
    MutationSignBsdasriArgs
  >(SIGN_BSDASRI);
  const { data, loading } = useQuery<Pick<Query, "bsdasri">, QueryBsdasriArgs>(
    GET_DASRI_METADATA,
    {
      variables: {
        id: form.id,
      },

      fetchPolicy: "network-only",
    }
  );
  if (loading) {
    return <Loader />;
  }
  const needUpdateBeforeSigningMessages =
    data?.bsdasri?.metadata?.errors
      .filter(err => err?.requiredFor.includes(signatureType))
      .map(err => err?.message) || [];

  return (
    <div>
      {!!needUpdateBeforeSigningMessages.length ? (
        <>
          <h3 className="tw-font-bold">
            Avant de signer, vous devez mettre à jour le bordereau
          </h3>
          <ul className="tw-mb-2">
            {needUpdateBeforeSigningMessages.map((message, idx) => (
              <li key={idx}>{message}</li>
            ))}
          </ul>
          <UpdateLink
            siret={siret}
            formId={form.id}
            stepName={signatureType.toLowerCase()}
          />
        </>
      ) : (
        <Formik
          initialValues={{
            author: "",
          }}
          validationSchema={() => validationSchema(form)}
          onSubmit={values => {
            signBsdasri({
              variables: {
                id: form.id,
                input: { ...values, type: signatureType },
              },
            });
            close();
          }}
        >
          {({ isSubmitting, handleReset }) => (
            <Form>
              <div>{config.validationText}</div>
              <div className="form__row">
                <label>
                  Nom du signataire
                  <Field
                    type="text"
                    name="author"
                    placeholder="NOM Prénom"
                    className="td-input"
                  />
                </label>
                <RedErrorMessage name="author" />
              </div>

              <div className="form__actions">
                <button
                  type="button"
                  className="btn btn--outline-primary"
                  onClick={() => {
                    handleReset();
                    close();
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isSubmitting}
                >
                  Signer
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}
      {error && (
        <>
          <p className="tw-mt-2 tw-text-red-700">
            Vous devez mettre à jour le bordereau et renseigner les champs
            nécessaires avant de le signer.
          </p>
          <NotificationError className="action-error" apolloError={error} />
        </>
      )}
    </div>
  );
}
