import React from "react";
import "./Faq.scss";

export default function Faq() {
  return (
    <div className="container">
      <h1>Foire Aux Questions</h1>
      <h2>Questions génériques sur Trackdéchets</h2>
      <h3>Trackdéchets c’est un service public ?</h3>
      <p>
        Trackdéchets est un produit numérique conçu au sein de l’incubateur du
        Ministère de la Transition Écologique et Solidaire. Il est donc gratuit
        et accessible à toute personne qui en aurait l’usage. Ce produit est
        co-construit avec les utilisateurs, les fonctionnalités sont donc
        amenées à évoluer.
      </p>
      <h3>Trackdéchets, c’est un outil est à destination de qui ?</h3>
      <p>
        Ce produit est à destination de tous les acteurs de la chaîne du déchet
        dangereux (les déchets non dangereux peuvent également être suivis
        dessus) : producteurs, collecteurs / regroupeurs, installations de
        traitement.
      </p>
      <p className="image-container">
        <img src="image-faq.png" />
      </p>
      <h3>Pourquoi utiliser Trackdéchets?</h3>
      <p>
        Trackdechets a vocation a simplifier la gestion de vos bordereaux au
        quotidien: 0 papiers, informations et statuts de mes BSD sur un outil
        unique, reporting automatique.
      </p>
      <p>
        Peu importe si vous travaillez avec de multiples prestataires, les
        informations concernant la traçabilité sont regroupées ici.
      </p>
      <h3>Si mon collecteur n’est pas inscrit, que se passe-t-il?</h3>
      <p>
        Vous éditez le BSD à son attention (prestataire), et il reçoit un
        message de notification l’invitant à se rendre sur la plateforme pour
        valider votre bordereau.
      </p>
      <table>
        <tbody>
          <tr>
            <td className="faq-cell" colSpan={1} rowSpan={1}>
              <p>1</p>
              <p>Je rédige mon BSD</p>
            </td>
            <td className="faq-cell" colSpan={1} rowSpan={1}>
              <p>2</p>
              <p>Je le transmets à mon collecteur</p>
            </td>
            <td className="faq-cell" colSpan={1} rowSpan={1}>
              <p>3</p>
              <p>S’il n’est pas inscrit, il reçoit un mail d’information</p>
            </td>
            <td className="faq-cell" colSpan={1} rowSpan={1}>
              <p>4</p>
              <p>il s’inscrit et retrouve le BSD dans son tableau de bord</p>
            </td>
          </tr>
        </tbody>
      </table>
      <h3>Trackdéchets, c’est du travail en plus ?</h3>
      <p>
        Au contraire, vous allez vite vous rendre compte que vous pouvez
        dupliquer vos bordereaux habituels et réaliser un nouveau bordereau en 2
        clics.
      </p>
      <p>
        La recherche des prestataires et de mon code déchets est simplifiée et
        bénéficie d’une aide et de favoris.
      </p>
      <p>
        De plus vous n’avez pas à chercher vos bordereaux, ils sont là! et votre
        prestataire n’a rien à vous transmettre, scanner, imprimer, etc.
      </p>
      <h3>
        Sur Trackdéchets lorsque je signe mon BSD dématérialisé, est-il valide
        juridiquement comme un BSD papier ?
      </h3>
      <p>
        Comme spécifié{" "}
        <a href="https://trackdechets.beta.gouv.fr/cgu">
          dans les CGU
        </a>
        , aux étapes clés de validation initialement réalisées par le biais
        d’une “signature physique”, lorsque l’émetteur ou le receveur d’un BSD
        clique sur le bouton “Je valide”, cela équivaut à valider les
        informations et à apposer sa signature.
      </p>
      <h3>
        Que faites vous des données que vous collectez dans Trackdéchets ?
      </h3>
      <p>
        Conformément aux normes européennes, Trackdéchets a une politique
        stricte en matière de gestion des données personnelles que vous pouvez
        regarder en détail{" "}
        <a href="https://trackdechets.beta.gouv.fr/Politique%20de%20confidentialit%C3%A9.pdf">
          ici
        </a>
        .<br />
      </p>
      <h3>Trackdéchets peut-il s’interfacer avec d’autres outils ?</h3>
      <p>
        Oui ! Trackdéchets a été conçu en prévoyant les futures intégrations
        avec d’autres services. L’API est structurée et documentée : vous pouvez
        y accéder à tout moment. Une fois que vous aurez créé votre compte vous
        pourrez générer une clé d’API sur la page “Mon compte” et commencer à
        utiliser l’API.
        Vous pouvez consulter <a href="  https://doc.trackdechets.fr/">la documentation dédiée</a>.

      </p>
      <h3>
        Comment m’assurer que l’entreprise qui va collecter et/ou traiter mon
        déchet est habilitée (autorisée et/ou agréé par l’Etat) à recevoir mes
        déchets ?
      </h3>
      <p>Attention :</p>
      <ul>
        <li>
          Toute installation de collecte et/ou de traitement des déchets est
          soumise à la réglementation des installations classées pour
          l’environnement et/ou nécessite de disposer d’un agrément
          préfectoral.(Cf. ci-après)
        </li>
        <li>
          Pour certaines catégories de déchets (VHU, pneus, huiles usagées,
          vidangeurs, installations fixes et mobiles de déchets contenant des
          PCB), l’exploitant doit être titulaire d’un agrément du (des Préfet du
          (des) département(s) sur lequel (lesquels) il exerce.
        </li>
      </ul>
      <p>
        Avant de contractualiser avec une entreprise, il convient de vérifier
        l’agrément, l’arrêté d’autorisation d’exploiter ou le récépissé de
        déclaration de vos collecteurs, transporteurs et exploitants de
        destination finale de vos déchets.
      </p>
      <p>
        C’est aujourd’hui une démarche assez fastidieuse que Trackdéchets veut
        vous aider à simplifier :{" "}
        <a href="https://trackdechets.beta.gouv.fr/search">
          https://trackdechets.beta.gouv.fr/search
        </a>
        .
      </p>
      <p>
        Trackdéchets prévoit d’aller plus loin et vous proposera prochainement
        un contrôle automatique des partenaires à chaque fois que vous
        transmettrez un BSD à un prestataire.
      </p>
      <h2>Sur la réglementation des déchets dangereux</h2>
      <h3>Qu'est-ce qu'un déchet dangereux ?</h3>
      <p>
        Tout déchet qui présente un risque particulier pour l'homme et
        l'environnement car il est toxique, inflammable, explosif, corrosif,
        etc. Exemples : les huiles, les solvants, les néons, les batteries, les
        piles, les bombes aérosols... Par extension, les emballages de ces
        produits, même vides, sont considérés comme des déchets dangereux.
      </p>
      <h3>Que dit la réglementation sur la gestion des déchets dangereux ?</h3>
      <p>
        Le déchet dangereux est sous la responsabilité du producteur jusqu’à son
        élimination finale. Attention, toute entreprise est donc responsable de
        la totalité des déchets générés par son activité. La responsabilité
        commence donc dès que le produit devient déchet et s’étend jusqu’à
        l’élimination du déchet, le traitement ou la mise en décharge. Mais elle
        ne cesse pas au moment où l’entreprise remet ses déchets à un tiers.
      </p>
      <h3>Que veut dire être producteur d’un déchet ?</h3>
      <p>
        Il existe 2 types de producteurs de déchets (
        <a href="https://www.legifrance.gouv.fr/affichCodeArticle.do;jsessionid=94F3A4F6C0617DCEA040256E0B0C3E85.tpdila15v_3?idArticle=LEGIARTI000023248311&cidTexte=LEGITEXT000006074220&dateTexte=20150417">
          article L541-1 du Code de l’Environnement
        </a>
        ) :
      </p>
      <ul>
        <li>
          producteur initial de déchets : toute personne dont l'activité produit
          des déchets
        </li>
        <li>
          producteur subséquent de déchets : toute personne qui effectue des
          opérations de traitement des déchets conduisant à un changement de la
          nature ou de la composition de ces déchets.
        </li>
      </ul>
      <h3>
        En tant que producteur de déchets dangereux, quelles sont mes
        responsabilités ?
      </h3>
      <p>
        Le producteur de déchets est tenu, lors de la remise de ses déchets à un
        tiers de renseigner et conserver les informations relatives au circuit
        de traitement de leurs déchets (exigence de traçabilité) en s’appuyant
        sur :
      </p>
      <ul>
        <li>
          l’émission d’un Bordereau de Suivi des Déchets (BSD) pour chaque
          déchet transmis (le fameux CERFA aujourd’hui. et un BSD dématérialisé
          dans Trackdéchets)
        </li>
        <li>
          sa conservation pendant 5 ans (archivage automatique dans
          Trackdéchets)
        </li>
        <li>
          le maintien d’un registre décrivant les opérations effectuées sur tous
          ses déchets (généré automatiquement via Trackdéchets)
        </li>
      </ul>
      <p>
        Attention : l’administration peut vous demander de justifier la bonne
        élimination de vos déchets. Il faut donc systématiquement réclamer aux
        prestataires de collecte les factures et les les bordereaux de suivi des
        déchets et les conserver.
      </p>
      <p>
        En cas de regroupement ou de prétraitement, vous devez recevoir le “BSD
        de Regroupement Prétraitement ” précisant la destination finale du
        déchet.
      </p>
      <h3>Qu’est ce qu’un BSD ? A quoi sert-il ?</h3>
      <p>
        Le BSD est un formulaire qui a pour objet d’assurer la traçabilité des
        déchets dangereux et de constituer une preuve de leur élimination pour
        le producteur responsable.
      </p>
      <p>
        Il comporte des indications sur la provenance des déchets, leurs
        caractéristiques, les modalités de collecte, de transport et
        d’entreposage, l’identité des entreprises concernées et la destination
        des déchets. Le BSD accompagne les déchets jusqu’à l’installation
        destinataire qui peut être un centre d’élimination, un centre de
        regroupement ou un centre de pré-traitement.
      </p>
      <p>
        Le producteur doit obligatoirement lire le BSD avant de le signer car il
        initie la traçabilité et acte de sa responsabilité.
      </p>
      <h3>Comment qualifier mon déchet ?</h3>
      <p>Comment rechercher le code de mon déchet sur Trackdéchets ?</p>
      <p>
        Aujourd’hui il n’y a pas encore de moteur de recherche simple mais il
        faut procéder par étape en s’appuyant sur la nomenclature des déchets.
      </p>
      <p>
        Les déchets y sont regroupés en 20 chapitres contenant des sections
        (Source : décret n°2002-540 du 18 avril 2002 ).
      </p>
      <p>
        Trackdéchets s’efforcer de vous aider à vous y retrouver lorsque vous
        éditez pour la première fois un BSD.
      </p>
      <p>
        Attention : les déchets faisant l’objet de l’émission obligatoire d’un
        BSD sont les déchets dangereux signalés par un astérisque dans la
        nomenclature déchets et les déchets radioactifs destinés à être traités
        dans des installations classées pour la protection de l’environnement.
      </p>
      <p>
        Rendez vous sur la{" "}
        <a href="https://trackdechets.beta.gouv.fr/wastetree">
          liste des déchets sur la plateforme Trackdéchets
        </a>{" "}
        et suivez les étapes suivantes:
      </p>
      <p><strong>Étape 1:</strong></p>
      <ol>
        <li>
          Repérer la source produisant le déchet dans les chapitres 1 à 12 et 17
          à 20
        </li>
        <li>
          Choisir le code à 6 chiffres approprié parmis les sous-chapitres (ex.
          procédés thermiques)
        </li>
      </ol>
      <p><strong>Étape 2:</strong></p>
      <p>
        Si aucun code approprié ne peut être trouvé à l’étape 1, alors chercher
        dans les rubriques 13 à 15.
      </p>
      <p><strong>Étape 3:</strong></p>
      <p>
        Si aucun code n’a pu être trouvé dans les étapes précédentes, chercher
        dans le chapitre 16.
      </p>
      <p><strong>Étape 4:</strong></p>
      <p>
        Au cas où le déchet ne relèverait pas des étapes ci-avant, alors le
        déchet sera classé sous la rubrique dont le code se termine par 99
        (déchets non spécifiés par ailleurs) dans le chapitre de la liste
        correspondant à l’activité repérée à la première étape.
      </p>
      <p>
        Pour aller plus loin sur les aspects réglementaires :{" "}
        <a href="https://www.ecologique-solidaire.gouv.fr/gestion-des-dechets-principes-generaux">
          https://www.ecologique-solidaire.gouv.fr/gestion-des-dechets-principes-generaux
        </a>
      </p>
      <h3>Qui a accès aux données de mon compte Trackdéchets ?</h3>
      <ul>
        <li>
          L'accès aux données personnelles d’inscription est lié au compte de
          l'utilisateur. Seul l'utilisateur peut consulter ou modifier la donnée
        </li>
        <li>
          L’accès aux données des BSD transmis par une entreprise est accessible
          par toutes les personnes de l’entreprise
        </li>
        <li>
          Les autorités publiques pourront avoir accès à l’outil dans des cas de
          contrôle
        </li>
        <li>
          De la donnée agrégée anonymisée pourrait être utilisée à terme pour
          faciliter la planification en matière de gestion des déchets
        </li>
        <li>
          Pour aller plus loin, la politique de confidentialité de Trackdéchets
          est disponible{" "}
          <a href="https://trackdechets.beta.gouv.fr/Politique%20de%20confidentialit%C3%A9.pdf">
            sur le site
          </a>.
        </li>
      </ul>
      <h3>
        Si j’interface mon outil métier avec Trackdéchets, quel est le niveau de
        protection de mes données ?
      </h3>
      <p>
        Les données transmises à Trackdéchets par API ne sont pas accessibles
        par les autres utilisateurs, elles sont sécurisées par le recours à un
        token d’authentification.
      </p>
      <h3>Terminologie: quel terme pour quel acteur ?</h3>
      <p>
        Tout d'abord quelques rappels sur la terminologie tirés du code de
        l'environnement:
      </p>
      <p>
        <strong>Déchet :</strong> toute substance ou tout objet, ou plus
        généralement tout bien meuble, dont le détenteur se défait ou dont il a
        l'intention ou l'obligation de se défaire ;
      </p>
      <p>
        <strong>Gestion des déchets :</strong> la collecte, le transport, la
        valorisation et, l'élimination des déchets et, plus largement, toute
        activité participant de l'organisation de la prise en charge des déchets
        depuis leur production jusqu'à leur traitement final, y compris les
        activités de négoce ou de courtage et la supervision de l'ensemble de
        ces opérations ;
      </p>
      <p>
        <strong>Producteur de déchets :</strong> toute personne dont l'activité
        produit des déchets (producteur initial de déchets) ou toute personne
        qui effectue des opérations de traitement des déchets conduisant à un
        changement de la nature ou de la composition de ces déchets (producteur
        subséquent de déchets) ;
      </p>
      <p>
        <strong>Détenteur de déchets :</strong> producteur des déchets ou toute
        autre personne qui se trouve en possession des déchets ;
      </p>
      <p>
        <strong>Collecte :</strong> toute opération de ramassage des déchets en
        vue de leur transport vers une installation de traitement des déchets ;
      </p>
      <p>
        <strong>Traitement :</strong> toute opération de valorisation ou
        d'élimination, y compris la préparation qui précède la valorisation ou
        l'élimination ;
      </p>
      <p>Pour Trackdéchets, on considère les profils suivant:</p>
      <ul>
        <li>
          Installation de traitement (installation d'élimination ou de
          valorisation d'un déchet ultime)
        </li>
        <li>Installation de Transit, Regroupement ou Tri de déchets</li>
        <li>
          Installation de collecte de déchets apportés par le producteur
          initial (déchetterie)
        </li>
        <li>
          Installation d'entreposage, dépollution, démontage, découpage de VHU
          (casse automobile)
        </li>
        <li>Producteur de déchets</li>
        <li>
          Transporteurs (opération de transport de marchandise y compris
          dangereuse) - Négociant en Déchets
        </li>
      </ul>
    </div>
  );
}
