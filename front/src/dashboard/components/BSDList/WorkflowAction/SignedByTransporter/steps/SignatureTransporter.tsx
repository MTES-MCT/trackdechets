import * as React from "react";
import { Field } from "formik";
import { Form } from "generated/graphql/types";
import { FORMS_PDF } from "dashboard/components/BSDDActions/useDownloadPdf";
import Packagings from "form/packagings/Packagings";
import NumberInput from "form/custom-inputs/NumberInput";
import { RedErrorMessage, DownloadFileLink, Label } from "common/components";
import { NextButton } from "common/components/Buttons";
import { IconPdf } from "common/components/Icons";
import { CollectAddress } from "./CollectAddress";

interface SignatureTransporterProps {
  form: Form;
  onCancel: () => void;
  onNext: () => void;
}

export function SignatureTransporter({
  form,
  onCancel,
  onNext,
}: SignatureTransporterProps) {
  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onNext();
      }}
    >
      <div className="notification success">
        Cet écran est à signer par le <strong>transporteur</strong>
      </div>

      <div className="form__row">
        <strong>Bordereau</strong>
        <span> {form.readableId}</span>
      </div>
      <div className="form__row">
        <strong id="collect-address-trs">Lieu de collecte</strong>
        <address aria-labelledby="collect-address-trs">
          <CollectAddress form={form} />
        </address>
      </div>
      <div className="form__row">
        <h3 className="h4 tw-font-bold">Déchets à collecter</h3>
      </div>
      <div className="form__row">
        <strong>Appellation du déchet :</strong>
        {form.wasteDetails?.name}
      </div>

      <div className="form__row">
        <Label htmlFor="id_packagings">Conditionnement</Label>
        <Field
          name="packagingInfos"
          component={Packagings}
          id="id_packagings"
        />
      </div>

      <div className="form__row">
        <Label htmlFor="id_quantity">Poids en tonnes</Label>
        <Field
          component={NumberInput}
          name="quantity"
          id="id_quantity"
          className="field__block td-input"
          min="0"
          step="0.001"
          style={{ width: "100px" }}
        />
      </div>

      <div className="form__row">
        <Label htmlFor="id_onuCode">Code ADR (ONU)</Label>
        <Field
          type="text"
          name="onuCode"
          id="id_onuCode"
          className="field__onu-code field__block td-input"
        />
        <span>
          Champ à renseigner selon le déchet transporté, sous votre
          responsabilité
        </span>
      </div>
      <div className="form__row">
        <strong id="destination-address">Destination du déchet :</strong>
        <address aria-labelledby="destination-address">
          {form.stateSummary?.recipient?.name} (
          {form.stateSummary?.recipient?.siret})
          <br /> {form.stateSummary?.recipient?.address}
        </address>
      </div>
      <div className="form__row">
        <Label htmlFor="id_signedByTransporter">
          <Field
            type="checkbox"
            className="td-checkbox"
            name="signedByTransporter"
            id="id_signedByTransporter"
            required
          />
          J'ai vérifié que les déchets à transporter correspondent aux
          informations ci avant.
        </Label>

        <RedErrorMessage name="signedByTransporter" />
      </div>
      <p>
        <DownloadFileLink
          query={FORMS_PDF}
          params={{ id: form.id }}
          className="tw-mt-4 link"
        >
          <span style={{ display: "inline-block", verticalAlign: "middle" }}>
            <IconPdf color="currentColor" />
          </span>
          <span className="tw-ml-2">Version CERFA du bordereau</span>
        </DownloadFileLink>
      </p>
      <div className="form__actions mb-2">
        <button
          type="button"
          className="btn btn--outline-primary"
          onClick={() => onCancel()}
        >
          Annuler
        </button>
        <NextButton caption="Signer par le transporteur" onClick={() => null} />
      </div>
    </form>
  );
}
