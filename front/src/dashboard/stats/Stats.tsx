import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import React from "react";
import { InlineError } from "src/common/components/Error";
import Loader from "src/common/components/Loaders";
import { Query } from "src/generated/graphql/types";

const GET_STATS = gql`
  query GetStats {
    stats {
      company {
        siret
      }
      stats {
        wasteCode
        incoming
        outgoing
      }
    }
  }
`;

export default function Stats() {
  const { loading, error, data } = useQuery<Pick<Query, "stats">>(GET_STATS);

  return (
    <div className="main">
      <h2>Statistiques</h2>
      {loading && <Loader />}
      {error && <InlineError apolloError={error} />}
      {!data && <p>Aucune donnée à afficher.</p>}
      {data && (
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
            {data.stats[0].stats.map(s => (
              <tr key={s.wasteCode}>
                <td>{s.wasteCode}</td>
                <td>{s.incoming}</td>
                <td>{s.outgoing}</td>
                <td>
                  {Math.max(
                    0,
                    Math.round((s.incoming - s.outgoing) * 100) / 100
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
