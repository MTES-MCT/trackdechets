import { useMutation } from "@apollo/react-hooks";
import { Field } from "formik";
import gql from "graphql-tag";
import { DateTime } from "luxon";
import React, { useState } from "react";
import { FaFileSignature } from "react-icons/fa";
import DownloadFileLink from "../../common/DownloadFileLink";
import { NotificationError } from "../../common/Error";
import { updateApolloCache } from "../../common/helper";
import RedErrorMessage from "../../common/RedErrorMessage";
import { Form, Form as FormModel } from "../../form/model";
import Packagings from "../../form/packagings/Packagings";
import { currentSiretService } from "../CompanySelector";
import { FORMS_PDF } from "../slips/slips-actions/DownloadPdf";
import { GET_TRANSPORT_SLIPS } from "./Transport";
import "./TransportSignature.scss";
import { Wizard } from "./Wizard";

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

type Props = { form: FormModel };

export default function TransportSignature({ form }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [signedByTransporter, { error }] = useMutation(SIGNED_BY_TRANSPORTER, {
    onCompleted: () => setIsOpen(false),
    refetchQueries: [],
    update: (store) => {
      updateApolloCache<{ forms: Form[] }>(store, {
        query: GET_TRANSPORT_SLIPS,
        variables: {
          siret: currentSiretService.getSiret(),
          type: "TRANSPORTER",
        },
        getNewData: (data) => ({
          forms: data.forms.filter((f) => f.id !== form.id),
        }),
      });
    },
  });

  return (
    <>
      <button
        className="link icon"
        onClick={() => setIsOpen(true)}
        title="Signer ce bordereau"
      >
        <FaFileSignature />
      </button>
      <div
        className="modal__backdrop"
        id="modal"
        style={{
          display: isOpen ? "flex" : "none",
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
              packagings: form.stateSummary.wasteVaryingDetails.packagings,
              quantity: form.stateSummary.wasteVaryingDetails.quantity,
              onuCode: form.stateSummary.wasteVaryingDetails.onuCode,
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
                  <h3>Lieu de collecte</h3>
                  <address>
                    {form.emitter.company.name} ({form.emitter.company.siret})
                    <br /> {form.emitter.company.address}
                  </address>

                  <h3>Déchets à collecter</h3>
                  <p>Bordereau numéro {form.readableId}</p>
                  <p>
                    Appellation du déchet: {form.wasteDetails.name} (
                    {form.wasteDetails.code})
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

                  <h3>Destination du déchet</h3>
                  <address>
                    {form.stateSummary.recipient?.name} (
                    {form.stateSummary.recipient?.siret})
                    <br /> {form.stateSummary.recipient?.address}
                  </address>

                  <h3>Validation</h3>

                  <p>
                    <label>
                      Date de l'enlèvement
                      <Field type="date" name="sentAt" />
                    </label>
                  </p>

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
            <Wizard.Page title="Signature Producteur">
              {(props: any) => (
                <>
                  <div>
                    <div className="notification success">
                      Cet écran est à lire et signer par le{" "}
                      <strong>producteur du déchet</strong>
                    </div>

                    <h3>Lieu de collecte</h3>
                    <address>
                      {form.stateSummary.emitter?.name} (
                      {form.stateSummary.emitter?.siret})
                      <br /> {form.stateSummary.emitter?.address}
                    </address>

                    <h3>Mes déchets</h3>
                    <p>
                      Bordereau numéro {form.readableId}
                      <br />
                      Appellation du déchet: {form.wasteDetails.name} (
                      {form.wasteDetails.code})
                      <br />
                      Conditionnement: {props.packagings.join(", ")}
                      <br />
                      Poids total: {props.quantity} tonnes
                    </p>

                    <h3>Transporteur</h3>
                    <address>
                      {form.stateSummary.transporter.name} (
                      {form.stateSummary.transporter.siret})
                      <br /> {form.stateSummary.transporter.address}
                    </address>

                    <h3>Destination du déchet</h3>
                    <address>
                      {form.stateSummary.recipient?.name} (
                      {form.stateSummary.recipient?.siret})
                      <br /> {form.stateSummary.recipient?.address}
                    </address>

                    <p>
                      <label>
                        <Field
                          type="checkbox"
                          name="signedByProducer"
                          required
                        />
                        En tant que producteur du déchet, j'ai vérifié que les
                        déchets confiés au transporter correspondent au
                        informations vue ci-avant et je valide l'enlèvement.
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
    </>
  );
}
