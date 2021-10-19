import React from "react";
import { RedErrorMessage } from "common/components";
import {
  Mutation,
  Query,
  MutationSignBsdasriArgs,
  QueryBsdasriArgs,
  BsdasriSignatureType,
  MutationUpdateBsdasriArgs,
} from "generated/graphql/types";
import { NotificationError, InlineError } from "common/components/Error";
import {
  ExtraSignatureType,
  SignatureType,
} from "dashboard/components/BSDList/BSDasri/types";
import Loader from "common/components/Loaders";
import { useQuery, useMutation } from "@apollo/client";
import routes from "common/routes";
import { useParams, useHistory, generatePath } from "react-router-dom";
import { GET_DETAIL_DASRI_WITH_METADATA } from "common/queries";

import EmptyDetail from "dashboard/detail/common/EmptyDetailView";
import { Formik, Field, Form } from "formik";
import { SIGN_BSDASRI, UPDATE_BSDASRI } from "form/bsdasri/utils/queries";

import { getComputedState } from "form/common/stepper/GenericStepList";
import getInitialState from "form/bsdasri/utils/initial-state";
import { signatureValidationSchema, prefillWasteDetails } from "./utils";
import {
  ProducerSignatureForm,
  TransportSignatureForm,
  ReceptionSignatureForm,
  OperationSignatureForm,
  removeSections,
} from "./PartialForms";

import { BdasriSummary } from "dashboard/components/BSDList/BSDasri/Summary/BsdasriSummary";

const forms = {
  [BsdasriSignatureType.Emission]: ProducerSignatureForm,

  [BsdasriSignatureType.Transport]: TransportSignatureForm,
  [ExtraSignatureType.DirectTakeover]: TransportSignatureForm,

  [BsdasriSignatureType.Reception]: ReceptionSignatureForm,
  [BsdasriSignatureType.Operation]: OperationSignatureForm,
};

const UpdateForm = ({ signatureType }) => {
  return <div>{forms[signatureType]()}</div>;
};

const settings: {
  [id: string]: {
    label: string;
    signatureType: BsdasriSignatureType;
    validationText: string;
  };
} = {
  [BsdasriSignatureType.Emission]: {
    label: "Signature producteur",
    signatureType: BsdasriSignatureType.Emission,
    validationText:
      "En signant, je confirme la remise du déchet au transporteur. La signature est horodatée.",
  },

  [BsdasriSignatureType.Transport]: {
    label: "Signature transporteur",
    signatureType: BsdasriSignatureType.Transport,
    validationText:
      "En signant, je confirme l'emport du déchet. La signature est horodatée.",
  },
  [ExtraSignatureType.DirectTakeover]: {
    label: "Emport direct transporteur",
    signatureType: BsdasriSignatureType.Transport,
    validationText: `L'émetteur de bordereau a autorisé son emport direct, en tant que
    transporteur vous pouvez donc emporter le déchet concerné.
    En signant, je confirme l'emport du déchet. La signature est horodatée.`,
  },
  [BsdasriSignatureType.Reception]: {
    label: "Signature reception",
    signatureType: BsdasriSignatureType.Reception,
    validationText:
      "En signant, je confirme la réception des déchets pour la quantité indiquée dans ce bordereau. La signature est horodatée.",
  },

  [BsdasriSignatureType.Operation]: {
    label: "Signature traitement",
    signatureType: BsdasriSignatureType.Operation,
    validationText:
      "En signant, je confirme le traitement des déchets pour la quantité indiquée dans ce bordereau. La signature est horodatée.",
  },
};

export function RouteSignBsdasri({
  UIsignatureType,
}: {
  UIsignatureType: SignatureType;
}) {
  const { id: formId, siret } = useParams<{ id: string; siret: string }>();
  const history = useHistory();
  const { error, data, loading } = useQuery<
    Pick<Query, "bsdasri">,
    QueryBsdasriArgs
  >(GET_DETAIL_DASRI_WITH_METADATA, {
    variables: {
      id: formId,
    },

    fetchPolicy: "network-only",
  });
  const [updateBsdasri, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsdasri">,
    MutationUpdateBsdasriArgs
  >(UPDATE_BSDASRI);
  const [signBsdasri, { error: signError }] = useMutation<
    Pick<Mutation, "signBsdasri">,
    MutationSignBsdasriArgs
  >(SIGN_BSDASRI);
  if (error) {
    return <InlineError apolloError={error} />;
  }
  if (loading) {
    return <Loader />;
  }
  if (data == null) {
    return <EmptyDetail />;
  }
  const { bsdasri } = data;

  const config = settings[UIsignatureType];

  const actionTab = {
    pathname: generatePath(routes.dashboard.bsds.act, {
      siret,
    }),
  };

  const formState = prefillWasteDetails(
    getComputedState(getInitialState(), bsdasri)
  );

  return (
    <div>
      <h2 className="td-modal-title">{config.label}</h2>
      <BdasriSummary bsdasri={bsdasri} />
      <Formik
        initialValues={{
          ...formState,
          signature: { author: "" },
        }}
        validationSchema={() => signatureValidationSchema(bsdasri)}
        onSubmit={async values => {
          const { id, signature, ...rest } = values;
          await updateBsdasri({
            variables: {
              id: id,
              input: {
                ...removeSections(rest, UIsignatureType),
              },
            },
          });

          await signBsdasri({
            variables: {
              id: bsdasri.id,
              input: { ...signature, type: config.signatureType },
            },
          });
          history.push(actionTab);
        }}
      >
        {({ isSubmitting, handleReset, errors }) => {
          return (
            <Form>
              <div className="notification success">
                {config.validationText}
              </div>

              <UpdateForm signatureType={UIsignatureType} />
              <div className="form__row">
                <label>
                  Nom du signataire
                  <Field
                    type="text"
                    name="signature.author"
                    placeholder="NOM Prénom"
                    className="td-input"
                  />
                </label>
                <RedErrorMessage name="signature.author" />
              </div>

              <div className="form__actions">
                <button
                  type="button"
                  className="btn btn--outline-primary"
                  onClick={() => {
                    handleReset();
                    history.push(actionTab);
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
          );
        }}
      </Formik>
      {(updateError || signError) && (
        <>
          <p className="tw-mt-2 tw-text-red-700">
            Vous devez mettre à jour le bordereau et renseigner les champs
            nécessaires avant de le signer.
          </p>
          {updateError && (
            <NotificationError
              className="action-error"
              apolloError={updateError}
            />
          )}
          {signError && (
            <NotificationError
              className="action-error"
              apolloError={signError}
            />
          )}
        </>
      )}
    </div>
  );
}
