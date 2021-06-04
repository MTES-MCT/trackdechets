import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";

const FeatureList = [
  {
    title: "La mission de Trackdéchets",
    Svg: require("../../static/img/undraw_factory.svg").default,
    description: (
      <>
        Trackdéchets est une plateforme développé par le Ministère de la
        Transition Écologique et Solidaire afin de simplifier la gestion
        quotidienne de la traçabilité des déchets dangereux pour tous les
        acteurs de la chaîne, grâce à la dématérialisation du bordereau de suivi
        de déchets dangereux.
      </>
    ),
  },
  {
    title: "Pourquoi se connecter à Trackdéchets ?",
    Svg: require("../../static/img/undraw_instant_information.svg").default,
    description: (
      <>
        Trackdéchets assure un rôle d’interface qui permet le partage
        d’informations entre les différents acteurs de la chaîne de traçabilité.
      </>
    ),
  },
  {
    title: "Comment ça marche ?",
    Svg: require("../../static/img/undraw_online_transactions.svg").default,
    description: (
      <>
        Trackdéchets a deux composantes distinctes : un moteur de gestion des
        BSD (constitutif de l’API GraphQL Trackdéchets) et une interface
        graphique. Que vous soyez professionnel du déchet (SI métier) ou un SaaS
        de gestion des déchets, en vous connectant à l’API Trackdéchets, vous
        pourrez échanger des données avec tous les acteurs connectés à
        Trackdéchets et rendre possible la dématérialisation totale de la chaîne
        de traçabilité du BSD.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
