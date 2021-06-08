---
id: objects
title: Objects
slug: objects
---

## AuthPayload

Cet objet est renvoyé par la mutation login qui est dépréciée

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
token<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Bearer token à durée illimité permettant de s&#39;authentifier
à l&#39;API Trackdéchets. Pour ce faire, il doit être passé dans le
header d&#39;autorisation <code>Authorization: Bearer ******</code></p>
</td>
</tr>
<tr>
<td>
user<br />
<a href="/api-reference/user-company/objects#user"><code>User!</code></a>
</td>
<td>
<p>Utilisateur lié au token</p>
</td>
</tr>
</tbody>
</table>

## BrokerReceipt

Récépissé courtier

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département ayant enregistré la déclaration</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/user-company/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receiptNumber<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de récépissé courtier</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/user-company/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Limite de validité du récépissé</p>
</td>
</tr>
</tbody>
</table>

## CompanyMember

Information sur utilisateur au sein d'un établissement

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Email</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/user-company/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
isActive<br />
<a href="/api-reference/user-company/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non l&#39;email de l&#39;utilisateur a été confirmé</p>
</td>
</tr>
<tr>
<td>
isMe<br />
<a href="/api-reference/user-company/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non cet utilisateur correspond à l&#39;utilisateur authentifié</p>
</td>
</tr>
<tr>
<td>
isPendingInvitation<br />
<a href="/api-reference/user-company/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui ou non une une invitation à joindre l&#39;établissement est en attente</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;utilisateur</p>
</td>
</tr>
<tr>
<td>
role<br />
<a href="/api-reference/user-company/enums#userrole"><code>UserRole</code></a>
</td>
<td>
<p>Rôle de l&#39;utilisateur dans l&#39;établissement (admin ou membre)</p>
</td>
</tr>
</tbody>
</table>

## CompanyPrivate

Information sur un établissement accessible par un utilisateur membre

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
brokerReceipt<br />
<a href="/api-reference/user-company/objects#brokerreceipt"><code>BrokerReceipt</code></a>
</td>
<td>
<p>Récépissé courtier (le cas échéant, pour les profils courtier)</p>
</td>
</tr>
<tr>
<td>
companyTypes<br />
<a href="/api-reference/user-company/enums#companytype"><code>[CompanyType!]!</code></a>
</td>
<td>
<p>Profil de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
contactEmail<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email de contact (visible sur la fiche entreprise)</p>
</td>
</tr>
<tr>
<td>
contactPhone<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact (visible sur la fiche entreprise)</p>
</td>
</tr>
<tr>
<td>
ecoOrganismeAgreements<br />
<a href="/api-reference/user-company/scalars#url"><code>[URL!]!</code></a>
</td>
<td>
<p>Liste des agréments de l&#39;éco-organisme</p>
</td>
</tr>
<tr>
<td>
gerepId<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant GEREP</p>
</td>
</tr>
<tr>
<td>
givenName<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom d&#39;usage de l&#39;entreprise qui permet de différencier
différents établissements ayant le même nom</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/user-company/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
installation<br />
<a href="/api-reference/user-company/objects#installation"><code>Installation</code></a>
</td>
<td>
<p>Installation classée pour la protection de l&#39;environnement (ICPE)
associé à cet établissement (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
libelleNaf<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Libellé NAF de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
naf<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code NAF de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
securityCode<br />
<a href="/api-reference/user-company/scalars#int"><code>Int!</code></a>
</td>
<td>
<p>Code de signature permettant de signer les BSD</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
traderReceipt<br />
<a href="/api-reference/user-company/objects#traderreceipt"><code>TraderReceipt</code></a>
</td>
<td>
<p>Récépissé négociant (le cas échéant, pour les profils négociant)</p>
</td>
</tr>
<tr>
<td>
transporterReceipt<br />
<a href="/api-reference/user-company/objects#transporterreceipt"><code>TransporterReceipt</code></a>
</td>
<td>
<p>Récépissé transporteur (le cas échéant, pour les profils transporteur)</p>
</td>
</tr>
<tr>
<td>
userRole<br />
<a href="/api-reference/user-company/enums#userrole"><code>UserRole</code></a>
</td>
<td>
<p>Rôle de l&#39;utilisateur authentifié cau sein de cet établissement</p>
</td>
</tr>
<tr>
<td>
users<br />
<a href="/api-reference/user-company/objects#companymember"><code>[CompanyMember!]</code></a>
</td>
<td>
<p>Liste des utilisateurs appartenant à cet établissement</p>
</td>
</tr>
<tr>
<td>
verificationStatus<br />
<a href="/api-reference/user-company/enums#companyverificationstatus"><code>CompanyVerificationStatus!</code></a>
</td>
<td>
<p>État du processus de vérification de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
vhuAgrementBroyeur<br />
<a href="/api-reference/user-company/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément broyeur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementDemolisseur<br />
<a href="/api-reference/user-company/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément démolisseur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
website<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Site web (visible sur la fiche entreprise)</p>
</td>
</tr>
</tbody>
</table>

## CompanyPublic

Information sur un établissement accessible publiquement

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
brokerReceipt<br />
<a href="/api-reference/user-company/objects#brokerreceipt"><code>BrokerReceipt</code></a>
</td>
<td>
<p>Récépissé courtier associé à cet établissement (le cas échant)</p>
</td>
</tr>
<tr>
<td>
companyTypes<br />
<a href="/api-reference/user-company/enums#companytype"><code>[CompanyType!]!</code></a>
</td>
<td>
<p>Profil de l&#39;établissement sur Trackdéchets
ayant pour valeur un tableau vide quand l&#39;établissement
n&#39;est pas inscrit sur la plateforme <code>isRegistered=false</code></p>
</td>
</tr>
<tr>
<td>
contactEmail<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Email de contact</p>
</td>
</tr>
<tr>
<td>
contactPhone<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de contact</p>
</td>
</tr>
<tr>
<td>
ecoOrganismeAgreements<br />
<a href="/api-reference/user-company/scalars#url"><code>[URL!]!</code></a>
</td>
<td>
<p>Liste des agréments de l&#39;éco-organisme</p>
</td>
</tr>
<tr>
<td>
etatAdministratif<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>État administratif de l&#39;établissement. A = Actif, F = Fermé</p>
</td>
</tr>
<tr>
<td>
installation<br />
<a href="/api-reference/user-company/objects#installation"><code>Installation</code></a>
</td>
<td>
<p>Installation classée pour la protection de l&#39;environnement (ICPE)
associé à cet établissement</p>
</td>
</tr>
<tr>
<td>
isRegistered<br />
<a href="/api-reference/user-company/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets</p>
</td>
</tr>
<tr>
<td>
libelleNaf<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Libellé NAF</p>
</td>
</tr>
<tr>
<td>
naf<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code NAF</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
traderReceipt<br />
<a href="/api-reference/user-company/objects#traderreceipt"><code>TraderReceipt</code></a>
</td>
<td>
<p>Récépissé négociant associé à cet établissement (le cas échant)</p>
</td>
</tr>
<tr>
<td>
transporterReceipt<br />
<a href="/api-reference/user-company/objects#transporterreceipt"><code>TransporterReceipt</code></a>
</td>
<td>
<p>Récépissé transporteur associé à cet établissement (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementBroyeur<br />
<a href="/api-reference/user-company/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément VHU broyeur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementDemolisseur<br />
<a href="/api-reference/user-company/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément VHU démolisseur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
website<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Site web</p>
</td>
</tr>
</tbody>
</table>

## CompanySearchResult

Information sur un établissement accessible publiquement en recherche

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Adresse de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
brokerReceipt<br />
<a href="/api-reference/user-company/objects#brokerreceipt"><code>BrokerReceipt</code></a>
</td>
<td>
<p>Récépissé courtier associé à cet établissement (le cas échant)</p>
</td>
</tr>
<tr>
<td>
codeCommune<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code commune de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
etatAdministratif<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>État administratif de l&#39;établissement. A = Actif, F = Fermé</p>
</td>
</tr>
<tr>
<td>
installation<br />
<a href="/api-reference/user-company/objects#installation"><code>Installation</code></a>
</td>
<td>
<p>Installation classée pour la protection de l&#39;environnement (ICPE)
associé à cet établissement</p>
</td>
</tr>
<tr>
<td>
libelleNaf<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Libellé NAF</p>
</td>
</tr>
<tr>
<td>
naf<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code NAF</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
traderReceipt<br />
<a href="/api-reference/user-company/objects#traderreceipt"><code>TraderReceipt</code></a>
</td>
<td>
<p>Récépissé négociant associé à cet établissement (le cas échant)</p>
</td>
</tr>
<tr>
<td>
transporterReceipt<br />
<a href="/api-reference/user-company/objects#transporterreceipt"><code>TransporterReceipt</code></a>
</td>
<td>
<p>Récépissé transporteur associé à cet établissement (le cas échéant)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementBroyeur<br />
<a href="/api-reference/user-company/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément VHU broyeur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
<tr>
<td>
vhuAgrementDemolisseur<br />
<a href="/api-reference/user-company/objects#vhuagrement"><code>VhuAgrement</code></a>
</td>
<td>
<p>Agrément VHU démolisseur (le cas échéant, pour les profils VHU)</p>
</td>
</tr>
</tbody>
</table>

## Declaration

Représente une ligne dans une déclaration GEREP

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
annee<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Année de la déclaration</p>
</td>
</tr>
<tr>
<td>
codeDechet<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Code du déchet</p>
</td>
</tr>
<tr>
<td>
gerepType<br />
<a href="/api-reference/user-company/enums#gereptype"><code>GerepType</code></a>
</td>
<td>
<p>Type de déclaration GEREP: producteur ou traiteur</p>
</td>
</tr>
<tr>
<td>
libDechet<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description du déchet</p>
</td>
</tr>
</tbody>
</table>

## EcoOrganisme

Eco-organisme
Les éco-organismes n'apparaissent pas en case 1 du bordereau mais sont quand même responsables du déchet.
C'est l'entreprise de collecte de déchet qui apparait en case 1.
Pour pouvoir saisir un éco-organisme, le détenteur du déchet doit être défini comme 'Autre détenteur'.
Seul un éco-organisme enregistré dans Trackdéchet peut être associé.

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Adresse de l&#39;éco-organisme</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/user-company/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de l&#39;éco-organisme</p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Siret de l&#39;éco-organisme</p>
</td>
</tr>
</tbody>
</table>

## Installation

Installation pour la protection de l'environnement (ICPE)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
codeS3ic<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Identifiant S3IC</p>
</td>
</tr>
<tr>
<td>
declarations<br />
<a href="/api-reference/user-company/objects#declaration"><code>[Declaration!]</code></a>
</td>
<td>
<p>Liste des déclarations GEREP</p>
</td>
</tr>
<tr>
<td>
rubriques<br />
<a href="/api-reference/user-company/objects#rubrique"><code>[Rubrique!]</code></a>
</td>
<td>
<p>Liste des rubriques associées</p>
</td>
</tr>
<tr>
<td>
urlFiche<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>URL de la fiche ICPE sur Géorisques</p>
</td>
</tr>
</tbody>
</table>

## MembershipRequest

Demande de rattachement à un établissement effectué par
un utilisateur.

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Email de l&#39;utilisateur faisant la demande</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/user-company/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Nom de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
sentTo<br />
<a href="/api-reference/user-company/scalars#string"><code>[String!]!</code></a>
</td>
<td>
<p>Liste des adresses email correspondant aux comptes administrateurs à qui la demande
de rattachement a été envoyée. Les adresses emails sont partiellement masquées de la
façon suivante j********<a href="mailto:&#x77;&#x40;&#x74;&#114;&#97;&#99;&#107;&#100;&#x65;&#99;&#x68;&#x65;&#116;&#x73;&#x2e;&#x66;&#x72;">&#x77;&#x40;&#x74;&#114;&#97;&#99;&#107;&#100;&#x65;&#99;&#x68;&#x65;&#116;&#x73;&#x2e;&#x66;&#x72;</a></p>
</td>
</tr>
<tr>
<td>
siret<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>SIRET de l&#39;établissement</p>
</td>
</tr>
<tr>
<td>
status<br />
<a href="/api-reference/user-company/enums#membershiprequeststatus"><code>MembershipRequestStatus!</code></a>
</td>
<td>
<p>Statut de la demande de rattachement</p>
</td>
</tr>
</tbody>
</table>

## Rubrique

Rubrique ICPE d'un établissement avec les autorisations associées
Pour plus de détails, se référer à la
[nomenclature des ICPE](https://www.georisques.gouv.fr/articles-risques/les-installations-classees-pour-la-protection-de-lenvironnement#nomenclature-des-installations-classees)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
activite<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Description de l&#39;activité:
Ex: traitement thermique de déchets dangereux</p>
</td>
</tr>
<tr>
<td>
alinea<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Alinéa pour la rubrique concerné</p>
</td>
</tr>
<tr>
<td>
category<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Catégorie d&#39;établissement associé: TTR, VHU, Traitement</p>
</td>
</tr>
<tr>
<td>
etatActivite<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>État de l&#39;activité, ex: &#39;En fonct&#39;, &#39;À l&#39;arrêt&#39;</p>
</td>
</tr>
<tr>
<td>
regimeAutorise<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Régime autorisé pour la rubrique: déclaratif, autorisation, seveso, etc</p>
</td>
</tr>
<tr>
<td>
rubrique<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de rubrique tel que défini dans la nomenclature des ICPE
Ex: 2710</p>
</td>
</tr>
<tr>
<td>
unite<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Unité utilisé pour le volume autorisé</p>
</td>
</tr>
<tr>
<td>
volume<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Volume autorisé</p>
</td>
</tr>
<tr>
<td>
wasteType<br />
<a href="/api-reference/user-company/enums#wastetype"><code>WasteType</code></a>
</td>
<td>
<p>Type de déchets autorisé</p>
</td>
</tr>
</tbody>
</table>

## TraderReceipt

Récépissé négociant

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département ayant enregistré la déclaration</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/user-company/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receiptNumber<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de récépissé négociant</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/user-company/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Limite de validité du récépissé</p>
</td>
</tr>
</tbody>
</table>

## TransporterReceipt

Récépissé transporteur

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
department<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département ayant enregistré la déclaration</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/user-company/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
receiptNumber<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro de récépissé transporteur</p>
</td>
</tr>
<tr>
<td>
validityLimit<br />
<a href="/api-reference/user-company/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Limite de validité du récépissé</p>
</td>
</tr>
</tbody>
</table>

## User

Représente un utilisateur sur la plateforme Trackdéchets

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
companies<br />
<a href="/api-reference/user-company/objects#companyprivate"><code>[CompanyPrivate!]!</code></a>
</td>
<td>
<p>Liste des établissements dont l&#39;utilisateur est membre</p>
</td>
</tr>
<tr>
<td>
email<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Email de l&#39;utiliateur</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/user-company/scalars#id"><code>ID!</code></a>
</td>
<td>
<p>Identifiant opaque</p>
</td>
</tr>
<tr>
<td>
isAdmin<br />
<a href="/api-reference/user-company/scalars#boolean"><code>Boolean</code></a>
</td>
<td>
<p>Qualité d&#39;administrateur. Rôle reservé aux agents de l&#39;administration</p>
</td>
</tr>
<tr>
<td>
name<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Nom de l&#39;utilisateur</p>
</td>
</tr>
<tr>
<td>
phone<br />
<a href="/api-reference/user-company/scalars#string"><code>String</code></a>
</td>
<td>
<p>Numéro de téléphone de l&#39;utilisateur</p>
</td>
</tr>
</tbody>
</table>

## VhuAgrement

Agrément VHU

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
agrementNumber<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Numéro d&#39;agrément VHU</p>
</td>
</tr>
<tr>
<td>
department<br />
<a href="/api-reference/user-company/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Département ayant enregistré la déclaration</p>
</td>
</tr>
<tr>
<td>
id<br />
<a href="/api-reference/user-company/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

