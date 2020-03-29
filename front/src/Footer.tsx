import React from "react";
import LazyLoad from "react-lazyload";
import { Link } from "react-router-dom";
import styles from "./Footer.module.scss";

export default function Footer() {
  const { REACT_APP_DEVELOPERS_ENDPOINT } = process.env;
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__logo">
          <LazyLoad>
            <img
              className={styles["full-width"]}
              src="/logo-mtes-mef.svg"
              alt=""
            />
          </LazyLoad>
          <div className={styles["logo-text"]}>
            <LazyLoad>
              <img src="/logo-fabnum.svg" alt="" />
            </LazyLoad>
            <small>
              Trackdéchets est un service numérique de l'Etat incubé à la
              Fabrique Numérique du Ministère de la Transition écologique et
              solidaire, membre du réseau d’incubateurs{" "}
              <a href="https://beta.gouv.fr">beta.gouv.fr</a>
            </small>
          </div>
        </div>
        <ul className="footer__links">
          <li>
            <h4>À propos de Trackdéchets</h4>
          </li>
          <li>
            <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">
              Nous contacter
            </a>
          </li>
          <li>
            <a href="https://faq.trackdechets.fr/">Foire aux questions</a>
          </li>
          <li>
            <a href={REACT_APP_DEVELOPERS_ENDPOINT}>Espace développeurs</a>
          </li>
          <li>
            <Link to="/cgu">Conditions générales d'utilisation</Link>
          </li>
          <li>
            <a
              href="/Politique de confidentialité.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Politique de confidentialité
            </a>
          </li>
          <li>
            <Link to="/stats">Statistiques</Link>
          </li>
          <li>
            <a href="https://drive.google.com/open?id=1To5yrG6jO3-bh9jRqyi334mXT1LqGCjE">
              Boite à outils communication
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
