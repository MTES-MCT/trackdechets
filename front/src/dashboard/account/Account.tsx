import gql from "graphql-tag";
import React, { useRef, useState } from "react";
import { ApolloConsumer } from "react-apollo";
import { FaCopy } from "react-icons/fa";
import { RouteComponentProps, withRouter } from "react-router";
import { localAuthService } from "../../login/auth.service";
import { Me } from "../../login/model";
import EditProfile from "./EditProfile";
import ImportNewUser from "./InviteNewUser";

interface IProps {
  me: Me;
}

const API_KEY = gql`
  query ApiKey {
    apiKey
  }
`;

export default withRouter(function Account({
  me,
  history
}: IProps & RouteComponentProps) {
  const [apiKey, setApiKey] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const tokenRef = useRef<any>(undefined);

  function copyTokenToClipboard() {
    tokenRef.current.select();
    document.execCommand("copy");
  }

  return (
    <div className="main">
      <div className="panel">
        <div className="panel__header">
          <h3>Mon compte</h3>
        </div>

        <p>
          Vous êtes connecté en tant que <strong>{me.name}</strong>
          <br />
          Email: {me.email}
          <br />
          Téléphone: {me.phone}
        </p>
        {!showUserForm && (
          <button
            className="button"
            onClick={() => setShowUserForm(!showUserForm)}
          >
            Editer mon profil
          </button>
        )}
        {showUserForm && (
          <EditProfile
            me={me}
            onSubmit={() => setShowUserForm(!showUserForm)}
          />
        )}

        <h4>Entreprise(s) associée(s):</h4>
        {me.companies.map(c => (
          <React.Fragment key={c.siret}>
            <address>
              {c.name}
              <br />
              Numéro SIRET: {c.siret}
              <br />
              {c.address}
            </address>
            {c.admin && c.admin.id === me.id && (
              <ImportNewUser siret={c.siret} />
            )}
          </React.Fragment>
        ))}

        <h4>Intégration API</h4>
        <p>
          Si vous souhaitez utiliser nos API pour vous intégrer avec
          Trackdéchets, vous aurez besoin d'une clé d'API pour authentifier vos
          appels. Vous pouvez la générer ci-dessous.
        </p>

        {apiKey ? (
          <div className="form__group">
            <label>Token</label>
            <div className="input__group">
              <input type="text" value={apiKey} ref={tokenRef} readOnly />
              <button
                className="button icon-button"
                onClick={copyTokenToClipboard}
              >
                <FaCopy />
              </button>
            </div>
          </div>
        ) : (
          <ApolloConsumer>
            {client => (
              <div>
                <button
                  className="button"
                  onClick={async () => {
                    const { data } = await client.query<{ apiKey: string }>({
                      query: API_KEY
                    });
                    setApiKey(data.apiKey);
                  }}
                >
                  Générer une clé
                </button>
              </div>
            )}
          </ApolloConsumer>
        )}

        <h4>Déconnexion</h4>
        <p>
          <button
            className="button"
            onClick={() => {
              localAuthService.locallySignOut();
              history.push("/");
            }}
          >
            Me déconnecter
          </button>
        </p>
      </div>
    </div>
  );
});
