import React, { useEffect } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { format } from "date-fns";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
import {
  Query,
  QueryCompanyDigestsArgs,
  Mutation,
  MutationCreateCompanyDigestArgs,
  QueryCompanyDigestPdfArgs
} from "@td/codegen-ui";
import { NotificationError } from "../../common/Components/Error/Error";
import { Loader } from "../../common/Components";
import {
  CREATE_COMPANY_DIGEST,
  COMPANY_DIGEST_PDF,
  COMPANY_DIGEST
} from "./queries";

const Description = () => (
  <div>
    <p>
      La génération de la fiche établissement est particulièrement coûteuse en
      ressources informatiques, c'est pourquoi elle ne peut être générée qu'une
      fois par jour et par établissement mais reste consultable.
    </p>
    <br />
    <p>Les sources des données sont multiples:</p>
    <br />
    <ul className="fr-ml-2w">
      <li>
        - Trackdéchets pour les déchets tracés et pour vos informations
        établissements (profils, agréments, etc)
      </li>
      <li>- RNDTS pour les déchets déclarés</li>
      <li>
        - GUN (outil de l'inspection des installations classées) pour les
        données ICPE (rubriques, capacités etc)
      </li>
    </ul>
    <br />
    <p>
      En cas de constat d'erreur sur la fiche, il convient donc de procéder aux
      révisions prévues dans les outils, en aucun cas, le support n'interviendra
      pour des corrections de fiche.
    </p>
    <br />
    <p>
      Si une fiche est en erreur, inutile de nous en informer, nous sommes en
      copie des remontées d'erreurs.
    </p>
    <br />
    <p>
      Les données sont encore sous beta-test et vous pouvez consulter la
      documentation en FAQ pour savoir à quoi elles correspondent.
    </p>
    <br />
    <p>
      Les données sont mises à jour toutes les 24h concernant Trackdéchets, et
      peuvent être mises à jour tous les mois, ou trimestres, concernant les
      autres sources.
    </p>
  </div>
);

const Spinner = () => (
  <span className="fr-icon-refresh-line spinning fr-mx-1w" />
);

const CompanyDigestDownload = ({ companyDigests, year, onClick }) => {
  const [getPdf] = useLazyQuery<
    Pick<Query, "companyDigestPdf">,
    QueryCompanyDigestPdfArgs
  >(COMPANY_DIGEST_PDF);

  const companyDigest = companyDigests.find(el => el?.year === year);

  const downloadIsReady = companyDigest?.state === "PROCESSED";
  const downloadIsPending = companyDigest?.state === "PENDING";
  const downloadIsFailing = companyDigest?.state === "ERROR";

  const label = `${
    downloadIsReady ? `Télécharger l'année ${year}` : `Générer l'année ${year}`
  }  `;

  const generatedLabel = downloadIsReady
    ? `Générée aujourd'hui à ${format(
        new Date(companyDigest.updatedAt),
        "HH:mm"
      )} `
    : "Non générée aujourd'hui";

  const iconId = downloadIsPending
    ? "fr-icon-refresh-line"
    : "fr-icon-file-download-line";

  const action = downloadIsReady
    ? () =>
        getPdf({
          variables: { id: companyDigest.id },
          onCompleted: r => {
            if (r.companyDigestPdf.downloadLink == null) {
              return;
            }

            window.open(r.companyDigestPdf.downloadLink, "_blank");
          }
        })
    : onClick;

  return (
    <div>
      <Button
        onClick={action}
        priority="secondary"
        iconId={iconId}
        iconPosition="right"
        disabled={downloadIsPending}
      >
        {label}
      </Button>
      {downloadIsPending && <Spinner />}
      {downloadIsPending && (
        <Alert
          severity="warning"
          className="fr-mt-2w"
          small
          description="La génération de la fiche est en file d’attente. Elle sera disponible dans quelques minutes. "
        />
      )}
      {downloadIsFailing && (
        <Alert
          severity="error"
          className="fr-mt-2w"
          small
          description="La génération de la fiche a échoué. Vous pouvez essayer à nouveau."
        />
      )}
      <p className="fr-mt-2w">{generatedLabel}</p>
    </div>
  );
};

const pollIntervall = 1000;

const CompanyDigestSheetForm = ({ company }) => {
  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery<
    Pick<Query, "companyDigests">,
    QueryCompanyDigestsArgs
  >(COMPANY_DIGEST, {
    fetchPolicy: "network-only",
    variables: { orgId: company.siret }
  });

  const needsPolling = data?.companyDigests.some(c =>
    ["PENDING", "INITIAL"].includes(c?.state ?? "")
  );

  useEffect(() => {
    if (needsPolling) {
      startPolling(pollIntervall);
    } else {
      stopPolling();
    }
    return () => {
      stopPolling();
    };
  }, [needsPolling, startPolling, stopPolling]);

  const [createCompanyDigest] = useMutation<
    Pick<Mutation, "createCompanyDigest">,
    MutationCreateCompanyDigestArgs
  >(CREATE_COMPANY_DIGEST);

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (loading) {
    return <Loader />;
  }

  if (data?.companyDigests) {
    if (
      data?.companyDigests.some(c =>
        ["PENDING", "INITIAL"].includes(c?.state ?? "")
      )
    ) {
      startPolling(pollIntervall);
    } else {
      stopPolling();
    }
  }
  return (
    <div>
      <h1 className="fr-h5">
        Fiche établissement{" "}
        <span className="fr-badge fr-badge--purple-glycine">VERSION BETA</span>
      </h1>

      <Alert description={Description()} severity="info" small />
      <div className="fr-my-2w">
        <CompanyDigestDownload
          companyDigests={data?.companyDigests}
          year={lastYear}
          onClick={async () => {
            await createCompanyDigest({
              variables: { input: { year: lastYear, orgId: company.siret } }
            });
            refetch();
          }}
        />
      </div>
      <div>
        <CompanyDigestDownload
          companyDigests={data?.companyDigests}
          year={currentYear}
          onClick={async () => {
            await createCompanyDigest({
              variables: {
                input: { year: currentYear, orgId: company.siret }
              }
            });
            refetch();
          }}
        />
      </div>
    </div>
  );
};

export default CompanyDigestSheetForm;
