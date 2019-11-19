import { Field, Form, Formik } from "formik";
import React from "react";
import { Me } from "../login/model";
import { Mutation } from "@apollo/react-components";
import gql from "graphql-tag";

const GET_ME = gql`
  {
    me {
      id
      name
      email
      phone
      companies {
        id
        admins {
          id
          name
        }
        siret
        name
        address
        securityCode
        companyTypes
      }
    }
  }
`;

const EDIT_PROFILE = gql`
  mutation EditProfile($name: String!, $phone: String!, $email: String!) {
    editProfile(name: $name, phone: $phone, email: $email) {
      name
      email
      phone
    }
  }
`;

type Props = { me: Me; onSubmit: () => void };
export default function EditProfile({ me, onSubmit }: Props) {
  return (
    <div className="account__form">
      <Mutation
        mutation={EDIT_PROFILE}
        update={(cache, { data: { editProfile } }) => {
          const query = cache.readQuery({ query: GET_ME });
          if (!query || !query.me) {
            return;
          }
          cache.writeQuery({
            query: GET_ME,
            data: { me: { ...query.me, ...editProfile } }
          });
        }}
      >
        {(editProfile, { data }) => (
          <Formik
            initialValues={{
              name: me.name,
              email: me.email,
              phone: me.phone
            }}
            onSubmit={(values, { setSubmitting }) => {
              editProfile({ variables: values }).then(_ => {
                setSubmitting(false);
                onSubmit();
              });
            }}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form__group">
                  <label>
                    Nom
                    <Field type="text" name="name" />
                  </label>
                </div>
                <div className="form__group">
                  <label>
                    Email
                    <Field type="email" name="email" />
                  </label>
                </div>
                <div className="form__group">
                  <label>
                    Téléphone
                    <Field type="text" name="phone" />
                  </label>
                </div>
                <button
                  type="submit"
                  className="button"
                  disabled={isSubmitting}
                >
                  Enregistrer
                </button>
              </Form>
            )}
          </Formik>
        )}
      </Mutation>
    </div>
  );
}
