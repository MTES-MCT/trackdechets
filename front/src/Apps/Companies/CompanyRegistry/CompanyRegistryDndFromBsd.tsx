import React, { useState } from "react";
import "./CompanyRegistryDndFromBsd.scss";
import {
  CompanyPrivate,
  Mutation,
  MutationEnableRegistryDndFromBsdArgs,
  UserRole
} from "@td/codegen-ui";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import Input from "@codegouvfr/react-dsfr/Input";
import { z } from "zod";
import gql from "graphql-tag";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { CompanyDetailsfragment } from "../common/fragments";
import { useMutation } from "@apollo/client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { format, isFuture, subDays } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  company: CompanyPrivate;
}

export const ENABLE_REGISTRY_DND_FROM_BSD = gql`
  mutation EnableRegistryDndFromBsd($id: String!) {
    enableRegistryDndFromBsd(id: $id) {
      ...CompanyDetailsFragment
    }
  }
  ${CompanyDetailsfragment.company}
`;

const confirmationModal = createModal({
  id: "confirmation-modal",
  isOpenedByDefault: false
});

const getSchema = (company: CompanyPrivate) =>
  z
    .object({
      siret: z
        .string({
          required_error: "Le SIRET est requis"
        })
        .transform(value => value.replace(/\s+/g, ""))
        .pipe(
          z
            .string()
            .min(14, { message: "Le SIRET doit faire 14 caractères" })
            .max(14, { message: "Le SIRET doit faire 14 caractères" })
        )
    })
    .superRefine(({ siret }, ctx) => {
      if (siret !== company.orgId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["siret"],
          message:
            "Le SIRET doit être celui de l'établissement pour lequel vous souhaitez activer la traçabilité des déchets non dangereux"
        });
      }
    });

export const CompanyRegistryDndFromBsd = ({ company }: Props) => {
  const [error, setError] = useState<string | null>(null);

  const [enableRegistryDndFromBsd, { loading: mutationLoading }] = useMutation<
    Pick<Mutation, "enableRegistryDndFromBsd">,
    MutationEnableRegistryDndFromBsdArgs
  >(ENABLE_REGISTRY_DND_FROM_BSD);

  const validationSchema = getSchema(company);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<z.infer<typeof validationSchema>>({
    defaultValues: {
      siret: ""
    },
    resolver: zodResolver(validationSchema)
  });

  useIsModalOpen(confirmationModal, {
    onConceal: () => {
      reset({
        siret: ""
      });
    }
  });

  const onSubmit: SubmitHandler<
    z.infer<typeof validationSchema>
  > = async () => {
    setError(null);
    await enableRegistryDndFromBsd({
      variables: {
        id: company.id
      },
      onCompleted: () => {
        confirmationModal.close();
        reset({
          siret: ""
        });
      },
      onError: err => setError(err.message)
    });
  };
  const isFutureDate =
    company.hasEnabledRegistryDndFromBsdSince &&
    isFuture(new Date(company.hasEnabledRegistryDndFromBsdSince));
  return (
    <>
      {company.hasEnabledRegistryDndFromBsdSince ? (
        <div>
          <h4 className="fr-h4">
            Traçabilité des déchets non dangereux dans le registre activée
          </h4>
          <p className="fr-text--bold">
            {`L'activation de la traçabilité est irréversible et ${
              isFutureDate
                ? `prendra effet à 23h59 (heure de Paris) le ${format(
                    subDays(
                      new Date(company.hasEnabledRegistryDndFromBsdSince),
                      1
                    ),
                    "d MMMM yyyy",
                    { locale: fr }
                  )}`
                : `a pris effet le ${format(
                    new Date(company.hasEnabledRegistryDndFromBsdSince),
                    "d MMMM yyyy",
                    { locale: fr }
                  )} à 00h00 (heure de Paris)`
            }.`}
          </p>
          <div className="fr-my-5v">
            <ul className="fr-list">
              <li>
                {`Les déchets non dangereux tracés avec Trackdéchets ${
                  isFutureDate ? "seront" : "sont"
                } pris en compte dans les registres réglementaires, les registres
                d'export et les données agrégées pour l'administration.`}
              </li>
              <li>
                {`Les déchets non dangereux tracés avec Trackdéchets ${
                  isFutureDate ? "vaudront" : "valent"
                } déclaration au registre, il ne faut donc plus les déclarer via
                les imports de registres, au risque de créer un doublon.`}
              </li>
              <li>
                {`Les déchets non dangereux tracés avec Trackdéchets ${
                  isFutureDate ? "seront" : "sont"
                } consultables via l'ensemble des registres réglementaires et
                exhaustif.`}
              </li>
            </ul>
          </div>
          <div className="fr-my-5v">
            <p>
              Plus d'informations{" "}
              <a
                className={`fr-link force-external-link-content force-underline-link`}
                href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte/modifier-les-informations-de-son-compte"
                target="_blank"
                rel="noreferrer"
              >
                dans la documentation
              </a>
            </p>
          </div>
        </div>
      ) : (
        <div>
          <h4 className="fr-h4">
            Activer la traçabilité des déchets non dangereux dans le registre
          </h4>
          <p className="fr-text--bold">
            Actuellement, la traçabilité des déchets non dangereux n'est pas
            activée.
          </p>
          <div className="fr-my-5v">
            <ul className="fr-list">
              <li>
                Les déchets non dangereux tracés avec Trackdéchets ne sont pas
                pris en compte dans les registres réglementaires, les registres
                d'export et les données agrégées pour l'administration.
              </li>
              <li>
                La déclaration des déchets non dangereux tracés avec
                Trackdéchets doit se faire via les imports de registres.
              </li>
              <li>
                Les déchets non dangereux tracés avec Trackdéchets sont
                uniquement consultables via le registre d'export exhaustif.
              </li>
            </ul>
          </div>
          <p className="fr-text--bold">En activant la traçabilité :</p>
          <div className="fr-my-5v">
            <ul className="fr-list">
              <li>
                Les déchets non dangereux tracés avec Trackdéchets seront pris
                en compte dans les registres réglementaires, les registres
                d'export et les données agrégées pour l'administration.
              </li>
              <li>
                Les déchets non dangereux tracés avec Trackdéchets vaudront
                déclaration au registre, il ne faudra donc plus les déclarer via
                les imports de registres, au risque de créer un doublon.
              </li>
              <li>
                Les déchets non dangereux tracés avec Trackdéchets seront
                consultables via l'ensemble des registres réglementaires et
                exhaustif.
              </li>
            </ul>
          </div>
          <div className="fr-my-5v">
            <p className="fr-text--bold">
              {`L'activation est irréversible et prendra effet à 23h59 (heure de Paris) le ${format(
                new Date(),
                "d MMMM yyyy",
                { locale: fr }
              )}.`}
            </p>
          </div>
          <div className="fr-my-5v">
            <p>
              Plus d'informations{" "}
              <a
                className={`fr-link force-external-link-content force-underline-link`}
                href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte/modifier-les-informations-de-son-compte"
                target="_blank"
                rel="noreferrer"
              >
                dans la documentation
              </a>
            </p>
          </div>
          <div>
            <Button
              priority="primary"
              iconId="fr-icon-arrow-right-line"
              iconPosition="right"
              onClick={() => confirmationModal.open()}
              disabled={company.userRole !== UserRole.Admin}
            >
              Activer la traçabilité
            </Button>
            {company.userRole !== UserRole.Admin && (
              <p className="fr-mt-2v fr-text--xs">
                Vous n'avez pas les droits pour activer la traçabilité des
                déchets non dangereux dans le registre.
              </p>
            )}
          </div>
        </div>
      )}
      <confirmationModal.Component
        title={`Activer la traçabilité des déchets non dangereux dans le registre`}
        iconId="fr-icon-warning-line"
        className="dnd-from-bsd-confirmation-modal"
        size="medium"
        buttons={[
          {
            onClick: handleSubmit(onSubmit),
            doClosesModal: false,
            priority: "primary",
            className: "danger-button",
            children: "Activer",
            disabled: mutationLoading
          },
          {
            priority: "primary",
            doClosesModal: true,
            children: "Ne pas activer",
            disabled: mutationLoading
          }
        ]}
      >
        <div className="fr-mt-5v">
          <p className="fr-text--bold">
            En validant cette option je comprends que :
          </p>
          <div className="fr-my-5v">
            <ul className="fr-list">
              <li>
                Les déchets non dangereux tracés avec Trackdéchets seront pris
                en compte dans les registres réglementaires, les registres
                d'export et les données agrégées pour l'administration.
              </li>
              <li>
                Les déchets non dangereux tracés avec Trackdéchets vaudront
                déclaration au registre, il ne faudra donc plus les déclarer via
                les imports de registres, au risque de créer un doublon.
              </li>
              <li>
                Les déchets non dangereux tracés avec Trackdéchets seront
                consultables via l'ensemble des registres réglementaires et
                exhaustif.
              </li>
            </ul>
          </div>
          <div className="fr-my-5v">
            <p className="fr-text--bold">
              Cette activation est irréversible et prendra effet à la date de la
              confirmation.
            </p>
          </div>
          <div className="fr-my-5v">
            <p className="fr-text--bold">
              Pour activer la traçabilité des déchets non dangereux dans le
              registre, saisissez le SIRET de votre établissement.
            </p>
          </div>

          <div className="fr-mb-4v">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="SIRET de l'établissement"
                // className="fr-col-3 fr-mb-5v"
                state={errors?.siret ? "error" : "default"}
                nativeInputProps={{
                  ...register("siret", { required: true })
                }}
                stateRelatedMessage={(errors?.siret?.message as string) ?? ""}
              />
            </form>
          </div>
          {error && (
            <Alert
              className="fr-mb-3w"
              small
              description={error}
              severity="error"
            />
          )}
        </div>
      </confirmationModal.Component>
    </>
  );
};
