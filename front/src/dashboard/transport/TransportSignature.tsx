import { useMutation } from "@apollo/react-hooks";
import { Field } from "formik";
import gql from "graphql-tag";
import { DateTime } from "luxon";
import React, { useState, useContext } from "react";
import { FaFileSignature } from "react-icons/fa";
import DownloadFileLink from "../../common/DownloadFileLink";
import { NotificationError } from "../../common/Error";
import { updateApolloCache } from "../../common/helper";
import RedErrorMessage from "../../common/RedErrorMessage";
import {
  Form,
  Mutation,
  MutationSignedByTransporterArgs,
  FormStatus,
} from "../../generated/graphql/types";
import Packagings from "../../form/packagings/Packagings";
import { FORMS_PDF } from "../slips/slips-actions/DownloadPdf";
import { GET_TRANSPORT_SLIPS, GET_FORM } from "./Transport";
import "./TransportSignature.scss";
import { Wizard } from "./Wizard";
import { SiretContext } from "../Dashboard";
import cogoToast from "cogo-toast";
import { FaFilePdf } from "react-icons/fa";
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

type Props = { form: Form; userSiret: string };

export default function TransportSignature({ form, userSiret }: Props) {
  const { siret } = useContext(SiretContext);
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
          roles: ["TRANSPORTER"],
          status: ["SEALED", "SENT", "RESEALED", "RESENT"],
        },
        getNewData: data => ({
          forms: data.forms,
        }),
      });
    },
  });

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
      <button
        className="link icon"
        onClick={() => setIsOpen(true)}
        title="Signer ce bordereau"
      >
        <FaFileSignature />
      </button>
      {isOpen && (
        <div
          className="modal__backdrop"
          id="modal"
          style={{
            display: "flex",
          }}
        >
          <div className="modal">
            <h2>Signature</h2>

            <Wizard
              initialValues={{
                sentAt: DateTime.local().toISODate(),
                sentBy: "",
                securityCode: "",
                signedByTransporter: false,
                signedByProducer: false,
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
                      Cet écran est à signer par le{" "}
                      <strong>transporteur</strong>
                    </div>
                    <h3 id="collect-address">Lieu de collecte</h3>
                    <address
                      aria-labelledby="collect-address"
                      className="address"
                    >
                      {form.stateSummary?.emitter?.name} (
                      {form.stateSummary?.emitter?.siret}
                      )
                      <br /> {form.stateSummary?.emitter?.address}
                    </address>

                    <h3>Déchets à collecter</h3>
                    <p>
                      <span className="waste-label">Bordereau numéro :</span>
                      {form.readableId}
                    </p>
                    <p>
                      <span className="waste-label">
                        Appellation du déchet :
                      </span>
                      {form.wasteDetails?.name} ({form.wasteDetails?.code})
                    </p>

                    <div>
                      <label>
                        Conditionnement
                        <Field name="packagings" component={Packagings} />
                      </label>
                    </div>

                    <p>
                      <label>
                        Poids en tonnes
                        <Field
                          type="number"
                          name="quantity"
                          className="field__weight field__block"
                        />
                      </label>
                    </p>

                    <p>
                      <label>
                        Code ADR (ONU) - Champ à renseigner selon le déchet
                        transporté, sous votre responsabilité
                        <Field
                          type="text"
                          name="onuCode"
                          className="field__onu-code field__block"
                        />
                      </label>
                    </p>

                    <h3 id="destination-address">Destination du déchet</h3>
                    <address
                      aria-labelledby="destination-address"
                      className="address"
                    >
                      {form.stateSummary?.recipient?.name} (
                      {form.stateSummary?.recipient?.siret})
                      <br /> {form.stateSummary?.recipient?.address}
                    </address>

                    <h3>Signature</h3>

                    <p>
                      <label>
                        <Field
                          type="checkbox"
                          name="signedByTransporter"
                          required
                        />
                        J'ai vérifié que les déchets à transporter correspondent
                        aux informations ci avant.
                      </label>
                    </p>
                    <RedErrorMessage name="signedByTransporter" />

                    <p>
                      <small>
                        <DownloadFileLink
                          query={FORMS_PDF}
                          params={{ id: form.id }}
                        >
                          {" "}
                          <FaFilePdf />
                          CERFA du bordereau
                        </DownloadFileLink>
                      </small>
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
                {(props: any) => (
                  <>
                    <div>
                      <div className="notification success">
                        Cet écran est à lire et signer par le{" "}
                        <strong>
                          {isEmittedByProducer ? "producteur" : "détenteur"} du
                          déchet
                        </strong>
                      </div>

                      <h3 id="collect-address">Lieu de collecte</h3>
                      <address
                        aria-labelledby="collect-address"
                        className="address"
                      >
                        {form.stateSummary?.emitter?.name} (
                        {form.stateSummary?.emitter?.siret})
                        <br /> {form.stateSummary?.emitter?.address}
                      </address>

                      <h3>Déchets</h3>
                      <p>
                        <span className="waste-label">Bordereau numéro:</span>
                        {form.readableId}
                        <br />
                        <span className="waste-label">
                          Appellation du déchet:
                        </span>
                        {form.wasteDetails?.name} ({form.wasteDetails?.code})
                        <br />{" "}
                        <span className="waste-label">Conditionnement:</span>
                        {props.packagings.join(", ")}
                        <br /> <span className="waste-label">Poids total:</span>
                        {props.quantity} tonnes
                      </p>

                      <h3 id="transporter-address">Transporteur</h3>
                      <address aria-labelledby="transporter-address">
                        {form.stateSummary?.transporter?.name} (
                        {form.stateSummary?.transporter?.siret})
                        <br /> {form.stateSummary?.transporter?.address}
                      </address>

                      <h3 id="destination-address">Destination du déchet</h3>
                      <address aria-labelledby="destination-address">
                        {form.stateSummary?.recipient?.name} (
                        {form.stateSummary?.recipient?.siret})
                        <br /> {form.stateSummary?.recipient?.address}
                      </address>

                      <p>
                        <label>
                          <Field
                            type="checkbox"
                            name="signedByProducer"
                            required
                          />
                          En tant que{" "}
                          {isEmittedByProducer ? "producteur" : "détenteur"} du
                          déchet, j'ai vérifié que les déchets confiés au
                          transporteur correspondent aux informations vues
                          ci-avant et je valide l'enlèvement.
                        </label>
                      </p>
                      <RedErrorMessage name="signedByProducer" />

                      <p>
                        <label>
                          Code de sécurité entreprise
                          <Field
                            name="securityCode"
                            type="number"
                            className="field__security-code field__block no-spinner"
                          />
                        </label>
                      </p>
                      <p>
                        <label>
                          Nom et prénom
                          <Field
                            type="text"
                            name="sentBy"
                            className="field__full-name field__block"
                          />
                        </label>
                      </p>
                      {error && <NotificationError apolloError={error} />}
                    </div>
                  </>
                )}
              </Wizard.Page>
            </Wizard>
          </div>
        </div>
      )}
    </>
  );
}
