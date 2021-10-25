import * as React from "react";
import { ApolloError } from "@apollo/client";
import { Field, useFormikContext } from "formik";
import {
  Form,
  FormStatus,
  SignatureAuthor,
  TransporterSignatureFormInput,
} from "generated/graphql/types";
import { Label, RedErrorMessage } from "common/components";
import { NotificationError } from "common/components/Error";
import { PreviousButton } from "common/components/Buttons";
import { CollectAddress } from "./CollectAddress";
import SignatureCodeInput from "form/common/components/custom-inputs/SignatureCodeInput";

interface SignatureEmitterProps {
  form: Form;
  onCancel: () => void;
  onPrevious: () => void;
  onNext: () => void;
  error?: ApolloError;
  isSubmitting: boolean;
}

export function SignatureEmitter({
  form,
  onCancel,
  onPrevious,
  onNext,
  error,
  isSubmitting,
}: SignatureEmitterProps) {
  const { values } = useFormikContext<TransporterSignatureFormInput>();

  const isEmittedByProducer =
    form.temporaryStorageDetail == null || form.status !== FormStatus.Resealed;
  const emitterAlias = isEmittedByProducer ? "producteur" : "détenteur";

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onNext();
      }}
    >
      <div className="notification success">
        Cet écran est à lire et signer par le{" "}
        <strong>{emitterAlias} du déchet</strong>
      </div>
      <div className="form__row">
        <strong id="collect-address">Lieu de collecte</strong>
        <address aria-labelledby="collect-address">
          <CollectAddress form={form} />
        </address>
      </div>
      <h3>Déchets</h3>
      <div className="form__row">
        <strong>Bordereau numéro :</strong>
        {form.readableId}
      </div>
      <div className="form__row">
        <strong>Appellation du déchet :</strong>
        {form.wasteDetails?.name}
      </div>
      <div className="form__row">
        <strong>Conditionnement :</strong>
        {values.packagingInfos?.map(p => `${p.quantity} ${p.type}`).join(", ")}
      </div>
      <div className="form__row">
        <strong>Poids total :</strong>
        {values.quantity} tonnes
      </div>
      <div className="form__row">
        <strong id="transporter-address">Transporteur :</strong>
        <address aria-labelledby="transporter-address">
          {form.stateSummary?.transporter?.name} (
          {form.stateSummary?.transporter?.siret})
          <br /> {form.stateSummary?.transporter?.address}
        </address>
      </div>
      <div className="form__row">
        <strong id="destination-address">Destination du déchet :</strong>
        <address aria-labelledby="destination-address">
          {form.stateSummary?.recipient?.name} (
          {form.stateSummary?.recipient?.siret})
          <br /> {form.stateSummary?.recipient?.address}
        </address>
      </div>
      {form.ecoOrganisme ? (
        <>
          <div className="form__row">
            <label>
              <Field
                type="radio"
                name="signatureAuthor"
                value={SignatureAuthor.Emitter}
                className="td-radio"
              />
              En tant que <strong>{emitterAlias}</strong> du déchet,
            </label>
          </div>
          <div className="form__row">
            <label>
              <Field
                type="radio"
                name="signatureAuthor"
                value={SignatureAuthor.EcoOrganisme}
                className="td-radio"
              />
              En tant que <strong>éco-organisme</strong> en charge du déchet,
            </label>
          </div>

          <div className="form__row">
            <Label htmlFor="id_signedByProducer">
              <Field
                type="checkbox"
                className="td-checkbox"
                name="signedByProducer"
                id="id_signedByProducer"
                required
              />
              J'ai vérifié que les déchets confiés au transporteur correspondent
              aux informations vues ci-avant et je valide l'enlèvement.
            </Label>

            <RedErrorMessage name="signedByTransporter" />
          </div>
        </>
      ) : (
        <div className="form__row">
          <Label htmlFor="id_signedByProducer">
            <Field
              type="checkbox"
              className="td-checkbox"
              name="signedByProducer"
              id="id_signedByProducer"
              required
            />
            En tant que <strong>{emitterAlias}</strong> du déchet, j'ai vérifié
            que les déchets confiés au transporteur correspondent aux
            informations vues ci-avant et je valide l'enlèvement.
          </Label>

          <RedErrorMessage name="signedByTransporter" />
        </div>
      )}

      <div className="form__row">
        <Label htmlFor="id_securityCode">
          Code de signature{" "}
          {values.signatureAuthor === SignatureAuthor.Emitter
            ? `du ${emitterAlias}`
            : "de l'éco-organisme"}
        </Label>
        <Field
          component={SignatureCodeInput}
          name="securityCode"
          id="id_securityCode"
          className="field__block td-input"
          required
          style={{ width: "100px" }}
        />
      </div>
      <RedErrorMessage name="securityCode" />
      <div className="form__row">
        <Label htmlFor="id_sentBy">Nom et prénom</Label>
        <Field
          type="text"
          id="id_sentBy"
          name="sentBy"
          className="field__block td-input"
          style={{ width: "350px" }}
        />
      </div>
      <RedErrorMessage name="sentBy" />
      {error && <NotificationError apolloError={error} />}
      <div className="form__actions mb-2">
        <PreviousButton onClick={onPrevious} />
        <button
          type="button"
          className="btn btn--outline-primary"
          onClick={onCancel}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Signature en cours..."
            : `Signer ${
                values.signatureAuthor === SignatureAuthor.Emitter
                  ? `par le ${emitterAlias}`
                  : "pour l'éco-organisme"
              }`}
        </button>
      </div>
    </form>
  );
}
