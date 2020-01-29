# Lexique

Pour s'y retrouver dans le jargon de Trackdéchets, voici un lexique des termes utilisés.

## Termes généraux


## Le BSD

L'objet BSD est représenté par un `form` dans Trackdéchets. Ci dessous sont présentées les significations des différents champs d'un bordereau en liaison avec l'actuel BSD papier.

```bash
type Form {
  # Identifiant interne à Trackdéchets, généré automatiquement
  id: ID                      
  
  # Numéro du BSD, généré automatiquement
  readableId: String          
  
  # Détails de l'émetteur qui remplissent le cadre 1 (et 9 en partie)
  emitter: Emitter            
  
  # Détails du destinataire qui remplissent le cadre 2 (et 10 en partie)
  recipient: Recipient        
  
  # Détails du transporteur qui remplissent le cadre 8
  transporter: Transporter    
  
  # Détails sur le déchet pour les cadres 3, 4, 5 et 6
  wasteDetails: WasteDetails  
  
  # Données sur le négociant pour le cadre 7
  trader: Trader              
  
  # Date de création du bordereau, généré automatiquement
  createdAt: DateTime         
  
  # Date de modification du bordereau, géré automatiquement
  updatedAt: DateTime         
  
  # Id de l'utilisateur qui a créé le bordereau, géré automatiquement
  ownerId: Int                
  
  # Etat du bordereau. Pour le détail des différentes valeurs possibles se référer à la doc sur [le cycle de vie](workflow.md)
  status: FormStatus          
  
  # Date d'envoi, complété lors du remplissage du cadre 9 avec la mutation `markAsSent`
  sentAt: DateTime            
  
  # Personne ayant validé l'envoi, complété lors du remplissage du cadre 9 avec la mutation `markAsSent`
  sentBy: String              
  
  # [Obsolete, remplacé par wasteAcceptationStatus] Définit si le déchet a été accepté à la réception, complété avec la mutation `markAsReceived`
  isAccepted: Boolean         
  
  # Définit si le déchet a été accepté, refusé, partiellement refusé à la réception, complété avec la mutation `markAsReceived`
  wasteAcceptationStatus: Enum (ACCEPTED|REFUSED|PARTIALLY_REFUSED)

  # Décrit mle motif de refus ou refus partiel, requis dans ces 2 cas
  # wasteRefusalReason: String

  # Personne ayant validé la reception, complété lors du remplissage du cadre 10 avec la mutation `markAsReceived`
  receivedBy: String          
  
  # Date de réception, complété lors du remplissage du cadre 10 avec la mutation `markAsReceived`
  receivedAt: DateTime        
  
  # Quantité reçue, complété lors du remplissage du cadre 10 avec la mutation `markAsReceived`
  quantityReceived: Float
  
  # Opération réalisée, complété lors du remplissage du cadre 11 avec la mutation `markAsProcessed`
  processingOperationDone: String
  
  # Description de l'opération réalisée, complété lors du remplissage du cadre 11 avec la mutation `markAsProcessed`
  processingOperationDescription: String 
  
  # Personne validant l'opération, complété lors du remplissage du cadre 11 avec la mutation `markAsProcessed`
  processedBy: String
  
  # Date de validation de l'opétation, complété lors du remplissage du cadre 11 avec la mutation `markAsProcessed`
  processedAt: DateTime
  
  # Indique s'il y a perte de traçabilité, complété lors du remplissage du cadre 11 avec la mutation `markAsProcessed`
  noTraceability: Boolean
  
  # Eventuelle destination ultérieure, complété lors du remplissage du cadre 11 avec la mutation `markAsProcessed`
  nextDestinationProcessingOperation: String
  
  # Détails sur la destination ultérieure, complété lors du remplissage du cadre 11 avec la mutation `markAsProcessed`
  nextDestinationDetails: String
  
  # Bordereaux associés dans le cas d'une annexe 2. Complété lorsqu'on crée un bordereau avec annexe 2
  appendix2Forms: [Form]
}
```

## Champs obligatoires

Lors de la création d'un bordereau aucun champ n'est obligatoire. En revanche, si on souhaite le faire rentrer dans le workflow de validation, c'est à dire lui faire quitter l'état `DRAFT`, la plupart des champs sont obligatoires. Le détail pour chaque champ du type `FormInput`, type attendu lors de la création d'un bordereau, est présenté ci-dessous.

```bash
input FormInput {
  id: ID # Obligatoire ⚠ quand modification, non présent si création
  emitter: EmitterInput # Obligatoire ⚠
  recipient: RecipientInput # Obligatoire ⚠
  transporter: TransporterInput # Obligatoire ⚠
  wasteDetails: WasteDetailsInput # Obligatoire ⚠
  trader: TraderInput # Optionnel ✔. Tous les bordereaux ne passent pas par un négociant

  appendix2Forms: [AppendixFormInput] # Optionnel ✔. Utile uniquement lors de la création d'annexes 2
}

input EmitterInput {
  type: EmitterType # Obligatoire ⚠, peut prendre les valeurs PRODUCER|OTHER|APPENDIX2
  pickupSite: String # Optionnel ✔
  company: CompanyInput # Obligatoire ⚠
}

input RecipientInput {
  cap: String # Optionnel ✔
  processingOperation: String # Obligatoire ⚠
  company: CompanyInput # Obligatoire ⚠
}

input TransporterInput {
  receipt: String # Obligatoire ⚠
  department: String # Obligatoire ⚠
  validityLimit: DateTime # Optionnel ✔
  numberPlate: String # Optionnel ✔
  company: CompanyInput # Obligatoire ⚠
}

input TraderInput {
  receipt: String # Optionnel ✔
  department: String # Optionnel ✔
  validityLimit: DateTime # Optionnel ✔
  company: CompanyInput # Optionnel ✔
}

input WasteDetailsInput {
  code: String # Obligatoire ⚠
  name: String # Obligatoire ⚠
  onuCode: String # Obligatoire ⚠
  packagings: [Packagings] # Obligatoire ⚠
  otherPackaging: String # Optionnel ✔
  numberOfPackages: Int # Obligatoire ⚠
  quantity: Float # Obligatoire ⚠
  quantityType: QuantityType # Obligatoire ⚠, peut prendre les valeurs REAL|ESTIMATED
  consistence: Consistence # Obligatoire ⚠, peut prendre les valeurs SOLID|LIQUID|GASEOUS
}

input AppendixFormInput {
  emitterSiret: String # Optionnel ✔
  readableId: ID # Optionnel ✔
}

input CompanyInput {
  siret: String # Obligatoire ⚠
  name: String # Obligatoire ⚠
  address: String # Obligatoire ⚠
  contact: String # Obligatoire ⚠
  mail: String # Obligatoire ⚠
  phone: String # Obligatoire ⚠
}
```
