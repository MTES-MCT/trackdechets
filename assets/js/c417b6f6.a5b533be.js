"use strict";(self.webpackChunktrackdechets=self.webpackChunktrackdechets||[]).push([[4722],{283:(e,s,r)=>{r.r(s),r.d(s,{assets:()=>l,contentTitle:()=>t,default:()=>h,frontMatter:()=>d,metadata:()=>c,toc:()=>a});var n=r(4848),i=r(8453);const d={id:"queries",title:"Queries",slug:"queries",sidebar_position:1},t=void 0,c={id:"reference/api-reference/bsda/queries",title:"Queries",description:"bsda",source:"@site/docs/reference/api-reference/bsda/queries.md",sourceDirName:"reference/api-reference/bsda",slug:"/reference/api-reference/bsda/queries",permalink:"/reference/api-reference/bsda/queries",draft:!1,unlisted:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/reference/api-reference/bsda/queries.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{id:"queries",title:"Queries",slug:"queries",sidebar_position:1},sidebar:"docs",previous:{title:"Utilisation des Webhooks de l'API Trackd\xe9chets",permalink:"/guides/webhooks"},next:{title:"Mutations",permalink:"/reference/api-reference/bsda/mutations"}},l={},a=[{value:"bsda",id:"bsda",level:2},{value:"bsdaPdf",id:"bsdapdf",level:2},{value:"bsdaRevisionRequests",id:"bsdarevisionrequests",level:2},{value:"bsdas",id:"bsdas",level:2}];function o(e){const s={a:"a",h2:"h2",p:"p",strong:"strong",...(0,i.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(s.h2,{id:"bsda",children:"bsda"}),"\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Type:"})," ",(0,n.jsx)(s.a,{href:"objects#bsda",children:"Bsda!"})]}),"\n",(0,n.jsx)("p",{style:{marginBottom:"0.4em"},children:(0,n.jsx)("strong",{children:"Arguments"})}),"\n",(0,n.jsxs)("table",{children:[(0,n.jsx)("thead",{children:(0,n.jsxs)("tr",{children:[(0,n.jsx)("th",{children:"Name"}),(0,n.jsx)("th",{children:"Description"})]})}),(0,n.jsx)("tbody",{children:(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["id",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"scalars#id",children:(0,n.jsx)("code",{children:"ID!"})})]})}),(0,n.jsx)("td",{})]})})]}),"\n",(0,n.jsx)(s.h2,{id:"bsdapdf",children:"bsdaPdf"}),"\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Type:"})," ",(0,n.jsx)(s.a,{href:"objects#filedownload",children:"FileDownload!"})]}),"\n",(0,n.jsx)(s.p,{children:"Renvoie un token pour t\xe9l\xe9charger un pdf de bordereau\nCe token doit \xeatre transmis \xe0 la route /download pour obtenir le fichier.\nIl est valable 10 secondes"}),"\n",(0,n.jsx)("p",{style:{marginBottom:"0.4em"},children:(0,n.jsx)("strong",{children:"Arguments"})}),"\n",(0,n.jsxs)("table",{children:[(0,n.jsx)("thead",{children:(0,n.jsxs)("tr",{children:[(0,n.jsx)("th",{children:"Name"}),(0,n.jsx)("th",{children:"Description"})]})}),(0,n.jsx)("tbody",{children:(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["id",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"scalars#id",children:(0,n.jsx)("code",{children:"ID!"})})]})}),(0,n.jsx)("td",{children:(0,n.jsx)("p",{children:"ID d'un bordereau"})})]})})]}),"\n",(0,n.jsx)(s.h2,{id:"bsdarevisionrequests",children:"bsdaRevisionRequests"}),"\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Type:"})," ",(0,n.jsx)(s.a,{href:"objects#bsdarevisionrequestconnection",children:"BsdaRevisionRequestConnection!"})]}),"\n",(0,n.jsx)(s.p,{children:"Renvoie les demandes de r\xe9visions Bsda associ\xe9es \xe0 un SIRET (demandes soumises et approbations requises)"}),"\n",(0,n.jsx)("p",{style:{marginBottom:"0.4em"},children:(0,n.jsx)("strong",{children:"Arguments"})}),"\n",(0,n.jsxs)("table",{children:[(0,n.jsx)("thead",{children:(0,n.jsxs)("tr",{children:[(0,n.jsx)("th",{children:"Name"}),(0,n.jsx)("th",{children:"Description"})]})}),(0,n.jsxs)("tbody",{children:[(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["siret",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"scalars#string",children:(0,n.jsx)("code",{children:"String!"})})]})}),(0,n.jsx)("td",{children:(0,n.jsx)("p",{children:"SIRET d'un \xe9tablissement dont je suis membre"})})]}),(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["where",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"inputObjects#bsdarevisionrequestwhere",children:(0,n.jsx)("code",{children:"BsdaRevisionRequestWhere"})})]})}),(0,n.jsx)("td",{children:(0,n.jsx)("p",{children:"(Optionnel) Filtres"})})]}),(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["after",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"scalars#string",children:(0,n.jsx)("code",{children:"String"})})]})}),(0,n.jsx)("td",{children:(0,n.jsxs)("p",{children:["(Optionnel) PAGINATION\nPermet en conjonction avec ",(0,n.jsx)("code",{children:"first"}),' de paginer "en avant"\n(des r\xe9visions les plus r\xe9centes aux r\xe9visions les plus ancienness)\nCurseur apr\xe8s lequel les r\xe9visions doivent \xeatre retourn\xe9es\nAttend un identifiant (propri\xe9t\xe9 ',(0,n.jsx)("code",{children:"id"}),") de r\xe9vision\nD\xe9faut \xe0 vide, pour retourner les r\xe9visions les plus r\xe9centes\nLa r\xe9vision pr\xe9cis\xe9e dans le curseur ne fait pas partie du r\xe9sultat"]})})]}),(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["first",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"scalars#int",children:(0,n.jsx)("code",{children:"Int"})})]})}),(0,n.jsx)("td",{children:(0,n.jsxs)("p",{children:["(Optionnel) PAGINATION\nPermet en conjonction avec ",(0,n.jsx)("code",{children:"after"}),' de paginer "en avant"\n(des r\xe9visions les plus r\xe9centes aux r\xe9visions les plus anciennes)\nNombre de r\xe9visions retourn\xe9es apr\xe8s le ',(0,n.jsx)("code",{children:"after"}),"\nD\xe9faut \xe0 50"]})})]})]})]}),"\n",(0,n.jsx)(s.h2,{id:"bsdas",children:"bsdas"}),"\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Type:"})," ",(0,n.jsx)(s.a,{href:"objects#bsdaconnection",children:"BsdaConnection!"})]}),"\n",(0,n.jsx)("p",{style:{marginBottom:"0.4em"},children:(0,n.jsx)("strong",{children:"Arguments"})}),"\n",(0,n.jsxs)("table",{children:[(0,n.jsx)("thead",{children:(0,n.jsxs)("tr",{children:[(0,n.jsx)("th",{children:"Name"}),(0,n.jsx)("th",{children:"Description"})]})}),(0,n.jsxs)("tbody",{children:[(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["after",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"scalars#id",children:(0,n.jsx)("code",{children:"ID"})})]})}),(0,n.jsx)("td",{children:(0,n.jsxs)("p",{children:["(Optionnel) PAGINATION\nPermet en conjonction avec ",(0,n.jsx)("code",{children:"first"}),' de paginer "en avant"\n(des bordereaux les plus r\xe9cents aux bordereaux les plus anciens)\nCurseur apr\xe8s lequel les bordereaux doivent \xeatre retourn\xe9s\nAttend un identifiant (propri\xe9t\xe9 ',(0,n.jsx)("code",{children:"id"}),") de BSD\nD\xe9faut \xe0 vide, pour retourner les bordereaux les plus r\xe9cents\nLe BSD pr\xe9cis\xe9 dans le curseur ne fait pas partie du r\xe9sultat"]})})]}),(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["first",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"scalars#int",children:(0,n.jsx)("code",{children:"Int"})})]})}),(0,n.jsx)("td",{children:(0,n.jsxs)("p",{children:["(Optionnel) PAGINATION\nPermet en conjonction avec ",(0,n.jsx)("code",{children:"cursorAfter"}),' de paginer "en avant"\n(des bordereaux les plus r\xe9cents aux bordereaux les plus anciens)\nNombre de bordereaux retourn\xe9s apr\xe8s le ',(0,n.jsx)("code",{children:"cursorAfter"}),"\nD\xe9faut \xe0 50, maximum \xe0 500"]})})]}),(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["before",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"scalars#id",children:(0,n.jsx)("code",{children:"ID"})})]})}),(0,n.jsx)("td",{children:(0,n.jsxs)("p",{children:["(Optionnel) PAGINATION\nPermet en conjonction avec ",(0,n.jsx)("code",{children:"last"}),' de paginer "en arri\xe8re"\n(des bordereaux les plus anciens aux bordereaux les plus r\xe9cents)\nCurseur avant lequel les bordereaux doivent \xeatre retourn\xe9s\nAttend un identifiant (propri\xe9t\xe9 ',(0,n.jsx)("code",{children:"id"}),") de BSD\nD\xe9faut \xe0 vide, pour retourner les bordereaux les plus anciens\nLe BSD pr\xe9cis\xe9 dans le curseur ne fait pas partie du r\xe9sultat"]})})]}),(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["last",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"scalars#int",children:(0,n.jsx)("code",{children:"Int"})})]})}),(0,n.jsx)("td",{children:(0,n.jsxs)("p",{children:["(Optionnel) PAGINATION\nNombre de bordereaux retourn\xe9s avant le ",(0,n.jsx)("code",{children:"cursorBefore"}),"\nD\xe9faut \xe0 50, maximum \xe0 500"]})})]}),(0,n.jsxs)("tr",{children:[(0,n.jsx)("td",{children:(0,n.jsxs)(s.p,{children:["where",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("a",{href:"inputObjects#bsdawhere",children:(0,n.jsx)("code",{children:"BsdaWhere"})})]})}),(0,n.jsx)("td",{})]})]})]})]})}function h(e={}){const{wrapper:s}={...(0,i.R)(),...e.components};return s?(0,n.jsx)(s,{...e,children:(0,n.jsx)(o,{...e})}):o(e)}},8453:(e,s,r)=>{r.d(s,{R:()=>t,x:()=>c});var n=r(6540);const i={},d=n.createContext(i);function t(e){const s=n.useContext(d);return n.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function c(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:t(e.components),n.createElement(d.Provider,{value:s},e.children)}}}]);