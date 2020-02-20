# Schema Types

<details>
  <summary><strong>Table of Contents</strong></summary>

  * [Query](#query)
  * [Mutation](#mutation)
  * [Objects](#objects)
    * [AccessToken](#accesstoken)
    * [AuthPayload](#authpayload)
    * [CompanyFavorite](#companyfavorite)
    * [CompanyMember](#companymember)
    * [CompanyPrivate](#companyprivate)
    * [CompanyPublic](#companypublic)
    * [CompanySearchResult](#companysearchresult)
    * [CompanyStat](#companystat)
    * [Declaration](#declaration)
    * [Emitter](#emitter)
    * [FileDownload](#filedownload)
    * [Form](#form)
    * [FormCompany](#formcompany)
    * [FormSubscription](#formsubscription)
    * [Installation](#installation)
    * [NextDestination](#nextdestination)
    * [Recipient](#recipient)
    * [Rubrique](#rubrique)
    * [Stat](#stat)
    * [StatusLog](#statuslog)
    * [StatusLogForm](#statuslogform)
    * [StatusLogUser](#statusloguser)
    * [Subscription](#subscription)
    * [Trader](#trader)
    * [Transporter](#transporter)
    * [UploadLink](#uploadlink)
    * [User](#user)
    * [WasteDetails](#wastedetails)
    * [formsLifeCycleData](#formslifecycledata)
  * [Inputs](#inputs)
    * [AppendixFormInput](#appendixforminput)
    * [CompanyInput](#companyinput)
    * [EmitterInput](#emitterinput)
    * [FormInput](#forminput)
    * [NextDestinationInput](#nextdestinationinput)
    * [PrivateCompanyInput](#privatecompanyinput)
    * [ProcessedFormInput](#processedforminput)
    * [ReceivedFormInput](#receivedforminput)
    * [RecipientInput](#recipientinput)
    * [SentFormInput](#sentforminput)
    * [SignupInput](#signupinput)
    * [TraderInput](#traderinput)
    * [TransporterInput](#transporterinput)
    * [TransporterSignatureFormInput](#transportersignatureforminput)
    * [WasteDetailsInput](#wastedetailsinput)
  * [Enums](#enums)
    * [CompanyType](#companytype)
    * [Consistence](#consistence)
    * [EmitterType](#emittertype)
    * [FavoriteType](#favoritetype)
    * [FormStatus](#formstatus)
    * [FormType](#formtype)
    * [FormsRegisterExportType](#formsregisterexporttype)
    * [GerepType](#gereptype)
    * [Packagings](#packagings)
    * [QuantityType](#quantitytype)
    * [UserRole](#userrole)
    * [UserType](#usertype)
    * [WasteAcceptationStatusInput](#wasteacceptationstatusinput)
    * [WasteType](#wastetype)
  * [Scalars](#scalars)
    * [Boolean](#boolean)
    * [DateTime](#datetime)
    * [Float](#float)
    * [ID](#id)
    * [Int](#int)
    * [JSON](#json)
    * [String](#string)

</details>

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
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>searchCompanies</strong></td>
<td valign="top">[<a href="#companysearchresult">CompanySearchResult</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">clue</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">department</td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>favorites</strong></td>
<td valign="top">[<a href="#companyfavorite">CompanyFavorite</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">type</td>
<td valign="top"><a href="#favoritetype">FavoriteType</a>!</td>
<td></td>
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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>forms</strong></td>
<td valign="top">[<a href="#form">Form</a>]</td>
<td>

Renvoie les BSDs de la compagnie sélectionnée (la première par défaut)
Par défaut, renvoie les BSDs dont on est producteur ou destinataire.
On peut également demander les bordereaux pour lesquels on est transporteur

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">type</td>
<td valign="top"><a href="#formtype">FormType</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>stats</strong></td>
<td valign="top">[<a href="#companystat">CompanyStat</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendixForms</strong></td>
<td valign="top">[<a href="#form">Form</a>]</td>
<td>

Renvoie des BSD candidats à un regroupement dans une annexe 2
`siret`: Siret d'une des entreprises que j'administre
`wasteCode`: Code déchet pour affiner la recherche, optionnel

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">wasteCode</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>formPdf</strong></td>
<td valign="top"><a href="#filedownload">FileDownload</a></td>
<td>

Renvoie un token pour télécharger un pdf de bordereau
Ce token doit être transmis à la route /download pour obtenir le fichier.
Il est valable 10 secondes

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#id">ID</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>formsRegister</strong></td>
<td valign="top"><a href="#filedownload">FileDownload</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sirets</td>
<td valign="top">[<a href="#string">String</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">exportType</td>
<td valign="top"><a href="#formsregisterexporttype">FormsRegisterExportType</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>formsLifeCycle</strong></td>
<td valign="top"><a href="#formslifecycledata">formsLifeCycleData</a></td>
<td>

Renvoie les changements de statut des bordereaux de l'entreprise sélectionnée. 
La liste est paginée par pages de 100 items, ordonnée par date décroissante (champ `created`)
Seuls les changements de statuts disposant d'un champ `created` non nul sont retournés
  
Filtres:

  `siret`: Siret d'une des entreprises que j'administre, optionnel

  `createdAfter`: date formatée après laquelle les changements de statut doivent être retournés (YYYY-MM-DD), optionnel

  `createdBefore`: date formatée avant laquelle les changements de statut doivent être retournés (YYYY-MM-DD), optionnel
  
  `formId`: id d'un bordereau, optionnel
  
Pagination:

  `cursorAfter`: cursor après lequel les changements de statut doivent être retournés, optionnel

  `cursorBefore`: cursor avant lequel les changements de statut doivent être retournés, optionnel

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">loggedBefore</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">loggedAfter</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">cursorAfter</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">cursorBefore</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">formId</td>
<td valign="top"><a href="#id">ID</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>me</strong></td>
<td valign="top"><a href="#user">User</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>apiKey</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
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
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateCompany</strong></td>
<td valign="top"><a href="#companyprivate">CompanyPrivate</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">siret</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">gerepId</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">contactEmail</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">contactPhone</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">website</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">companyTypes</td>
<td valign="top">[<a href="#companytype">CompanyType</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">givenName</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createCompany</strong></td>
<td valign="top"><a href="#companyprivate">CompanyPrivate</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">companyInput</td>
<td valign="top"><a href="#privatecompanyinput">PrivateCompanyInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createUploadLink</strong></td>
<td valign="top"><a href="#uploadlink">UploadLink</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">fileName</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">fileType</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
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
<td></td>
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
<td></td>
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
<td></td>
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
<td></td>
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
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">sentInfo</td>
<td valign="top"><a href="#sentforminput">SentFormInput</a>!</td>
<td></td>
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
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">receivedInfo</td>
<td valign="top"><a href="#receivedforminput">ReceivedFormInput</a>!</td>
<td></td>
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
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">processedInfo</td>
<td valign="top"><a href="#processedforminput">ProcessedFormInput</a>!</td>
<td></td>
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
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">signingInfo</td>
<td valign="top"><a href="#transportersignatureforminput">TransporterSignatureFormInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signup</strong></td>
<td valign="top"><a href="#user">User</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userInfos</td>
<td valign="top"><a href="#signupinput">SignupInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>login</strong></td>
<td valign="top"><a href="#authpayload">AuthPayload</a>!</td>
<td></td>
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
<td></td>
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
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">email</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>editProfile</strong></td>
<td valign="top"><a href="#user">User</a></td>
<td></td>
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
<td></td>
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
<td></td>
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
<td></td>
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
<td></td>
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
<td></td>
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

### AccessToken

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
<td></td>
</tr>
</tbody>
</table>

### AuthPayload

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>user</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### CompanyFavorite

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contact</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### CompanyMember

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>role</strong></td>
<td valign="top"><a href="#userrole">UserRole</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isActive</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isPendingInvitation</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isMe</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
</tbody>
</table>

### CompanyPrivate

Private company type accessed by a user
who is member of the company. Is is typically
accessed through `query { user { companies } }`

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

 Company info in Prisma
#######################

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyTypes</strong></td>
<td valign="top">[<a href="#companytype">CompanyType</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>gerepId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>securityCode</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contactEmail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

 Contact info (from prisma)
##########################

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contactPhone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>website</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>users</strong></td>
<td valign="top">[<a href="#companymember">CompanyMember</a>]</td>
<td>

List of company members

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>userRole</strong></td>
<td valign="top"><a href="#userrole">UserRole</a></td>
<td>

Role of the logged in user in the company

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>givenName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

Given name used in company selector

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

 Company info from SIRENE
#########################

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>naf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libelleNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>longitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>latitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>installation</strong></td>
<td valign="top"><a href="#installation">Installation</a></td>
<td>

 Company info from ICPE database
################################

</td>
</tr>
</tbody>
</table>

### CompanyPublic

Public company type that can be accessed
by a user who is not member of the company
(for example in the fiche entreprise)

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

 Contact info (from prisma)
##########################

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contactPhone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>website</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

 Company info from SIRENE
#########################

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>naf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libelleNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>longitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>latitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>installation</strong></td>
<td valign="top"><a href="#installation">Installation</a></td>
<td>

Company info from ICPE database

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isRegistered</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

Whether or not this company is registered in TD

</td>
</tr>
</tbody>
</table>

### CompanySearchResult

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

company info from SIRENE

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyTypes</strong></td>
<td valign="top">[<a href="#companytype">CompanyType</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>naf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libelleNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>longitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>latitude</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>installation</strong></td>
<td valign="top"><a href="#installation">Installation</a></td>
<td>

company info from ICPE database

</td>
</tr>
</tbody>
</table>

### CompanyStat

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>stats</strong></td>
<td valign="top">[<a href="#stat">Stat</a>]</td>
<td></td>
</tr>
</tbody>
</table>

### Declaration

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>codeDechet</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>libDechet</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>gerepType</strong></td>
<td valign="top"><a href="#gereptype">GerepType</a></td>
<td></td>
</tr>
</tbody>
</table>

### Emitter

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pickupSite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td></td>
</tr>
</tbody>
</table>

### FileDownload

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>downloadLink</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Form

Représente un BSD

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
<td colspan="2" valign="top"><strong>readableId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#emitter">Emitter</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#recipient">Recipient</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporter">Transporter</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetails">WasteDetails</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>trader</strong></td>
<td valign="top"><a href="#trader">Trader</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createdAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>ownerId</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#formstatus">FormStatus</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByTransporter</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteAcceptationStatus</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDescription</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>noTraceability</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>nextDestination</strong></td>
<td valign="top"><a href="#nextdestination">NextDestination</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendix2Forms</strong></td>
<td valign="top">[<a href="#form">Form</a>]</td>
<td></td>
</tr>
</tbody>
</table>

### FormCompany

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>siret</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contact</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### FormSubscription

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>node</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedFields</strong></td>
<td valign="top">[<a href="#string">String</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>previousValues</strong></td>
<td valign="top"><a href="#form">Form</a></td>
<td></td>
</tr>
</tbody>
</table>

### Installation

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>urlFiche</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>rubriques</strong></td>
<td valign="top">[<a href="#rubrique">Rubrique</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>declarations</strong></td>
<td valign="top">[<a href="#declaration">Declaration</a>]</td>
<td></td>
</tr>
</tbody>
</table>

### NextDestination

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td></td>
</tr>
</tbody>
</table>

### Recipient

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#formcompany">FormCompany</a></td>
<td></td>
</tr>
</tbody>
</table>

### Rubrique

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>alinea</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>etatActivite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>regimeAutorise</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>activite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>category</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>volume</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>unite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteType</strong></td>
<td valign="top"><a href="#wastetype">WasteType</a></td>
<td></td>
</tr>
</tbody>
</table>

### Stat

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>incoming</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>outgoing</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
</tbody>
</table>

### StatusLog

Changement de statut d'un bordereau

  `status`: statut du bordereau après le changement de statut

  `updatedFields`: valeur des champs transmis lors du changement de statut (eg. receivedBY, processingOperationDescription)

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
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#formstatus">FormStatus</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>loggedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatedFields</strong></td>
<td valign="top"><a href="#json">JSON</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>form</strong></td>
<td valign="top"><a href="#statuslogform">StatusLogForm</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>user</strong></td>
<td valign="top"><a href="#statusloguser">StatusLogUser</a></td>
<td></td>
</tr>
</tbody>
</table>

### StatusLogForm

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
<td colspan="2" valign="top"><strong>readableId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### StatusLogUser

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
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">token</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Trader

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
</tbody>
</table>

### Transporter

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isExemptedOfReceipt</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberPlate</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### UploadLink

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>key</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### User

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>email</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companies</strong></td>
<td valign="top">[<a href="#companyprivate">CompanyPrivate</a>]</td>
<td></td>
</tr>
</tbody>
</table>

### WasteDetails

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#packagings">Packagings</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>otherPackaging</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberOfPackages</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>consistence</strong></td>
<td valign="top"><a href="#consistence">Consistence</a></td>
<td></td>
</tr>
</tbody>
</table>

### formsLifeCycleData

Informations du cycle de vie des bordereaux

Pagination

  `hasNextPage` et `hasPreviousPage`: pagination, indique si d'autres pages existent avant ou après

  `startCursor`et `endCursor`: premier et dernier ID de la page, à passer dans cursorAfter ou cursorBefore de la query formsLifeCycle

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasNextPage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasPreviousPage</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>startCursor</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>endCursor</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>count</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

## Inputs

### AppendixFormInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>readableId</strong></td>
<td valign="top"><a href="#id">ID</a></td>
<td></td>
</tr>
</tbody>
</table>

### CompanyInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>address</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>contact</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>mail</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### EmitterInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pickupSite</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### FormInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>emitter</strong></td>
<td valign="top"><a href="#emitterinput">EmitterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recipient</strong></td>
<td valign="top"><a href="#recipientinput">RecipientInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>transporter</strong></td>
<td valign="top"><a href="#transporterinput">TransporterInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteDetails</strong></td>
<td valign="top"><a href="#wastedetailsinput">WasteDetailsInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>trader</strong></td>
<td valign="top"><a href="#traderinput">TraderInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>appendix2Forms</strong></td>
<td valign="top">[<a href="#appendixforminput">AppendixFormInput</a>]</td>
<td></td>
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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### PrivateCompanyInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>gerepId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyTypes</strong></td>
<td valign="top">[<a href="#companytype">CompanyType</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>codeNaf</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>companyName</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>documentKeys</strong></td>
<td valign="top">[<a href="#string">String</a>]</td>
<td></td>
</tr>
</tbody>
</table>

### ProcessedFormInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperationDescription</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>nextDestination</strong></td>
<td valign="top"><a href="#nextdestinationinput">NextDestinationInput</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>noTraceability</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
</tbody>
</table>

### ReceivedFormInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>wasteRefusalReason</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedBy</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receivedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityReceived</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### RecipientInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>processingOperation</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### SentFormInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>password</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>phone</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### TraderInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### TransporterInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>receipt</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>department</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>validityLimit</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberPlate</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>company</strong></td>
<td valign="top"><a href="#companyinput">CompanyInput</a></td>
<td></td>
</tr>
</tbody>
</table>

### TransporterSignatureFormInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByTransporter</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>securityCode</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sentBy</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signedByProducer</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#packagings">Packagings</a>]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### WasteDetailsInput

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>onuCode</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>packagings</strong></td>
<td valign="top">[<a href="#packagings">Packagings</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>otherPackaging</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>numberOfPackages</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantity</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>quantityType</strong></td>
<td valign="top"><a href="#quantitytype">QuantityType</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>consistence</strong></td>
<td valign="top"><a href="#consistence">Consistence</a></td>
<td></td>
</tr>
</tbody>
</table>

## Enums

### CompanyType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRODUCER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>COLLECTOR</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WASTEPROCESSOR</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORTER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WASTE_VEHICLES</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WASTE_CENTER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TRADER</strong></td>
<td></td>
</tr>
</tbody>
</table>

### Consistence

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>SOLID</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>LIQUID</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>GASEOUS</strong></td>
<td></td>
</tr>
</tbody>
</table>

### EmitterType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRODUCER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>OTHER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>APPENDIX1</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>APPENDIX2</strong></td>
<td></td>
</tr>
</tbody>
</table>

### FavoriteType

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

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>DRAFT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SEALED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>SENT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>RECEIVED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PROCESSED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>AWAITING_GROUP</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>GROUPED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NO_TRACEABILITY</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### FormType

On peut récupérer les BSD par type:
- ACTOR: on est acteur du BSD, c'est à dire émetteur ou destinataire (cas par défaut)
- TRANSPORTER: on est uniquement transporteur du déchet

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ACTOR</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORTER</strong></td>
<td></td>
</tr>
</tbody>
</table>

### FormsRegisterExportType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>INCOMING</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>OUTGOING</strong></td>
<td></td>
</tr>
</tbody>
</table>

### GerepType

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

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>FUT</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>GRV</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>CITERNE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>BENNE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>AUTRE</strong></td>
<td></td>
</tr>
</tbody>
</table>

### QuantityType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>REAL</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>ESTIMATED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### UserRole

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

### UserType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRODUCER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>COLLECTOR</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WASTEPROCESSOR</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TRANSPORTER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WASTE_VEHICLES</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>WASTE_CENTER</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>TRADER</strong></td>
<td></td>
</tr>
</tbody>
</table>

### WasteAcceptationStatusInput

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ACCEPTED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>REFUSED</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>PARTIALLY_REFUSED</strong></td>
<td></td>
</tr>
</tbody>
</table>

### WasteType

<table>
<thead>
<th align="left">Value</th>
<th align="left">Description</th>
</thead>
<tbody>
<tr>
<td valign="top"><strong>INERTE</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>NOT_DANGEROUS</strong></td>
<td></td>
</tr>
<tr>
<td valign="top"><strong>DANGEROUS</strong></td>
<td></td>
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
