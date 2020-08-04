import { useMutation } from "@apollo/react-hooks";
import { Field } from "formik";
import React, { useState } from "react";
import { FaEnvelope, FaEye, FaIdCard, FaLock, FaPhone } from "react-icons/fa";
import { Link, useHistory } from "react-router-dom";
import { NotificationError } from "../common/Error";
import PasswordMeter from "../common/PasswordMeter";
import RedErrorMessage from "../common/RedErrorMessage";
import { SIGNUP } from "./mutations";
import "./Signup.scss";
import { Wizard } from "./Wizard";
import { Mutation, MutationSignupArgs } from "../generated/graphql/types";

export default function Signup() {
  const [passwordType, setPasswordType] = useState("password");
  const [signup, { error: signupError }] = useMutation<
    Pick<Mutation, "signup">,
    MutationSignupArgs
  >(SIGNUP);

  const history = useHistory();

  return (
    <section className="section section-white">
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
                  pathname: "/signup/activation",
                  state: { signupEmail: userInfos.email },
                })
              )
              .catch(_ => {
                setSubmitting(false);
              });
          }}
        >
          <Wizard.Page title="Bienvenue">
            <h1>Bienvenue sur Trackdéchets</h1>
            <p>
              Trackdéchets est un produit du Ministère de la Transition
              Ecologique et Solidaire.
            </p>

            <p>
              Son objectif : simplifier la gestion des déchets dangereux au
              quotidien. 0 papier, traçabilité en temps réel, informations
              regroupées sur un outil unique, vérification de vos prestataires.
            </p>

            <p>
              Il est libre d'utilisation et utilisable par tous les acteurs de
              la filière déchets. Rejoignez-nous !
            </p>

            <p>
              Vous vous apprêtez à créer un compte personnel. Cette étape est un
              prélable obligatoire à l'enregistrement ou au rattachement d'une
              entreprise dans Trackdéchets.
            </p>
          </Wizard.Page>
          <Wizard.Page
            title="Informations utilisateur"
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
            <h1>Informations utilisateur</h1>

            <div className="form__group">
              <label>Nom et prénom*</label>
              <div className="search__group">
                <Field type="text" name="name" />
                <button
                  type="button"
                  className="overlay-button"
                  aria-label="Recherche"
                >
                  <FaIdCard />
                </button>
              </div>

              <RedErrorMessage name="name" />
            </div>

            <div className="form__group">
              <label>Email*</label>
              <div className="search__group">
                <Field type="text" name="email" />
                <button
                  type="button"
                  className="overlay-button"
                  aria-label="Recherche"
                >
                  <FaEnvelope />
                </button>
              </div>

              <RedErrorMessage name="email" />
            </div>

            <div className="form__group">
              <label>Téléphone</label>
              <div className="search__group">
                <Field type="text" name="phone" />
                <button
                  type="button"
                  className="overlay-button"
                  aria-label="Recherche"
                >
                  <FaPhone />
                </button>
              </div>
            </div>

            <div className="form__group">
              <label>Mot de passe*</label>
              <div className="search__group">
                <Field name="password">
                  {({ field }) => {
                    return (
                      <>
                        <input type={passwordType} {...field} />
                        <button
                          type="button"
                          className="overlay-button"
                          aria-label="Recherche"
                        >
                          <FaLock />
                        </button>
                        <span
                          className="show-password"
                          onClick={() =>
                            setPasswordType(
                              passwordType === "password" ? "text" : "password"
                            )
                          }
                        >
                          <FaEye /> Afficher le mot de passe
                        </span>
                        <PasswordMeter password={field.value} />
                      </>
                    );
                  }}
                </Field>
              </div>

              <RedErrorMessage name="password" />
            </div>

            <div className="form__group">
              <label>
                <Field name="cgu" type="checkbox" />
                Je certifie avoir lu les{" "}
                <a
                  href="https://trackdechets.beta.gouv.fr/cgu"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  conditions générales d'utilisation
                </a>
                *
              </label>
            </div>

            <RedErrorMessage name="cgu" />

            {signupError && <NotificationError apolloError={signupError} />}
          </Wizard.Page>
        </Wizard>
      </div>
    </section>
  );
}
