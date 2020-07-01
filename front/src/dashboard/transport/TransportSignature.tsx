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
import { GET_TRANSPORT_SLIPS } from "./Transport";
import "./TransportSignature.scss";
import { Wizard } from "./Wizard";
import { SiretContext } from "../Dashboard";
import cogoToast from "cogo-toast";

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
    refetchQueries: [],
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
              <Wizard.Page title="Signature transporteur">
                {(props: any) => (
                  <>
                    <div className="notification success">
                      Cet écran est à lire et signer par le{" "}
                      <strong>transporteur</strong>
                    </div>
                    <h3 id="collect-address">Lieu de collecte</h3>
                    <address aria-labelledby="collect-address">
                      {form.stateSummary?.emitter?.name} (
                      {form.stateSummary?.emitter?.siret}
                      )
                      <br /> {form.stateSummary?.emitter?.address}
                    </address>

                    <h3>Déchets à collecter</h3>
                    <p>Bordereau numéro {form.readableId}</p>
                    <p>
                      Appellation du déchet: {form.wasteDetails?.name} (
                      {form.wasteDetails?.code})
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
                        <Field type="number" name="quantity" />
                      </label>
                    </p>

                    <p>
                      <label>
                        Code ADR (ONU) - Champ à renseigner selon le déchet
                        transporté, sous votre responsabilité
                        <Field type="text" name="onuCode" />
                      </label>
                    </p>

                    <h3 id="destination-address">Destination du déchet</h3>
                    <address aria-labelledby="destination-address">
                      {form.stateSummary?.recipient?.name} (
                      {form.stateSummary?.recipient?.siret})
                      <br /> {form.stateSummary?.recipient?.address}
                    </address>

                    <h3>Validation</h3>

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
                        Si vous le désirez, vous pouvez accéder à{" "}
                        <DownloadFileLink
                          query={FORMS_PDF}
                          params={{ id: form.id }}
                        >
                          une vue CERFA du bordereau
                        </DownloadFileLink>
                      </small>
                    </p>
                  </>
                )}
              </Wizard.Page>
              <Wizard.Page
                title={`Signature ${
                  isEmittedByProducer ? "Producteur" : "Détenteur"
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
                      <address aria-labelledby="collect-address">
                        {form.stateSummary?.emitter?.name} (
                        {form.stateSummary?.emitter?.siret})
                        <br /> {form.stateSummary?.emitter?.address}
                      </address>

                      <h3>Mes déchets</h3>
                      <p>
                        Bordereau numéro {form.readableId}
                        <br />
                        Appellation du déchet: {form.wasteDetails?.name} (
                        {form.wasteDetails?.code})
                        <br />
                        Conditionnement: {props.packagings.join(", ")}
                        <br />
                        Poids total: {props.quantity} tonnes
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
                            className="no-spinner"
                          />
                        </label>
                      </p>
                      <p>
                        <label>
                          Nom et prénom
                          <Field type="text" name="sentBy" />
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
