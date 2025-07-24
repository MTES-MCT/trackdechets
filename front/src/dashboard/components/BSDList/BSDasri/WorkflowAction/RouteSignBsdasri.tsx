import React from "react";
import { RedErrorMessage } from "../../../../../common/components";
import {
  Mutation,
  Query,
  MutationSignBsdasriArgs,
  QueryBsdasriArgs,
  BsdasriSignatureType,
  MutationUpdateBsdasriArgs,
  Bsdasri,
  TransportMode
} from "@td/codegen-ui";
import {
  NotificationError,
  InlineError
} from "../../../../../Apps/common/Components/Error/Error";
import { ExtraSignatureType, SignatureType } from "../types";
import Loader from "../../../../../Apps/common/Components/Loader/Loaders";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useNavigate, generatePath } from "react-router-dom";
import { GET_DETAIL_DASRI_WITH_METADATA } from "../../../../../Apps/common/queries";

import EmptyDetail from "../../../../detail/common/EmptyDetailView";
import { Formik, Field, Form } from "formik";
import {
  SIGN_BSDASRI,
  UPDATE_BSDASRI
} from "../../../../../Apps/common/queries/bsdasri/queries";

import { getComputedState } from "../../../../../Apps/Dashboard/Creation/getComputedState";
import getInitialState from "../../../../../form/bsdasri/utils/initial-state";
import { signatureValidationSchema, prefillWasteDetails } from "./utils";
import {
  EmitterSignatureForm,
  TransportSignatureForm,
  SynthesisTransportSignatureForm,
  ReceptionSignatureForm,
  OperationSignatureForm,
  removeBsdasriSectionsBeforeSignature
} from "./PartialForms";
import routes from "../../../../../Apps/routes";

import { BdasriSummary } from "../Summary/BsdasriSummary";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";

const forms = {
  [BsdasriSignatureType.Emission]: EmitterSignatureForm,

  [BsdasriSignatureType.Transport]: TransportSignatureForm,
  [ExtraSignatureType.DirectTakeover]: TransportSignatureForm,

  [ExtraSignatureType.SynthesisTakeOver]: SynthesisTransportSignatureForm,

  [BsdasriSignatureType.Reception]: ReceptionSignatureForm,
  [BsdasriSignatureType.Operation]: OperationSignatureForm
};

const UpdateForm = ({ signatureType }) => {
  return <div>{forms[signatureType]()}</div>;
};

const settings: {
  [id: string]: {
    getLabel: (dasri: Bsdasri, siret: string) => string;
    signatureType: BsdasriSignatureType;
    validationText: string;
  };
} = {
  [BsdasriSignatureType.Emission]: {
    getLabel: (bsdasri, siret) =>
      bsdasri.ecoOrganisme?.siret === siret
        ? "Signature Éco-organisme"
        : "Signature producteur",
    signatureType: BsdasriSignatureType.Emission,
    validationText:
      "En signant, je confirme la remise du déchet au transporteur."
  },
  [ExtraSignatureType.SynthesisTakeOver]: {
    getLabel: () => "Signature bordereau de synthèse",
    signatureType: BsdasriSignatureType.Transport,
    validationText:
      "En signant, je valide l'emport du bsd de synthèse et des bordereaux associés. Les bordereaux associés ne sont plus modifiables."
  },

  [BsdasriSignatureType.Transport]: {
    getLabel: () => "Signature transporteur",
    signatureType: BsdasriSignatureType.Transport,
    validationText: "En signant, je confirme l'emport du déchet."
  },
  [ExtraSignatureType.DirectTakeover]: {
    getLabel: () => "Emport direct transporteur",
    signatureType: BsdasriSignatureType.Transport,
    validationText: `L'émetteur de bordereau a autorisé son emport direct, en tant que
    transporteur vous pouvez donc emporter le déchet concerné.
    En signant, je confirme l'emport du déchet. La signature est horodatée.`
  },

  [BsdasriSignatureType.Reception]: {
    getLabel: () => "Signature réception",
    signatureType: BsdasriSignatureType.Reception,
    validationText:
      "En signant, je confirme la réception des déchets pour la quantité indiquée dans ce bordereau."
  },

  [BsdasriSignatureType.Operation]: {
    getLabel: () => "Signature traitement",
    signatureType: BsdasriSignatureType.Operation,
    validationText:
      "En signant, je confirme le traitement des déchets pour la quantité indiquée dans ce bordereau."
  }
};

export function RouteSignBsdasri({
  UIsignatureType
}: {
  UIsignatureType: SignatureType;
}) {
  const { id: formId, siret } = useParams<{ id: string; siret: string }>();
  const navigate = useNavigate();
  const transporterTabRoute = routes.dashboard.transport.toCollect;
  const transporterTab = {
    pathname: generatePath(transporterTabRoute, {
      siret
    })
  };

  // in most cases, goBack works, but for combined signature (pred+transporter), it leads to an infinite loop
  // so we explicitly redirect to transporter tab
  const nextPage =
    UIsignatureType === BsdasriSignatureType.Transport
      ? () => navigate(transporterTab)
      : () => navigate(-1);

  const { error, data, loading } = useQuery<
    Pick<Query, "bsdasri">,
    QueryBsdasriArgs
  >(GET_DETAIL_DASRI_WITH_METADATA, {
    variables: {
      id: formId!
    },
    fetchPolicy: "no-cache"
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

  const formState = prefillWasteDetails(
    getComputedState(getInitialState(), bsdasri)
  );

  // DASRI can be created via API with a null transport mode.
  // getComputedState() will not fix it because it doesn't override null values,
  // so fix it here manually
  if (!formState.transporter.transport.mode) {
    formState.transporter.transport.mode = TransportMode.Road;
  }

  const TODAY = new Date();

  return (
    <div>
      <h2 className="td-modal-title">{config.getLabel(bsdasri, siret!)}</h2>
      <BdasriSummary bsdasri={bsdasri} />
      <Formik
        initialValues={{
          ...formState,
          signature: { author: "", date: TODAY.toISOString() }
        }}
        validationSchema={() => signatureValidationSchema}
        onSubmit={async values => {
          const { id, signature, ...rest } = values;

          await updateBsdasri({
            variables: {
              id: id,
              input: {
                ...removeBsdasriSectionsBeforeSignature(rest, UIsignatureType)
              }
            }
          });

          await signBsdasri({
            variables: {
              id: bsdasri.id,
              input: { ...signature, type: config.signatureType }
            }
          });
          nextPage();
        }}
      >
        {({ isSubmitting, handleReset }) => {
          return (
            <Form>
              <div className="notification success">
                {config.validationText}
              </div>
              <UpdateForm signatureType={UIsignatureType} />
              <div className="form__row">
                <label>
                  Date
                  <div className="td-date-wrapper">
                    <Field
                      name="signature.date"
                      component={DateInput}
                      minDate={subMonths(TODAY, 2)}
                      maxDate={TODAY}
                      required
                      className="td-input"
                    />
                  </div>
                </label>
                <RedErrorMessage name="signature.date" />
              </div>
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
                    nextPage();
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
