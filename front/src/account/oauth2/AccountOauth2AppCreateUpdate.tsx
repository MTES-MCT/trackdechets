import React from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Formik, Form, Field, FieldArray } from "formik";
import * as yup from "yup";
import { Label, Loader, RedErrorMessage } from "common/components";
import { IconTrash } from "common/components/Icons";
import {
  ApplicationInput,
  Mutation,
  MutationCreateApplicationArgs,
  MutationUpdateApplicationArgs,
  Query,
} from "generated/graphql/types";
import styles from "./AccountOauth2AppCreateUpdate.module.scss";
import { useHistory } from "react-router";
import routes from "common/routes";
import { NotificationError } from "common/components/Error";
import {
  APPLICATION,
  APPLICATIONS,
  CREATE_APPLICATION,
  UPDATE_APPLICATION,
} from "./queries";

const ApplicationInputSchema: yup.SchemaOf<ApplicationInput> = yup.object({
  name: yup.string().required(),
  logoUrl: yup
    .string()
    .matches(/^https?:\/\//i, "URL invalide")
    .required(),
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
});

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
  >(CREATE_APPLICATION, { refetchQueries: [APPLICATIONS] });

  const [
    updateApplication,
    { loading: updateApplicationLoading, error: updateApplicationError },
  ] = useMutation<
    Pick<Mutation, "updateApplication">,
    MutationUpdateApplicationArgs
  >(UPDATE_APPLICATION);

  const history = useHistory();

  const initialValues = {
    name: "",
    logoUrl: "",
    redirectUris: [],
    ...(data?.application
      ? {
          name: data.application.name,
          logoUrl: data.application.logoUrl,
          redirectUris: data.application.redirectUris,
        }
      : {}),
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
              variables: { id: data.application.id, input: values },
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
