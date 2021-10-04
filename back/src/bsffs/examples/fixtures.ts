function detenteurInput(siret: string) {
  return {
    company: {
      siret,
      name: "Client",
      address: "5 boulevard Longchamp, 13001 MARSEILLE",
      contact: "Le directeur",
      phone: "04 00 00 00 00",
      mail: "jean@magasin1.fr"
    }
  };
}

function operateurInput(siret: string) {
  return { company: operateurCompanyInput(siret) };
}

function operateurCompanyInput(siret: string) {
  return {
    siret,
    name: "Les gentlemen du froid",
    address: "1 rue de paradis, 75010 PARIS",
    contact: "Le directeur",
    phone: "01 00 00 00 00",
    mail: "contact@gentlemandufroid.fr"
  };
}

export default {
  detenteurInput,
  operateurInput
};
