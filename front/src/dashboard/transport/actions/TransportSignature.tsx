import { useMutation } from "@apollo/react-hooks";
import { Field } from "formik";
import gql from "graphql-tag";
import { DateTime } from "luxon";
import React, { useState } from "react";
import DownloadFileLink from "common/components/DownloadFileLink";
import { NotificationError } from "common/components/Error";
import { updateApolloCache } from "common/helper";
import RedErrorMessage from "common/components/RedErrorMessage";
import {
  Form,
  Mutation,
  MutationSignedByTransporterArgs,
  FormStatus,
  FormRole,
} from "generated/graphql/types";
import Packagings from "form/packagings/Packagings";
import { FORMS_PDF } from "dashboard/slips/slips-actions/DownloadPdf";
import { GET_TRANSPORT_SLIPS, GET_FORM } from "../queries";
import styles from "./TransportSignature.module.scss";
import { Wizard } from "../Wizard";
import cogoToast from "cogo-toast";
import TdModal from "common/components/Modal";
import { COLORS } from "common/config";
import { ShipmentSignSmartphoneIcon, PdfIcon } from "common/components/Icons";

import { useParams } from "react-router-dom";

import ActionButton from "common/components/ActionButton";

export const SIGNED_BY_TRANSPORTER = gql`
  mutation SignedByTransporter(
    $id: ID!
    $signingInfo: TransporterSignatureFormInput!
  ) {
    signedByTransporter(id: $id, signingInfo: $signingInfo) {
      id
      wasteDetails {
        onuCode
        packagings
        quantity
      }
      status
    }
  }
`;

type Props = { form: Form; userSiret: string; inCard?: boolean };

export default function TransportSignature({
  form,
  userSiret,
  inCard = false,
}: Props) {
  const { siret } = useParams<{ siret: string }>();

  const [isOpen, setIsOpen] = useState(false);
  const refetchQuery = {
    query: GET_FORM,
    variables: { id: form.id },
  };
  const [signedByTransporter, { error }] = useMutation<
    Pick<Mutation, "signedByTransporter">,
    MutationSignedByTransporterArgs
  >(SIGNED_BY_TRANSPORTER, {
    onCompleted: () => {
      setIsOpen(false);
      cogoToast.success("La prise en charge du bordereau est validée", {
        hideAfter: 5,
      });
    },
    refetchQueries: [refetchQuery],
    update: store => {
      updateApolloCache<{ forms: Form[] }>(store, {
        query: GET_TRANSPORT_SLIPS,
        variables: {
          siret,
          roles: [FormRole.Transporter],
          status: [
            FormStatus.Sealed,
            FormStatus.Sent,
            FormStatus.Resealed,
            FormStatus.Resent,
          ],
        },
        getNewData: data => ({
          forms: data.forms,
        }),
      });
    },
  });
  const [signatureAuthor, setSignatureAuthor] = useState<
    "EMITTER" | "ECO_ORGANISME"
  >("EMITTER");

  const isPendingTransportFromEmitter =
    form.status === "SEALED" && form.transporter?.company?.siret === userSiret;
  const isPendingTransportFromTemporaryStorage =
    form.status === "RESEALED" &&
    form.temporaryStorageDetail?.transporter?.company?.siret === userSiret;
  const isPendingTransport =
    isPendingTransportFromEmitter || isPendingTransportFromTemporaryStorage;

  if (!isPendingTransport) {
    return null;
  }

  const isEmittedByProducer =
    form.temporaryStorageDetail == null || form.status !== FormStatus.Resealed;

  return (
    <>
      {inCard ? (
        <button
          className="btn btn--primary"
          onClick={() => setIsOpen(true)}
          title="Signer ce bordereau"
        >
          <ShipmentSignSmartphoneIcon size={32} />
          <span className="tw-text-sm tw-ml-2">
            Signer <br /> l'enlèvement
          </span>
        </button>
      ) : (
        <ActionButton
          title="Signer ce bordereau"
          icon={ShipmentSignSmartphoneIcon}
          onClick={() => setIsOpen(true)}
          iconSize={32}
        />
      )}
      <TdModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ariaLabel="Signature transporteur"
      >
        <h2 className="td-modal-title">Signature</h2>

        <Wizard
          initialValues={{
            sentAt: DateTime.local().toISODate(),
            sentBy: "",
            securityCode: "",
            signedByTransporter: false,
            signedByProducer: true,
            packagings: form.stateSummary?.packagings,
            quantity: form.stateSummary?.quantity ?? "",
            onuCode: form.stateSummary?.onuCode ?? "",
          }}
          onSubmit={(values: any) =>
            signedByTransporter({
              variables: { id: form.id, signingInfo: values },
            })
          }
          onCancel={() => setIsOpen(false)}
        >
          <Wizard.Page
            title="Signature transporteur"
            nextButtonCaption="Signer par le transporteur"
          >
            {(props: any) => (
              <>
                <div className="notification success">
                  Cet écran est à signer par le <strong>transporteur</strong>
                </div>

                <div className="form__row">
                  <span className={styles.label}>Bordereau</span>
                  <span> {form.readableId}</span>
                </div>
                <div className="form__row">
                  <span id="collect-address-trs" className={styles.label}>
                    Lieu de collecte
                  </span>
                  <address
                    aria-labelledby="collect-address-trs"
                    className={styles.address}
                  >
                    {form.stateSummary?.emitter?.name} (
                    {form.stateSummary?.emitter?.siret}
                    )
                    <br /> {form.stateSummary?.emitter?.address}
                  </address>
                </div>
                <div className="form__row">
                  <h3 className="h4 tw-font-bold">Déchets à collecter</h3>
                </div>
                <div className="form__row">
                  <span className={styles.label}>Appellation du déchet :</span>
                  {form.wasteDetails?.name} ({form.wasteDetails?.code})
                </div>

                <div className="form__row">
                  <label htmlFor="id_packagings" className={styles.label}>
                    Conditionnement
                  </label>
                  <Field
                    name="packagings"
                    id="id_packagings"
                    component={Packagings}
                  />
                </div>

                <div className="form__row">
                  <label htmlFor="id_quantity" className={styles.label}>
                    Poids en tonnes
                  </label>
                  <Field
                    type="number"
                    name="quantity"
                    id="id_quantity"
                    className={`${styles.fieldWeight} field__block td-input`}
                  />
                </div>

                <div className="form__row">
                  <label htmlFor="id_onuCode" className={styles.label}>
                    Code ADR (ONU)
                  </label>
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
                  <span id="destination-address" className={styles.label}>
                    Destination du déchet
                  </span>
                  <address
                    aria-labelledby="destination-address"
                    className={styles.address}
                  >
                    {form.stateSummary?.recipient?.name} (
                    {form.stateSummary?.recipient?.siret})
                    <br /> {form.stateSummary?.recipient?.address}
                  </address>
                </div>
                <div className="form__row">
                  <label
                    htmlFor="id_signedByTransporter"
                    className="tw-font-bold tw-mt-2 "
                  >
                    <Field
                      type="checkbox"
                      className="td-checkbox"
                      name="signedByTransporter"
                      id="id_signedByTransporter"
                      required
                    />
                    J'ai vérifié que les déchets à transporter correspondent aux
                    informations ci avant.
                  </label>

                  <RedErrorMessage name="signedByTransporters" />
                </div>
                <p>
                  <DownloadFileLink
                    query={FORMS_PDF}
                    params={{ id: form.id }}
                    className={`${styles.pdf} tw-mt-4 link`}
                  >
                    <PdfIcon color={COLORS.blueLight} />
                    <span className="tw-ml-2">Version CERFA du bordereau</span>
                  </DownloadFileLink>
                </p>
              </>
            )}
          </Wizard.Page>
          <Wizard.Page
            title="Signature Producteur"
            submitButtonCaption={`Signer par le ${
              isEmittedByProducer ? "producteur" : "détenteur"
            }`}
          >
            {({ values }) => (
              <>
                <div>
                  <div className="notification success">
                    Cet écran est à lire et signer par le{" "}
                    <strong>
                      {isEmittedByProducer ? "producteur" : "détenteur"} du
                      déchet
                    </strong>
                  </div>
                  <div className="form__row">
                    <span id="collect-address" className={styles.label}>
                      Lieu de collecte
                    </span>
                    <address
                      aria-labelledby="collect-address"
                      className={styles.address}
                    >
                      {form.stateSummary?.emitter?.name} (
                      {form.stateSummary?.emitter?.siret})
                      <br /> {form.stateSummary?.emitter?.address}
                    </address>
                  </div>
                  <h3>Déchets</h3>
                  <div className="form__row">
                    <span className={styles.label}>Bordereau numéro:</span>
                    {form.readableId}
                  </div>
                  <div className="form__row">
                    <span className={styles.label}>Appellation du déchet:</span>
                    {form.wasteDetails?.name} ({form.wasteDetails?.code})
                  </div>
                  <div className="form__row">
                    <span className={styles.label}>Conditionnement:</span>
                    {values.packagings.join(", ")}
                  </div>
                  <div className="form__row">
                    <span className={styles.label}>Poids total:</span>
                    {values.quantity} tonnes
                  </div>
                  <div className="form__row">
                    <span id="transporter-address" className={styles.label}>
                      Transporteur
                    </span>
                    <address
                      aria-labelledby="transporter-address"
                      className={styles.address}
                    >
                      {form.stateSummary?.transporter?.name} (
                      {form.stateSummary?.transporter?.siret})
                      <br /> {form.stateSummary?.transporter?.address}
                    </address>
                  </div>
                  <div className="form__row">
                    <span id="destination-address" className={styles.label}>
                      Destination du déchet
                    </span>
                    <address
                      aria-labelledby="destination-address"
                      className={styles.address}
                    >
                      {form.stateSummary?.recipient?.name} (
                      {form.stateSummary?.recipient?.siret})
                      <br /> {form.stateSummary?.recipient?.address}
                    </address>
                  </div>

                  <div className="form__row">
                    <label>
                      <input
                        type="radio"
                        name="signatureAuthor"
                        onChange={() => setSignatureAuthor("EMITTER")}
                        checked={signatureAuthor === "EMITTER"}
                        className="td-radio"
                      />
                      En tant que{" "}
                      <strong>
                        {isEmittedByProducer ? "producteur" : "détenteur"}
                      </strong>{" "}
                      du déchet, j'ai vérifié que les déchets confiés au
                      transporteur correspondent aux informations vues ci-avant
                      et je valide l'enlèvement.
                    </label>
                  </div>
                  {signatureAuthor === "EMITTER" && (
                    <>
                      <div className="form__row">
                        <label
                          className={styles.label}
                          htmlFor="id_securityCode"
                        >
                          Code de sécurité entreprise
                        </label>
                        <Field
                          name="securityCode"
                          id="id_securityCode"
                          type="number"
                          className={`field__block td-input ${styles.fieldSecurityCode} ${styles.noSpinner}`}
                        />
                      </div>
                      <div className="form__row">
                        <label className={styles.label} htmlFor="id_sentBy">
                          Nom et prénom
                        </label>
                        <Field
                          type="text"
                          id="id_sentBy"
                          name="sentBy"
                          className={`field__block td-input ${styles.fieldFullName}`}
                        />
                      </div>
                    </>
                  )}

                  {form.ecoOrganisme && (
                    <>
                      <div className="form__row">
                        <label>
                          <input
                            type="radio"
                            name="signatureAuthor"
                            onChange={() => setSignatureAuthor("ECO_ORGANISME")}
                            checked={signatureAuthor === "ECO_ORGANISME"}
                            className="td-radio"
                          />
                          En tant que <strong>éco-organisme</strong> responsable
                          du déchet, j'ai vérifié que les déchets confiés au
                          transporteur correspondent aux informations vues
                          ci-avant et je valide l'enlèvement.
                        </label>
                      </div>
                      {signatureAuthor === "ECO_ORGANISME" && (
                        <>
                          <div className="form__row">
                            <label
                              className={styles.label}
                              htmlFor="id_securityCode"
                            >
                              Code de sécurité entreprise
                            </label>
                            <Field
                              name="securityCode"
                              id="id_securityCode"
                              type="number"
                              className={`field__block td-input ${styles.fieldSecurityCode} ${styles.noSpinner}`}
                            />
                          </div>
                          <div className="form__row">
                            <label className={styles.label} htmlFor="id_sentBy">
                              Nom et prénom
                            </label>
                            <Field
                              type="text"
                              id="id_sentBy"
                              name="sentBy"
                              className={`field__block td-input ${styles.fieldFullName}`}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {error && <NotificationError apolloError={error} />}
                </div>
              </>
            )}
          </Wizard.Page>
        </Wizard>
      </TdModal>
    </>
  );
}
