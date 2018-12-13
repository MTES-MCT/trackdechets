export const typeDefs = /* GraphQL */ `type AggregateCompany {
  count: Int!
}

type AggregateForm {
  count: Int!
}

type AggregateUser {
  count: Int!
}

type BatchPayload {
  count: Long!
}

type Company {
  siret: String!
}

type CompanyConnection {
  pageInfo: PageInfo!
  edges: [CompanyEdge]!
  aggregate: AggregateCompany!
}

input CompanyCreateInput {
  siret: String!
}

input CompanyCreateOneInput {
  create: CompanyCreateInput
  connect: CompanyWhereUniqueInput
}

type CompanyEdge {
  node: Company!
  cursor: String!
}

enum CompanyOrderByInput {
  siret_ASC
  siret_DESC
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type CompanyPreviousValues {
  siret: String!
}

type CompanySubscriptionPayload {
  mutation: MutationType!
  node: Company
  updatedFields: [String!]
  previousValues: CompanyPreviousValues
}

input CompanySubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: CompanyWhereInput
  AND: [CompanySubscriptionWhereInput!]
  OR: [CompanySubscriptionWhereInput!]
  NOT: [CompanySubscriptionWhereInput!]
}

input CompanyUpdateDataInput {
  siret: String
}

input CompanyUpdateInput {
  siret: String
}

input CompanyUpdateManyMutationInput {
  siret: String
}

input CompanyUpdateOneRequiredInput {
  create: CompanyCreateInput
  update: CompanyUpdateDataInput
  upsert: CompanyUpsertNestedInput
  connect: CompanyWhereUniqueInput
}

input CompanyUpsertNestedInput {
  update: CompanyUpdateDataInput!
  create: CompanyCreateInput!
}

input CompanyWhereInput {
  siret: String
  siret_not: String
  siret_in: [String!]
  siret_not_in: [String!]
  siret_lt: String
  siret_lte: String
  siret_gt: String
  siret_gte: String
  siret_contains: String
  siret_not_contains: String
  siret_starts_with: String
  siret_not_starts_with: String
  siret_ends_with: String
  siret_not_ends_with: String
  AND: [CompanyWhereInput!]
  OR: [CompanyWhereInput!]
  NOT: [CompanyWhereInput!]
}

input CompanyWhereUniqueInput {
  siret: String
}

scalar DateTime

enum EmitterType {
  PRODUCER
  OTHER
}

type Form {
  id: ID!
  owner: User!
  createdAt: DateTime!
  updatedAt: DateTime!
  status: String
  sentAt: DateTime
  sentBy: String
  isAccepted: Boolean
  receivedAt: DateTime
  quantityReceived: Float
  processingOperationDone: String
  emitterType: EmitterType
  emitterPickupSite: String
  emitterCompanyName: String
  emitterCompanySiret: String
  emitterCompanyAddress: String
  emitterCompanyContact: String
  emitterCompanyPhone: String
  emitterCompanyMail: String
  recipientCap: String
  recipientProcessingOperation: String
  recipientCompanyName: String
  recipientCompanySiret: String
  recipientCompanyAddress: String
  recipientCompanyContact: String
  recipientCompanyPhone: String
  recipientCompanyMail: String
  transporterCompanyName: String
  transporterCompanySiret: String
  transporterCompanyAddress: String
  transporterCompanyContact: String
  transporterCompanyPhone: String
  transporterCompanyMail: String
  transporterReceipt: String
  transporterDepartment: String
  transporterValidityLimit: DateTime
  transporterContact: String
  transporterNumberPlate: String
  wasteDetailsCode: String
  wasteDetailsOnuCode: String
  wasteDetailsPackagings: Json
  wasteDetailsOtherPackaging: String
  wasteDetailsNumberOfPackages: Int
  wasteDetailsQuantity: Float
  wasteDetailsQuantityType: QuantityType
}

type FormConnection {
  pageInfo: PageInfo!
  edges: [FormEdge]!
  aggregate: AggregateForm!
}

input FormCreateInput {
  owner: UserCreateOneInput!
  status: String
  sentAt: DateTime
  sentBy: String
  isAccepted: Boolean
  receivedAt: DateTime
  quantityReceived: Float
  processingOperationDone: String
  emitterType: EmitterType
  emitterPickupSite: String
  emitterCompanyName: String
  emitterCompanySiret: String
  emitterCompanyAddress: String
  emitterCompanyContact: String
  emitterCompanyPhone: String
  emitterCompanyMail: String
  recipientCap: String
  recipientProcessingOperation: String
  recipientCompanyName: String
  recipientCompanySiret: String
  recipientCompanyAddress: String
  recipientCompanyContact: String
  recipientCompanyPhone: String
  recipientCompanyMail: String
  transporterCompanyName: String
  transporterCompanySiret: String
  transporterCompanyAddress: String
  transporterCompanyContact: String
  transporterCompanyPhone: String
  transporterCompanyMail: String
  transporterReceipt: String
  transporterDepartment: String
  transporterValidityLimit: DateTime
  transporterContact: String
  transporterNumberPlate: String
  wasteDetailsCode: String
  wasteDetailsOnuCode: String
  wasteDetailsPackagings: Json
  wasteDetailsOtherPackaging: String
  wasteDetailsNumberOfPackages: Int
  wasteDetailsQuantity: Float
  wasteDetailsQuantityType: QuantityType
}

type FormEdge {
  node: Form!
  cursor: String!
}

enum FormOrderByInput {
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
  status_ASC
  status_DESC
  sentAt_ASC
  sentAt_DESC
  sentBy_ASC
  sentBy_DESC
  isAccepted_ASC
  isAccepted_DESC
  receivedAt_ASC
  receivedAt_DESC
  quantityReceived_ASC
  quantityReceived_DESC
  processingOperationDone_ASC
  processingOperationDone_DESC
  emitterType_ASC
  emitterType_DESC
  emitterPickupSite_ASC
  emitterPickupSite_DESC
  emitterCompanyName_ASC
  emitterCompanyName_DESC
  emitterCompanySiret_ASC
  emitterCompanySiret_DESC
  emitterCompanyAddress_ASC
  emitterCompanyAddress_DESC
  emitterCompanyContact_ASC
  emitterCompanyContact_DESC
  emitterCompanyPhone_ASC
  emitterCompanyPhone_DESC
  emitterCompanyMail_ASC
  emitterCompanyMail_DESC
  recipientCap_ASC
  recipientCap_DESC
  recipientProcessingOperation_ASC
  recipientProcessingOperation_DESC
  recipientCompanyName_ASC
  recipientCompanyName_DESC
  recipientCompanySiret_ASC
  recipientCompanySiret_DESC
  recipientCompanyAddress_ASC
  recipientCompanyAddress_DESC
  recipientCompanyContact_ASC
  recipientCompanyContact_DESC
  recipientCompanyPhone_ASC
  recipientCompanyPhone_DESC
  recipientCompanyMail_ASC
  recipientCompanyMail_DESC
  transporterCompanyName_ASC
  transporterCompanyName_DESC
  transporterCompanySiret_ASC
  transporterCompanySiret_DESC
  transporterCompanyAddress_ASC
  transporterCompanyAddress_DESC
  transporterCompanyContact_ASC
  transporterCompanyContact_DESC
  transporterCompanyPhone_ASC
  transporterCompanyPhone_DESC
  transporterCompanyMail_ASC
  transporterCompanyMail_DESC
  transporterReceipt_ASC
  transporterReceipt_DESC
  transporterDepartment_ASC
  transporterDepartment_DESC
  transporterValidityLimit_ASC
  transporterValidityLimit_DESC
  transporterContact_ASC
  transporterContact_DESC
  transporterNumberPlate_ASC
  transporterNumberPlate_DESC
  wasteDetailsCode_ASC
  wasteDetailsCode_DESC
  wasteDetailsOnuCode_ASC
  wasteDetailsOnuCode_DESC
  wasteDetailsPackagings_ASC
  wasteDetailsPackagings_DESC
  wasteDetailsOtherPackaging_ASC
  wasteDetailsOtherPackaging_DESC
  wasteDetailsNumberOfPackages_ASC
  wasteDetailsNumberOfPackages_DESC
  wasteDetailsQuantity_ASC
  wasteDetailsQuantity_DESC
  wasteDetailsQuantityType_ASC
  wasteDetailsQuantityType_DESC
}

type FormPreviousValues {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  status: String
  sentAt: DateTime
  sentBy: String
  isAccepted: Boolean
  receivedAt: DateTime
  quantityReceived: Float
  processingOperationDone: String
  emitterType: EmitterType
  emitterPickupSite: String
  emitterCompanyName: String
  emitterCompanySiret: String
  emitterCompanyAddress: String
  emitterCompanyContact: String
  emitterCompanyPhone: String
  emitterCompanyMail: String
  recipientCap: String
  recipientProcessingOperation: String
  recipientCompanyName: String
  recipientCompanySiret: String
  recipientCompanyAddress: String
  recipientCompanyContact: String
  recipientCompanyPhone: String
  recipientCompanyMail: String
  transporterCompanyName: String
  transporterCompanySiret: String
  transporterCompanyAddress: String
  transporterCompanyContact: String
  transporterCompanyPhone: String
  transporterCompanyMail: String
  transporterReceipt: String
  transporterDepartment: String
  transporterValidityLimit: DateTime
  transporterContact: String
  transporterNumberPlate: String
  wasteDetailsCode: String
  wasteDetailsOnuCode: String
  wasteDetailsPackagings: Json
  wasteDetailsOtherPackaging: String
  wasteDetailsNumberOfPackages: Int
  wasteDetailsQuantity: Float
  wasteDetailsQuantityType: QuantityType
}

type FormSubscriptionPayload {
  mutation: MutationType!
  node: Form
  updatedFields: [String!]
  previousValues: FormPreviousValues
}

input FormSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: FormWhereInput
  AND: [FormSubscriptionWhereInput!]
  OR: [FormSubscriptionWhereInput!]
  NOT: [FormSubscriptionWhereInput!]
}

input FormUpdateInput {
  owner: UserUpdateOneRequiredInput
  status: String
  sentAt: DateTime
  sentBy: String
  isAccepted: Boolean
  receivedAt: DateTime
  quantityReceived: Float
  processingOperationDone: String
  emitterType: EmitterType
  emitterPickupSite: String
  emitterCompanyName: String
  emitterCompanySiret: String
  emitterCompanyAddress: String
  emitterCompanyContact: String
  emitterCompanyPhone: String
  emitterCompanyMail: String
  recipientCap: String
  recipientProcessingOperation: String
  recipientCompanyName: String
  recipientCompanySiret: String
  recipientCompanyAddress: String
  recipientCompanyContact: String
  recipientCompanyPhone: String
  recipientCompanyMail: String
  transporterCompanyName: String
  transporterCompanySiret: String
  transporterCompanyAddress: String
  transporterCompanyContact: String
  transporterCompanyPhone: String
  transporterCompanyMail: String
  transporterReceipt: String
  transporterDepartment: String
  transporterValidityLimit: DateTime
  transporterContact: String
  transporterNumberPlate: String
  wasteDetailsCode: String
  wasteDetailsOnuCode: String
  wasteDetailsPackagings: Json
  wasteDetailsOtherPackaging: String
  wasteDetailsNumberOfPackages: Int
  wasteDetailsQuantity: Float
  wasteDetailsQuantityType: QuantityType
}

input FormUpdateManyMutationInput {
  status: String
  sentAt: DateTime
  sentBy: String
  isAccepted: Boolean
  receivedAt: DateTime
  quantityReceived: Float
  processingOperationDone: String
  emitterType: EmitterType
  emitterPickupSite: String
  emitterCompanyName: String
  emitterCompanySiret: String
  emitterCompanyAddress: String
  emitterCompanyContact: String
  emitterCompanyPhone: String
  emitterCompanyMail: String
  recipientCap: String
  recipientProcessingOperation: String
  recipientCompanyName: String
  recipientCompanySiret: String
  recipientCompanyAddress: String
  recipientCompanyContact: String
  recipientCompanyPhone: String
  recipientCompanyMail: String
  transporterCompanyName: String
  transporterCompanySiret: String
  transporterCompanyAddress: String
  transporterCompanyContact: String
  transporterCompanyPhone: String
  transporterCompanyMail: String
  transporterReceipt: String
  transporterDepartment: String
  transporterValidityLimit: DateTime
  transporterContact: String
  transporterNumberPlate: String
  wasteDetailsCode: String
  wasteDetailsOnuCode: String
  wasteDetailsPackagings: Json
  wasteDetailsOtherPackaging: String
  wasteDetailsNumberOfPackages: Int
  wasteDetailsQuantity: Float
  wasteDetailsQuantityType: QuantityType
}

input FormWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  owner: UserWhereInput
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  updatedAt: DateTime
  updatedAt_not: DateTime
  updatedAt_in: [DateTime!]
  updatedAt_not_in: [DateTime!]
  updatedAt_lt: DateTime
  updatedAt_lte: DateTime
  updatedAt_gt: DateTime
  updatedAt_gte: DateTime
  status: String
  status_not: String
  status_in: [String!]
  status_not_in: [String!]
  status_lt: String
  status_lte: String
  status_gt: String
  status_gte: String
  status_contains: String
  status_not_contains: String
  status_starts_with: String
  status_not_starts_with: String
  status_ends_with: String
  status_not_ends_with: String
  sentAt: DateTime
  sentAt_not: DateTime
  sentAt_in: [DateTime!]
  sentAt_not_in: [DateTime!]
  sentAt_lt: DateTime
  sentAt_lte: DateTime
  sentAt_gt: DateTime
  sentAt_gte: DateTime
  sentBy: String
  sentBy_not: String
  sentBy_in: [String!]
  sentBy_not_in: [String!]
  sentBy_lt: String
  sentBy_lte: String
  sentBy_gt: String
  sentBy_gte: String
  sentBy_contains: String
  sentBy_not_contains: String
  sentBy_starts_with: String
  sentBy_not_starts_with: String
  sentBy_ends_with: String
  sentBy_not_ends_with: String
  isAccepted: Boolean
  isAccepted_not: Boolean
  receivedAt: DateTime
  receivedAt_not: DateTime
  receivedAt_in: [DateTime!]
  receivedAt_not_in: [DateTime!]
  receivedAt_lt: DateTime
  receivedAt_lte: DateTime
  receivedAt_gt: DateTime
  receivedAt_gte: DateTime
  quantityReceived: Float
  quantityReceived_not: Float
  quantityReceived_in: [Float!]
  quantityReceived_not_in: [Float!]
  quantityReceived_lt: Float
  quantityReceived_lte: Float
  quantityReceived_gt: Float
  quantityReceived_gte: Float
  processingOperationDone: String
  processingOperationDone_not: String
  processingOperationDone_in: [String!]
  processingOperationDone_not_in: [String!]
  processingOperationDone_lt: String
  processingOperationDone_lte: String
  processingOperationDone_gt: String
  processingOperationDone_gte: String
  processingOperationDone_contains: String
  processingOperationDone_not_contains: String
  processingOperationDone_starts_with: String
  processingOperationDone_not_starts_with: String
  processingOperationDone_ends_with: String
  processingOperationDone_not_ends_with: String
  emitterType: EmitterType
  emitterType_not: EmitterType
  emitterType_in: [EmitterType!]
  emitterType_not_in: [EmitterType!]
  emitterPickupSite: String
  emitterPickupSite_not: String
  emitterPickupSite_in: [String!]
  emitterPickupSite_not_in: [String!]
  emitterPickupSite_lt: String
  emitterPickupSite_lte: String
  emitterPickupSite_gt: String
  emitterPickupSite_gte: String
  emitterPickupSite_contains: String
  emitterPickupSite_not_contains: String
  emitterPickupSite_starts_with: String
  emitterPickupSite_not_starts_with: String
  emitterPickupSite_ends_with: String
  emitterPickupSite_not_ends_with: String
  emitterCompanyName: String
  emitterCompanyName_not: String
  emitterCompanyName_in: [String!]
  emitterCompanyName_not_in: [String!]
  emitterCompanyName_lt: String
  emitterCompanyName_lte: String
  emitterCompanyName_gt: String
  emitterCompanyName_gte: String
  emitterCompanyName_contains: String
  emitterCompanyName_not_contains: String
  emitterCompanyName_starts_with: String
  emitterCompanyName_not_starts_with: String
  emitterCompanyName_ends_with: String
  emitterCompanyName_not_ends_with: String
  emitterCompanySiret: String
  emitterCompanySiret_not: String
  emitterCompanySiret_in: [String!]
  emitterCompanySiret_not_in: [String!]
  emitterCompanySiret_lt: String
  emitterCompanySiret_lte: String
  emitterCompanySiret_gt: String
  emitterCompanySiret_gte: String
  emitterCompanySiret_contains: String
  emitterCompanySiret_not_contains: String
  emitterCompanySiret_starts_with: String
  emitterCompanySiret_not_starts_with: String
  emitterCompanySiret_ends_with: String
  emitterCompanySiret_not_ends_with: String
  emitterCompanyAddress: String
  emitterCompanyAddress_not: String
  emitterCompanyAddress_in: [String!]
  emitterCompanyAddress_not_in: [String!]
  emitterCompanyAddress_lt: String
  emitterCompanyAddress_lte: String
  emitterCompanyAddress_gt: String
  emitterCompanyAddress_gte: String
  emitterCompanyAddress_contains: String
  emitterCompanyAddress_not_contains: String
  emitterCompanyAddress_starts_with: String
  emitterCompanyAddress_not_starts_with: String
  emitterCompanyAddress_ends_with: String
  emitterCompanyAddress_not_ends_with: String
  emitterCompanyContact: String
  emitterCompanyContact_not: String
  emitterCompanyContact_in: [String!]
  emitterCompanyContact_not_in: [String!]
  emitterCompanyContact_lt: String
  emitterCompanyContact_lte: String
  emitterCompanyContact_gt: String
  emitterCompanyContact_gte: String
  emitterCompanyContact_contains: String
  emitterCompanyContact_not_contains: String
  emitterCompanyContact_starts_with: String
  emitterCompanyContact_not_starts_with: String
  emitterCompanyContact_ends_with: String
  emitterCompanyContact_not_ends_with: String
  emitterCompanyPhone: String
  emitterCompanyPhone_not: String
  emitterCompanyPhone_in: [String!]
  emitterCompanyPhone_not_in: [String!]
  emitterCompanyPhone_lt: String
  emitterCompanyPhone_lte: String
  emitterCompanyPhone_gt: String
  emitterCompanyPhone_gte: String
  emitterCompanyPhone_contains: String
  emitterCompanyPhone_not_contains: String
  emitterCompanyPhone_starts_with: String
  emitterCompanyPhone_not_starts_with: String
  emitterCompanyPhone_ends_with: String
  emitterCompanyPhone_not_ends_with: String
  emitterCompanyMail: String
  emitterCompanyMail_not: String
  emitterCompanyMail_in: [String!]
  emitterCompanyMail_not_in: [String!]
  emitterCompanyMail_lt: String
  emitterCompanyMail_lte: String
  emitterCompanyMail_gt: String
  emitterCompanyMail_gte: String
  emitterCompanyMail_contains: String
  emitterCompanyMail_not_contains: String
  emitterCompanyMail_starts_with: String
  emitterCompanyMail_not_starts_with: String
  emitterCompanyMail_ends_with: String
  emitterCompanyMail_not_ends_with: String
  recipientCap: String
  recipientCap_not: String
  recipientCap_in: [String!]
  recipientCap_not_in: [String!]
  recipientCap_lt: String
  recipientCap_lte: String
  recipientCap_gt: String
  recipientCap_gte: String
  recipientCap_contains: String
  recipientCap_not_contains: String
  recipientCap_starts_with: String
  recipientCap_not_starts_with: String
  recipientCap_ends_with: String
  recipientCap_not_ends_with: String
  recipientProcessingOperation: String
  recipientProcessingOperation_not: String
  recipientProcessingOperation_in: [String!]
  recipientProcessingOperation_not_in: [String!]
  recipientProcessingOperation_lt: String
  recipientProcessingOperation_lte: String
  recipientProcessingOperation_gt: String
  recipientProcessingOperation_gte: String
  recipientProcessingOperation_contains: String
  recipientProcessingOperation_not_contains: String
  recipientProcessingOperation_starts_with: String
  recipientProcessingOperation_not_starts_with: String
  recipientProcessingOperation_ends_with: String
  recipientProcessingOperation_not_ends_with: String
  recipientCompanyName: String
  recipientCompanyName_not: String
  recipientCompanyName_in: [String!]
  recipientCompanyName_not_in: [String!]
  recipientCompanyName_lt: String
  recipientCompanyName_lte: String
  recipientCompanyName_gt: String
  recipientCompanyName_gte: String
  recipientCompanyName_contains: String
  recipientCompanyName_not_contains: String
  recipientCompanyName_starts_with: String
  recipientCompanyName_not_starts_with: String
  recipientCompanyName_ends_with: String
  recipientCompanyName_not_ends_with: String
  recipientCompanySiret: String
  recipientCompanySiret_not: String
  recipientCompanySiret_in: [String!]
  recipientCompanySiret_not_in: [String!]
  recipientCompanySiret_lt: String
  recipientCompanySiret_lte: String
  recipientCompanySiret_gt: String
  recipientCompanySiret_gte: String
  recipientCompanySiret_contains: String
  recipientCompanySiret_not_contains: String
  recipientCompanySiret_starts_with: String
  recipientCompanySiret_not_starts_with: String
  recipientCompanySiret_ends_with: String
  recipientCompanySiret_not_ends_with: String
  recipientCompanyAddress: String
  recipientCompanyAddress_not: String
  recipientCompanyAddress_in: [String!]
  recipientCompanyAddress_not_in: [String!]
  recipientCompanyAddress_lt: String
  recipientCompanyAddress_lte: String
  recipientCompanyAddress_gt: String
  recipientCompanyAddress_gte: String
  recipientCompanyAddress_contains: String
  recipientCompanyAddress_not_contains: String
  recipientCompanyAddress_starts_with: String
  recipientCompanyAddress_not_starts_with: String
  recipientCompanyAddress_ends_with: String
  recipientCompanyAddress_not_ends_with: String
  recipientCompanyContact: String
  recipientCompanyContact_not: String
  recipientCompanyContact_in: [String!]
  recipientCompanyContact_not_in: [String!]
  recipientCompanyContact_lt: String
  recipientCompanyContact_lte: String
  recipientCompanyContact_gt: String
  recipientCompanyContact_gte: String
  recipientCompanyContact_contains: String
  recipientCompanyContact_not_contains: String
  recipientCompanyContact_starts_with: String
  recipientCompanyContact_not_starts_with: String
  recipientCompanyContact_ends_with: String
  recipientCompanyContact_not_ends_with: String
  recipientCompanyPhone: String
  recipientCompanyPhone_not: String
  recipientCompanyPhone_in: [String!]
  recipientCompanyPhone_not_in: [String!]
  recipientCompanyPhone_lt: String
  recipientCompanyPhone_lte: String
  recipientCompanyPhone_gt: String
  recipientCompanyPhone_gte: String
  recipientCompanyPhone_contains: String
  recipientCompanyPhone_not_contains: String
  recipientCompanyPhone_starts_with: String
  recipientCompanyPhone_not_starts_with: String
  recipientCompanyPhone_ends_with: String
  recipientCompanyPhone_not_ends_with: String
  recipientCompanyMail: String
  recipientCompanyMail_not: String
  recipientCompanyMail_in: [String!]
  recipientCompanyMail_not_in: [String!]
  recipientCompanyMail_lt: String
  recipientCompanyMail_lte: String
  recipientCompanyMail_gt: String
  recipientCompanyMail_gte: String
  recipientCompanyMail_contains: String
  recipientCompanyMail_not_contains: String
  recipientCompanyMail_starts_with: String
  recipientCompanyMail_not_starts_with: String
  recipientCompanyMail_ends_with: String
  recipientCompanyMail_not_ends_with: String
  transporterCompanyName: String
  transporterCompanyName_not: String
  transporterCompanyName_in: [String!]
  transporterCompanyName_not_in: [String!]
  transporterCompanyName_lt: String
  transporterCompanyName_lte: String
  transporterCompanyName_gt: String
  transporterCompanyName_gte: String
  transporterCompanyName_contains: String
  transporterCompanyName_not_contains: String
  transporterCompanyName_starts_with: String
  transporterCompanyName_not_starts_with: String
  transporterCompanyName_ends_with: String
  transporterCompanyName_not_ends_with: String
  transporterCompanySiret: String
  transporterCompanySiret_not: String
  transporterCompanySiret_in: [String!]
  transporterCompanySiret_not_in: [String!]
  transporterCompanySiret_lt: String
  transporterCompanySiret_lte: String
  transporterCompanySiret_gt: String
  transporterCompanySiret_gte: String
  transporterCompanySiret_contains: String
  transporterCompanySiret_not_contains: String
  transporterCompanySiret_starts_with: String
  transporterCompanySiret_not_starts_with: String
  transporterCompanySiret_ends_with: String
  transporterCompanySiret_not_ends_with: String
  transporterCompanyAddress: String
  transporterCompanyAddress_not: String
  transporterCompanyAddress_in: [String!]
  transporterCompanyAddress_not_in: [String!]
  transporterCompanyAddress_lt: String
  transporterCompanyAddress_lte: String
  transporterCompanyAddress_gt: String
  transporterCompanyAddress_gte: String
  transporterCompanyAddress_contains: String
  transporterCompanyAddress_not_contains: String
  transporterCompanyAddress_starts_with: String
  transporterCompanyAddress_not_starts_with: String
  transporterCompanyAddress_ends_with: String
  transporterCompanyAddress_not_ends_with: String
  transporterCompanyContact: String
  transporterCompanyContact_not: String
  transporterCompanyContact_in: [String!]
  transporterCompanyContact_not_in: [String!]
  transporterCompanyContact_lt: String
  transporterCompanyContact_lte: String
  transporterCompanyContact_gt: String
  transporterCompanyContact_gte: String
  transporterCompanyContact_contains: String
  transporterCompanyContact_not_contains: String
  transporterCompanyContact_starts_with: String
  transporterCompanyContact_not_starts_with: String
  transporterCompanyContact_ends_with: String
  transporterCompanyContact_not_ends_with: String
  transporterCompanyPhone: String
  transporterCompanyPhone_not: String
  transporterCompanyPhone_in: [String!]
  transporterCompanyPhone_not_in: [String!]
  transporterCompanyPhone_lt: String
  transporterCompanyPhone_lte: String
  transporterCompanyPhone_gt: String
  transporterCompanyPhone_gte: String
  transporterCompanyPhone_contains: String
  transporterCompanyPhone_not_contains: String
  transporterCompanyPhone_starts_with: String
  transporterCompanyPhone_not_starts_with: String
  transporterCompanyPhone_ends_with: String
  transporterCompanyPhone_not_ends_with: String
  transporterCompanyMail: String
  transporterCompanyMail_not: String
  transporterCompanyMail_in: [String!]
  transporterCompanyMail_not_in: [String!]
  transporterCompanyMail_lt: String
  transporterCompanyMail_lte: String
  transporterCompanyMail_gt: String
  transporterCompanyMail_gte: String
  transporterCompanyMail_contains: String
  transporterCompanyMail_not_contains: String
  transporterCompanyMail_starts_with: String
  transporterCompanyMail_not_starts_with: String
  transporterCompanyMail_ends_with: String
  transporterCompanyMail_not_ends_with: String
  transporterReceipt: String
  transporterReceipt_not: String
  transporterReceipt_in: [String!]
  transporterReceipt_not_in: [String!]
  transporterReceipt_lt: String
  transporterReceipt_lte: String
  transporterReceipt_gt: String
  transporterReceipt_gte: String
  transporterReceipt_contains: String
  transporterReceipt_not_contains: String
  transporterReceipt_starts_with: String
  transporterReceipt_not_starts_with: String
  transporterReceipt_ends_with: String
  transporterReceipt_not_ends_with: String
  transporterDepartment: String
  transporterDepartment_not: String
  transporterDepartment_in: [String!]
  transporterDepartment_not_in: [String!]
  transporterDepartment_lt: String
  transporterDepartment_lte: String
  transporterDepartment_gt: String
  transporterDepartment_gte: String
  transporterDepartment_contains: String
  transporterDepartment_not_contains: String
  transporterDepartment_starts_with: String
  transporterDepartment_not_starts_with: String
  transporterDepartment_ends_with: String
  transporterDepartment_not_ends_with: String
  transporterValidityLimit: DateTime
  transporterValidityLimit_not: DateTime
  transporterValidityLimit_in: [DateTime!]
  transporterValidityLimit_not_in: [DateTime!]
  transporterValidityLimit_lt: DateTime
  transporterValidityLimit_lte: DateTime
  transporterValidityLimit_gt: DateTime
  transporterValidityLimit_gte: DateTime
  transporterContact: String
  transporterContact_not: String
  transporterContact_in: [String!]
  transporterContact_not_in: [String!]
  transporterContact_lt: String
  transporterContact_lte: String
  transporterContact_gt: String
  transporterContact_gte: String
  transporterContact_contains: String
  transporterContact_not_contains: String
  transporterContact_starts_with: String
  transporterContact_not_starts_with: String
  transporterContact_ends_with: String
  transporterContact_not_ends_with: String
  transporterNumberPlate: String
  transporterNumberPlate_not: String
  transporterNumberPlate_in: [String!]
  transporterNumberPlate_not_in: [String!]
  transporterNumberPlate_lt: String
  transporterNumberPlate_lte: String
  transporterNumberPlate_gt: String
  transporterNumberPlate_gte: String
  transporterNumberPlate_contains: String
  transporterNumberPlate_not_contains: String
  transporterNumberPlate_starts_with: String
  transporterNumberPlate_not_starts_with: String
  transporterNumberPlate_ends_with: String
  transporterNumberPlate_not_ends_with: String
  wasteDetailsCode: String
  wasteDetailsCode_not: String
  wasteDetailsCode_in: [String!]
  wasteDetailsCode_not_in: [String!]
  wasteDetailsCode_lt: String
  wasteDetailsCode_lte: String
  wasteDetailsCode_gt: String
  wasteDetailsCode_gte: String
  wasteDetailsCode_contains: String
  wasteDetailsCode_not_contains: String
  wasteDetailsCode_starts_with: String
  wasteDetailsCode_not_starts_with: String
  wasteDetailsCode_ends_with: String
  wasteDetailsCode_not_ends_with: String
  wasteDetailsOnuCode: String
  wasteDetailsOnuCode_not: String
  wasteDetailsOnuCode_in: [String!]
  wasteDetailsOnuCode_not_in: [String!]
  wasteDetailsOnuCode_lt: String
  wasteDetailsOnuCode_lte: String
  wasteDetailsOnuCode_gt: String
  wasteDetailsOnuCode_gte: String
  wasteDetailsOnuCode_contains: String
  wasteDetailsOnuCode_not_contains: String
  wasteDetailsOnuCode_starts_with: String
  wasteDetailsOnuCode_not_starts_with: String
  wasteDetailsOnuCode_ends_with: String
  wasteDetailsOnuCode_not_ends_with: String
  wasteDetailsOtherPackaging: String
  wasteDetailsOtherPackaging_not: String
  wasteDetailsOtherPackaging_in: [String!]
  wasteDetailsOtherPackaging_not_in: [String!]
  wasteDetailsOtherPackaging_lt: String
  wasteDetailsOtherPackaging_lte: String
  wasteDetailsOtherPackaging_gt: String
  wasteDetailsOtherPackaging_gte: String
  wasteDetailsOtherPackaging_contains: String
  wasteDetailsOtherPackaging_not_contains: String
  wasteDetailsOtherPackaging_starts_with: String
  wasteDetailsOtherPackaging_not_starts_with: String
  wasteDetailsOtherPackaging_ends_with: String
  wasteDetailsOtherPackaging_not_ends_with: String
  wasteDetailsNumberOfPackages: Int
  wasteDetailsNumberOfPackages_not: Int
  wasteDetailsNumberOfPackages_in: [Int!]
  wasteDetailsNumberOfPackages_not_in: [Int!]
  wasteDetailsNumberOfPackages_lt: Int
  wasteDetailsNumberOfPackages_lte: Int
  wasteDetailsNumberOfPackages_gt: Int
  wasteDetailsNumberOfPackages_gte: Int
  wasteDetailsQuantity: Float
  wasteDetailsQuantity_not: Float
  wasteDetailsQuantity_in: [Float!]
  wasteDetailsQuantity_not_in: [Float!]
  wasteDetailsQuantity_lt: Float
  wasteDetailsQuantity_lte: Float
  wasteDetailsQuantity_gt: Float
  wasteDetailsQuantity_gte: Float
  wasteDetailsQuantityType: QuantityType
  wasteDetailsQuantityType_not: QuantityType
  wasteDetailsQuantityType_in: [QuantityType!]
  wasteDetailsQuantityType_not_in: [QuantityType!]
  AND: [FormWhereInput!]
  OR: [FormWhereInput!]
  NOT: [FormWhereInput!]
}

input FormWhereUniqueInput {
  id: ID
}

scalar Json

scalar Long

type Mutation {
  createCompany(data: CompanyCreateInput!): Company!
  updateCompany(data: CompanyUpdateInput!, where: CompanyWhereUniqueInput!): Company
  updateManyCompanies(data: CompanyUpdateManyMutationInput!, where: CompanyWhereInput): BatchPayload!
  upsertCompany(where: CompanyWhereUniqueInput!, create: CompanyCreateInput!, update: CompanyUpdateInput!): Company!
  deleteCompany(where: CompanyWhereUniqueInput!): Company
  deleteManyCompanies(where: CompanyWhereInput): BatchPayload!
  createForm(data: FormCreateInput!): Form!
  updateForm(data: FormUpdateInput!, where: FormWhereUniqueInput!): Form
  updateManyForms(data: FormUpdateManyMutationInput!, where: FormWhereInput): BatchPayload!
  upsertForm(where: FormWhereUniqueInput!, create: FormCreateInput!, update: FormUpdateInput!): Form!
  deleteForm(where: FormWhereUniqueInput!): Form
  deleteManyForms(where: FormWhereInput): BatchPayload!
  createUser(data: UserCreateInput!): User!
  updateUser(data: UserUpdateInput!, where: UserWhereUniqueInput!): User
  updateManyUsers(data: UserUpdateManyMutationInput!, where: UserWhereInput): BatchPayload!
  upsertUser(where: UserWhereUniqueInput!, create: UserCreateInput!, update: UserUpdateInput!): User!
  deleteUser(where: UserWhereUniqueInput!): User
  deleteManyUsers(where: UserWhereInput): BatchPayload!
}

enum MutationType {
  CREATED
  UPDATED
  DELETED
}

interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

enum QuantityType {
  REAL
  ESTIMATED
}

type Query {
  company(where: CompanyWhereUniqueInput!): Company
  companies(where: CompanyWhereInput, orderBy: CompanyOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Company]!
  companiesConnection(where: CompanyWhereInput, orderBy: CompanyOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): CompanyConnection!
  form(where: FormWhereUniqueInput!): Form
  forms(where: FormWhereInput, orderBy: FormOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Form]!
  formsConnection(where: FormWhereInput, orderBy: FormOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): FormConnection!
  user(where: UserWhereUniqueInput!): User
  users(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [User]!
  usersConnection(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): UserConnection!
  node(id: ID!): Node
}

type Subscription {
  company(where: CompanySubscriptionWhereInput): CompanySubscriptionPayload
  form(where: FormSubscriptionWhereInput): FormSubscriptionPayload
  user(where: UserSubscriptionWhereInput): UserSubscriptionPayload
}

type User {
  id: ID!
  email: String!
  password: String!
  name: String
  phone: String
  company: Company!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserConnection {
  pageInfo: PageInfo!
  edges: [UserEdge]!
  aggregate: AggregateUser!
}

input UserCreateInput {
  email: String!
  password: String!
  name: String
  phone: String
  company: CompanyCreateOneInput!
}

input UserCreateOneInput {
  create: UserCreateInput
  connect: UserWhereUniqueInput
}

type UserEdge {
  node: User!
  cursor: String!
}

enum UserOrderByInput {
  id_ASC
  id_DESC
  email_ASC
  email_DESC
  password_ASC
  password_DESC
  name_ASC
  name_DESC
  phone_ASC
  phone_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type UserPreviousValues {
  id: ID!
  email: String!
  password: String!
  name: String
  phone: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserSubscriptionPayload {
  mutation: MutationType!
  node: User
  updatedFields: [String!]
  previousValues: UserPreviousValues
}

input UserSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: UserWhereInput
  AND: [UserSubscriptionWhereInput!]
  OR: [UserSubscriptionWhereInput!]
  NOT: [UserSubscriptionWhereInput!]
}

input UserUpdateDataInput {
  email: String
  password: String
  name: String
  phone: String
  company: CompanyUpdateOneRequiredInput
}

input UserUpdateInput {
  email: String
  password: String
  name: String
  phone: String
  company: CompanyUpdateOneRequiredInput
}

input UserUpdateManyMutationInput {
  email: String
  password: String
  name: String
  phone: String
}

input UserUpdateOneRequiredInput {
  create: UserCreateInput
  update: UserUpdateDataInput
  upsert: UserUpsertNestedInput
  connect: UserWhereUniqueInput
}

input UserUpsertNestedInput {
  update: UserUpdateDataInput!
  create: UserCreateInput!
}

input UserWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  email: String
  email_not: String
  email_in: [String!]
  email_not_in: [String!]
  email_lt: String
  email_lte: String
  email_gt: String
  email_gte: String
  email_contains: String
  email_not_contains: String
  email_starts_with: String
  email_not_starts_with: String
  email_ends_with: String
  email_not_ends_with: String
  password: String
  password_not: String
  password_in: [String!]
  password_not_in: [String!]
  password_lt: String
  password_lte: String
  password_gt: String
  password_gte: String
  password_contains: String
  password_not_contains: String
  password_starts_with: String
  password_not_starts_with: String
  password_ends_with: String
  password_not_ends_with: String
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  phone: String
  phone_not: String
  phone_in: [String!]
  phone_not_in: [String!]
  phone_lt: String
  phone_lte: String
  phone_gt: String
  phone_gte: String
  phone_contains: String
  phone_not_contains: String
  phone_starts_with: String
  phone_not_starts_with: String
  phone_ends_with: String
  phone_not_ends_with: String
  company: CompanyWhereInput
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  updatedAt: DateTime
  updatedAt_not: DateTime
  updatedAt_in: [DateTime!]
  updatedAt_not_in: [DateTime!]
  updatedAt_lt: DateTime
  updatedAt_lte: DateTime
  updatedAt_gt: DateTime
  updatedAt_gte: DateTime
  AND: [UserWhereInput!]
  OR: [UserWhereInput!]
  NOT: [UserWhereInput!]
}

input UserWhereUniqueInput {
  id: ID
  email: String
}
`