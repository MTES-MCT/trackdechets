import React from "react";
import { Me } from "../../login/model";
import "./Transport.scss";
import { Query, QueryResult } from "react-apollo";
import gql from "graphql-tag";
import { Form } from "../../form/model";

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
                    <th>Colonne 1</th>
                    <th>Colonne 2</th>
                    <th>Colonne 3</th>
                    <th>Colonne 4</th>
                  </tr>
                </thead>
              </table>
            );
          }}
        </Query>
      </div>
    </>
  );
}
