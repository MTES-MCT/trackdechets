"use strict";(self.webpackChunktrackdechets=self.webpackChunktrackdechets||[]).push([[4776],{3090:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>a,contentTitle:()=>i,default:()=>h,frontMatter:()=>l,metadata:()=>d,toc:()=>c});var n=s(4848),t=s(8453);const l={title:"Erreurs"},i=void 0,d={id:"reference/errors",title:"Erreurs",description:"Formattage des erreurs",source:"@site/docs/reference/errors.md",sourceDirName:"reference",slug:"/reference/errors",permalink:"/reference/errors",draft:!1,unlisted:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/reference/errors.md",tags:[],version:"current",frontMatter:{title:"Erreurs"},sidebar:"docs",previous:{title:"Hi\xe9rarchie des modes de traitement",permalink:"/reference/operationModes"},next:{title:"Notifications",permalink:"/reference/notifications"}},a={},c=[{value:"Formattage des erreurs",id:"formattage-des-erreurs",level:2},{value:"Liste des codes erreur GraphQL",id:"liste-des-codes-erreur-graphql",level:2},{value:"Liste des codes HTTP",id:"liste-des-codes-http",level:2}];function o(e){const r={a:"a",admonition:"admonition",code:"code",h2:"h2",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,t.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.h2,{id:"formattage-des-erreurs",children:"Formattage des erreurs"}),"\n",(0,n.jsxs)(r.p,{children:["Dans le cas o\xf9 une erreur a lieu avant ou pendant l'ex\xe9cution d'une requ\xeate GraphQL, un champ ",(0,n.jsx)(r.code,{children:"errors"})," sera pr\xe9sent dans le corps de la r\xe9ponse. Ce champ correspond \xe0 une liste non vide d'erreurs format\xe9es de la fa\xe7on suivante :"]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-json",children:'{\n  "errors": [\n    {\n      "message": "Vous n\'\xeates pas authentifi\xe9",\n      "extensions": {\n        "code": "UNAUTHENTICATED"\n      }\n    }\n  ]\n}\n'})}),"\n",(0,n.jsxs)(r.p,{children:["Voir ",(0,n.jsx)(r.a,{href:"https://spec.graphql.org/June2018/#sec-Response-Format",children:"GraphQL Response Format"})," pour plus d'information sur le formattage des erreurs GraphQL."]}),"\n",(0,n.jsxs)(r.p,{children:["Le champ ",(0,n.jsx)(r.code,{children:"code"})," permet au client de l'API d'\xeatre inform\xe9 du type d'erreur renvoy\xe9 et d'effectuer une action ad\xe9quate."]}),"\n",(0,n.jsx)(r.h2,{id:"liste-des-codes-erreur-graphql",children:"Liste des codes erreur GraphQL"}),"\n",(0,n.jsx)(r.p,{children:"La liste des codes erreur utilis\xe9s est la suivante :"}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"GRAPHQL_PARSE_FAILED"})," : Erreur de syntaxe dans la requ\xeate GraphQL. Exemple :"]}),"\n"]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-graphql",children:"query {\n  me  // accolade manquante\n    email\n  }\n}\n"})}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"GRAPHQL_VALIDATION_FAILED"})," : La syntaxe de la requ\xeate GraphQL est correcte mais elle ne correspond pas au sch\xe9ma. Exemple :"]}),"\n"]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-graphql",children:"{\n  query {\n    me {\n      hair_color // le champ hair_color n'existe pas sur le type User\n    }\n  }\n}\n"})}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:["\n",(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.code,{children:"UNAUTHENTICATED"})," : Vous n'\xeates pas authentifi\xe9."]}),"\n"]}),"\n",(0,n.jsxs)(r.li,{children:["\n",(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.code,{children:"FORBIDDEN"})," : Vous n'avez pas les droits pour effectuer l'action d\xe9sir\xe9e. Exemple: vous essayez de finaliser un bordereau sur lesquel aucune entreprise dont vous \xeates membre n'apparait."]}),"\n"]}),"\n",(0,n.jsxs)(r.li,{children:["\n",(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.code,{children:"BAD_USER_INPUT"})," : La requ\xeate GraphQL est valide mais la valeur des arguments fournis ne l'est pas. Exemple: vous essayez de passer un SIRET qui ne fait pas 14 caract\xe8res."]}),"\n"]}),"\n",(0,n.jsxs)(r.li,{children:["\n",(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.code,{children:"EXTERNAL_SERVICE_ERROR"})," : La requ\xeate GraphQL est valide mais un service tiers externe \xe0 Trackd\xe9chets a renvoy\xe9 une erreur."]}),"\n"]}),"\n"]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-graphql",children:'query {\n  companyInfos(siret: "123") {\n    siret\n  }\n}\n'})}),"\n",(0,n.jsxs)(r.p,{children:["Dans le cas des erreurs ",(0,n.jsx)(r.code,{children:"BAD_USER_INPUT"})," un champ additionnel ",(0,n.jsx)(r.code,{children:"invalidArgs"})," pourra \xeatre pr\xe9sent dans la r\xe9ponse."]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-json",children:'{\n  "errors": [\n    {\n      "message": "Le siret doit faire 14 caract\xe8res",\n      "extensions": {\n        "code": "BAD_USER_INPUT",\n        "invalidArgs": [\n          "siret"\n        ]\n      }\n    }\n  ]\n}\n'})}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"INTERNAL_SERVER_ERROR"})," : Une erreur inconnue s'est produite. Ce code s'accompagne du message d'erreur \"Erreur serveur\"."]}),"\n"]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-json",children:'{\n  "errors": [\n    {\n      "message": "Erreur serveur",\n      "extensions": {\n        "code": "INTERNAL_SERVER_ERROR"\n      }\n    }\n  ]\n}\n'})}),"\n",(0,n.jsxs)(r.ul,{children:["\n",(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.code,{children:"GRAPHQL_MAX_OPERATIONS_ERROR"})," : La limite du nombre d'op\xe9rations GraphQL group\xe9es est d\xe9pass\xe9e."]}),"\n"]}),"\n",(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:"language-json",children:'{\n  "errors": [\n    {\n      "message": "Batching by query merging is limited to 5 operations per query.",\n      "extensions": {\n        "code": "GRAPHQL_MAX_OPERATIONS_ERROR"\n      }\n    }\n  ]\n}\n'})}),"\n",(0,n.jsx)(r.h2,{id:"liste-des-codes-http",children:"Liste des codes HTTP"}),"\n",(0,n.jsx)(r.p,{children:"Ci-dessous un tableau r\xe9capitulatif des diff\xe9rents codes HTTP et codes GraphQL possibles :"}),"\n",(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{style:{textAlign:"left"},children:"Code HTTP"}),(0,n.jsx)(r.th,{style:{textAlign:"left"},children:"Code GraphQL"}),(0,n.jsx)(r.th,{style:{textAlign:"left"},children:"Erreur"})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"200"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"UNAUTHENTICATED"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"Vous n'\xeates pas authentifi\xe9"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"200"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"FORBIDDEN"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"Vous n'avez pas les droits pour effectuer l'action d\xe9sir\xe9e"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"200"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"BAD_USER_INPUT"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"La requ\xeate GraphQL est valide mais la valeur des arguments fournis ne l'est pas"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"400"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"GRAPHQL_PARSE_FAILED"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"Erreur de syntaxe GraphQL"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"400"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"GRAPHQL_VALIDATION_FAILED"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"La syntaxe de la requ\xeate GraphQL est correcte mais elle ne correspond pas au sch\xe9ma"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"400"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"GRAPHQL_MAX_OPERATIONS_ERROR"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"La limite du nombre d'op\xe9rations GraphQL group\xe9es est d\xe9pass\xe9e."})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"502"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"N/A"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"Le serveur GraphQL est indisponible"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"503"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"N/A"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"Le serveur GraphQL est indisponible"})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"504"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"N/A"}),(0,n.jsx)(r.td,{style:{textAlign:"left"},children:"Le serveur GraphQL met trop de temps \xe0 r\xe9pondre"})]})]})]}),"\n",(0,n.jsx)(r.admonition,{type:"tip",children:(0,n.jsxs)(r.p,{children:['Le code HTTP renvoy\xe9 par le serveur GraphQL est toujours 200 lorsque la requ\xeate GraphQL a \xe9t\xe9 "comprise" par le serveur (la syntaxe est bonne et la requ\xeate correspond au sch\xe9ma). ',(0,n.jsx)("br",{}),"\nEn cas d'indisponibilit\xe9 ou de surcharge du serveur GraphQL, l'erreur renvoy\xe9e provient du serveur proxy et ne comporte pas de code erreur GraphQL."]})})]})}function h(e={}){const{wrapper:r}={...(0,t.R)(),...e.components};return r?(0,n.jsx)(r,{...e,children:(0,n.jsx)(o,{...e})}):o(e)}},8453:(e,r,s)=>{s.d(r,{R:()=>i,x:()=>d});var n=s(6540);const t={},l=n.createContext(t);function i(e){const r=n.useContext(l);return n.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function d(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:i(e.components),n.createElement(l.Provider,{value:r},e.children)}}}]);