import React, { useState, createRef } from "react";
import { useHistory } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { Mutation, MutationSignupArgs } from "generated/graphql/types";
import { SIGNUP } from "./mutations";
import routes from "common/routes";

import {
  Container,
  Row,
  Col,
  Title,
  Text,
  TextInput,
  Button,
  Checkbox,
  Link,
  Alert,
} from "@dataesr/react-dsfr";
import styles from "./Login.module.scss";

import { CONTACT_EMAIL } from "common/config";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [signup] =
    useMutation<Pick<Mutation, "signup">, MutationSignupArgs>(SIGNUP);

  const history = useHistory();

  const nameRef = createRef<HTMLInputElement>();
  const emailRef = createRef<HTMLInputElement>();
  const passwordRef = createRef<HTMLInputElement>();
  const cguRef = createRef<HTMLInputElement>();

  const handleSubmit = event => {
    event?.preventDefault();

    if (!submittable || submitting) return;

    const userInfos = {
      email: emailRef.current?.value || "",
      name: nameRef.current?.value || "",
      password: passwordRef.current?.value || "",
    };

    setSubmitting(true);

    signup({ variables: { userInfos } })
      .then(_ => {
        setUserEmail(userInfos.email);
        setSignupCompleted(true);
      })
      .catch(_ => {
        setErrorMessage(
          _.message || "Une erreur est survenue, veuillez réessayer."
        );
        setSubmitting(false);
      });
  };

  const onConnectClick = () => {
    history.push({
      pathname: routes.login,
    });
  };

  const onChange = () => {
    const formFilled =
      !!nameRef.current?.value &&
      !!emailRef.current?.value &&
      !!passwordRef.current?.value &&
      !!cguRef.current?.checked;

    setSubmittable(formFilled);
  };

  const alert =
    errorMessage.length > 0 ? (
      <Row spacing="mb-2w">
        <Alert title="Erreur" description={errorMessage} type="error" />
      </Row>
    ) : null;

  const formContent = (
    <form onSubmit={handleSubmit}>
      <Container className={styles.centralContainer} spacing="pt-10w">
        {alert}
        <Row justifyContent="center" spacing="mb-2w">
          <Col spacing="m-auto">
            <Title as="h1" look="h3" spacing="mb-1w">
              Créer mon compte Trackdéchets
            </Title>
            <Text as="p" spacing="mb-1w">
              Vous vous apprêtez à créer votre compte utilisateur. Cette étape
              est préalable à l'enregistrement ou au rattachement d'une
              entreprise dans Trackdéchets.
            </Text>
            <Text as="p" className="fr-text--bold">
              Vos informations :
            </Text>
            <TextInput
              // @ts-ignore Ref isn't part of the interface
              ref={nameRef}
              required
              label="Nom et prénom"
              onBlur={onChange}
            />
            <TextInput
              // @ts-ignore ref
              ref={emailRef}
              required
              label="Email"
              onBlur={onChange}
            />
            <TextInput
              type={showPassword ? "text" : "password"}
              required
              label="Mot de passe"
              // @ts-ignore
              ref={passwordRef}
              onBlur={onChange}
            />
            <Button
              tertiary
              hasBorder={false}
              icon={showPassword ? "ri-eye-off-line" : "ri-eye-line"}
              iconPosition="left"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Masquer" : "Afficher"} le mot de passe
            </Button>
          </Col>
        </Row>
        <Row spacing="mb-2w">
          <Col className={styles.resetFlexCol}>
            <Checkbox
              // @ts-ignore no change event in interface / passes as remaining props
              onChange={onChange}
              label="Je certifie avoir lu les conditions générales"
              ref={cguRef}
            />
            <Link
              href="https://trackdechets.beta.gouv.fr/cgu"
              target="_blank"
              isSimple
              // @ts-ignore
              rel="noopener noreferrer"
            >
              Voir les conditions générales.
            </Link>
          </Col>
        </Row>
        <Row justifyContent="right">
          <Col className={styles.resetFlexCol}>
            <Button
              icon="ri-arrow-right-line"
              iconPosition="right"
              size="md"
              title={submitting ? "Création en cours..." : "Créer mon compte"}
              disabled={!submittable || submitting}
              onClick={handleSubmit}
            >
              Créer mon compte
            </Button>
          </Col>
        </Row>
      </Container>
    </form>
  );

  const successContent = (
    <Container className={styles.centralContainerLarge} spacing="pt-10w">
      <Row justifyContent="center" spacing="mb-2w">
        <Col spacing="m-auto pr-2w">
          <Title as="h1" look="h3" spacing="mb-1w">
            On y est presque !
          </Title>
          <Text as="p" spacing="mb-1w">
            Un email de confirmation vous a été envoyé à l'adresse{" "}
            <strong>{userEmail}</strong> 📨
          </Text>
          <Text as="p">👉 Il peut mettre quelques minutes à arriver</Text>
          <Text as="p">👉 Vérifiez vos spams ou indésirables</Text>
          <Text as="p">👉 Ajoutez info@trackdechets.beta.gouv.fr à 
            vos contacts</Text>
          <Text as="p">
            👉 Si vous n'avez pas reçu l'email de confirmation au bout d'une
            heure, vous pouvez le renvoyer depuis{" "}
            <Link href={routes.resendActivationEmail} isSimple>
              cette page
            </Link>
          </Text>
          <Text as="p">
            Le message peut ne pas arriver pour les raisons suivantes :<br />-
            adresse email erronée
            <br />- antivirus ou suite logicielle de sécurité trop restrictifs
          </Text>
          <Text as="p">
            Pour finaliser votre inscription, cliquez sur le lien qui vous a été
            envoyé par email. Vous pourrez ensuite vous connecter à
            Trackdéchets. 🚀
          </Text>
          <Text as="p">
            Des questions, des interrogations ? N'hésitez pas à nous contacter
            via{" "}
            <Link
              href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
              isSimple
            >
              la FAQ
            </Link>
            .
          </Text>
        </Col>
      </Row>
      <Row justifyContent="right">
        <Col className={styles.resetFlexCol}>
          <Button size="md" title="Se connecter" onClick={onConnectClick}>
            Se connecter
          </Button>
        </Col>
      </Row>
    </Container>
  );

  return (
    <div className={styles.onboardingWrapper}>
      {signupCompleted ? successContent : formContent}
    </div>
  );
}
