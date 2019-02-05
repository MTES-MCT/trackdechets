import React from "react";
import { Me } from "../../login/model";
import { Query, QueryResult } from "react-apollo";
import gql from "graphql-tag";

interface IProps {
  me: Me;
}

type Stats = {
  wasteCode: string;
  incoming: number;
  outgoing: number;
  awaiting: number;
};

const GET_STATS = gql`
  query GetStats {
    stats {
      wasteCode
      incoming
      outgoing
    }
  }
`;

export default function Exports({ me }: IProps) {
  return (
    <div className="main">
      <h2>Statistiques</h2>
      <Query query={GET_STATS}>
        {({ loading, error, data }: QueryResult<{ stats: Stats[] }>) => {
          if (loading) return "Chargement...";
          if (error || !data) return "Erreur...";
          return (
            <table className="table">
              <thead>
                <tr>
                  <th>Code déchet</th>
                  <th>Quantité totale entrée</th>
                  <th>Quantité totale sortie</th>
                  <th>En stock / attente</th>
                </tr>
              </thead>
              <tbody>
                {data.stats.map(s => (
                  <tr key={s.wasteCode}>
                    <td>{s.wasteCode}</td>
                    <td>{s.incoming}</td>
                    <td>{s.outgoing}</td>
                    <td>{s.incoming - s.outgoing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }}
      </Query>
      <h2>Téléchargement de registres</h2>
      <p>
        Vous avez la possibilité de télécharger un registre des déchets entrants
        et sortants de votre entreprise. Ce registre est basé uniquement sur les
        déchets qui ont terminé leur cycle de vie, c'est à dire qui ne sont pas
        en attente de réception ou de traitement par une entité. Cela correspond
        aux bordereaux que vous retrouvez dans votre onglet "Archives"
      </p>
      <a
        className="button"
        target="_blank"
        href={`${
          process.env.REACT_APP_API_ENDPOINT
        }/exports?exportType=OUTGOING&siret=${me.company.siret}`}
      >
        Registre de déchets sortants
      </a>
      <a
        className="button"
        target="_blank"
        href={`${
          process.env.REACT_APP_API_ENDPOINT
        }/exports?exportType=INCOMING&siret=${me.company.siret}`}
      >
        Registre de déchets entrants
      </a>
    </div>
  );
}
