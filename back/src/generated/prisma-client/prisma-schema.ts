export const typeDefs = /* GraphQL */ `type AggregateCompany {
  count: Int!
}

type AggregateEmitter {
  count: Int!
}

type AggregateForm {
  count: Int!
}

type AggregateFormCompany {
  count: Int!
}

type AggregateRecipient {
  count: Int!
}

type AggregateTransporter {
  count: Int!
}

type AggregateUser {
  count: Int!
}

type AggregateWasteDetails {
  count: Int!
}

type BatchPayload {
  count: Long!
}

type Company {
  siret: Int!
}

type CompanyConnection {
  pageInfo: PageInfo!
  edges: [CompanyEdge]!
  aggregate: AggregateCompany!
}

input CompanyCreateInput {
  siret: Int!
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
  siret: Int!
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
  siret: Int
}

input CompanyUpdateInput {
  siret: Int
}

input CompanyUpdateManyMutationInput {
  siret: Int
}

input CompanyUpdateOneInput {
  create: CompanyCreateInput
  update: CompanyUpdateDataInput
  upsert: CompanyUpsertNestedInput
  delete: Boolean
  disconnect: Boolean
  connect: CompanyWhereUniqueInput
}

input CompanyUpsertNestedInput {
  update: CompanyUpdateDataInput!
  create: CompanyCreateInput!
}

input CompanyWhereInput {
  siret: Int
  siret_not: Int
  siret_in: [Int!]
  siret_not_in: [Int!]
  siret_lt: Int
  siret_lte: Int
  siret_gt: Int
  siret_gte: Int
  AND: [CompanyWhereInput!]
  OR: [CompanyWhereInput!]
  NOT: [CompanyWhereInput!]
}

input CompanyWhereUniqueInput {
  siret: Int
}

scalar DateTime

type Emitter {
  type: EmitterType
  pickupSite: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

type EmitterConnection {
  pageInfo: PageInfo!
  edges: [EmitterEdge]!
  aggregate: AggregateEmitter!
}

input EmitterCreateInput {
  type: EmitterType
  pickupSite: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

input EmitterCreateOneInput {
  create: EmitterCreateInput
}

type EmitterEdge {
  node: Emitter!
  cursor: String!
}

enum EmitterOrderByInput {
  type_ASC
  type_DESC
  pickupSite_ASC
  pickupSite_DESC
  companyName_ASC
  companyName_DESC
  companySiret_ASC
  companySiret_DESC
  companyAddress_ASC
  companyAddress_DESC
  companyContact_ASC
  companyContact_DESC
  companyPhone_ASC
  companyPhone_DESC
  companyMail_ASC
  companyMail_DESC
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type EmitterPreviousValues {
  type: EmitterType
  pickupSite: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

type EmitterSubscriptionPayload {
  mutation: MutationType!
  node: Emitter
  updatedFields: [String!]
  previousValues: EmitterPreviousValues
}

input EmitterSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: EmitterWhereInput
  AND: [EmitterSubscriptionWhereInput!]
  OR: [EmitterSubscriptionWhereInput!]
  NOT: [EmitterSubscriptionWhereInput!]
}

enum EmitterType {
  PRODUCER
  OTHER
}

input EmitterUpdateDataInput {
  type: EmitterType
  pickupSite: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

input EmitterUpdateManyMutationInput {
  type: EmitterType
  pickupSite: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

input EmitterUpdateOneInput {
  create: EmitterCreateInput
  update: EmitterUpdateDataInput
  upsert: EmitterUpsertNestedInput
  delete: Boolean
  disconnect: Boolean
}

input EmitterUpsertNestedInput {
  update: EmitterUpdateDataInput!
  create: EmitterCreateInput!
}

input EmitterWhereInput {
  type: EmitterType
  type_not: EmitterType
  type_in: [EmitterType!]
  type_not_in: [EmitterType!]
  pickupSite: String
  pickupSite_not: String
  pickupSite_in: [String!]
  pickupSite_not_in: [String!]
  pickupSite_lt: String
  pickupSite_lte: String
  pickupSite_gt: String
  pickupSite_gte: String
  pickupSite_contains: String
  pickupSite_not_contains: String
  pickupSite_starts_with: String
  pickupSite_not_starts_with: String
  pickupSite_ends_with: String
  pickupSite_not_ends_with: String
  companyName: String
  companyName_not: String
  companyName_in: [String!]
  companyName_not_in: [String!]
  companyName_lt: String
  companyName_lte: String
  companyName_gt: String
  companyName_gte: String
  companyName_contains: String
  companyName_not_contains: String
  companyName_starts_with: String
  companyName_not_starts_with: String
  companyName_ends_with: String
  companyName_not_ends_with: String
  companySiret: String
  companySiret_not: String
  companySiret_in: [String!]
  companySiret_not_in: [String!]
  companySiret_lt: String
  companySiret_lte: String
  companySiret_gt: String
  companySiret_gte: String
  companySiret_contains: String
  companySiret_not_contains: String
  companySiret_starts_with: String
  companySiret_not_starts_with: String
  companySiret_ends_with: String
  companySiret_not_ends_with: String
  companyAddress: String
  companyAddress_not: String
  companyAddress_in: [String!]
  companyAddress_not_in: [String!]
  companyAddress_lt: String
  companyAddress_lte: String
  companyAddress_gt: String
  companyAddress_gte: String
  companyAddress_contains: String
  companyAddress_not_contains: String
  companyAddress_starts_with: String
  companyAddress_not_starts_with: String
  companyAddress_ends_with: String
  companyAddress_not_ends_with: String
  companyContact: String
  companyContact_not: String
  companyContact_in: [String!]
  companyContact_not_in: [String!]
  companyContact_lt: String
  companyContact_lte: String
  companyContact_gt: String
  companyContact_gte: String
  companyContact_contains: String
  companyContact_not_contains: String
  companyContact_starts_with: String
  companyContact_not_starts_with: String
  companyContact_ends_with: String
  companyContact_not_ends_with: String
  companyPhone: Int
  companyPhone_not: Int
  companyPhone_in: [Int!]
  companyPhone_not_in: [Int!]
  companyPhone_lt: Int
  companyPhone_lte: Int
  companyPhone_gt: Int
  companyPhone_gte: Int
  companyMail: String
  companyMail_not: String
  companyMail_in: [String!]
  companyMail_not_in: [String!]
  companyMail_lt: String
  companyMail_lte: String
  companyMail_gt: String
  companyMail_gte: String
  companyMail_contains: String
  companyMail_not_contains: String
  companyMail_starts_with: String
  companyMail_not_starts_with: String
  companyMail_ends_with: String
  companyMail_not_ends_with: String
  AND: [EmitterWhereInput!]
  OR: [EmitterWhereInput!]
  NOT: [EmitterWhereInput!]
}

type Form {
  id: ID!
  owner: User!
  createdAt: DateTime!
  updatedAt: DateTime!
  emitter: Emitter
  recipient: Recipient
  transporter: Transporter
  wasteDetails: WasteDetails
}

type FormCompany {
  name: String
  siret: String
  address: String
  contact: String
  phone: Int
  mail: String
}

type FormCompanyConnection {
  pageInfo: PageInfo!
  edges: [FormCompanyEdge]!
  aggregate: AggregateFormCompany!
}

input FormCompanyCreateInput {
  name: String
  siret: String
  address: String
  contact: String
  phone: Int
  mail: String
}

type FormCompanyEdge {
  node: FormCompany!
  cursor: String!
}

enum FormCompanyOrderByInput {
  name_ASC
  name_DESC
  siret_ASC
  siret_DESC
  address_ASC
  address_DESC
  contact_ASC
  contact_DESC
  phone_ASC
  phone_DESC
  mail_ASC
  mail_DESC
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type FormCompanyPreviousValues {
  name: String
  siret: String
  address: String
  contact: String
  phone: Int
  mail: String
}

type FormCompanySubscriptionPayload {
  mutation: MutationType!
  node: FormCompany
  updatedFields: [String!]
  previousValues: FormCompanyPreviousValues
}

input FormCompanySubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: FormCompanyWhereInput
  AND: [FormCompanySubscriptionWhereInput!]
  OR: [FormCompanySubscriptionWhereInput!]
  NOT: [FormCompanySubscriptionWhereInput!]
}

input FormCompanyUpdateManyMutationInput {
  name: String
  siret: String
  address: String
  contact: String
  phone: Int
  mail: String
}

input FormCompanyWhereInput {
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
  address: String
  address_not: String
  address_in: [String!]
  address_not_in: [String!]
  address_lt: String
  address_lte: String
  address_gt: String
  address_gte: String
  address_contains: String
  address_not_contains: String
  address_starts_with: String
  address_not_starts_with: String
  address_ends_with: String
  address_not_ends_with: String
  contact: String
  contact_not: String
  contact_in: [String!]
  contact_not_in: [String!]
  contact_lt: String
  contact_lte: String
  contact_gt: String
  contact_gte: String
  contact_contains: String
  contact_not_contains: String
  contact_starts_with: String
  contact_not_starts_with: String
  contact_ends_with: String
  contact_not_ends_with: String
  phone: Int
  phone_not: Int
  phone_in: [Int!]
  phone_not_in: [Int!]
  phone_lt: Int
  phone_lte: Int
  phone_gt: Int
  phone_gte: Int
  mail: String
  mail_not: String
  mail_in: [String!]
  mail_not_in: [String!]
  mail_lt: String
  mail_lte: String
  mail_gt: String
  mail_gte: String
  mail_contains: String
  mail_not_contains: String
  mail_starts_with: String
  mail_not_starts_with: String
  mail_ends_with: String
  mail_not_ends_with: String
  AND: [FormCompanyWhereInput!]
  OR: [FormCompanyWhereInput!]
  NOT: [FormCompanyWhereInput!]
}

type FormConnection {
  pageInfo: PageInfo!
  edges: [FormEdge]!
  aggregate: AggregateForm!
}

input FormCreateInput {
  owner: UserCreateOneInput!
  emitter: EmitterCreateOneInput
  recipient: RecipientCreateOneInput
  transporter: TransporterCreateOneInput
  wasteDetails: WasteDetailsCreateOneInput
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
}

type FormPreviousValues {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
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
  emitter: EmitterUpdateOneInput
  recipient: RecipientUpdateOneInput
  transporter: TransporterUpdateOneInput
  wasteDetails: WasteDetailsUpdateOneInput
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
  emitter: EmitterWhereInput
  recipient: RecipientWhereInput
  transporter: TransporterWhereInput
  wasteDetails: WasteDetailsWhereInput
  AND: [FormWhereInput!]
  OR: [FormWhereInput!]
  NOT: [FormWhereInput!]
}

input FormWhereUniqueInput {
  id: ID
}

scalar Long

type Mutation {
  createCompany(data: CompanyCreateInput!): Company!
  updateCompany(data: CompanyUpdateInput!, where: CompanyWhereUniqueInput!): Company
  updateManyCompanies(data: CompanyUpdateManyMutationInput!, where: CompanyWhereInput): BatchPayload!
  upsertCompany(where: CompanyWhereUniqueInput!, create: CompanyCreateInput!, update: CompanyUpdateInput!): Company!
  deleteCompany(where: CompanyWhereUniqueInput!): Company
  deleteManyCompanies(where: CompanyWhereInput): BatchPayload!
  createEmitter(data: EmitterCreateInput!): Emitter!
  updateManyEmitters(data: EmitterUpdateManyMutationInput!, where: EmitterWhereInput): BatchPayload!
  deleteManyEmitters(where: EmitterWhereInput): BatchPayload!
  createForm(data: FormCreateInput!): Form!
  updateForm(data: FormUpdateInput!, where: FormWhereUniqueInput!): Form
  upsertForm(where: FormWhereUniqueInput!, create: FormCreateInput!, update: FormUpdateInput!): Form!
  deleteForm(where: FormWhereUniqueInput!): Form
  deleteManyForms(where: FormWhereInput): BatchPayload!
  createFormCompany(data: FormCompanyCreateInput!): FormCompany!
  updateManyFormCompanies(data: FormCompanyUpdateManyMutationInput!, where: FormCompanyWhereInput): BatchPayload!
  deleteManyFormCompanies(where: FormCompanyWhereInput): BatchPayload!
  createRecipient(data: RecipientCreateInput!): Recipient!
  updateManyRecipients(data: RecipientUpdateManyMutationInput!, where: RecipientWhereInput): BatchPayload!
  deleteManyRecipients(where: RecipientWhereInput): BatchPayload!
  createTransporter(data: TransporterCreateInput!): Transporter!
  updateManyTransporters(data: TransporterUpdateManyMutationInput!, where: TransporterWhereInput): BatchPayload!
  deleteManyTransporters(where: TransporterWhereInput): BatchPayload!
  createUser(data: UserCreateInput!): User!
  updateUser(data: UserUpdateInput!, where: UserWhereUniqueInput!): User
  updateManyUsers(data: UserUpdateManyMutationInput!, where: UserWhereInput): BatchPayload!
  upsertUser(where: UserWhereUniqueInput!, create: UserCreateInput!, update: UserUpdateInput!): User!
  deleteUser(where: UserWhereUniqueInput!): User
  deleteManyUsers(where: UserWhereInput): BatchPayload!
  createWasteDetails(data: WasteDetailsCreateInput!): WasteDetails!
  updateManyWasteDetailses(data: WasteDetailsUpdateManyMutationInput!, where: WasteDetailsWhereInput): BatchPayload!
  deleteManyWasteDetailses(where: WasteDetailsWhereInput): BatchPayload!
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
  emitters(where: EmitterWhereInput, orderBy: EmitterOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Emitter]!
  emittersConnection(where: EmitterWhereInput, orderBy: EmitterOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): EmitterConnection!
  form(where: FormWhereUniqueInput!): Form
  forms(where: FormWhereInput, orderBy: FormOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Form]!
  formsConnection(where: FormWhereInput, orderBy: FormOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): FormConnection!
  formCompanies(where: FormCompanyWhereInput, orderBy: FormCompanyOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [FormCompany]!
  formCompaniesConnection(where: FormCompanyWhereInput, orderBy: FormCompanyOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): FormCompanyConnection!
  recipients(where: RecipientWhereInput, orderBy: RecipientOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Recipient]!
  recipientsConnection(where: RecipientWhereInput, orderBy: RecipientOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): RecipientConnection!
  transporters(where: TransporterWhereInput, orderBy: TransporterOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Transporter]!
  transportersConnection(where: TransporterWhereInput, orderBy: TransporterOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): TransporterConnection!
  user(where: UserWhereUniqueInput!): User
  users(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [User]!
  usersConnection(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): UserConnection!
  wasteDetailses(where: WasteDetailsWhereInput, orderBy: WasteDetailsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [WasteDetails]!
  wasteDetailsesConnection(where: WasteDetailsWhereInput, orderBy: WasteDetailsOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): WasteDetailsConnection!
  node(id: ID!): Node
}

type Recipient {
  cap: String
  processingOperation: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

type RecipientConnection {
  pageInfo: PageInfo!
  edges: [RecipientEdge]!
  aggregate: AggregateRecipient!
}

input RecipientCreateInput {
  cap: String
  processingOperation: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

input RecipientCreateOneInput {
  create: RecipientCreateInput
}

type RecipientEdge {
  node: Recipient!
  cursor: String!
}

enum RecipientOrderByInput {
  cap_ASC
  cap_DESC
  processingOperation_ASC
  processingOperation_DESC
  companyName_ASC
  companyName_DESC
  companySiret_ASC
  companySiret_DESC
  companyAddress_ASC
  companyAddress_DESC
  companyContact_ASC
  companyContact_DESC
  companyPhone_ASC
  companyPhone_DESC
  companyMail_ASC
  companyMail_DESC
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type RecipientPreviousValues {
  cap: String
  processingOperation: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

type RecipientSubscriptionPayload {
  mutation: MutationType!
  node: Recipient
  updatedFields: [String!]
  previousValues: RecipientPreviousValues
}

input RecipientSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: RecipientWhereInput
  AND: [RecipientSubscriptionWhereInput!]
  OR: [RecipientSubscriptionWhereInput!]
  NOT: [RecipientSubscriptionWhereInput!]
}

input RecipientUpdateDataInput {
  cap: String
  processingOperation: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

input RecipientUpdateManyMutationInput {
  cap: String
  processingOperation: String
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
}

input RecipientUpdateOneInput {
  create: RecipientCreateInput
  update: RecipientUpdateDataInput
  upsert: RecipientUpsertNestedInput
  delete: Boolean
  disconnect: Boolean
}

input RecipientUpsertNestedInput {
  update: RecipientUpdateDataInput!
  create: RecipientCreateInput!
}

input RecipientWhereInput {
  cap: String
  cap_not: String
  cap_in: [String!]
  cap_not_in: [String!]
  cap_lt: String
  cap_lte: String
  cap_gt: String
  cap_gte: String
  cap_contains: String
  cap_not_contains: String
  cap_starts_with: String
  cap_not_starts_with: String
  cap_ends_with: String
  cap_not_ends_with: String
  processingOperation: String
  processingOperation_not: String
  processingOperation_in: [String!]
  processingOperation_not_in: [String!]
  processingOperation_lt: String
  processingOperation_lte: String
  processingOperation_gt: String
  processingOperation_gte: String
  processingOperation_contains: String
  processingOperation_not_contains: String
  processingOperation_starts_with: String
  processingOperation_not_starts_with: String
  processingOperation_ends_with: String
  processingOperation_not_ends_with: String
  companyName: String
  companyName_not: String
  companyName_in: [String!]
  companyName_not_in: [String!]
  companyName_lt: String
  companyName_lte: String
  companyName_gt: String
  companyName_gte: String
  companyName_contains: String
  companyName_not_contains: String
  companyName_starts_with: String
  companyName_not_starts_with: String
  companyName_ends_with: String
  companyName_not_ends_with: String
  companySiret: String
  companySiret_not: String
  companySiret_in: [String!]
  companySiret_not_in: [String!]
  companySiret_lt: String
  companySiret_lte: String
  companySiret_gt: String
  companySiret_gte: String
  companySiret_contains: String
  companySiret_not_contains: String
  companySiret_starts_with: String
  companySiret_not_starts_with: String
  companySiret_ends_with: String
  companySiret_not_ends_with: String
  companyAddress: String
  companyAddress_not: String
  companyAddress_in: [String!]
  companyAddress_not_in: [String!]
  companyAddress_lt: String
  companyAddress_lte: String
  companyAddress_gt: String
  companyAddress_gte: String
  companyAddress_contains: String
  companyAddress_not_contains: String
  companyAddress_starts_with: String
  companyAddress_not_starts_with: String
  companyAddress_ends_with: String
  companyAddress_not_ends_with: String
  companyContact: String
  companyContact_not: String
  companyContact_in: [String!]
  companyContact_not_in: [String!]
  companyContact_lt: String
  companyContact_lte: String
  companyContact_gt: String
  companyContact_gte: String
  companyContact_contains: String
  companyContact_not_contains: String
  companyContact_starts_with: String
  companyContact_not_starts_with: String
  companyContact_ends_with: String
  companyContact_not_ends_with: String
  companyPhone: Int
  companyPhone_not: Int
  companyPhone_in: [Int!]
  companyPhone_not_in: [Int!]
  companyPhone_lt: Int
  companyPhone_lte: Int
  companyPhone_gt: Int
  companyPhone_gte: Int
  companyMail: String
  companyMail_not: String
  companyMail_in: [String!]
  companyMail_not_in: [String!]
  companyMail_lt: String
  companyMail_lte: String
  companyMail_gt: String
  companyMail_gte: String
  companyMail_contains: String
  companyMail_not_contains: String
  companyMail_starts_with: String
  companyMail_not_starts_with: String
  companyMail_ends_with: String
  companyMail_not_ends_with: String
  AND: [RecipientWhereInput!]
  OR: [RecipientWhereInput!]
  NOT: [RecipientWhereInput!]
}

type Subscription {
  company(where: CompanySubscriptionWhereInput): CompanySubscriptionPayload
  emitter(where: EmitterSubscriptionWhereInput): EmitterSubscriptionPayload
  form(where: FormSubscriptionWhereInput): FormSubscriptionPayload
  formCompany(where: FormCompanySubscriptionWhereInput): FormCompanySubscriptionPayload
  recipient(where: RecipientSubscriptionWhereInput): RecipientSubscriptionPayload
  transporter(where: TransporterSubscriptionWhereInput): TransporterSubscriptionPayload
  user(where: UserSubscriptionWhereInput): UserSubscriptionPayload
  wasteDetails(where: WasteDetailsSubscriptionWhereInput): WasteDetailsSubscriptionPayload
}

type Transporter {
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
  receipt: String
  department: String
  validityLimit: DateTime
  contact: String
  numberPlate: String
}

type TransporterConnection {
  pageInfo: PageInfo!
  edges: [TransporterEdge]!
  aggregate: AggregateTransporter!
}

input TransporterCreateInput {
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
  receipt: String
  department: String
  validityLimit: DateTime
  contact: String
  numberPlate: String
}

input TransporterCreateOneInput {
  create: TransporterCreateInput
}

type TransporterEdge {
  node: Transporter!
  cursor: String!
}

enum TransporterOrderByInput {
  companyName_ASC
  companyName_DESC
  companySiret_ASC
  companySiret_DESC
  companyAddress_ASC
  companyAddress_DESC
  companyContact_ASC
  companyContact_DESC
  companyPhone_ASC
  companyPhone_DESC
  companyMail_ASC
  companyMail_DESC
  receipt_ASC
  receipt_DESC
  department_ASC
  department_DESC
  validityLimit_ASC
  validityLimit_DESC
  contact_ASC
  contact_DESC
  numberPlate_ASC
  numberPlate_DESC
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type TransporterPreviousValues {
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
  receipt: String
  department: String
  validityLimit: DateTime
  contact: String
  numberPlate: String
}

type TransporterSubscriptionPayload {
  mutation: MutationType!
  node: Transporter
  updatedFields: [String!]
  previousValues: TransporterPreviousValues
}

input TransporterSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: TransporterWhereInput
  AND: [TransporterSubscriptionWhereInput!]
  OR: [TransporterSubscriptionWhereInput!]
  NOT: [TransporterSubscriptionWhereInput!]
}

input TransporterUpdateDataInput {
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
  receipt: String
  department: String
  validityLimit: DateTime
  contact: String
  numberPlate: String
}

input TransporterUpdateManyMutationInput {
  companyName: String
  companySiret: String
  companyAddress: String
  companyContact: String
  companyPhone: Int
  companyMail: String
  receipt: String
  department: String
  validityLimit: DateTime
  contact: String
  numberPlate: String
}

input TransporterUpdateOneInput {
  create: TransporterCreateInput
  update: TransporterUpdateDataInput
  upsert: TransporterUpsertNestedInput
  delete: Boolean
  disconnect: Boolean
}

input TransporterUpsertNestedInput {
  update: TransporterUpdateDataInput!
  create: TransporterCreateInput!
}

input TransporterWhereInput {
  companyName: String
  companyName_not: String
  companyName_in: [String!]
  companyName_not_in: [String!]
  companyName_lt: String
  companyName_lte: String
  companyName_gt: String
  companyName_gte: String
  companyName_contains: String
  companyName_not_contains: String
  companyName_starts_with: String
  companyName_not_starts_with: String
  companyName_ends_with: String
  companyName_not_ends_with: String
  companySiret: String
  companySiret_not: String
  companySiret_in: [String!]
  companySiret_not_in: [String!]
  companySiret_lt: String
  companySiret_lte: String
  companySiret_gt: String
  companySiret_gte: String
  companySiret_contains: String
  companySiret_not_contains: String
  companySiret_starts_with: String
  companySiret_not_starts_with: String
  companySiret_ends_with: String
  companySiret_not_ends_with: String
  companyAddress: String
  companyAddress_not: String
  companyAddress_in: [String!]
  companyAddress_not_in: [String!]
  companyAddress_lt: String
  companyAddress_lte: String
  companyAddress_gt: String
  companyAddress_gte: String
  companyAddress_contains: String
  companyAddress_not_contains: String
  companyAddress_starts_with: String
  companyAddress_not_starts_with: String
  companyAddress_ends_with: String
  companyAddress_not_ends_with: String
  companyContact: String
  companyContact_not: String
  companyContact_in: [String!]
  companyContact_not_in: [String!]
  companyContact_lt: String
  companyContact_lte: String
  companyContact_gt: String
  companyContact_gte: String
  companyContact_contains: String
  companyContact_not_contains: String
  companyContact_starts_with: String
  companyContact_not_starts_with: String
  companyContact_ends_with: String
  companyContact_not_ends_with: String
  companyPhone: Int
  companyPhone_not: Int
  companyPhone_in: [Int!]
  companyPhone_not_in: [Int!]
  companyPhone_lt: Int
  companyPhone_lte: Int
  companyPhone_gt: Int
  companyPhone_gte: Int
  companyMail: String
  companyMail_not: String
  companyMail_in: [String!]
  companyMail_not_in: [String!]
  companyMail_lt: String
  companyMail_lte: String
  companyMail_gt: String
  companyMail_gte: String
  companyMail_contains: String
  companyMail_not_contains: String
  companyMail_starts_with: String
  companyMail_not_starts_with: String
  companyMail_ends_with: String
  companyMail_not_ends_with: String
  receipt: String
  receipt_not: String
  receipt_in: [String!]
  receipt_not_in: [String!]
  receipt_lt: String
  receipt_lte: String
  receipt_gt: String
  receipt_gte: String
  receipt_contains: String
  receipt_not_contains: String
  receipt_starts_with: String
  receipt_not_starts_with: String
  receipt_ends_with: String
  receipt_not_ends_with: String
  department: String
  department_not: String
  department_in: [String!]
  department_not_in: [String!]
  department_lt: String
  department_lte: String
  department_gt: String
  department_gte: String
  department_contains: String
  department_not_contains: String
  department_starts_with: String
  department_not_starts_with: String
  department_ends_with: String
  department_not_ends_with: String
  validityLimit: DateTime
  validityLimit_not: DateTime
  validityLimit_in: [DateTime!]
  validityLimit_not_in: [DateTime!]
  validityLimit_lt: DateTime
  validityLimit_lte: DateTime
  validityLimit_gt: DateTime
  validityLimit_gte: DateTime
  contact: String
  contact_not: String
  contact_in: [String!]
  contact_not_in: [String!]
  contact_lt: String
  contact_lte: String
  contact_gt: String
  contact_gte: String
  contact_contains: String
  contact_not_contains: String
  contact_starts_with: String
  contact_not_starts_with: String
  contact_ends_with: String
  contact_not_ends_with: String
  numberPlate: String
  numberPlate_not: String
  numberPlate_in: [String!]
  numberPlate_not_in: [String!]
  numberPlate_lt: String
  numberPlate_lte: String
  numberPlate_gt: String
  numberPlate_gte: String
  numberPlate_contains: String
  numberPlate_not_contains: String
  numberPlate_starts_with: String
  numberPlate_not_starts_with: String
  numberPlate_ends_with: String
  numberPlate_not_ends_with: String
  AND: [TransporterWhereInput!]
  OR: [TransporterWhereInput!]
  NOT: [TransporterWhereInput!]
}

type User {
  id: ID!
  email: String!
  password: String!
  name: String
  phone: String
  company: Company
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
  company: CompanyCreateOneInput
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
  company: CompanyUpdateOneInput
}

input UserUpdateInput {
  email: String
  password: String
  name: String
  phone: String
  company: CompanyUpdateOneInput
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

type WasteDetails {
  code: String
  onuCode: String
  packaging: String
  numberOfPackages: Int
  quantity: Float
  quantityType: QuantityType
}

type WasteDetailsConnection {
  pageInfo: PageInfo!
  edges: [WasteDetailsEdge]!
  aggregate: AggregateWasteDetails!
}

input WasteDetailsCreateInput {
  code: String
  onuCode: String
  packaging: String
  numberOfPackages: Int
  quantity: Float
  quantityType: QuantityType
}

input WasteDetailsCreateOneInput {
  create: WasteDetailsCreateInput
}

type WasteDetailsEdge {
  node: WasteDetails!
  cursor: String!
}

enum WasteDetailsOrderByInput {
  code_ASC
  code_DESC
  onuCode_ASC
  onuCode_DESC
  packaging_ASC
  packaging_DESC
  numberOfPackages_ASC
  numberOfPackages_DESC
  quantity_ASC
  quantity_DESC
  quantityType_ASC
  quantityType_DESC
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type WasteDetailsPreviousValues {
  code: String
  onuCode: String
  packaging: String
  numberOfPackages: Int
  quantity: Float
  quantityType: QuantityType
}

type WasteDetailsSubscriptionPayload {
  mutation: MutationType!
  node: WasteDetails
  updatedFields: [String!]
  previousValues: WasteDetailsPreviousValues
}

input WasteDetailsSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: WasteDetailsWhereInput
  AND: [WasteDetailsSubscriptionWhereInput!]
  OR: [WasteDetailsSubscriptionWhereInput!]
  NOT: [WasteDetailsSubscriptionWhereInput!]
}

input WasteDetailsUpdateDataInput {
  code: String
  onuCode: String
  packaging: String
  numberOfPackages: Int
  quantity: Float
  quantityType: QuantityType
}

input WasteDetailsUpdateManyMutationInput {
  code: String
  onuCode: String
  packaging: String
  numberOfPackages: Int
  quantity: Float
  quantityType: QuantityType
}

input WasteDetailsUpdateOneInput {
  create: WasteDetailsCreateInput
  update: WasteDetailsUpdateDataInput
  upsert: WasteDetailsUpsertNestedInput
  delete: Boolean
  disconnect: Boolean
}

input WasteDetailsUpsertNestedInput {
  update: WasteDetailsUpdateDataInput!
  create: WasteDetailsCreateInput!
}

input WasteDetailsWhereInput {
  code: String
  code_not: String
  code_in: [String!]
  code_not_in: [String!]
  code_lt: String
  code_lte: String
  code_gt: String
  code_gte: String
  code_contains: String
  code_not_contains: String
  code_starts_with: String
  code_not_starts_with: String
  code_ends_with: String
  code_not_ends_with: String
  onuCode: String
  onuCode_not: String
  onuCode_in: [String!]
  onuCode_not_in: [String!]
  onuCode_lt: String
  onuCode_lte: String
  onuCode_gt: String
  onuCode_gte: String
  onuCode_contains: String
  onuCode_not_contains: String
  onuCode_starts_with: String
  onuCode_not_starts_with: String
  onuCode_ends_with: String
  onuCode_not_ends_with: String
  packaging: String
  packaging_not: String
  packaging_in: [String!]
  packaging_not_in: [String!]
  packaging_lt: String
  packaging_lte: String
  packaging_gt: String
  packaging_gte: String
  packaging_contains: String
  packaging_not_contains: String
  packaging_starts_with: String
  packaging_not_starts_with: String
  packaging_ends_with: String
  packaging_not_ends_with: String
  numberOfPackages: Int
  numberOfPackages_not: Int
  numberOfPackages_in: [Int!]
  numberOfPackages_not_in: [Int!]
  numberOfPackages_lt: Int
  numberOfPackages_lte: Int
  numberOfPackages_gt: Int
  numberOfPackages_gte: Int
  quantity: Float
  quantity_not: Float
  quantity_in: [Float!]
  quantity_not_in: [Float!]
  quantity_lt: Float
  quantity_lte: Float
  quantity_gt: Float
  quantity_gte: Float
  quantityType: QuantityType
  quantityType_not: QuantityType
  quantityType_in: [QuantityType!]
  quantityType_not_in: [QuantityType!]
  AND: [WasteDetailsWhereInput!]
  OR: [WasteDetailsWhereInput!]
  NOT: [WasteDetailsWhereInput!]
}
`