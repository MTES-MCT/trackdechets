import React, { useState } from "react";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import { COMPANY_PRIVATE_INFOS } from "form/common/components/company/query";
import AccountCompanyAddMembershipRequest from "./AccountCompanyAddMembershipRequest";
import styles from "../AccountCompanyAdd.module.scss";
import { Mutation, Query } from "generated/graphql/types";
import {
  isFRVat,
  isSiret,
  isVat,
} from "generated/constants/companySearchHelpers";
import { CONTACT_EMAIL } from "common/config";

import {
  Container,
  Row,
  Col,
  Button,
  TextInput,
  Alert,
} from "@dataesr/react-dsfr";

type IProps = {
  onCompanyInfos: (companyInfos) => void;
  showIndividualInfo?: Boolean;
};

const CREATE_TEST_COMPANY = gql`
  mutation CreateTestCompany {
    createTestCompany
  }
`;

const individualInfo = (
  <div className={styles.alertWrapper}>
    <Alert
      closable
      title="Vous rencontrez des difficultés dans la création d'un établissement ?"
      description="Si vous êtes un particulier, vous n'avez pas à créer d'établissement, ni de compte Trackdéchets."
    />
  </div>
);

const isRegisteredInfo = (
  <div className={styles.alertWrapper}>
    <Alert
      title="Cet établissement existe déjà dans Trackdéchets"
      type="error"
      description={
        <>
          Vous pouvez demander à rejoindre cet établissement auprès de son
          administrateur actuel.
        </>
      }
    />
  </div>
);

const closedCompanyError = (
  <div className={styles.alertWrapper}>
    <Alert
      title="Cet établissement est fermé"
      type="error"
      description={
        <>
          <p>
            Il ne peut pas être inscrit. Il est possible que votre SIRET ait
            changé.
          </p>
          <p>
            Pour vérifier s'il existe encore, RDV sur{" "}
            <a
              href="https://annuaire-entreprises.data.gouv.fr"
              target="_blank"
              rel="noreferrer"
            >
              https://annuaire-entreprises.data.gouv.fr
            </a>
          </p>
          <p>
            Pour déclarer un changement, RDV sur{" "}
            <a
              href="https://entreprendre.service-public.fr/vosdroits/F31479"
              target="_blank"
              rel="noreferrer"
            >
              https://entreprendre.service-public.fr/vosdroits/F31479
            </a>
          </p>
        </>
      }
    />
  </div>
);

const nonDiffusibleError = (
  <div className={styles.alertWrapper}>
    <Alert
      title="Etablissement non diffusible"
      type="error"
      description={
        <>
          <span>
            Nous n'avons pas pu récupérer les informations de cet établissement
            car il n'est pas diffusible. Veuillez nous contacter à l'adresse{" "}
            {CONTACT_EMAIL} <b>avec</b> votre certificat d'inscription au 
            répertoire des Entreprises et des Établissements (SIRENE) pour 
            pouvoir procéder à la création de l'établissement. Pour télécharger 
            votre certificat, RDV sur{" "}
          </span>
          <a
            href="https://avis-situation-sirene.insee.fr/"
            target="_blank"
            rel="noreferrer"
          >
            https://avis-situation-sirene.insee.fr/
          </a>
        </>
      }
    />
  </div>
);

/**
 * SIRET Formik field for company creation
 * The siret is checked against query { companyInfos }
 * to make sure :
 * - company exists
 * - it is not already registered in TD
 * - it is not closed
 */
export default function AccountCompanyAddSiret({
  onCompanyInfos,
  showIndividualInfo = false,
}: IProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isNonDiffusible, setIsNonDiffusible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const [searchCompany, { loading, error }] = useLazyQuery<
    Pick<Query, "companyPrivateInfos">
  >(COMPANY_PRIVATE_INFOS, {
    onCompleted: data => {
      if (data && data.companyPrivateInfos) {
        const companyInfos = data.companyPrivateInfos;
        if (companyInfos.etatAdministratif === "F") {
          setIsClosed(true);
        } else {
          // Non-diffusible mais pas encore inscrit en AnonymousCompany
          if (
            companyInfos?.statutDiffusionEtablissement === "N" &&
            !companyInfos?.isAnonymousCompany
          ) {
            setIsNonDiffusible(true);
            onCompanyInfos(null);
          } else {
            onCompanyInfos(companyInfos);
          }
          setIsDisabled(!companyInfos?.isRegistered);
          setIsRegistered(companyInfos?.isRegistered ?? false);
          setIsClosed(false);
        }
      }
    },
    fetchPolicy: "no-cache",
  });

  const [createTestCompany] =
    useMutation<Pick<Mutation, "createTestCompany">>(CREATE_TEST_COMPANY);

  return (
    <Container fluid>
      <Row>
        <Col n="12">
          {error && (
            <Alert
              type="error"
              title="Erreur"
              description={error => error.message}
            />
          )}
          <Formik
            initialValues={{ siret: "" }}
            validate={values => {
              const isValidSiret = isSiret(values.siret);
              const isValidVat = isVat(values.siret);
              if (!isValidSiret && !/^[a-zA-Z]{2}/.test(values.siret)) {
                return {
                  siret: "Vous devez entrer un SIRET de 14 chiffres",
                };
              } else if (!isValidVat && !/^[0-9]{14}$/.test(values.siret)) {
                return {
                  siret: `Vous devez entrer un numéro de TVA intracommunautaire valide. Veuillez nous contacter à l'adresse ${CONTACT_EMAIL} avec un justificatif légal du pays d'origine.`,
                };
              } else if (isValidVat && isFRVat(values.siret)) {
                return {
                  siret:
                    "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et non son numéro de TVA",
                };
              }
            }}
            onSubmit={values => {
              // reset company infos
              onCompanyInfos(null);
              searchCompany({
                variables: { clue: values.siret },
              });
            }}
          >
            {({ setFieldValue, errors, values }) => (
              <Form className={styles.companyAddForm}>
                <Field name="siret">
                  {({ field }) => {
                    return (
                      <TextInput
                        {...field}
                        label="SIRET"
                        hint="ou numéro TVA pour un transporteur de l'UE"
                        messageType={errors.siret ? "error" : ""}
                        message={errors.siret || ""}
                        onChange={e => {
                          const siret = e.target.value.split(" ").join("");
                          setIsRegistered(false);
                          setFieldValue("siret", siret);
                        }}
                        disabled={isDisabled}
                      />
                    );
                  }}
                </Field>

                {import.meta.env.VITE_ALLOW_TEST_COMPANY === "true" && (
                  <Button
                    tertiary
                    disabled={loading || isDisabled}
                    title="Génère un n°SIRET unique permettant la création d'un établissement factice pour la réalisation de vos tests"
                    onClick={() =>
                      createTestCompany().then(response => {
                        setFieldValue(
                          "siret",
                          response.data?.createTestCompany
                        );
                      })
                    }
                  >
                    Obtenir un n° SIRET factice
                  </Button>
                )}

                {isRegistered && isRegisteredInfo}
                {isRegistered && (
                  <AccountCompanyAddMembershipRequest siret={values.siret} />
                )}
                <div className={styles["submit-form"]}>
                  <Button disabled={loading || isDisabled} submit>
                    {loading ? "Chargement..." : "Valider"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
          {isNonDiffusible && nonDiffusibleError}
          {isClosed && closedCompanyError}
          {showIndividualInfo && !isDisabled && individualInfo}
        </Col>
      </Row>
    </Container>
  );
}
