/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    const docsUrl = this.props.config.docsUrl;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ""}`;
    const langPart = `${language ? `${language}/` : ""}`;
    return `${baseUrl}${docsPart}${langPart}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : "") + doc;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            )}
          </a>
          <div>
            <h5>Trackdéchets</h5>
            <a href={this.props.config.trackdechetsUrl}>Site web</a>
            <a href={this.props.config.roadmapUrl}>Roadmap produit</a>
            <a href={this.props.config.repoUrl}>Code source</a>
            <a
              className="github-button"
              href={this.props.config.repoUrl}
              data-icon="octicon-star"
              data-count-href="/facebook/docusaurus/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub"
            >
              Star
            </a>
          </div>
          <div>
            <h5>Communauté</h5>
            <a href={this.props.config.forumUrl}>Forum technique</a>
          </div>
          <div>
            <h5>API</h5>
            <a href={`${this.props.config.baseUrl}docs/apireference`}>
              Référence de l'API
            </a>
            <a href={this.props.config.statusUrl}>Statut de l'API</a>
            <a href={this.props.config.playgroundUrl}>Playground</a>
          </div>
        </section>

        <a
          href="https://beta.gouv.fr/incubateurs/mtes.html"
          target="_blank"
          rel="noreferrer noopener"
          className="fbOpenSource"
        >
          <img
            src={`${this.props.config.baseUrl}img/logo-mtes-mef.svg`}
            alt="La Fabrique Numérique"
            width="170"
            height="45"
          />
        </a>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
