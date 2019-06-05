import React, { useState } from "react";
import { Me } from "../../login/model";
import "./Transport.scss";
import { Query, QueryResult } from "react-apollo";
import gql from "graphql-tag";
import { Form } from "../../form/model";
import { FaFileSignature } from "react-icons/fa";

type Props = {
  me: Me;
  siret: string;
};

export const GET_TRANSPORT_SLIPS = gql`
  query GetSlips($siret: String, $type: FormType) {
    forms(siret: $siret, type: $type) {
      id
      readableId
      createdAt
      emitter {
        company {
          name
          siret
        }
      }
      wasteDetails {
        code
        name
        quantity
      }
    }
  }
`;

export default function Transport({ me, siret }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProducerSigning, setIsProducerSigning] = useState(false);

  return (
    <>
      <div className="header-content">
        <h2>Mes bordereaux à transporter</h2>
      </div>

      <div>
        <Query
          query={GET_TRANSPORT_SLIPS}
          variables={{ siret, type: "TRANSPORTER" }}
        >
          {({ loading, error, data }: QueryResult<{ forms: Form[] }>) => {
            if (loading) return "Chargement...";
            if (error || !data) return "Erreur...";

            return (
              <table className="table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Emetteur</th>
                    <th>Déchet</th>
                    <th>Quantité estimée</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forms.map(form => (
                    <tr key={form.id}>
                      <td>{form.readableId}</td>
                      <td>
                        {form.emitter.company && form.emitter.company.name}
                      </td>
                      <td>
                        <div>{form.wasteDetails.code}</div>
                        <div>{form.wasteDetails.name}</div>
                      </td>
                      <td>{form.wasteDetails.quantity} tonnes</td>
                      <td>
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
                          style={{ display: isOpen ? "flex" : "none" }}
                        >
                          <div className="modal">
                            <h2>Signature</h2>
                            <p>
                              Vous avez la possibilité de signer en tant que
                              transporteur, et de faire signer le départ du
                              déchet par le producteur dans cette interface.
                            </p>
                            <p>
                              <label>
                                <input type="date" /> Date de l'enlèvement
                              </label>
                            </p>
                            <p>
                              <label>
                                <input type="checkbox" />
                                En tant que transporteur, j'atteste de la prise
                                en charge du déchet
                              </label>
                            </p>
                            <p>
                              Vous désirez faire signer le producteur du déchet
                              pour attester de l'enlèvement ?{" "}
                              <button
                                className="button-outline small primary"
                                onClick={() =>
                                  setIsProducerSigning(!isProducerSigning)
                                }
                              >
                                Cliquez ici
                              </button>
                            </p>
                            {isProducerSigning && (
                              <div>
                                <p>
                                  Le producteur du déchet est l'entreprise{" "}
                                  <strong>{form.emitter.company.name}</strong>
                                </p>
                                <p>
                                  <label>
                                    Code de sécurité entreprise
                                    <input type="number" />
                                  </label>
                                </p>
                                <p>
                                  <label>
                                    <input type="checkbox" />
                                    En tant que producteur, j'atteste de
                                    l'enlèvement du déchet
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
                            <button
                              className="button"
                              onClick={() => setIsOpen(false)}
                            >
                              Valider
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          }}
        </Query>
      </div>
    </>
  );
}
