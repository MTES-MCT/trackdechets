import React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Formik, Form, Field, FieldArray } from "formik";
import * as yup from "yup";
import { Label, Loader, RedErrorMessage } from "common/components";
import { IconTrash } from "common/components/Icons";
import {
  ApplicationGoal,
  CreateApplicationInput,
  Mutation,
  MutationCreateApplicationArgs,
  MutationUpdateApplicationArgs,
  Query,
} from "generated/graphql/types";
import styles from "./AccountOauth2AppCreateUpdate.module.scss";
import { useHistory } from "react-router";
import routes from "common/routes";
import { NotificationError } from "common/components/Error";
import Tooltip from "common/components/Tooltip";
import {
  APPLICATION,
  MY_APPLICATIONS,
  CREATE_APPLICATION,
  UPDATE_APPLICATION,
} from "./queries";

const ApplicationInputSchema: yup.SchemaOf<CreateApplicationInput> = yup.object(
  {
    name: yup.string().required(),
    logoUrl: yup
      .string()
      .matches(/^https?:\/\//i, "URL invalide")
      .required(),
    goal: yup.mixed<ApplicationGoal>().required(),
    redirectUris: yup
      .array()
      .of(
        yup
          .string()
          .matches(/^https?:\/\//i, "URL invalide")
          .required("L'URL ne peut pas être vide")
      )
      .required()
      .min(1, "Vous devez préciser au moins une URL de redirection"),
  }
);

type AccountOauth2AppCreateUpdateProps = {
  id?: string;
};

export default function AccountOauth2AppCreateUpdate({
  id,
}: AccountOauth2AppCreateUpdateProps) {
  const { data, loading: getApplicationLoading } = useQuery<
    Pick<Query, "application">
  >(APPLICATION, {
    skip: !id,
    variables: { id },
    fetchPolicy: "network-only",
  });

  const [
    createApplication,
    { loading: createApplicationLoading, error: createApplicationError },
  ] = useMutation<
    Pick<Mutation, "createApplication">,
    MutationCreateApplicationArgs
  >(CREATE_APPLICATION, { refetchQueries: [MY_APPLICATIONS] });

  const [
    updateApplication,
    { loading: updateApplicationLoading, error: updateApplicationError },
  ] = useMutation<
    Pick<Mutation, "updateApplication">,
    MutationUpdateApplicationArgs
  >(UPDATE_APPLICATION);

  const history = useHistory();

  const initialValues = {
    name: data?.application?.name ?? "",
    logoUrl: data?.application?.logoUrl ?? "",
    goal: data?.application?.goal ?? ApplicationGoal.Personnal,
    redirectUris: data?.application?.redirectUris ?? [],
  };

  if (getApplicationLoading) {
    return <Loader />;
  }

  return (
    <div className="panel">
      <Formik
        initialValues={initialValues}
        validationSchema={ApplicationInputSchema}
        onSubmit={async values => {
          if (data?.application?.id) {
            await updateApplication({
              variables: {
                id: data.application.id,
                input: values,
              },
            });
          } else {
            await createApplication({ variables: { input: values } });
          }
          history.push(routes.account.oauth2.list);
        }}
      >
        {({ values, errors }) => (
          <Form className={styles.oauth2AppAddForm}>
            <div className={styles.field}>
              <Label className={`${styles.bold}`}>Nom</Label>
              <div className={styles.field__value}>
                <Field
                  type="text"
                  name="name"
                  className={`td-input ${styles.textField}`}
                />
                <RedErrorMessage name="name" />
              </div>
            </div>
            {(!data?.application?.id || !data?.application?.goal) && (
              <div className={styles.field}>
                <Label id="goal-radio-group" className={`${styles.bold}`}>
                  Cette application gère les données de :
                  <Tooltip
                    msg="Le but principal de cette app est d’accéder aux données de la
                  plate-forme Trackdéchets et de les utiliser au nom de :"
                  />
                </Label>
                <div className={styles.field__value}>
                  <div role="group" aria-labelledby="goal-radio-group">
                    <label className="tw-block">
                      <Field
                        type="radio"
                        name="goal"
                        value={ApplicationGoal.Personnal}
                        className="td-radio"
                      />
                      Votre propre entreprise
                    </label>
                    <label className="tw-block">
                      <Field
                        type="radio"
                        name="goal"
                        value={ApplicationGoal.Clients}
                        className="td-radio"
                      />
                      Vos clients{" "}
                      <Tooltip
                        msg="Par exemple un développeur d'une solution logicielle SaaS permettant de
                    gérer les expéditions de déchets pour le compte de producteurs"
                      />
                    </label>
                  </div>
                  <RedErrorMessage name="goal" />
                  {values.goal === ApplicationGoal.Clients && (
                    <div className="notification tw-mt-2">
                      Si vous développez une application pour le compte de
                      clients, vous êtes soumis à la Section 5.2.2 des{" "}
                      <a
                        className="tw-underline"
                        href="https://trackdechets.beta.gouv.fr/cgu"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        conditions générales d'utilisation.
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={styles.field}>
              <Label className={`${styles.bold}`}>URL du logo</Label>
              <div className={styles.field__value}>
                <Field
                  type="url"
                  name="logoUrl"
                  className={`td-input ${styles.textField}`}
                  placeholder="https://acme.com/logo.png"
                />
                <RedErrorMessage name="logoUrl" />
              </div>
            </div>

            <div className={styles.field}>
              <Label className={`${styles.bold}`}>URLs de redirection</Label>
              <div className={styles.field__value}>
                <FieldArray name="redirectUris">
                  {({ push, remove }) => (
                    <>
                      {values.redirectUris.map((_, index) => (
                        <React.Fragment key={index}>
                          <div className={styles.InputGroup}>
                            <Field
                              type="url"
                              name={`redirectUris.${index}`}
                              className={`td-input ${styles.textField}`}
                              placeholder="https://acme.com/callback"
                            />
                            <button
                              type="button"
                              className="btn btn--outline-primary"
                              onClick={() => remove(index)}
                            >
                              <IconTrash />
                            </button>
                            <div>
                              {errors.redirectUris &&
                                Array.isArray(errors.redirectUris) && (
                                  <div className="error-message">
                                    {errors.redirectUris[index]}
                                  </div>
                                )}
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                      <button
                        type="button"
                        className={`btn btn--primary ${styles.addUrlButton}`}
                        onClick={() => push("")}
                      >
                        Ajouter une URL de redirection
                      </button>
                    </>
                  )}
                </FieldArray>
                {errors.redirectUris && !Array.isArray(errors.redirectUris) && (
                  <RedErrorMessage name="redirectUris" />
                )}
              </div>
            </div>
            <div className="td-modal-actions">
              <button
                className="btn btn--outline-primary"
                onClick={() => history.goBack()}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={createApplicationLoading || updateApplicationLoading}
              >
                {createApplicationLoading || updateApplicationLoading
                  ? "Envoi..."
                  : data?.application?.id
                  ? "Modifier"
                  : "Créer"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
      {createApplicationError && (
        <NotificationError apolloError={createApplicationError} />
      )}
      {updateApplicationError && (
        <NotificationError apolloError={updateApplicationError} />
      )}
    </div>
  );
}
