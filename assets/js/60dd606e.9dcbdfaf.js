"use strict";(self.webpackChunktrackdechets=self.webpackChunktrackdechets||[]).push([[1804],{5352:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>d,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>l,toc:()=>o});var r=n(4848),s=n(8453);const a={title:"Utiliser le playground"},i=void 0,l={id:"guides/playground",title:"Utiliser le playground",description:"Le playground GraphQL est un environnement de d\xe9veloppement int\xe9gr\xe9 au navigateur web qui permet de facilement tester des requ\xeates \xe0 l'API Trackd\xe9chets.",source:"@site/docs/guides/playground.md",sourceDirName:"guides",slug:"/guides/playground",permalink:"/guides/playground",draft:!1,unlisted:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/guides/playground.md",tags:[],version:"current",frontMatter:{title:"Utiliser le playground"},sidebar:"docs",previous:{title:"Consommer l'api - Bonnes pratiques",permalink:"/guides/good-practices"},next:{title:"Faire une requ\xeate GraphQL dans le langage de son choix",permalink:"/guides/language"}},d={},o=[{value:"Pr\xe9sentation du playground",id:"pr\xe9sentation-du-playground",level:2},{value:"Renseigner son token",id:"renseigner-son-token",level:2},{value:"Ex\xe9cuter une requ\xeate GraphQL",id:"ex\xe9cuter-une-requ\xeate-graphql",level:2},{value:"Utiliser les variables",id:"utiliser-les-variables",level:2},{value:"Parcourir la documentation de l&#39;API",id:"parcourir-la-documentation-de-lapi",level:2},{value:"T\xe9l\xe9charger le sch\xe9ma",id:"t\xe9l\xe9charger-le-sch\xe9ma",level:2}];function c(e){const t={a:"a",admonition:"admonition",code:"code",em:"em",h2:"h2",img:"img",li:"li",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,s.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.p,{children:"Le playground GraphQL est un environnement de d\xe9veloppement int\xe9gr\xe9 au navigateur web qui permet de facilement tester des requ\xeates \xe0 l'API Trackd\xe9chets.\nIl s'affiche par d\xe9faut lors d'une connexion \xe0 la racine de l'API via un navigateur. Pour rappel :"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Environnement"}),(0,r.jsx)(t.th,{children:"URL de l'API"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"Sandbox"}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.a,{href:"https://api.sandbox.trackdechets.beta.gouv.fr",children:"https://api.sandbox.trackdechets.beta.gouv.fr"})})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"Production"}),(0,r.jsx)(t.td,{children:(0,r.jsx)(t.a,{href:"https://api.trackdechets.beta.gouv.fr",children:"https://api.trackdechets.beta.gouv.fr"})})]})]})]}),"\n",(0,r.jsx)(t.h2,{id:"pr\xe9sentation-du-playground",children:"Pr\xe9sentation du playground"}),"\n",(0,r.jsx)(t.p,{children:"Le playground GraphQL est compos\xe9 de diff\xe9rentes zones :"}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"une zone de texte \xe9ditable permettant d'\xe9crire des queries et des mutations GraphQL. Vous pouvez utiliser les fonctionnalit\xe9s d'auto-compl\xe9tion et le boutton \"Prettify\" pour formatter les requ\xeates."}),"\n",(0,r.jsx)(t.li,{children:"une zone de texte pour visualiser les r\xe9ponses \xe0 vos requ\xeates"}),"\n",(0,r.jsx)(t.li,{children:"un panneau lat\xe9ral permettant d'acc\xe9der \xe0 la documentation des champs de l'API et au sch\xe9ma GraphQL"}),"\n",(0,r.jsxs)(t.li,{children:["un onglet permettant de sp\xe9cifier des variables \xe0 injecter dans vos ",(0,r.jsx)(t.em,{children:"queries"})," ou ",(0,r.jsx)(t.em,{children:"mutations"})]}),"\n",(0,r.jsx)(t.li,{children:"un onglet \"HTTP Headers\" permettant d'ajouter l'en-t\xeate d'authentification"}),"\n"]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"playground",src:n(3049).A+"",width:"1200",height:"944"})}),"\n",(0,r.jsx)(t.h2,{id:"renseigner-son-token",children:"Renseigner son token"}),"\n",(0,r.jsxs)(t.p,{children:["Le token (voir ",(0,r.jsx)(t.a,{href:"../reference/authentification",children:"Authentification"}),') doit \xeatre renseign\xe9 dans l\'onglet "HTTP Headers" de la fa\xe7on suivante :']}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"playground-token",src:n(4970).A+"",width:"941",height:"177"})}),"\n",(0,r.jsx)(t.h2,{id:"ex\xe9cuter-une-requ\xeate-graphql",children:"Ex\xe9cuter une requ\xeate GraphQL"}),"\n",(0,r.jsxs)(t.p,{children:["Vous pouvez \xe9crire des requ\xeates GraphQL dans la zone de texte \xe0 gauche. Exemple avec la requ\xeate ",(0,r.jsx)(t.code,{children:"companyInfos"})," permettant d'obtenir des informations sur un \xe9tablissement partenaire :"]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"playground-query",src:n(4149).A+"",width:"605",height:"389"})}),"\n",(0,r.jsx)(t.admonition,{type:"tip",children:(0,r.jsx)(t.p,{children:'Utiliser le bouton "Prettify" pour valider et formatter vos requ\xeates'})}),"\n",(0,r.jsx)(t.h2,{id:"utiliser-les-variables",children:"Utiliser les variables"}),"\n",(0,r.jsx)(t.p,{children:'Vous pouvez \xe9galement utiliser l\'onglet "Variables" pour injecter les variables dans votre requ\xeate de la fa\xe7on suivante :'}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"playground-variables",src:n(2546).A+"",width:"944",height:"780"})}),"\n",(0,r.jsx)(t.h2,{id:"parcourir-la-documentation-de-lapi",children:"Parcourir la documentation de l'API"}),"\n",(0,r.jsxs)(t.p,{children:["L'onglet de droite \"Docs\" vous permet de parcourir la r\xe9f\xe9rence de l'API. Vous y retrouverez les diff\xe9rentes Query et Mutation disponibles ainsi que les variables et les types de retours. La r\xe9f\xe9rence de l'API est \xe9galement disponible dans la section ",(0,r.jsx)(t.a,{href:"../reference/api-reference/bsdd/queries",children:"R\xe9f\xe9rence API"})]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"playground-docs",src:n(9896).A+"",width:"351",height:"463"})}),"\n",(0,r.jsx)(t.h2,{id:"t\xe9l\xe9charger-le-sch\xe9ma",children:"T\xe9l\xe9charger le sch\xe9ma"}),"\n",(0,r.jsxs)(t.p,{children:['Vous pouvez t\xe9l\xe9charger le sch\xe9ma GraphQL en cliquant sur le panneau lat\xe9ral "Schema", puis "DOWNLOAD". Le sch\xe9ma permet notamment de construire des clients gr\xe2ce \xe0 des librairies dans le langage de votre choix. Voir la liste compl\xe8te des librairies GraphQL sur le site ',(0,r.jsx)(t.a,{href:"https://graphql.org/code/",children:"graphql.org"}),"."]})]})}function u(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},9896:(e,t,n)=>{n.d(t,{A:()=>r});const r=n.p+"assets/images/playground-docs-34d4b58b1493e8a404a4a24b9eb0658f.png"},3049:(e,t,n)=>{n.d(t,{A:()=>r});const r=n.p+"assets/images/playground-guide-3ccf0c22f4e563235a583ad4ecdae4fa.png"},4149:(e,t,n)=>{n.d(t,{A:()=>r});const r=n.p+"assets/images/playground-query-9ec49f9c812324c9585bcd1a89f4f867.png"},4970:(e,t,n)=>{n.d(t,{A:()=>r});const r=n.p+"assets/images/playground-token-b7ee9991935dd1d83e6cfdce9774eee3.png"},2546:(e,t,n)=>{n.d(t,{A:()=>r});const r=n.p+"assets/images/playground-variables-35f44f472b9cc391c2feba6709b56744.png"},8453:(e,t,n)=>{n.d(t,{R:()=>i,x:()=>l});var r=n(6540);const s={},a=r.createContext(s);function i(e){const t=r.useContext(a);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),r.createElement(a.Provider,{value:t},e.children)}}}]);