import React from "react";
import { RedErrorMessage, Label } from "common/components";
import Packagings from "form/bsdasri/components/packagings/Packagings";
import WeightWidget from "form/bsdasri/components/Weight";
import { useParams, useHistory, generatePath } from "react-router-dom";
import { BdasriSummary } from "dashboard/components/BSDList/BSDasri/Summary/BsdasriSummary";
import Loader from "common/components/Loaders";
import { useQuery, useMutation } from "@apollo/client";
import {
  Query,
  QueryBsdasriArgs,
  Mutation,
  MutationSignBsdasriEmissionWithSecretCodeArgs,
  MutationUpdateBsdasriArgs,
  BsdasriSignatureType,
} from "generated/graphql/types";
import { getComputedState } from "form/common/stepper/GenericStepList";
import getInitialState, {
  getInitialWeightFn,
} from "form/bsdasri/utils/initial-state";

import { GET_DETAIL_DASRI } from "common/queries";
import { InlineError, NotificationError } from "common/components/Error";
import EmptyDetail from "dashboard/detail/common/EmptyDetailView";
import { Formik, Field, Form } from "formik";
import routes from "common/routes";
import { removeSections } from "./PartialForms";
import {
  SIGN_BSDASRI_EMISSION_WITH_SECRET_CODE,
  UPDATE_BSDASRI,
} from "form/bsdasri/utils/queries";
import {
  emissionSignatureSecretCodeValidationSchema,
  prefillWasteDetails,
} from "./utils";
import SignatureCodeInput from "form/common/components/custom-inputs/SignatureCodeInput";

export function RouteBSDasrisSignEmissionSecretCode() {
  const history = useHistory();
  const { id: formId, siret } = useParams<{ id: string; siret: string }>();
  const { error, data, loading } = useQuery<
    Pick<Query, "bsdasri">,
    QueryBsdasriArgs
  >(GET_DETAIL_DASRI, {
    variables: {
      id: formId,
    },

    fetchPolicy: "network-only",
  });
  const [updateBsdasri, { error: updateError }] = useMutation<
    Pick<Mutation, "updateBsdasri">,
    MutationUpdateBsdasriArgs
  >(UPDATE_BSDASRI);
  const [signBsdasriEmissionWithSecretCode, { error: signError }] = useMutation<
    Pick<Mutation, "signBsdasriEmissionWithSecretCode">,
    MutationSignBsdasriEmissionWithSecretCodeArgs
  >(SIGN_BSDASRI_EMISSION_WITH_SECRET_CODE);

  const toCollectDashboard = {
    pathname: generatePath(routes.dashboard.transport.toCollect, {
      siret,
    }),
  };
  const signTransporterRedirection = {
    pathname: generatePath(routes.dashboard.bsdasris.sign.transporter, {
      siret,
      id: formId,
    }),
    state: { background: toCollectDashboard },
  };

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

  return (
    <div>
      <h2 className="td-modal-title">Signature producteur</h2>
      <div className="notification success">
        Cet écran est à lire et signer par le{" "}
        <strong>producteur du déchet</strong> sur le terminal du transporteur
      </div>
      <BdasriSummary bsdasri={bsdasri} />
      <Formik
        initialValues={{
          ...prefillWasteDetails(getComputedState(getInitialState(), bsdasri)),
          signature: {
            author: "",
            securityCode: "",
          },
        }}
        validationSchema={emissionSignatureSecretCodeValidationSchema}
        onSubmit={async values => {
          const { id, signature, ...rest } = values;
          await updateBsdasri({
            variables: {
              id: id,
              input: {
                ...removeSections(rest, BsdasriSignatureType.Emission),
              },
            },
          });
          await signBsdasriEmissionWithSecretCode({
            variables: {
              id: data.bsdasri.id,
              input: {
                ...signature,
                securityCode: parseInt(signature.securityCode, 10),
              },
            },
          });

          history.push(signTransporterRedirection);
        }}
      >
        {({ isSubmitting, handleReset }) => {
          return (
            <Form>
              <div className="form__row">
                <Field name="emission.packagingInfos" component={Packagings} />
              </div>
              <h4 className="form__section-heading">Quantité remise</h4>
              <div className="form__row">
                <WeightWidget
                  switchLabel="Je souhaite ajouter une quantité"
                  dasriPath="emitter.emission"
                  getInitialWeightFn={getInitialWeightFn}
                />
              </div>
              <div className="form__row">
                <Label htmlFor="id_securityCode">Code de signature </Label>

                <Field
                  component={SignatureCodeInput}
                  name="signature.securityCode"
                  id="id_securityCode"
                  className="field__block td-input"
                  required
                  style={{ width: "100px" }}
                />
              </div>
              <RedErrorMessage name="signature.securityCode" />
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
                    history.push(toCollectDashboard);
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
