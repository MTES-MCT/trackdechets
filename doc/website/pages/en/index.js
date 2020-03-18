/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");

const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
  render() {
    const { siteConfig, language = "" } = this.props;
    const { baseUrl, docsUrl } = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ""}`;
    const langPart = `${language ? `${language}/` : ""}`;
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = props => (
      <div className="homeContainer lightBackground">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const Logo = props => (
      <div className="projectLogo">
        <img src={props.img_src} alt="Project Logo" />
      </div>
    );

    const ProjectTitle = props => (
      <h2 className="projectTitle">{props.tagline}</h2>
    );

    const Button = props => (
      <div className="pluginWrapper buttonWrapper">
        <a
          className="button largeButton"
          href={props.href}
          target={props.target}
        >
          {props.children}
        </a>
      </div>
    );

    return (
      <SplashContainer>
        <Logo img_src={`${baseUrl}img/undraw_monitor.svg`} />
        <div className="inner align-left">
          <ProjectTitle tagline={siteConfig.tagline} />
          <Button href={docUrl("introduction")}>Démarrer avec l'API</Button>
        </div>
      </SplashContainer>
    );
  }
}

class Index extends React.Component {
  render() {
    const { config: siteConfig, language = "" } = this.props;
    const { baseUrl } = siteConfig;

    const Block = props => (
      <Container
        padding={["bottom", "top"]}
        id={props.id}
        background={props.background}
      >
        <GridBlock
          align="left"
          contents={props.children}
          layout={props.layout}
        />
      </Container>
    );

    const WhatIsTrackdechets = () => (
      <Block id="whatistd">
        {[
          {
            content:
              "Trackdéchets est un service gratuit développé " +
              "par le Ministère de la Transition Écologique et Solidaire afin de:" +
              "<br/> " +
              "<ul>" +
              "<li>simplifier la traçabilité des déchets dangereux </li>" +
              "<li>" +
              "assurer aux acteurs de la filière que leurs entreprises " +
              "partenaires disposent bien des autorisations nécessaires " +
              "pour collecter, regrouper et/ou traiter leurs déchets dangereux" +
              "</li>" +
              "</ul>",
            image: `${baseUrl}img/undraw_factory.svg`,
            imageAlign: "right",
            title: "La mission de Trackdéchets ?"
          }
        ]}
      </Block>
    );

    const WhyTrackdechets = () => (
      <Block id="whytd" background="light">
        {[
          {
            content:
              "Trackdéchets assure un rôle d’interface qui permet le partage " +
              "d’informations entre les différents acteurs de la chaîne de traçabilité." +
              "<ul>" +
              "<li>" +
              "Gagnez du temps et de l’argent : une fois connecté, fini le papier et plus " +
              "besoin de se connecter à de très nombreux acteurs aux processus métiers et " +
              "SI divers pour assurer le suivi." +
              "</li>" +
              "<li>" +
              "Anticipez les évolutions réglementaires en matière de responsabilité de la filière : " +
              "Trackdéchets s’insère directement dans le cadre réglementaire et facilite la prise " +
              "en compte des évolutions" +
              "</ul>",
            image: `${baseUrl}img/undraw_instant_information.svg`,
            imageAlign: "left",
            title: "Pourquoi se connecter à Trackdéchets ?"
          }
        ]}
      </Block>
    );

    const HowDoesItWork = () => (
      <Block id="howdoesitwork">
        {[
          {
            content:
              "Trackdéchets a deux composantes distinctes : un moteur de gestion des BSD " +
              "(constitutif de l’API GraphQL Trackdéchets) et une interface graphique. " +
              "Que vous soyez professionnel du déchet (SI métier) ou un SaaS de gestion des déchets, " +
              "en vous connectant à l’API Trackdéchets, vous pourrez échanger des données avec tous " +
              "les acteurs connectés à Trackdéchets et rendre possible la dématérialisation totale " +
              "de la chaîne de traçabilité du BSD.",
            image: `${baseUrl}img/undraw_online_transactions.svg`,
            imageAlign: "right",
            title: "Comment ça marche ?"
          }
        ]}
      </Block>
    );

    const Showcase = () => {
      if ((siteConfig.users || []).length === 0) {
        return null;
      }

      const showcase = siteConfig.users
        .filter(user => user.pinned)
        .map(user => (
          <img
            key={user.caption}
            src={user.image}
            alt={user.caption}
            title={user.caption}
          />
        ));

      return (
        <div className="productShowcaseSection paddingBottom">
          <h2>Ils sont connectés à l'API Trackdéchets</h2>
          <p></p>
          <div className="logos">{showcase}</div>
        </div>
      );
    };

    return (
      <div>
        <HomeSplash siteConfig={siteConfig} language={language} />
        <div className="mainContainer">
          <WhatIsTrackdechets />
          <WhyTrackdechets />
          <HowDoesItWork />
          <Showcase />
        </div>
      </div>
    );
  }
}

module.exports = Index;
