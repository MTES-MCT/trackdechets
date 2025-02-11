"use strict";(self.webpackChunktrackdechets=self.webpackChunktrackdechets||[]).push([[6789],{9373:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>l,contentTitle:()=>c,default:()=>h,frontMatter:()=>d,metadata:()=>n,toc:()=>o});const n=JSON.parse('{"id":"reference/api-reference/bsvhu/queries","title":"Queries","description":"bsvhu","source":"@site/docs/reference/api-reference/bsvhu/queries.md","sourceDirName":"reference/api-reference/bsvhu","slug":"/reference/api-reference/bsvhu/queries","permalink":"/reference/api-reference/bsvhu/queries","draft":false,"unlisted":false,"editUrl":"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/reference/api-reference/bsvhu/queries.md","tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"id":"queries","title":"Queries","slug":"queries","sidebar_position":1},"sidebar":"docs","previous":{"title":"Scalars","permalink":"/reference/api-reference/bspaoh/scalars"},"next":{"title":"Mutations","permalink":"/reference/api-reference/bsvhu/mutations"}}');var i=s(4848),t=s(8453);const d={id:"queries",title:"Queries",slug:"queries",sidebar_position:1},c=void 0,l={},o=[{value:"bsvhu",id:"bsvhu",level:2},{value:"bsvhuPdf",id:"bsvhupdf",level:2},{value:"bsvhus",id:"bsvhus",level:2}];function a(e){const r={a:"a",h2:"h2",p:"p",strong:"strong",...(0,t.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(r.h2,{id:"bsvhu",children:"bsvhu"}),"\n",(0,i.jsxs)(r.p,{children:[(0,i.jsx)(r.strong,{children:"Type:"})," ",(0,i.jsx)(r.a,{href:"objects#bsvhu",children:"Bsvhu!"})]}),"\n",(0,i.jsx)("p",{style:{marginBottom:"0.4em"},children:(0,i.jsx)("strong",{children:"Arguments"})}),"\n",(0,i.jsxs)("table",{children:[(0,i.jsx)("thead",{children:(0,i.jsxs)("tr",{children:[(0,i.jsx)("th",{children:"Name"}),(0,i.jsx)("th",{children:"Description"})]})}),(0,i.jsx)("tbody",{children:(0,i.jsxs)("tr",{children:[(0,i.jsx)("td",{children:(0,i.jsxs)(r.p,{children:["id",(0,i.jsx)("br",{}),"\n",(0,i.jsx)("a",{href:"scalars#id",children:(0,i.jsx)("code",{children:"ID!"})})]})}),(0,i.jsx)("td",{})]})})]}),"\n",(0,i.jsx)(r.h2,{id:"bsvhupdf",children:"bsvhuPdf"}),"\n",(0,i.jsxs)(r.p,{children:[(0,i.jsx)(r.strong,{children:"Type:"})," ",(0,i.jsx)(r.a,{href:"objects#filedownload",children:"FileDownload!"})]}),"\n",(0,i.jsx)(r.p,{children:"Renvoie un token pour t\xe9l\xe9charger un pdf de bordereau\nCe token doit \xeatre transmis \xe0 la route /download pour obtenir le fichier.\nIl est valable 10 secondes"}),"\n",(0,i.jsx)("p",{style:{marginBottom:"0.4em"},children:(0,i.jsx)("strong",{children:"Arguments"})}),"\n",(0,i.jsxs)("table",{children:[(0,i.jsx)("thead",{children:(0,i.jsxs)("tr",{children:[(0,i.jsx)("th",{children:"Name"}),(0,i.jsx)("th",{children:"Description"})]})}),(0,i.jsx)("tbody",{children:(0,i.jsxs)("tr",{children:[(0,i.jsx)("td",{children:(0,i.jsxs)(r.p,{children:["id",(0,i.jsx)("br",{}),"\n",(0,i.jsx)("a",{href:"scalars#id",children:(0,i.jsx)("code",{children:"ID!"})})]})}),(0,i.jsx)("td",{children:(0,i.jsx)("p",{children:"ID d'un bordereau"})})]})})]}),"\n",(0,i.jsx)(r.h2,{id:"bsvhus",children:"bsvhus"}),"\n",(0,i.jsxs)(r.p,{children:[(0,i.jsx)(r.strong,{children:"Type:"})," ",(0,i.jsx)(r.a,{href:"objects#bsvhuconnection",children:"BsvhuConnection!"})]}),"\n",(0,i.jsx)(r.p,{children:"Tous les arguments sont optionnels.\nPar d\xe9faut, retourne les 50 premiers bordereaux associ\xe9s \xe0 entreprises dont vous \xeates membres"}),"\n",(0,i.jsx)("p",{style:{marginBottom:"0.4em"},children:(0,i.jsx)("strong",{children:"Arguments"})}),"\n",(0,i.jsxs)("table",{children:[(0,i.jsx)("thead",{children:(0,i.jsxs)("tr",{children:[(0,i.jsx)("th",{children:"Name"}),(0,i.jsx)("th",{children:"Description"})]})}),(0,i.jsxs)("tbody",{children:[(0,i.jsxs)("tr",{children:[(0,i.jsx)("td",{children:(0,i.jsxs)(r.p,{children:["after",(0,i.jsx)("br",{}),"\n",(0,i.jsx)("a",{href:"scalars#id",children:(0,i.jsx)("code",{children:"ID"})})]})}),(0,i.jsx)("td",{children:(0,i.jsxs)("p",{children:["PAGINATION\nPermet en conjonction avec ",(0,i.jsx)("code",{children:"first"}),' de paginer "en avant"\n(des bordereaux les plus r\xe9cents aux bordereaux les plus anciens)\nCurseur apr\xe8s lequel les bordereaux doivent \xeatre retourn\xe9s\nAttend un identifiant (propri\xe9t\xe9 ',(0,i.jsx)("code",{children:"id"}),") de BSD\nD\xe9faut \xe0 vide, pour retourner les bordereaux les plus r\xe9cents\nLe BSD pr\xe9cis\xe9 dans le curseur ne fait pas partie du r\xe9sultat"]})})]}),(0,i.jsxs)("tr",{children:[(0,i.jsx)("td",{children:(0,i.jsxs)(r.p,{children:["first",(0,i.jsx)("br",{}),"\n",(0,i.jsx)("a",{href:"scalars#int",children:(0,i.jsx)("code",{children:"Int"})})]})}),(0,i.jsx)("td",{children:(0,i.jsxs)("p",{children:["PAGINATION\nPermet en conjonction avec ",(0,i.jsx)("code",{children:"cursorAfter"}),' de paginer "en avant"\n(des bordereaux les plus r\xe9cents aux bordereaux les plus anciens)\nNombre de bordereaux retourn\xe9s apr\xe8s le ',(0,i.jsx)("code",{children:"cursorAfter"}),"\nD\xe9faut \xe0 50, maximum \xe0 500"]})})]}),(0,i.jsxs)("tr",{children:[(0,i.jsx)("td",{children:(0,i.jsxs)(r.p,{children:["before",(0,i.jsx)("br",{}),"\n",(0,i.jsx)("a",{href:"scalars#id",children:(0,i.jsx)("code",{children:"ID"})})]})}),(0,i.jsx)("td",{children:(0,i.jsxs)("p",{children:["PAGINATION\nPermet en conjonction avec ",(0,i.jsx)("code",{children:"last"}),' de paginer "en arri\xe8re"\n(des bordereaux les plus anciens aux bordereaux les plus r\xe9cents)\nCurseur avant lequel les bordereaux doivent \xeatre retourn\xe9s\nAttend un identifiant (propri\xe9t\xe9 ',(0,i.jsx)("code",{children:"id"}),") de BSD\nD\xe9faut \xe0 vide, pour retourner les bordereaux les plus anciens\nLe BSD pr\xe9cis\xe9 dans le curseur ne fait pas partie du r\xe9sultat"]})})]}),(0,i.jsxs)("tr",{children:[(0,i.jsx)("td",{children:(0,i.jsxs)(r.p,{children:["last",(0,i.jsx)("br",{}),"\n",(0,i.jsx)("a",{href:"scalars#int",children:(0,i.jsx)("code",{children:"Int"})})]})}),(0,i.jsx)("td",{children:(0,i.jsxs)("p",{children:["PAGINATION\nNombre de bordereaux retourn\xe9s avant le ",(0,i.jsx)("code",{children:"cursorBefore"}),"\nD\xe9faut \xe0 50, maximum \xe0 500"]})})]}),(0,i.jsxs)("tr",{children:[(0,i.jsx)("td",{children:(0,i.jsxs)(r.p,{children:["where",(0,i.jsx)("br",{}),"\n",(0,i.jsx)("a",{href:"inputObjects#bsvhuwhere",children:(0,i.jsx)("code",{children:"BsvhuWhere"})})]})}),(0,i.jsx)("td",{children:(0,i.jsx)("p",{children:"Filtres"})})]})]})]})]})}function h(e={}){const{wrapper:r}={...(0,t.R)(),...e.components};return r?(0,i.jsx)(r,{...e,children:(0,i.jsx)(a,{...e})}):a(e)}},8453:(e,r,s)=>{s.d(r,{R:()=>d,x:()=>c});var n=s(6540);const i={},t=n.createContext(i);function d(e){const r=n.useContext(t);return n.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function c(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:d(e.components),n.createElement(t.Provider,{value:r},e.children)}}}]);