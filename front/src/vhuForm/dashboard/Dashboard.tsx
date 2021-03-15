import { useMutation, useQuery } from "@apollo/client";
import { DownloadFileLink } from "common/components";
import routes from "common/routes";
import { QueryBsvhusArgs, Query } from "generated/graphql/types";
import React, { useState } from "react";
import { generatePath, Link, useParams } from "react-router-dom";
import {
  DUPLICATE_VHU_FORM,
  GET_VHU_FORMS,
  PDF_VHU_FORM,
} from "form/bsvhu/utils/queries";
import { InlineError } from "../../common/components/Error";
import Loader from "../../common/components/Loaders";
import Tooltip from "../../common/components/Tooltip";
import Sign from "./Sign";

export default function Dashboard() {
  const { siret } = useParams<{ siret: string }>();
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);

  const [formRoute, setFormRoute] = useState(routes.dashboard.bsvhus.create);

  const { error, data, loading, refetch } = useQuery<
    Pick<Query, "bsvhus">,
    QueryBsvhusArgs
  >(GET_VHU_FORMS, {
    variables: {
      siret,
    } as any,
    fetchPolicy: "network-only",
  });

  const [duplicate] = useMutation(DUPLICATE_VHU_FORM);

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  if (!data) return <p>Rien à afficher</p>;

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-end tw-pb-4">
        <span>
          Type de déchet{" "}
          <Tooltip msg="Choisissez le type de bordereau que vous souhaitez créer" />
        </span>
        <div className="tw-px-3">
          <select
            id="select"
            value={formRoute}
            onChange={e => setFormRoute(e.target.value)}
            className="td-select"
          >
            <option value={routes.dashboard.bsdds.create}>BSD classique</option>
            <option value={routes.dashboard.bsvhus.create}>BSD VHU</option>
            <option value="TODO" disabled>
              BSD DASRI
            </option>
          </select>
        </div>
        <Link
          to={generatePath(formRoute, { siret })}
          className="btn btn--primary"
        >
          Créer un bordereau
        </Link>
      </div>

      <table className="tw-table-auto">
        <thead>
          <tr>
            <th className="tw-px-4 py-2">Emetteur</th>
            <th className="tw-px-4 py-2">Destinataire</th>
            <th className="tw-px-4 py-2">Brouillon</th>
            <th className="tw-px-4 py-2">Statut / ID</th>
            <th className="tw-px-4 py-2">Signatures</th>
            <th className="tw-px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.bsvhus?.edges?.map(({ node: vhu }) => (
            <tr key={vhu.id}>
              <td className="tw-border tw-px-4 tw-py-2">
                {vhu.emitter?.company?.name}
              </td>
              <td className="tw-border tw-px-4 tw-py-2">
                {vhu.recipient?.company?.name}
              </td>
              <td className="tw-border tw-px-4 tw-py-2">
                {vhu.isDraft ? "OUI" : "NON"}
              </td>
              <td className="tw-border tw-px-4 tw-py-2">
                {vhu.status} / {vhu.readableId}
              </td>
              <td className="tw-border tw-px-4 tw-py-2">
                <ul>
                  <li>Emetteur {vhu.emitter?.signature?.date ? "✅" : "❌"}</li>
                  <li>
                    Transporter {vhu.transporter?.signature?.date ? "✅" : "❌"}
                  </li>
                  <li>
                    Destinataire
                    {vhu.recipient?.signature?.date ? "✅" : "❌"}
                  </li>
                </ul>
              </td>
              <td className="tw-border tw-px-4 tw-py-2">
                {vhu.status !== "DONE" && (
                  <>
                    <Link
                      className="btn btn--primary btn--slim"
                      to={generatePath(routes.dashboard.bsvhus.edit, {
                        siret,
                        id: vhu.id,
                      })}
                    >
                      Editer
                    </Link>
                    <button
                      className="btn btn--primary btn--slim"
                      onClick={() => setIsSignatureOpen(true)}
                    >
                      Signer
                    </button>
                    <Sign
                      form={vhu}
                      isOpen={isSignatureOpen}
                      onClose={() => {
                        setIsSignatureOpen(false);
                        refetch();
                      }}
                    />
                  </>
                )}
                <button
                  className="btn btn--primary btn--slim"
                  onClick={async () => {
                    await duplicate({ variables: { id: vhu.id } });
                    refetch();
                  }}
                >
                  Dupliquer
                </button>
                <DownloadFileLink
                  query={PDF_VHU_FORM}
                  params={{ id: vhu.id }}
                  title="Télécharger le PDF"
                  className="btn btn--primary btn--slim"
                  linkGetter={data => data.bordereauVhu?.pdf?.downloadLink}
                >
                  PDF
                </DownloadFileLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
