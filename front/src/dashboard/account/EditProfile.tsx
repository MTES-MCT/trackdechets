import { Field, Form, Formik } from "formik";
import React from "react";
import { Me } from "../../login/model";
import "./EditProfile.scss";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { GET_ME } from "../Dashboard";
import UserType from "../../login/UserType";

const EDIT_PROFILE = gql`
  mutation EditProfile($name: String!, $phone: String!, $email: String!, $userType: [String]) {
    editProfile(name: $name, phone: $phone, email: $email, userType: $userType) {
      name
      email
      phone
      userType
    }
  }
`;

type Props = { me: Me; onSubmit: () => void };
export default function EditProfile({ me, onSubmit }: Props) {
  return (
    <div className="EditProfile">
      <Mutation
        mutation={EDIT_PROFILE}
        update={(cache, { data: { editProfile } }) => {
          const query = cache.readQuery<{ me: Me }>({ query: GET_ME });
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
              phone: me.phone,
              userType: me.userType
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
                    <Field type="email" name="email" disabled />
                  </label>
                </div>
                <div className="form__group">
                  <label>
                    Téléphone
                    <Field type="text" name="phone" />
                  </label>
                </div>
                <div className="form__group">
                  <label>
                    Vous êtes
                    <Field name="userType" component={UserType} />
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
