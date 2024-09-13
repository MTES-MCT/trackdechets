import * as React from "react";
import { useMutation } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  BsdType,
  Bsff,
  BsffSignatureType,
  BsffTransporterTransportInput,
  Mutation,
  MutationSignBsffArgs,
  MutationUpdateBsffTransporterArgs,
  SignatureInput,
  TransportMode
} from "@td/codegen-ui";
import { RedErrorMessage } from "../../../../../common/components";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import { SIGN_BSFF } from "../../../../../Apps/common/queries/bsff/queries";
import { SignBsff } from "./SignBsff";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import TransporterRecepisseWrapper from "../../../../../form/common/components/company/TransporterRecepisseWrapper";
import { subMonths } from "date-fns";
import { UPDATE_BSFF_TRANSPORTER } from "../../../../../Apps/Forms/Components/query";
import TransportPlates from "../../../../../Apps/Forms/Components/TransportPlates/TransportPlates";
import Select from "@codegouvfr/react-dsfr/Select";
import { transportModeLabels } from "../../../../constants";

const validationSchema = yup.object({
  transport: yup.object({
    takenOverAt: yup.date().required("La date de prise en charge est requise")
  }),
  signature: yup.object({
    date: yup.date().required("La date est requise"),
    author: yup
      .string()
      .ensure()
      .min(1, "Le nom et prénom de l'auteur de la signature est requis")
  })
});

interface SignTransportFormProps {
  bsff: Bsff;
  onClose: () => void;
}

type FormikValues = {
  transport: BsffTransporterTransportInput;
  signature: SignatureInput;
};

function SignTransportForm({
  bsff,
  onClose
}: Readonly<SignTransportFormProps>) {
  const [updateBsffTransporter, updateBsffTransporterResult] = useMutation<
    Pick<Mutation, "updateBsffTransporter">,
    MutationUpdateBsffTransporterArgs
  >(UPDATE_BSFF_TRANSPORTER);

  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  const TODAY = new Date();

  const signingTransporter = bsff.transporters?.find(
    t => !t.transport?.signature?.date
  );

  const loading = React.useMemo(
    () => updateBsffTransporterResult.loading || signBsffResult.loading,
    [updateBsffTransporterResult, signBsffResult]
  );

  if (!signingTransporter) {
    return <div>Tous les transporteurs ont déjà signé</div>;
  }

  return (
    <Formik<FormikValues>
      initialValues={{
        transport: {
          mode: signingTransporter.transport?.mode ?? TransportMode.Road,
          plates: signingTransporter.transport?.plates ?? [],
          takenOverAt:
            signingTransporter.transport?.takenOverAt ??
            new Date().toISOString()
        },
        signature: {
          author: "",
          date: TODAY.toISOString()
        }
      }}
      validationSchema={validationSchema}
      onSubmit={async values => {
        const { transport, signature } = values;

        await updateBsffTransporter({
          variables: {
            id: signingTransporter.id,
            input: { transport: transport }
          }
        });

        await signBsff({
          variables: {
            id: bsff.id,
            input: {
              type: BsffSignatureType.Transport,
              author: signature.author,
              date: signature.date
            }
          }
        });
        onClose();
      }}
    >
      {({ values }) => (
        <Form>
          <p>
            En qualité de <strong>transporteur du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant ce document,
            je déclare prendre en charge le déchet.
          </p>
          <TransporterRecepisseWrapper transporter={signingTransporter} />

          <div className="form__row">
            <div className={"fr-mb-2w"} style={{ width: "300px" }}>
              <Field name={"transport.mode"}>
                {({ field }) => (
                  <Select label="Mode de transport" nativeSelectProps={field}>
                    <option value="ROAD">
                      {transportModeLabels[TransportMode.Road]}
                    </option>
                    <option value="AIR">
                      {transportModeLabels[TransportMode.Air]}
                    </option>
                    <option value="RAIL">
                      {transportModeLabels[TransportMode.Rail]}
                    </option>
                    <option value="RIVER">
                      {transportModeLabels[TransportMode.River]}
                    </option>
                    <option value="SEA">
                      {transportModeLabels[TransportMode.Sea]}
                    </option>
                  </Select>
                )}
              </Field>
            </div>
            <RedErrorMessage name="transport.takenOverAt" />
          </div>

          {(!values.transport?.mode ||
            values.transport?.mode === TransportMode.Road) && (
            <div style={{ width: "300px" }}>
              <TransportPlates
                bsdType={BsdType.Bsff}
                fieldName={"transport.plates"}
              />
            </div>
          )}

          <div className="form__row">
            <label>
              Date de prise en charge
              <div className="td-date-wrapper">
                <Field
                  name="transport.takenOverAt"
                  component={DateInput}
                  className="td-input"
                  minDate={subMonths(TODAY, 2)}
                  maxDate={TODAY}
                  required
                />
              </div>
            </label>
            <RedErrorMessage name="transport.takenOverAt" />
          </div>

          <div className="form__row">
            <label>
              NOM et prénom du signataire
              <Field
                className="td-input"
                name="signature.author"
                placeholder="NOM Prénom"
              />
            </label>
            <RedErrorMessage name="signature.author" />
          </div>

          {updateBsffTransporterResult.error && (
            <NotificationError
              apolloError={updateBsffTransporterResult.error}
            />
          )}

          {signBsffResult.error && (
            <NotificationError apolloError={signBsffResult.error} />
          )}

          <div className="td-modal-actions">
            <button
              type="button"
              className="btn btn--outline-primary"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={signBsffResult.loading}
            >
              <span>
                {loading ? "Signature en cours..." : "Signer l'enlèvement"}
              </span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

interface SignTransportProps {
  bsffId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
}

export function SignTransport({
  bsffId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: SignTransportProps) {
  return (
    <SignBsff
      title="Signer l'enlèvement"
      bsffId={bsffId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsff, onClose }) => (
        <SignTransportForm bsff={bsff} onClose={onClose} />
      )}
    </SignBsff>
  );
}
