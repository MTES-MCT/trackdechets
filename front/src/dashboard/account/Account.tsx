import React, { useState } from "react";
import { Me } from "../../login/model";
import { localAuthService } from "../../login/auth.service";
import { RouteComponentProps, withRouter } from "react-router";
import EditProfile from "./EditProfile";

interface IProps {
  me: Me;
}

export default withRouter(function Account({
  me,
  history
}: IProps & RouteComponentProps) {
  const [showUserForm, setShowUserForm] = useState(false);

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

        <h4>Entreprise administrée:</h4>
        <address>
          {me.company.name}
          <br />
          Numéro SIRET: {me.company.siret}
          <br />
          {me.company.address}
        </address>
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
