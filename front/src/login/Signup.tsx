import { useMutation } from "@apollo/react-hooks";
import { Field } from "formik";
import React, { useState } from "react";
import { FaEnvelope, FaEye, FaIdCard, FaLock, FaPhone } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { NotificationError } from "common/components/Error";
import PasswordMeter from "common/components/PasswordMeter";
import RedErrorMessage from "common/components/RedErrorMessage";
import { SIGNUP } from "./mutations";
import styles from "./Signup.module.scss";
import { Wizard } from "./Wizard";
import { Mutation, MutationSignupArgs } from "generated/graphql/types";
import routes from "common/routes";

export default function Signup() {
  const [passwordType, setPasswordType] = useState("password");
  const [signup, { error: signupError }] = useMutation<
    Pick<Mutation, "signup">,
    MutationSignupArgs
  >(SIGNUP);

  const history = useHistory();

  return (
    <section className="section section--white">
      <div className="container">
        <Wizard
          initialValues={{
            email: "",
            name: "",
            phone: "",
            password: "",
            cgu: false,
          }}
          onSubmit={(values: any, { setSubmitting }) => {
            const { cgu, ...userInfos } = values;

            signup({ variables: { userInfos } })
              .then(_ =>
                history.push({
                  pathname: routes.signup.activation,
                  state: { signupEmail: userInfos.email },
                })
              )
              .catch(_ => {
                setSubmitting(false);
              });
          }}
        >
          <Wizard.Page title="Bienvenue" formClassName="container-narrow">
            <div>
              <h1 className="h1 tw-mb-6">Bienvenue sur Trackdéchets</h1>

              <p className="body-text">
                Trackdéchets est un produit du Ministère de la Transition
                Ecologique et Solidaire.
              </p>

              <p className="body-text">
                Son objectif : simplifier la gestion des déchets dangereux au
                quotidien. 0 papier, traçabilité en temps réel, informations
                regroupées sur un outil unique, vérification de vos
                prestataires.
              </p>

              <p className="body-text">
                Il est libre d'utilisation et utilisable par tous les acteurs de
                la filière déchets. Rejoignez-nous !
              </p>

              <p className="body-text">
                Vous vous apprêtez à créer un compte personnel. Cette étape est
                un prélable obligatoire à l'enregistrement ou au rattachement
                d'une entreprise dans Trackdéchets.
              </p>
            </div>
          </Wizard.Page>
          <Wizard.Page
            title="Informations utilisateur"
            formClassName="container-narrow"
            validate={(values: any) => {
              let errors: any = {};

              if (!values.email) {
                errors.email = "L'email est obligatoire";
              }
              if (!values.name) {
                errors.name = "Le nom et prénom sont obligatoires";
              }

              if (!values.password) {
                errors.password = "Le mot de passe ne peut pas être vide";
              }

              if (!values.cgu) {
                errors.cgu =
                  "Vous devez avoir lu les conditions générales d'utilisation";
              }

              return errors;
            }}
          >
            {" "}
            <div className="container-narrow">
              <h1 className="h1 tw-mb-6">Informations utilisateur</h1>

              <div className="form__row">
                <label>Nom et prénom</label>
                <div className="field-with-icon-wrapper">
                  <Field type="text" name="name" className="td-input" />
                  <i>
                    <FaIdCard />
                  </i>
                </div>

                <RedErrorMessage name="name" />
              </div>

              <div className="form__row">
                <label>Email</label>
                <div className="field-with-icon-wrapper">
                  <Field type="email" name="email" className="td-input" />
                  <i>
                    <FaEnvelope />
                  </i>
                </div>

                <RedErrorMessage name="email" />
              </div>

              <div className="form__row">
                <label>Téléphone (optionnel)</label>
                <div className="field-with-icon-wrapper">
                  <Field type="text" name="phone" className="td-input" />
                  <i>
                    <FaPhone />
                  </i>
                </div>
              </div>

              <div className="form__row">
                <label>Mot de passe</label>

                <Field name="password">
                  {({ field }) => {
                    return (
                      <>
                        <div className="field-with-icon-wrapper">
                          <input
                            type={passwordType}
                            {...field}
                            className="td-input"
                          />
                          <i>
                            <FaLock />
                          </i>
                        </div>
                        <span
                          className={styles.showPassword}
                          onClick={() =>
                            setPasswordType(
                              passwordType === "password" ? "text" : "password"
                            )
                          }
                        >
                          <FaEye /> <span>Afficher le mot de passe</span>
                        </span>
                        <PasswordMeter password={field.value} />
                      </>
                    );
                  }}
                </Field>

                <RedErrorMessage name="password" />
              </div>

              <div className="form__row">
                <label>
                  <Field name="cgu" type="checkbox" className="td-checkbox" />
                  Je certifie avoir lu les{" "}
                  <a
                    href="https://trackdechets.beta.gouv.fr/cgu"
                    target="_blank"
                    className="link"
                    rel="noopener noreferrer"
                  >
                    conditions générales d'utilisation
                  </a>
                  *
                </label>
              </div>

              <RedErrorMessage name="cgu" />

              {signupError && <NotificationError apolloError={signupError} />}
            </div>
          </Wizard.Page>
        </Wizard>
      </div>
    </section>
  );
}
