"use strict";(self.webpackChunktrackdechets=self.webpackChunktrackdechets||[]).push([[5449],{1089:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>d,contentTitle:()=>o,default:()=>a,frontMatter:()=>i,metadata:()=>c,toc:()=>l});var t=s(4848),r=s(8453);const i={id:"queries",title:"Queries",slug:"queries",sidebar_position:1},o=void 0,c={id:"reference/api-reference/webhooks/queries",title:"Queries",description:"webhooksetting",source:"@site/docs/reference/api-reference/webhooks/queries.md",sourceDirName:"reference/api-reference/webhooks",slug:"/reference/api-reference/webhooks/queries",permalink:"/reference/api-reference/webhooks/queries",draft:!1,unlisted:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/reference/api-reference/webhooks/queries.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{id:"queries",title:"Queries",slug:"queries",sidebar_position:1},sidebar:"docs",previous:{title:"Scalars",permalink:"/reference/api-reference/registre/scalars"},next:{title:"Mutations",permalink:"/reference/api-reference/webhooks/mutations"}},d={},l=[{value:"webhooksetting",id:"webhooksetting",level:2},{value:"webhooksettings",id:"webhooksettings",level:2}];function h(e){const n={a:"a",h2:"h2",p:"p",strong:"strong",...(0,r.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h2,{id:"webhooksetting",children:"webhooksetting"}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:"Type:"})," ",(0,t.jsx)(n.a,{href:"objects#webhooksetting",children:"WebhookSetting!"})]}),"\n",(0,t.jsx)("p",{style:{marginBottom:"0.4em"},children:(0,t.jsx)("strong",{children:"Arguments"})}),"\n",(0,t.jsxs)("table",{children:[(0,t.jsx)("thead",{children:(0,t.jsxs)("tr",{children:[(0,t.jsx)("th",{children:"Name"}),(0,t.jsx)("th",{children:"Description"})]})}),(0,t.jsx)("tbody",{children:(0,t.jsxs)("tr",{children:[(0,t.jsx)("td",{children:(0,t.jsxs)(n.p,{children:["id",(0,t.jsx)("br",{}),"\n",(0,t.jsx)("a",{href:"scalars#id",children:(0,t.jsx)("code",{children:"ID!"})})]})}),(0,t.jsx)("td",{children:(0,t.jsx)("p",{children:"Identifiant de l'objet WebhookSetting"})})]})})]}),"\n",(0,t.jsx)(n.h2,{id:"webhooksettings",children:"webhooksettings"}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:"Type:"})," ",(0,t.jsx)(n.a,{href:"objects#webhooksettingconnection",children:"WebhookSettingConnection!"})]}),"\n",(0,t.jsx)(n.p,{children:"Renvoie les WebhooksSettings.\nLes WebhooksSettings des diff\xe9rentes companies de l'utilisateur sont renvoy\xe9s."}),"\n",(0,t.jsx)("p",{style:{marginBottom:"0.4em"},children:(0,t.jsx)("strong",{children:"Arguments"})}),"\n",(0,t.jsxs)("table",{children:[(0,t.jsx)("thead",{children:(0,t.jsxs)("tr",{children:[(0,t.jsx)("th",{children:"Name"}),(0,t.jsx)("th",{children:"Description"})]})}),(0,t.jsxs)("tbody",{children:[(0,t.jsxs)("tr",{children:[(0,t.jsx)("td",{children:(0,t.jsxs)(n.p,{children:["after",(0,t.jsx)("br",{}),"\n",(0,t.jsx)("a",{href:"scalars#id",children:(0,t.jsx)("code",{children:"ID"})})]})}),(0,t.jsx)("td",{children:(0,t.jsxs)("p",{children:["(Optionnel) PAGINATION\nPermet en conjonction avec ",(0,t.jsx)("code",{children:"first"}),' de paginer "en avant"\n(des WebhookSettings les plus r\xe9cents aux WebhookSettings les plus anciens)\nCurseur apr\xe8s lequel les WebhookSettings doivent \xeatre retourn\xe9s\nAttend un identifiant (propri\xe9t\xe9 ',(0,t.jsx)("code",{children:"id"}),") de BSD\nD\xe9faut \xe0 vide, pour retourner les WebhookSettings les plus r\xe9cents.\nLe WebhookSetting pr\xe9cis\xe9 dans le curseur ne fait pas partie du r\xe9sultat"]})})]}),(0,t.jsxs)("tr",{children:[(0,t.jsx)("td",{children:(0,t.jsxs)(n.p,{children:["first",(0,t.jsx)("br",{}),"\n",(0,t.jsx)("a",{href:"scalars#int",children:(0,t.jsx)("code",{children:"Int"})})]})}),(0,t.jsx)("td",{children:(0,t.jsxs)("p",{children:["(Optionnel) PAGINATION\nPermet en conjonction avec ",(0,t.jsx)("code",{children:"after"}),' de paginer "en avant"\n(des WebhookSettings les plus r\xe9cents aux WebhookSettings les plus anciens)\nNombre de WebhookSettings retourn\xe9s apr\xe8s le ',(0,t.jsx)("code",{children:"cursorAfter"}),"\nD\xe9faut \xe0 50, maximum \xe0 500"]})})]}),(0,t.jsxs)("tr",{children:[(0,t.jsx)("td",{children:(0,t.jsxs)(n.p,{children:["before",(0,t.jsx)("br",{}),"\n",(0,t.jsx)("a",{href:"scalars#id",children:(0,t.jsx)("code",{children:"ID"})})]})}),(0,t.jsx)("td",{children:(0,t.jsxs)("p",{children:["(Optionnel) PAGINATION\nPermet en conjonction avec ",(0,t.jsx)("code",{children:"last"}),' de paginer "en arri\xe8re"\n(des WebhookSettings les plus anciens aux WebhookSettings les plus r\xe9cents)\nCurseur avant lequel les WebhooksSettings doivent \xeatre retourn\xe9s\nAttend un identifiant (propri\xe9t\xe9 ',(0,t.jsx)("code",{children:"id"}),") de WebhookSetting\nD\xe9faut \xe0 vide, pour retourner les WebhookSetting les plus anciens\nLe WebhookSetting pr\xe9cis\xe9 dans le curseur ne fait pas partie du r\xe9sultat"]})})]}),(0,t.jsxs)("tr",{children:[(0,t.jsx)("td",{children:(0,t.jsxs)(n.p,{children:["last",(0,t.jsx)("br",{}),"\n",(0,t.jsx)("a",{href:"scalars#int",children:(0,t.jsx)("code",{children:"Int"})})]})}),(0,t.jsx)("td",{children:(0,t.jsxs)("p",{children:["(Optionnel) PAGINATION\nNombre de WebhookSettings retourn\xe9s avant le ",(0,t.jsx)("code",{children:"before"}),"\nD\xe9faut \xe0 50, maximum \xe0 500"]})})]})]})]})]})}function a(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>o,x:()=>c});var t=s(6540);const r={},i=t.createContext(r);function o(e){const n=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:o(e.components),t.createElement(i.Provider,{value:n},e.children)}}}]);