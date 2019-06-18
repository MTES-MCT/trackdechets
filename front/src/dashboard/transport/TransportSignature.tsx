import React, { useState } from "react";
import { Form as FormModel } from "../../form/model";
import { FaFileSignature } from "react-icons/fa";
import { Formik, Form, Field } from "formik";
import { DateTime } from "luxon";
import gql from "graphql-tag";
import { Mutation } from "react-apollo";

export const SIGNED_BY_TRANSPORTER = gql`
  mutation SignedByTransporter(
    $id: ID!
    $signingInfo: TransporterSignatureFormInput!
  ) {
    signedByTransporter(id: $id, signingInfo: $signingInfo) {
      id
      status
    }
  }
`;

type Props = { form: FormModel };

export default function TransportSignature({ form }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProducerSigning, setIsProducerSigning] = useState(false);

  return (
    <>
      <a
        className="icon"
        onClick={() => setIsOpen(true)}
        title="Signer ce bordereau"
      >
        <FaFileSignature />
      </a>
      <div
        className="modal__backdrop"
        id="modal"
        style={{
          display: isOpen ? "flex" : "none"
        }}
      >
        <div className="modal">
          <h2>Signature</h2>
          <Mutation
            mutation={SIGNED_BY_TRANSPORTER}
            onCompleted={() => setIsOpen(false)}
          >
            {(signedByTransporter, { error }) => (
              <Formik
                initialValues={{
                  sentAt: DateTime.local().toISODate(),
                  sentBy: "",
                  securityCode: "",
                  signedByTransporter: false,
                  signedByProducer: false
                }}
                onSubmit={values =>
                  signedByTransporter({
                    variables: { id: form.id, signingInfo: values }
                  })
                }
              >
                {({ isSubmitting, values }) => (
                  <Form>
                    <p>Bordereau numéro {form.readableId}</p>
                    <p>
                      <label>
                        Date de l'enlèvement
                        <Field type="date" name="sentAt" />
                      </label>
                    </p>
                    <p>
                      <label>
                        <Field type="checkbox" name="signedByTransporter" />
                        En tant que transporteur, j'atteste de la prise en
                        charge du déchet
                      </label>
                    </p>
                    <p>
                      Si vous le désirez vous pouvez faire signer le producteur
                      du déchet pour attester de l'enlèvement. Pour se faire,{" "}
                      <a
                        className="button-outline small primary"
                        onClick={() => setIsProducerSigning(!isProducerSigning)}
                      >
                        cliquez ici
                      </a>
                    </p>
                    {isProducerSigning && (
                      <div>
                        <h4>Signature du producteur</h4>
                        <p>
                          Cette section est à remplir par le producteur{" "}
                          <strong>{form.emitter.company.name}</strong>, pour le
                          déchet "{form.wasteDetails.name}" (
                          {form.wasteDetails.code}). La quantité estimée est de{" "}
                          {form.wasteDetails.quantity} tonnes.
                        </p>
                        <p>
                          <label>
                            Code de sécurité entreprise
                            <Field type="number" name="securityCode" />
                          </label>
                        </p>
                        <p>
                          <label>
                            Nom et prénom
                            <Field type="text" name="sentBy" />
                          </label>
                        </p>
                        <p>
                          <label>
                            <Field type="checkbox" name="signedByProducer" />
                            En tant que producteur, je certifie que les
                            renseignements du bordereau sont corrects
                          </label>
                        </p>
                      </div>
                    )}
                    <button
                      className="button warning"
                      onClick={() => setIsOpen(false)}
                    >
                      Annuler
                    </button>
                    <button className="button" type="submit">
                      Valider
                    </button>
                  </Form>
                )}
              </Formik>
            )}
          </Mutation>
        </div>
      </div>
    </>
  );
}
