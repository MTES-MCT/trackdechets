import { Query } from "@apollo/react-components";
import gql from "graphql-tag";
import React from "react";
import { InlineError } from "../../common/Error";
import { Me } from "../../login/model";
import "./Transport.scss";
import TransportSignature from "./TransportSignature";

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
          address
        }
      }
      recipient {
        company {
          name
          siret
          address
        }
      }
      transporter {
        company {
          name
          siret
          address
        }
      }
      wasteDetails {
        code
        name
        quantity
        packagings
        onuCode
      }
    }
  }
`;

export default function Transport({ me, siret }: Props) {
  return (
    <>
      <div className="header-content">
        <h2>Mes bordereaux à transporter</h2>
      </div>

      <div className="transport-table">
        <Query
          query={GET_TRANSPORT_SLIPS}
          variables={{ siret, type: "TRANSPORTER" }}
        >
          {({ loading, error, data }) => {
            if (loading) return <p>Chargement...</p>;
            if (error) return <InlineError apolloError={error} />;
            if (!data) return <p>Aucune donnée à afficher</p>;

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
                        <TransportSignature form={form} />
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
