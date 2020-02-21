# Référence de l'API GraphQL


## Query
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>companyInfos</strong></td>
<td valign="top"><a href="#companypublic">CompanyPublic</a></td>
<td>

Renvoie des informations publiques sur un établissement
extrait de la base SIRENE et de la base des installations
classées pour la protection de l'environnement (ICPE)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>searchCompanies</strong></td>
<td valign="top">[<a href="#companysearchresult">CompanySearchResult</a>]</td>
<td>

Effectue une recherche floue sur la base SIRENE et enrichit
les résultats avec des informations provenant de Trackdéchets

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">clue</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Champ utilisé pour faire une recherche floue
sur la nom de l'établissement, ex: 'Boulangerie Dupont'

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">department</td>
<td valign="top"><a href="#int">Int</a></td>
<td>

(Optionnel) Filtre les résultats par numéro de département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>favorites</strong></td>
<td valign="top">[<a href="#companyfavorite">CompanyFavorite</a>]</td>
<td>

Renvoie les établissements favoris de l'utilisateur. C'est à dire les
établissements qui font souvent partis des BSD édités

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">type</td>
<td valign="top"><a href="#favoritetype">FavoriteType</a>!</td>
<td>

type de favoris

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>form</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Renvoie un BSD, sélectionné par ID

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant opaque du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>forms</strong></td>
<td valign="top">[<a href="#form">Form</a>]</td>
<td>

Renvoie les BSDs de l'établissement sélectionné (le premier par défaut)
Par défaut, renvoie les BSDs dont on est producteur ou destinataire.
On peut également demander les bordereaux pour lesquels on est transporteur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET d'un établissement dont je suis membre

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">type</td>
<td valign="top"><a href="#formtype">FormType</a></td>
<td>

(Optionnel) Type de BSD renvoyés
ACTOR = BSD's dont on est producteur ou destinataire
TRANSPORTER = BSD's dont on est transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>stats</strong></td>
<td valign="top">[<a href="#companystat">CompanyStat</a>]</td>
<td>

Renvoie des statistiques sur le volume de déchets entrant et sortant

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendixForms</strong></td>
<td valign="top">[<a href="#form">Form</a>]</td>
<td>

Renvoie des BSD candidats à un regroupement dans une annexe 2

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Siret d'un des établissements dont je suis membre

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">wasteCode</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Code déchet pour affiner la recherche

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>formPdf</strong></td>
<td valign="top"><a href="#filedownload">FileDownload</a></td>
<td>

Renvoie un token pour télécharger un pdf de BSD
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>formsRegister</strong></td>
<td valign="top"><a href="#filedownload">FileDownload</a></td>
<td>

Renvoie un token pour télécharger un csv du regsitre
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sirets</td>
<td valign="top">[<a href="#string">String</a>]</td>
<td>

Liste de SIRET d'établissements dont je suis membre

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">exportType</td>
<td valign="top"><a href="#formsregisterexporttype">FormsRegisterExportType</a></td>
<td>

Type d'export

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>formsLifeCycle</strong></td>
<td valign="top"><a href="#formslifecycledata">formsLifeCycleData</a></td>
<td>

Renvoie les changements de statut des bordereaux de l'entreprise sélectionnée.
La liste est paginée par pages de 100 items, ordonnée par date décroissante (champ `loggedAt`)
Seuls les changements de statuts disposant d'un champ `loggedAt` non nul sont retournés

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) SIRET d'un établissement dont je suis membre

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">loggedBefore</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Date formatée après laquelle les changements de statut doivent être retournés (YYYY-MM-DD)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">loggedAfter</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Date formatée avant laquelle les changements de statut doivent être retournés (YYYY-MM-DD), optionnel

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">cursorAfter</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) PAGINATION - Curseur après lequel les changements de statut doivent être retournés

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">cursorBefore</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) PAGINATION - Curseur avant lequel les changements de statut doivent être retournés

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">formId</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

(Optionnel) ID d'un BSD en particulier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>me</strong></td>
<td valign="top"><a href="#user">User</a></td>
<td>

Renvoie les informations sur l'utilisateur authentifié

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>apiKey</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

USAGE INTERNE > Mon Compte > Générer un token
Renvoie un token permettant de s'authentifier à l'API Trackdéchets

</td>
</tr>
</tbody>
</table>

## Mutation
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>renewSecurityCode</strong></td>
<td valign="top"><a href="#companyprivate">CompanyPrivate</a></td>
<td>

USAGE INTERNE
Renouvelle le code de sécurité de l'établissement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateCompany</strong></td>
<td valign="top"><a href="#companyprivate">CompanyPrivate</a></td>
<td>

USAGE INTERNE
Édite les informations d'un établissement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">gerepId</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Identifiant GEREP

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">contactEmail</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Email de contact

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">contactPhone</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Numéro de téléphone de contact

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">website</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Site web

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">companyTypes</td>
<td valign="top">[<a href="#companytype">CompanyType</a>]</td>
<td>

(Optionnel) Profil de l'établissement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">givenName</td>
<td valign="top"><a href="#string">String</a></td>
<td>

(Optionnel) Nom d'usage de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createCompany</strong></td>
<td valign="top"><a href="#companyprivate">CompanyPrivate</a></td>
<td>

USAGE INTERNE
Rattache un établissement à l'utilisateur authentifié

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">companyInput</td>
<td valign="top"><a href="#privatecompanyinput">PrivateCompanyInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createUploadLink</strong></td>
<td valign="top"><a href="#uploadlink">UploadLink</a></td>
<td>

USAGE INTERNE
Récupère une URL signé pour l'upload d'un fichier

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">fileName</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

nom du fichier

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">fileType</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

type de fichier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>saveForm</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Sauvegarde un BSD (création ou modification, si `FormInput` contient un ID)

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">formInput</td>
<td valign="top"><a href="#forminput">FormInput</a>!</td>
<td>

Payload du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteForm</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Supprime un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>duplicateForm</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Duplique un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsSealed</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Scelle un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsSent</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide l'envoi d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sentInfo</td>
<td valign="top"><a href="#sentforminput">SentFormInput</a>!</td>
<td>

Informations liées à l'envoi

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsReceived</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide la réception d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">receivedInfo</td>
<td valign="top"><a href="#receivedforminput">ReceivedFormInput</a>!</td>
<td>

Informations liées à la réception

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markAsProcessed</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide le traitement d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">processedInfo</td>
<td valign="top"><a href="#processedforminput">ProcessedFormInput</a>!</td>
<td>

Informations liées au traitement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByTransporter</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Valide la prise en charge par le transporteur, et peut valider l'envoi

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

ID d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">signingInfo</td>
<td valign="top"><a href="#transportersignatureforminput">TransporterSignatureFormInput</a>!</td>
<td>

Informations liées à la signature transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signup</strong></td>
<td valign="top"><a href="#user">User</a></td>
<td>

USAGE INTERNE
Permet de créer un nouvel utilisateur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userInfos</td>
<td valign="top"><a href="#signupinput">SignupInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>login</strong></td>
<td valign="top"><a href="#authpayload">AuthPayload</a>!</td>
<td>

DEPRECATED - La récupération de token pour le compte de tiers
doit s'effectuer avec le protocole OAuth2

Récupére un token à partir de l'email et du mot de passe
d'un utilisateur.

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">email</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">password</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>changePassword</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td>

USAGE INTERNE
Modifie le mot de passe d'un utilisateur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">oldPassword</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">newPassword</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>resetPassword</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

USAGE INTERNE
Envoie un email pour la réinitialisation du mot de passe

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">email</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>editProfile</strong></td>
<td valign="top"><a href="#user">User</a></td>
<td>

USAGE INTERNE
Met à jour les informations de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">name</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">phone</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">email</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>inviteUserToCompany</strong></td>
<td valign="top"><a href="#companyprivate">CompanyPrivate</a></td>
<td>

USAGE INTERNE
Invite un nouvel utilisateur à un établissement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">email</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">role</td>
<td valign="top"><a href="#userrole">UserRole</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>resendInvitation</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

USAGE INTERNE
Renvoie l'email d'invitation à un établissement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">email</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>joinWithInvite</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td>

USAGE INTERNE
Active le compte d'un utilisateur invité

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">inviteHash</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">name</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">password</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeUserFromCompany</strong></td>
<td valign="top"><a href="#companyprivate">CompanyPrivate</a></td>
<td>

USAGE INTERNE
Supprime les droits d'un utilisateurs sur un établissement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteInvitation</strong></td>
<td valign="top"><a href="#companyprivate">CompanyPrivate</a></td>
<td>

USAGE INTERNE
Supprime une invitation à un établissement

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">email</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

## Objects

### AuthPayload

Cet objet est renvoyé par la mutation login qui est dépréciée

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>token</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Bearer token à durée illimité permettant de s'authentifier
à l'API Trackdéchets. Pour ce faire, il doit être passé dans le
header d'autorisation `Authorization: Bearer ******`

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>user</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td>

Utilisateur lié au token

</td>
</tr>
</tbody>
</table>

### CompanyFavorite

Information sur établissement accessible dans la liste des favoris
La liste des favoris est constituée à partir de l'historique des
BSD édités

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contact</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom du contact

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email de contact

</td>
</tr>
</tbody>
</table>

### CompanyMember

Information sur utilisateur au sein d'un établissement

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant opaque

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Email

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>role</strong></td>
<td valign="top"><a href="#userrole">UserRole</a></td>
<td>

Rôle de l'utilisateur dans l'établissement (admin ou membre)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isActive</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non l'email de l'utilisateur a été confirmé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isPendingInvitation</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non une une invitation à joindre l'établissement est en attente

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isMe</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non cet utilisateur correspond à l'utilisateur authentifié

</td>
</tr>
</tbody>
</table>

### CompanyPrivate

Information sur un établissement accessible par un utilisateur membre

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant opaque

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyTypes</strong></td>
<td valign="top">[<a href="#companytype">CompanyType</a>]</td>
<td>

Profil de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>gerepId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant GEREP

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>securityCode</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

Code de sécurité permettant de signer les BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contactEmail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email de contact (visible sur la fiche entreprise)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contactPhone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de contact (visible sur la fiche entreprise)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>website</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Site web (visible sur la fiche entreprise)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>users</strong></td>
<td valign="top">[<a href="#companymember">CompanyMember</a>]</td>
<td>

Liste des utilisateurs appartenant à cet établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>userRole</strong></td>
<td valign="top"><a href="#userrole">UserRole</a></td>
<td>

Rôle de l'utilisateur authentifié cau sein de cet établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>givenName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom d'usage de l'entreprise qui permet de différencier
différents établissements ayant le même nom

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>naf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code NAF de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libelleNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Libellé NAF de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>longitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Longitude de l'établissement (info géographique)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>latitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Latitude de l'établissement (info géographique)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>installation</strong></td>
<td valign="top"><a href="#installation">Installation</a></td>
<td>

Installation classée pour la protection de l'environnement (ICPE)
associé à cet établissement (le cas échéant)

</td>
</tr>
</tbody>
</table>

### CompanyPublic

Information sur un établissement accessible publiquement

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>contactEmail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email de contact

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contactPhone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de contact

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>website</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Site web

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>naf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code NAF

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libelleNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Libellé NAF

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>longitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Longitude de l'établissement (info géographique)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>latitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Latitude de l'établissement (info géographique)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>installation</strong></td>
<td valign="top"><a href="#installation">Installation</a></td>
<td>

Installation classée pour la protection de l'environnement (ICPE)
associé à cet établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isRegistered</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets

</td>
</tr>
</tbody>
</table>

### CompanySearchResult

Information sur un établissement accessible publiquement en recherche

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyTypes</strong></td>
<td valign="top">[<a href="#companytype">CompanyType</a>]</td>
<td>

Profil de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>naf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code NAF

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libelleNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Libellé NAF

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>longitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Longitude de l'établissement (info géographique)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>latitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Latitude de l'établissement (info géographique)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>installation</strong></td>
<td valign="top"><a href="#installation">Installation</a></td>
<td>

Installation classée pour la protection de l'environnement (ICPE)
associé à cet établissement

</td>
</tr>
</tbody>
</table>

### CompanyStat

Statistiques d'un établissement

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>stats</strong></td>
<td valign="top">[<a href="#stat">Stat</a>]</td>
<td>

Liste des statistiques

</td>
</tr>
</tbody>
</table>

### Declaration

Représente une ligne dans une déclaration GEREP

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>annee</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Année de la déclaration

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>codeDechet</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code du déchet

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libDechet</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description du déchet

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>gerepType</strong></td>
<td valign="top"><a href="#gereptype">GerepType</a></td>
<td>

Type de déclaration GEREP: producteur ou traiteur

</td>
</tr>
</tbody>
</table>

### Emitter

Émetteur du BSD (case 1)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#emittertype">EmitterType</a></td>
<td>

Type d'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pickupSite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse du chantier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement émetteur

</td>
</tr>
</tbody>
</table>

### FileDownload

URL de téléchargement accompagné d'un token
permettant de valider le téléchargement.

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>token</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Token ayant une durée de validité de 10s

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>downloadLink</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Lien de téléchargement

</td>
</tr>
</tbody>
</table>

### Form

Bordereau de suivi de déchets (BSD)
Version dématérialisée du [CERFA n°12571*01](https://www.service-public.fr/professionnels-entreprises/vosdroits/R14334)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant interne du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>readableId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant utilisé dans la case 'Bordereau n° ****'

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant personnalisé permettant de faire le lien avec un
objet un système d'information tierce

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#emitter">Emitter</a></td>
<td>

Établissement émetteur/producteur du déchet (case 1)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#recipient">Recipient</a></td>
<td>

Établissement qui reçoit le déchet (case 2)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporter">Transporter</a></td>
<td>

Transporteur du déchet (case 8)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetails">WasteDetails</a></td>
<td>

Détails du déchet (case 3)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>trader</strong></td>
<td valign="top"><a href="#trader">Trader</a></td>
<td>

Négociant (case 7)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createdAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de création du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de la dernière modification du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ownerId</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

ID de l'utilisateur ayant crée le BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#formstatus">FormStatus</a></td>
<td>

Statut du BSD (brouillon, envoyé, reçu, traité, etc)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByTransporter</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non le BSD a été signé par un transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de l'envoi du déchet par l'émetteur (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de la personne responsable de l'envoi du déchet (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptationStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Statut d'acceptation du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Raison du refus (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de la personne en charge de la réception du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date à laquelle le déchet a été reçu (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité réelle présentée (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Traitement réalisé (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDescription</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description de l'opération de traitement (case 11)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Personne en charge du traitement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date à laquelle le déchet a été traité

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>noTraceability</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non il y a eu perte de traçabalité

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>nextDestination</strong></td>
<td valign="top"><a href="#nextdestination">NextDestination</a></td>
<td>

Destination ultérieure prévue (case 12)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendix2Forms</strong></td>
<td valign="top">[<a href="#form">Form</a>]</td>
<td>

Annexe 2

</td>
</tr>
</tbody>
</table>

### FormCompany

Information sur un établissement dans un BSD

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contact</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom du contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email du contact dans l'établissement

</td>
</tr>
</tbody>
</table>

### FormSubscription

DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`

Mise à jour d'un BSD

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>mutation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Type de mutation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>node</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

BSD concerné

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedFields</strong></td>
<td valign="top">[<a href="#string">String</a>]</td>
<td>

Liste des champs mis à jour

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>previousValues</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td>

Ancienne valeurs

</td>
</tr>
</tbody>
</table>

### Installation

Installation pour la protection de l'environnement (ICPE)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>codeS3ic</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant S3IC

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>urlFiche</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

URL de la fiche ICPE sur Géorisques

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>rubriques</strong></td>
<td valign="top">[<a href="#rubrique">Rubrique</a>]</td>
<td>

Liste des rubriques associées

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>declarations</strong></td>
<td valign="top">[<a href="#declaration">Declaration</a>]</td>
<td>

Liste des déclarations GEREP

</td>
</tr>
</tbody>
</table>

### NextDestination

Destination ultérieure prévue (case 12)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Traitement prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement ultérieure

</td>
</tr>
</tbody>
</table>

### Recipient

Installation de destination ou d'entreprosage
ou de reconditionnement prévue (case 2)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>cap</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de CAP (le cas échéant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération d'élimination / valorisation prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement de destination

</td>
</tr>
</tbody>
</table>

### Rubrique

Rubrique ICPE d'un établissement avec les autorisations associées
Pour plus de détails, se référer à la
[nomenclature des ICPE](https://www.georisques.gouv.fr/dossiers/installations/nomenclature-ic)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>rubrique</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de rubrique tel que défini dans la nomenclature des ICPE
Ex: 2710

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>alinea</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Alinéa pour la rubrique concerné

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>etatActivite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

État de l'activité, ex: 'En fonct', 'À l'arrêt'

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>regimeAutorise</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Régime autorisé pour la rubrique: déclaratif, autorisation, seveso, etc

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>activite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description de l'activité:
Ex: traitement thermique de déchets dangereux

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>category</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Catégorie d'établissement associé: TTR, VHU, Traitement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>volume</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Volume autorisé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>unite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Unité utilisé pour le volume autorisé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteType</strong></td>
<td valign="top"><a href="#wastetype">WasteType</a></td>
<td>

Type de déchets autorisé

</td>
</tr>
</tbody>
</table>

### Stat

Statistiques

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code déchet

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>incoming</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité entrante

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>outgoing</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Qantité sortante

</td>
</tr>
</tbody>
</table>

### StatusLog

Changement de statut d'un bordereau

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant du log

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#formstatus">FormStatus</a></td>
<td>

Statut du bordereau après le changement de statut

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>loggedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date à laquelle le changement de statut a été effectué

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedFields</strong></td>
<td valign="top"><a href="#json">JSON</a></td>
<td>

Valeur des champs transmis lors du changement de statut (eg. receivedBY, processingOperationDescription)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>form</strong></td>
<td valign="top"><a href="#statuslogform">StatusLogForm</a></td>
<td>

BSD concerné

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>user</strong></td>
<td valign="top"><a href="#statusloguser">StatusLogUser</a></td>
<td>

Utilisateur à l'origine de la modification

</td>
</tr>
</tbody>
</table>

### StatusLogForm

Information sur un BSD dans les logs de modifications de statuts

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant du BSD

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>readableId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° du bordereau

</td>
</tr>
</tbody>
</table>

### StatusLogUser

Utilisateur ayant modifié le BSD

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Subscription

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>forms</strong></td>
<td valign="top"><a href="#formsubscription">FormSubscription</a></td>
<td>

DEPRECATED - Privilégier l'utilisation d'un polling régulier sur la query `formsLifeCycle`

Permet de s'abonner aux changements de statuts d'un BSD

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">token</td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Token permettant de s'authentifier à l'API

</td>
</tr>
</tbody>
</table>

### Trader

Négociant (case 7)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement négociant

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité

</td>
</tr>
</tbody>
</table>

### Transporter

Collecteur - transporteur (case 8)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td>

Établissement collecteur - transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isExemptedOfReceipt</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Exemption de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité du récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberPlate</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de plaque d'immatriculation

</td>
</tr>
</tbody>
</table>

### UploadLink

Lien d'upload

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>signedUrl</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

URL signé permettant d'uploader un fichier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>key</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Clé permettant l'upload du fichier

</td>
</tr>
</tbody>
</table>

### User

Représente un utilisateur sur la plateforme Trackdéchets

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td>

Identifiant opaque

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Email de l'utiliateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companies</strong></td>
<td valign="top">[<a href="#companyprivate">CompanyPrivate</a>]</td>
<td>

Liste des établissements dont l'utilisateur est membre

</td>
</tr>
</tbody>
</table>

### WasteDetails

Détails du déchet (case 3, 4, 5, 6)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>code</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Rubrique déchet au format |_|_| |_|_| |_|_| (*)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Dénomination usuelle

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code ONU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#packagings">Packagings</a>]</td>
<td>

Conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>otherPackaging</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Autre packaging (préciser)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberOfPackages</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Nombre de colis

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité en tonnes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a></td>
<td>

Réelle ou estimée

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>consistence</strong></td>
<td valign="top"><a href="#consistence">Consistence</a></td>
<td>

Consistance

</td>
</tr>
</tbody>
</table>

### formsLifeCycleData

Informations du cycle de vie des bordereaux

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>statusLogs</strong></td>
<td valign="top">[<a href="#statuslog">StatusLog</a>]</td>
<td>

Liste des changements de statuts

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasNextPage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

pagination, indique si d'autres pages existent après

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasPreviousPage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

pagination, indique si d'autres pages existent avant

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>startCursor</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Premier id de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>endCursor</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Dernier ID de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>count</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Nombre de changements de statuts renvoyés

</td>
</tr>
</tbody>
</table>

## Inputs

### AppendixFormInput

Payload de création d'une annexe 2

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>emitterSiret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>readableId</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

N° de bordereau

</td>
</tr>
</tbody>
</table>

### CompanyInput

Payload d'un établissement

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contact</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom du contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Email du contact dans l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de contact dans l'établissement

</td>
</tr>
</tbody>
</table>

### EmitterInput

Payload lié à un l'émetteur du BSD (case 1)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#emittertype">EmitterType</a></td>
<td>

Type d'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pickupSite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Adresse du chantier

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement émetteur

</td>
</tr>
</tbody>
</table>

### FormInput

Payload de création d'un BSD

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td>

Identifiant opaque

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant personnalisé permettant de faire le lien avec un
objet un système d'information tierce

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#emitterinput">EmitterInput</a></td>
<td>

Établissement émetteur/producteur du déchet (case 1)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#recipientinput">RecipientInput</a></td>
<td>

Établissement qui reçoit le déchet (case 2)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporterinput">TransporterInput</a></td>
<td>

Transporteur du déchet (case 8)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetailsinput">WasteDetailsInput</a></td>
<td>

Détails du déchet (case 3)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>trader</strong></td>
<td valign="top"><a href="#traderinput">TraderInput</a></td>
<td>

Négociant (case 7)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendix2Forms</strong></td>
<td valign="top">[<a href="#appendixforminput">AppendixFormInput</a>]</td>
<td>

Annexe 2

</td>
</tr>
</tbody>
</table>

### NextDestinationInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Traitement prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement de destination ultérieur

</td>
</tr>
</tbody>
</table>

### PrivateCompanyInput

Payload permettant le rattachement d'un établissement à un utilisateur

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

SIRET de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>gerepId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Identifiant GEREP de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyTypes</strong></td>
<td valign="top">[<a href="#companytype">CompanyType</a>]</td>
<td>

Profil de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>codeNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code NAF

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de l'établissement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>documentKeys</strong></td>
<td valign="top">[<a href="#string">String</a>]</td>
<td>

Liste de documents permettant de démontrer l'appartenance
de l'utilisateur à l'établissement

</td>
</tr>
</tbody>
</table>

### ProcessedFormInput

Payload de traitement d'un BSD

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDone</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Traitement réalisé (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDescription</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Description de l'opération de traitement (case 11)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Personne en charge du traitement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date à laquelle le déchet a été traité

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>nextDestination</strong></td>
<td valign="top"><a href="#nextdestinationinput">NextDestinationInput</a></td>
<td>

Destination ultérieure prévue (case 12)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>noTraceability</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Si oui ou non il y a eu perte de traçabalité

</td>
</tr>
</tbody>
</table>

### ReceivedFormInput

Payload de réception d'un BSD

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptationStatus</strong></td>
<td valign="top"><a href="#wasteacceptationstatusinput">WasteAcceptationStatusInput</a>!</td>
<td>

Statut d'acceptation du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Raison du refus (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de la personne en charge de la réception du déchet (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date à laquelle le déchet a été reçu (case 10)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Quantité réelle présentée (case 10)

</td>
</tr>
</tbody>
</table>

### RecipientInput

Payload lié à l'installation de destination ou d'entreprosage
ou de reconditionnement prévue (case 2)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>cap</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de CAP (le cas échéant)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Opération d'élimination / valorisation prévue (code D/R)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement de destination

</td>
</tr>
</tbody>
</table>

### SentFormInput

Payload de signature d'un BSD

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>sentAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Date de l'envoi du déchet par l'émetteur (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de la personne responsable de l'envoi du déchet (case 9)

</td>
</tr>
</tbody>
</table>

### SignupInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Email de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>password</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Mot de passe de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Nom de l'utilisateur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de téléphone de l'utilisateur

</td>
</tr>
</tbody>
</table>

### TraderInput

Payload lié au négociant

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement négociant

</td>
</tr>
</tbody>
</table>

### TransporterInput

Collecteur - transporteur (case 8)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>isExemptedOfReceipt</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Exemption de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

N° de récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Département

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

Limite de validité du récipissé

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberPlate</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Numéro de plaque d'immatriculation

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td>

Établissement collecteur - transporteur

</td>
</tr>
</tbody>
</table>

### TransporterSignatureFormInput

Payload de signature d'un BSD par un transporteur

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>sentAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

Date de l'envoi du déchet par l'émetteur (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByTransporter</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Si oui ou non le BSD a été signé par un transporteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>securityCode</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Code de sécurité permettant d'authentifier l'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Nom de la personne responsable de l'envoi du déchet (case 9)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByProducer</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

Si oui on non le BSD a été signé par l'émetteur

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#packagings">Packagings</a>]!</td>
<td>

Conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td>

Quantité en tonnes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

Code ONU

</td>
</tr>
</tbody>
</table>

### WasteDetailsInput

Payload lié au détails du déchet (case 3, 4, 5, 6)

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>code</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Rubrique déchet au format |_|_| |_|_| |_|_| (*)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Dénomination usuelle

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Code ONU

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#packagings">Packagings</a>]</td>
<td>

Conditionnement

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>otherPackaging</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Autre packaging (préciser)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberOfPackages</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

Nombre de colis

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td>

Quantité en tonnes

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a></td>
<td>

Réelle ou estimée

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>consistence</strong></td>
<td valign="top"><a href="#consistence">Consistence</a></td>
<td>

Consistance

</td>
</tr>
</tbody>
</table>

## Enums

### CompanyType

Profil entreprise

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRODUCER</strong></td>
<td>

Producteur de déchet

</td>
</tr>
<tr>
<td valign="top"><strong>COLLECTOR</strong></td>
<td>

Installation de Transit, regroupement ou tri de déchets

</td>
</tr>
<tr>
<td valign="top"><strong>WASTEPROCESSOR</strong></td>
<td>

Installation de traitement

</td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORTER</strong></td>
<td>

Transporteur

</td>
</tr>
<tr>
<td valign="top"><strong>WASTE_VEHICLES</strong></td>
<td>

Installation d'entreposage, dépollution, démontage, découpage de VHU

</td>
</tr>
<tr>
<td valign="top"><strong>WASTE_CENTER</strong></td>
<td>

Installation de collecte de déchets apportés par le producteur initial

</td>
</tr>
<tr>
<td valign="top"><strong>TRADER</strong></td>
<td>

Négociant

</td>
</tr>
</tbody>
</table>

### Consistence

Consistance du déchet

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>SOLID</strong></td>
<td>

Solide

</td>
</tr>
<tr>
<td valign="top"><strong>LIQUID</strong></td>
<td>

Liquide

</td>
</tr>
<tr>
<td valign="top"><strong>GASEOUS</strong></td>
<td>

Gazeux

</td>
</tr>
</tbody>
</table>

### EmitterType

Types d'émetteur de déchet (choix multiple de la case 1)

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRODUCER</strong></td>
<td>

Producetur de déchet

</td>
</tr>
<tr>
<td valign="top"><strong>OTHER</strong></td>
<td>

Autre détenteur

</td>
</tr>
<tr>
<td valign="top"><strong>APPENDIX1</strong></td>
<td>

Collecteur de petites quantités de déchets relevant de la même rubrique

</td>
</tr>
<tr>
<td valign="top"><strong>APPENDIX2</strong></td>
<td>

Personne ayant transformé ou réalisé un traitement dont la provenance des déchets reste identifiable

</td>
</tr>
</tbody>
</table>

### FavoriteType

Type d'établissement favoris

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>EMITTER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORTER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RECIPIENT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TRADER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NEXT_DESTINATION</strong></td>
<td></td>
</tr>
</tbody>
</table>

### FormStatus

Différents statuts d'un BSD au cours de son cycle de vie

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>DRAFT</strong></td>
<td>

BSD à l'état de brouillon
Des champs obligatoires peuvent manquer

</td>
</tr>
<tr>
<td valign="top"><strong>SEALED</strong></td>
<td>

BSD finalisé
Les champs sont validés pour détecter des valeurs manquantes ou erronnées

</td>
</tr>
<tr>
<td valign="top"><strong>SENT</strong></td>
<td>

BSD envoyé vers l'établissement de destination

</td>
</tr>
<tr>
<td valign="top"><strong>RECEIVED</strong></td>
<td>

BSD reçu par l'établissement de destination

</td>
</tr>
<tr>
<td valign="top"><strong>PROCESSED</strong></td>
<td>

BSD dont les déchets ont été traités

</td>
</tr>
<tr>
<td valign="top"><strong>AWAITING_GROUP</strong></td>
<td>

BSD en attente de regroupement

</td>
</tr>
<tr>
<td valign="top"><strong>GROUPED</strong></td>
<td>

Regroupement effectué

</td>
</tr>
<tr>
<td valign="top"><strong>NO_TRACEABILITY</strong></td>
<td>

Perte de traçabalité

</td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td>

Déchet refusé

</td>
</tr>
</tbody>
</table>

### FormType

Valeur possibles pour le filtre de la query `forms`

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ACTOR</strong></td>
<td>

Uniquement les BSD's dont je suis émetteur ou destinataire (cas par défaut)

</td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORTER</strong></td>
<td>

Uniquement les BSD's dont je suis transporteur

</td>
</tr>
</tbody>
</table>

### FormsRegisterExportType

Type pour l'export du registre

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>INCOMING</strong></td>
<td>

Déchets entrants

</td>
</tr>
<tr>
<td valign="top"><strong>OUTGOING</strong></td>
<td>

Déchets sortants

</td>
</tr>
</tbody>
</table>

### GerepType

Type d'une déclaration GEREP

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>Producteur</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>Traiteur</strong></td>
<td></td>
</tr>
</tbody>
</table>

### Packagings

Type de packaging du déchet

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>FUT</strong></td>
<td>

Fut

</td>
</tr>
<tr>
<td valign="top"><strong>GRV</strong></td>
<td>

GRV

</td>
</tr>
<tr>
<td valign="top"><strong>CITERNE</strong></td>
<td>

Citerne

</td>
</tr>
<tr>
<td valign="top"><strong>BENNE</strong></td>
<td>

Benne

</td>
</tr>
<tr>
<td valign="top"><strong>AUTRE</strong></td>
<td>

Autre

</td>
</tr>
</tbody>
</table>

### QuantityType

Type de quantité lors de l'émission

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>REAL</strong></td>
<td>

Quntité réelle

</td>
</tr>
<tr>
<td valign="top"><strong>ESTIMATED</strong></td>
<td>

Quantité estimée

</td>
</tr>
</tbody>
</table>

### UserRole

Liste les différents rôles d'un utilisateur au sein
d'un établissement.

Les admins peuvent:
* consulter/éditer les bordereaux
* gérer les utilisateurs de l'établissement
* éditer les informations de la fiche entreprise
* demander le renouvellement du code de sécurité
* Éditer les informations de la fiche entreprise

Les membres peuvent:
* consulter/éditer les bordereaux
* consulter le reste des informations

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>MEMBER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ADMIN</strong></td>
<td></td>
</tr>
</tbody>
</table>

### WasteAcceptationStatusInput

Statut d'acceptation d'un déchet

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ACCEPTED</strong></td>
<td>

Accepté en totalité

</td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td>

Refusé

</td>
</tr>
<tr>
<td valign="top"><strong>PARTIALLY_REFUSED</strong></td>
<td>

Refus partiel

</td>
</tr>
</tbody>
</table>

### WasteType

Type de déchets autorisé pour une rubrique

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>INERTE</strong></td>
<td>

Déchet inerte

</td>
</tr>
<tr>
<td valign="top"><strong>NOT_DANGEROUS</strong></td>
<td>

Déchet non dangereux

</td>
</tr>
<tr>
<td valign="top"><strong>DANGEROUS</strong></td>
<td>

Déchet dangereux

</td>
</tr>
</tbody>
</table>

## Scalars

### Boolean

The `Boolean` scalar type represents `true` or `false`.

### DateTime

### Float

The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).

### ID

The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.

### Int

The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.

### JSON

### String

The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.
