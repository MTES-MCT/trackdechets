import React from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";

import { Mutation, MutationCreatePdfAccessTokenArgs } from "@td/codegen-ui";
import QRCodeIcon from "react-qr-code";
import { useMutation, gql } from "@apollo/client";
import { Loader } from "../../../../../Apps/common/Components";

import { useParams, useNavigate } from "react-router-dom";
import { InlineError } from "../../../../../Apps/common/Components/Error/Error";
import { TOAST_DURATION } from "../../../../../common/config";

import toast from "react-hot-toast";

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
  const navigate = useNavigate();

  const [createPdfAccessToken, { data, loading, error }] = useMutation<
    Pick<Mutation, "createPdfAccessToken">,
    MutationCreatePdfAccessTokenArgs
  >(CREATE_PDF_ACCESS_TOKEN, {
    onError: () =>
      toast.error(`Le QR-code n'a pas pu être affiché`, {
        duration: TOAST_DURATION
      })
  });

  return (
    <div>
      <h2 className="fr-h2">QR Code contrôle routier</h2>

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
        <Button
          priority="secondary"
          onClick={() => {
            navigate(-1);
          }}
        >
          Annuler
        </Button>

        <Button
          disabled={loading || !!data}
          onClick={() =>
            createPdfAccessToken({
              variables: {
                input: { bsdId: id! }
              }
            })
          }
        >
          Afficher le QR code
        </Button>
      </div>
    </div>
  );
}
