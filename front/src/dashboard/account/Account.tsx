import React from "react";
import { Me } from "../../login/model";
import { localAuthService } from "../../login/auth.service";
import { RouteComponentProps, withRouter } from "react-router";

interface IProps {
  me: Me;
}

export default withRouter(function Account({
  me,
  history
}: IProps & RouteComponentProps) {
  return (
    <div className="main">
      <div className="panel">
        <div className="panel__header">
          <h3>Mon compte</h3>
        </div>

        <p>
          Vous êtes connecté en tant que {me.name}
          {` < ${me.email} >`}
        </p>
        <p>
          vous administrez la compagnie <strong>{me.company.siret}</strong>
        </p>
        <button
          className="button"
          onClick={() => {
            localAuthService.locallySignOut();
            history.push("/");
          }}
        >
          Me déconnecter
        </button>
      </div>
    </div>
  );
});
