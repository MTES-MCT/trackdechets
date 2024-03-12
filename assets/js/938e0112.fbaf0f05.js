"use strict";(self.webpackChunktrackdechets=self.webpackChunktrackdechets||[]).push([[3178],{5743:(e,r,n)=>{n.d(r,{A:()=>t});var s=n(6540),i=n(6294),d=n(4848);i.L.initialize({startOnLoad:!0});const t=function(e){var r=e.chart;return(0,s.useEffect)((function(){i.L.contentLoaded()}),[]),(0,d.jsx)("div",{className:"mermaid",children:r})}},9708:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>a,contentTitle:()=>c,default:()=>h,frontMatter:()=>t,metadata:()=>l,toc:()=>o});var s=n(4848),i=n(8453),d=n(5743);const t={title:"BSDD"},c=void 0,l={id:"reference/statuts/bsdd",title:"BSDD",description:"Au cours de son cycle de vie, un BSDD num\xe9rique peut passer par diff\xe9rents \xe9tats d\xe9crits ici.",source:"@site/docs/reference/statuts/bsdd.mdx",sourceDirName:"reference/statuts",slug:"/reference/statuts/bsdd",permalink:"/reference/statuts/bsdd",draft:!1,unlisted:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/reference/statuts/bsdd.mdx",tags:[],version:"current",frontMatter:{title:"BSDD"},sidebar:"docs",previous:{title:"BSDASRI",permalink:"/reference/statuts/bsdasri"},next:{title:"BSFF",permalink:"/reference/statuts/bsff"}},a={},o=[];function E(e){const r={a:"a",code:"code",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(r.p,{children:["Au cours de son cycle de vie, un BSDD num\xe9rique peut passer par diff\xe9rents \xe9tats d\xe9crits ",(0,s.jsx)(r.a,{href:"/reference/api-reference/bsdd/enums#formstatus",children:"ici"}),"."]}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"DRAFT"})," (brouillon): \xc9tat initial \xe0 la cr\xe9ation d'un BSD. Des champs obligatoires peuvent manquer."]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"SEALED"})," (finalis\xe9): BSD finalis\xe9. Les donn\xe9es sont valid\xe9es et un num\xe9ro de BSD ",(0,s.jsx)(r.code,{children:"readableId"})," est affect\xe9."]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"SIGNED_BY_PRODUCER"}),": BSD sign\xe9 par le producteur, en attente d'enl\xe8vement par le transporteur"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"SENT"})," (envoy\xe9): BSD en transit vers l'installation de destination, d'entreposage ou de reconditionnement"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"RECEIVED"})," (re\xe7u): BSD re\xe7u sur l'installation de destination"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"ACCEPTED"})," (accept\xe9): BSD accept\xe9 sur l'installation de destination"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"REFUSED"})," (refus\xe9): D\xe9chet refus\xe9"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"PROCESSED"})," (trait\xe9): BSD dont l'op\xe9ration de traitement a \xe9t\xe9 effectu\xe9"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"NO_TRACEABILITY"})," (rupture de tra\xe7abilit\xe9): Rupture de tra\xe7abilit\xe9 autoris\xe9e par arr\xeat\xe9 pr\xe9fectoral avec transfert de responsabilit\xe9."]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"AWAITING_GROUP"}),": BSD en attente de regroupement (code de traitement D 13, D 14, D 15, R 12, R 13)"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"FOLLOWED_WITH_PNTTD"})," (trait\xe9): BSD sans rupture de tra\xe7abilit\xe9 avec destination ult\xe9rieure \xe0 l'\xe9tranger"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"GROUPED"}),": BSD qui a \xe9t\xe9 ajout\xe9 \xe0 une annexe 2"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"TEMP_STORED"}),": (re\xe7u): BSD re\xe7u sur l'installation d'entreposage provisoire ou de reconditionnement"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"TEMP_STORED_ACCEPTED"}),": (accept\xe9): BSD accept\xe9 sur l'installation d'entreposage provisoire ou de reconditionnement"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"RESEALED"}),": (finalis\xe9): BSD sur lequel les informations de l'entreposage provisoire ont \xe9t\xe9 finalis\xe9es et valid\xe9es"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"SIGNED_BY_TEMP_STORER"}),": BSD sign\xe9 par l'installation d'entreposage provisoire, en attente d'enl\xe8vement par le transporteur"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"RESENT"}),": (envoy\xe9): BSD en transit vers l'installation de destination finale apr\xe8s un entreposage provisoire"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"CANCELED"}),": (annul\xe9): BSD annul\xe9 suite \xe0 approbation des parties prenantes (via le processus de r\xe9vision)"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"Chaque changement d'\xe9tat s'effectue gr\xe2ce \xe0 une mutation."}),"\n",(0,s.jsxs)(r.table,{children:[(0,s.jsx)(r.thead,{children:(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.th,{children:"Mutation"}),(0,s.jsx)(r.th,{children:"Transition"}),(0,s.jsx)(r.th,{children:"Donn\xe9es"}),(0,s.jsx)(r.th,{children:"Permissions"})]})}),(0,s.jsxs)(r.tbody,{children:[(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"createForm"})}),(0,s.jsxs)(r.td,{children:[(0,s.jsx)(r.code,{children:"-> DRAFT"})," ",(0,s.jsx)("br",{})]}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#forminput",children:"FormInput"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:"\xe9metteur"}),(0,s.jsx)("li",{children:"destinataire"}),(0,s.jsx)("li",{children:"transporteur"}),(0,s.jsx)("li",{children:"n\xe9gociant"}),(0,s.jsx)("li",{children:"\xe9co-organisme"})]})})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"updateForm"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"DRAFT -> DRAFT"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SEALED -> SEALED"})})]})})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#forminput",children:"FormInput"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:"\xe9metteur"}),(0,s.jsx)("li",{children:"destinataire"}),(0,s.jsx)("li",{children:"transporteur"}),(0,s.jsx)("li",{children:"n\xe9gociant"}),(0,s.jsx)("li",{children:"\xe9co-organisme"})]})})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"markAsSealed"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"DRAFT -> SEALED"})}),(0,s.jsx)(r.td,{}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:"\xe9metteur"}),(0,s.jsx)("li",{children:"destinataire"}),(0,s.jsx)("li",{children:"transporteur"}),(0,s.jsx)("li",{children:"n\xe9gociant"}),(0,s.jsx)("li",{children:"\xe9co-organisme"})]})})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"signEmissionForm"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SEALED -> SIGNED_BY_PRODUCER"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"RESEALED -> SIGNED_BY_TEMP_STORER"})})]})})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#signemissionforminput",children:"SignEmissionFormInput"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:"\xe9metteur / entreposage provisoire (authentifi\xe9 ou via son code de signature)"}),(0,s.jsx)("li",{children:"\xe9co-organisme (authentifi\xe9 ou via son code de signature)"})]})})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"signTransportForm"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SIGNED_BY_PRODUCER -> SENT"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SIGNED_BY_TEMP_STORER -> RESENT"})})]})})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#signtransportforminput",children:"SignTransportFormInput"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsx)("ul",{children:(0,s.jsx)("li",{children:"transporteur (authentifi\xe9 ou via son code de signature)"})})})})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"markAsReceived"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SENT -> ACCEPTED"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SENT -> RECEIVED"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SENT -> REFUSED"})})]})})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#receivedforminput",children:"ReceivedFormInput"})}),(0,s.jsx)(r.td,{children:"Uniquement le destinataire du BSD"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"markAsAccepted"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"RECEIVED -> ACCEPTED"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#acceptedforminput",children:"AcceptedFormInput"})}),(0,s.jsx)(r.td,{children:"Uniquement le destinataire du BSD"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"markAsProcessed"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"RECEIVED -> PROCESSED"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"RECEIVED -> NO_TRACEABILITY"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"RECEIVED -> AWAITING_GROUP"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"RECEIVED -> FOLLOWED_WITH_PNTTD"})})]})})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#processedforminput",children:"ProcessedFormInput"})}),(0,s.jsx)(r.td,{children:"Uniquement le destinataire du BSD"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"markAsTempStored"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SENT -> TEMP_STORER_ACCEPTED"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SENT -> TEMP_STORED"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"SENT -> REFUSED"})})]})})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#tempstoredforminput",children:"TempStoredFormInput"})}),(0,s.jsx)(r.td,{children:"Uniquement le site d'entreposage temporaire ou de reconditionnement"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"markAsTempStorerAccepted"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"TEMP_STORED -> TEMP_STORER_ACCEPTED"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#tempstoreracceptedforminput",children:"TempStorerAcceptedFormInput"})}),(0,s.jsx)(r.td,{children:"Uniquement le site d'entreposage temporaire ou de reconditionnement"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"markAsResealed"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"TEMP_STORED -> RESEALED"})}),(0,s.jsx)("li",{children:(0,s.jsx)(r.code,{children:"RESEALED -> RESEALED"})})]})})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#resealedtoredforminput",children:"ResealedFormInput"})}),(0,s.jsx)(r.td,{children:"Uniquement le site d'entreposage temporaire ou de reconditionnement"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"importPaperForm"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"SEALED -> PROCESSED"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#importpaperforminput",children:"ImportPaperFormInput"})}),(0,s.jsx)(r.td,{children:"Uniquement l'entreprise de destination"})]}),(0,s.jsxs)(r.tr,{children:[(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"createFormRevisionRequest"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.code,{children:"CANCELED"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)(r.a,{href:"../api-reference/bsdd/inputObjects#createformrevisionrequestinput",children:"CreateFormRevisionRequestInput"})}),(0,s.jsx)(r.td,{children:(0,s.jsx)("div",{children:(0,s.jsxs)("ul",{children:[(0,s.jsx)("li",{children:"\xe9metteur"}),(0,s.jsx)("li",{children:"destinataire"})]})})})]})]})]}),"\n",(0,s.jsx)(r.p,{children:"Le diagramme ci dessous retrace le cycle de vie d'un BSD dans Trackd\xe9chets:"}),"\n",(0,s.jsx)(d.A,{chart:"\ngraph TD\nNO_STATE(NO STATE) --\x3e|createForm| DRAFT\nDRAFT --\x3e|updateForm| DRAFT\nSEALED --\x3e|updateForm| SEALED\nDRAFT[DRAFT] --\x3e|markAsSealed| SEALED(SEALED)\nSEALED --\x3e|signEmissionForm| SIGNED_BY_PRODUCER\nSIGNED_BY_PRODUCER --\x3e|signTransportForm| SENT(SENT)\nSEALED --\x3e|importPaperForm| PROCESSED(PROCESSED)\nSENT --\x3e|markAsReceived| ACCEPTED(ACCEPTED)\nSENT --\x3e|markAsReceived - sans signature| RECEIVED(RECEIVED)\nRECEIVED --\x3e|markAsAccepted| ACCEPTED\nRECEIVED --\x3e|markAsReceived - avec refus| REFUSED\nACCEPTED --\x3e|markAsProcessed| PROCESSED(PROCESSED)\nACCEPTED --\x3e|markAsProcessed - avec rupture de tra\xe7abalit\xe9 |NO_TRACEABILITY(NO_TRACEABILITY)\nACCEPTED --\x3e|markAsProcessed - avec op\xe9ration de regroupement | AWAITING_GROUP(AWAITING_GROUP)\nACCEPTED --\x3e|markAsProcessed - avec une destination ult\xe9rieure \xe0 l'\xe9tranger | FOLLOWED_WITH_PNTTD(FOLLOWED_WITH_PNTTD)\nSENT --\x3e|markAsReceived - avec refus| REFUSED(REFUSED)\nSENT --\x3e|markAsTempStored - avec refus| REFUSED\nAWAITING_GROUP.->|createForm - appendix2Forms |DRAFT\nAWAITING_GROUP--\x3e|Lorsque markAsSealed est appel\xe9 sur le BSD de regroupement avec annexe 2|GROUPED[GROUPED]\nGROUPED--\x3e|Lorsque markAsProcessed est appel\xe9 sur le BSD  de regroupement avec annexe 2|PROCESSED\nSENT --\x3e|markAsTempStored - |TEMP_STORED(TEMP_STORED)\nSENT --\x3e|markAsTempStored|TEMP_STORER_ACCEPTED\nTEMP_STORED --\x3e|markAsTempStorerAccepted - avec refus|REFUSED\nTEMP_STORED --\x3e|markAsTempStorerAccepted|TEMP_STORER_ACCEPTED(TEMP_STORER_ACCEPTED)\nTEMP_STORER_ACCEPTED --\x3e|markAsResealed| RESEALED(RESEALED)\nRESEALED --\x3e|markAsResealed| RESEALED\nRESEALED --\x3e|signEmissionForm| SIGNED_BY_TEMP_STORER\nSIGNED_BY_TEMP_STORER --\x3e|signTransportForm| RESENT(RESENT)\nRESENT --\x3e ACCEPTED\n"}),"\n",(0,s.jsxs)(r.p,{children:["Il est \xe9galement possible de supprimer ou ajouter une \xe9tape d'entreposage provisoire ou reconditionnement\nen appelant ",(0,s.jsx)(r.code,{children:"markAsProcessed"})," de fa\xe7on anticip\xe9e sur un bordereau \xe0 l'\xe9tat ",(0,s.jsx)(r.code,{children:"TEMP_STORER_ACCEPTED"})," ou en appelant ",(0,s.jsx)(r.code,{children:"markAsResealed"}),"\nsur un bordereau \xe0 l'\xe9tat ",(0,s.jsx)(r.code,{children:"ACCEPTED"}),"."]}),"\n",(0,s.jsx)(d.A,{chart:"\ngraph TD\nACCEPTED --\x3e|markAsProcessed| PROCESSED(PROCESSED - AWAITING_GROUP - NO_TRACEABILITY)\nACCEPTED -.->|markAsResealed| RESEALED(RESEALED)\nTEMP_STORER_ACCEPTED --\x3e|markAsResealed| RESEALED(RESEALED)\nTEMP_STORER_ACCEPTED -.->|markAsProcessed| PROCESSED(PROCESSED / AWAITING_GROUP / NO_TRACEABILITY)\n"})]})}function h(e={}){const{wrapper:r}={...(0,i.R)(),...e.components};return r?(0,s.jsx)(r,{...e,children:(0,s.jsx)(E,{...e})}):E(e)}}}]);