import React from "react";
import zxcvbn from "zxcvbn";
import { connect } from "formik";
import { FaAward } from "react-icons/fa";

export default connect<{}, { password: string }>(function PasswordMeter({
  formik
}) {
  const password = formik.values.password;
  if (!password) return <span />;

  const { score } = zxcvbn(password);

  return (
    <span className="password-meter">
      <FaAward /> Difficulté du mot de passe: {createPasswordLabel(score)}
    </span>
  );
});

function createPasswordLabel(score: number): string {
  switch (score) {
    case 0:
      return "Très faible";
    case 1:
      return "Faible";
    case 2:
      return "Correct";
    case 3:
      return "Bon";
    case 4:
      return "Très bon";
    default:
      return "Faible";
  }
}
