import React from "react";

import {
  Mutation,
  MutationCreatePdfAccessTokenArgs,
} from "generated/graphql/types";
import QRCodeIcon from "react-qr-code";
import { useMutation, gql } from "@apollo/client";
import { Loader } from "common/components";

import { useParams, useHistory } from "react-router-dom";
import { InlineError } from "common/components/Error";

import cogoToast from "cogo-toast";

const CREATE_PDF_ACCESS_TOKEN = gql`
  mutation CreatePdfAccessToken($input: CreatePdfAccessTokenInput!) {
    createPdfAccessToken(input: $input)
  }
`;

export function RouteControlPdf() {
  const { id } = useParams<{
    id: string;
    siret: string;
  }>();
  const history = useHistory();

  const [createPdfAccessToken, { data, loading, error }] = useMutation<
    Pick<Mutation, "createPdfAccessToken">,
    MutationCreatePdfAccessTokenArgs
  >(CREATE_PDF_ACCESS_TOKEN, {
    onError: () =>
      cogoToast.error(`Le QR-code n'a pas pu être affiché`, {
        hideAfter: 5,
      }),
  });

  return (
    <div>
      <h2 className="td-modal-title">QR Code contrôle routier</h2>

      <p>
        Ce QR code est à présenter au forces de l'ordre en cas de contrôle
        routier. Il est utilisable dans les 30 minutes qui suivent son
        affichage.
      </p>

      {!!error && <InlineError apolloError={error} />}
      {!!loading && <Loader />}
      {!!data && (
        <div className="tw-mt-4 tw-mb-4 tw-flex tw-flex-col tw-items-center">
          <QRCodeIcon value={data.createPdfAccessToken} size={128} />
          <span className="tw-mt-3">À scanner par les forces de l'ordre</span>
        </div>
      )}

      <div className="td-modal-actions">
        <button className="btn btn--outline-primary" onClick={history.goBack}>
          Annuler
        </button>
        <button
          className="btn btn--primary"
          disabled={loading || !!data}
          onClick={() =>
            createPdfAccessToken({
              variables: {
                input: { bsdId: id },
              },
            })
          }
        >
          <span>Afficher le QR code</span>
        </button>
      </div>
    </div>
  );
}
