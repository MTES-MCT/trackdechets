import * as React from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Formik, Form, Field, FieldArray } from "formik";
import * as yup from "yup";
import {
  Label,
  List,
  ListItem,
  Modal,
  RedErrorMessage,
} from "common/components";
import { IconTrash } from "common/components/Icons";
import {
  ApplicationInput,
  Mutation,
  MutationCreateApplicationArgs,
  Query,
} from "generated/graphql/types";
import styles from "./Applications.module.scss";

const ApplicationFragment = gql`
  fragment ApplicationFragment on Application {
    id
    name
    logoUrl
    redirectUris
    clientSecret
  }
`;

const MY_APPLICATIONS = gql`
  query GetMyApplications {
    myApplications {
      ...ApplicationFragment
    }
  }
  ${ApplicationFragment}
`;

const CREATE_APPLICATION = gql`
  mutation CreateApplication($input: ApplicationInput!) {
    createApplication(input: $input) {
      ...ApplicationFragment
    }
  }
  ${ApplicationFragment}
`;

interface CreateApplicationModalProps {
  onClose: () => void;
}

const ApplicationInputSchema: yup.SchemaOf<ApplicationInput> = yup.object({
  name: yup.string().required(),
  logoUrl: yup.string().url().required(),
  redirectUris: yup
    .array()
    .of(yup.string().url().required())
    .required()
    .min(1, "Vous devez préciser au moins une URL de redirection"),
});

function CreateApplicationModal({ onClose }: CreateApplicationModalProps) {
  const [createApplication, { loading }] = useMutation<
    Pick<Mutation, "createApplication">,
    MutationCreateApplicationArgs
  >(CREATE_APPLICATION, { refetchQueries: [MY_APPLICATIONS] });

  return (
    <Modal ariaLabel="Créer une application OAuth2" onClose={onClose} isOpen>
      <h2 className="td-modal-title">Créer une application OAuth2</h2>
      <Formik
        initialValues={{ name: "", logoUrl: "", redirectUris: [""] }}
        validationSchema={ApplicationInputSchema}
        onSubmit={async values => {
          await createApplication({ variables: { input: values } });
          onClose();
        }}
      >
        {({ values }) => (
          <Form>
            <div className="form__row">
              <Label>Nom</Label>
              <Field name="name" className="td-input" placeholder="Acme" />
              <RedErrorMessage name="name" />
            </div>

            <div className="form__row">
              <Label>URL du logo</Label>
              <Field
                type="url"
                name="logoUrl"
                className="td-input"
                placeholder="https://acme.com/logo.png"
              />
              <RedErrorMessage name="logoUrl" />
            </div>

            <div className="form__row">
              <Label>URLs de redirection</Label>
              <FieldArray name="redirectUris">
                {({ push, remove }) => (
                  <>
                    {values.redirectUris.map((redirectUri, index) => (
                      <React.Fragment key={index}>
                        <div className={styles.InputGroup}>
                          <Field
                            type="url"
                            name={`redirectUris.${index}`}
                            className="td-input"
                            placeholder="https://acme.com/callback"
                          />
                          <button
                            type="button"
                            className="btn btn--outline-primary"
                            onClick={() => remove(index)}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </React.Fragment>
                    ))}
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => push("")}
                    >
                      Ajouter une URL de redirection
                    </button>
                  </>
                )}
              </FieldArray>
              <RedErrorMessage name="redirectUris" />
            </div>

            <div className="td-modal-actions">
              <button className="btn btn--outline-primary" onClick={onClose}>
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? "Création..." : "Créer"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

export function Applications() {
  const { data } = useQuery<Pick<Query, "myApplications">>(MY_APPLICATIONS);
  const [isCreating, setIsCreating] = React.useState(false);
  const myApplications = data?.myApplications ?? [];

  return (
    <div className={styles.Applications}>
      <h5 className="h5 tw-font-bold tw-mb-4">Applications OAuth2</h5>
      {myApplications.map(application => (
        <div key={application.id} className={styles.Application}>
          <div className={styles.ApplicationLogo}>
            <img src={application.logoUrl} alt="" width="100" height="100" />
          </div>
          <div className={styles.ApplicationDetails}>
            <p>
              <strong>{application.name}</strong>
            </p>
            <p>Client id : {application.id}</p>
            <p>Client secret : {application.clientSecret}</p>
            <p>URLs de redirection :</p>
            <List>
              {application.redirectUris.map((redirectUri, index) => (
                <ListItem key={index}>{redirectUri}</ListItem>
              ))}
            </List>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => setIsCreating(true)}
        disabled={myApplications.length > 0}
      >
        Créer une application
      </button>
      {isCreating && (
        <CreateApplicationModal onClose={() => setIsCreating(false)} />
      )}
    </div>
  );
}
