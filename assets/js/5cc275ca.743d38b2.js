"use strict";(self.webpackChunktrackdechets=self.webpackChunktrackdechets||[]).push([[7204],{5446:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>a,contentTitle:()=>d,default:()=>c,frontMatter:()=>i,metadata:()=>l,toc:()=>u});var r=s(4848),t=s(8453);const i={title:"Requ\xeater et filtrer les bordereaux Bsda, Bsdasri, Bsff et Bsvhu"},d=void 0,l={id:"tutoriels/courant/query-bordereaux",title:"Requ\xeater et filtrer les bordereaux Bsda, Bsdasri, Bsff et Bsvhu",description:"Les bordereaux Bsda, Bsdasri, Bsff et Bsvhu, ont b\xe9n\xe9fici\xe9 des retours utiilisateurs et proposent des filtres de requ\xeates puissants.",source:"@site/docs/tutoriels/courant/query-bordereaux.md",sourceDirName:"tutoriels/courant",slug:"/tutoriels/courant/query-bordereaux",permalink:"/tutoriels/courant/query-bordereaux",draft:!1,unlisted:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/tutoriels/courant/query-bordereaux.md",tags:[],version:"current",frontMatter:{title:"Requ\xeater et filtrer les bordereaux Bsda, Bsdasri, Bsff et Bsvhu"},sidebar:"docs",previous:{title:"Cr\xe9er votre premier BSD",permalink:"/tutoriels/quickstart/first-bsd"},next:{title:"Acheminement direct du producteur de d\xe9chet \xe0 l'installation de traitement",permalink:"/tutoriels/examples/bsdd/acheminement-direct"}},a={},u=[{value:"Filtres simples",id:"filtres-simples",level:3},{value:"Sur l&#39;\xe9tat de brouillon (boolean)",id:"sur-l\xe9tat-de-brouillon-boolean",level:4},{value:"Sur un statut",id:"sur-un-statut",level:4},{value:"Egalit\xe9 stricte : Sur le siret d&#39;un producteur",id:"egalit\xe9-stricte--sur-le-siret-dun-producteur",level:4},{value:"Filtres temporels",id:"filtres-temporels",level:4},{value:"Filtre d&#39;appartenance",id:"filtre-dappartenance",level:4},{value:"Sur les statuts",id:"sur-les-statuts",level:5},{value:"Sur des identifiants",id:"sur-des-identifiants",level:4},{value:"Filtres combin\xe9s",id:"filtres-combin\xe9s",level:3},{value:"Not  (_not)",id:"not--_not",level:3},{value:"And implicite",id:"and-implicite",level:3},{value:"Or (_or)",id:"or-_or",level:3},{value:"And (_and)",id:"and-_and",level:3}];function o(e){const n={a:"a",code:"code",h3:"h3",h4:"h4",h5:"h5",p:"p",pre:"pre",...(0,t.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.p,{children:"Les bordereaux Bsda, Bsdasri, Bsff et Bsvhu, ont b\xe9n\xe9fici\xe9 des retours utiilisateurs et proposent des filtres de requ\xeates puissants."}),"\n",(0,r.jsx)(n.p,{children:"Veuillez noter que les Bsdd (requ\xeate forms) ne disposent pas des m\xeames filtres."}),"\n",(0,r.jsxs)(n.p,{children:["Pour une documentation exhaustive, veuillez consulter la r\xe9f\xe9rence des requ\xeates de chaque bordereau, par exemple ",(0,r.jsx)(n.a,{href:"/reference/api-reference/bsdasri/queries#bsdasris",children:"la requ\xeate bsdasri"}),"."]}),"\n",(0,r.jsx)(n.p,{children:"Les exemples suivants portent sur les dasris, mais sont ais\xe9ment transposables aux autres bordereaux.\nIls ne pr\xe9tendent pas avoir un int\xe9r\xeat m\xe9tier particulier, mais simplement expliciter la syntaxe de requ\xeate."}),"\n",(0,r.jsx)(n.h3,{id:"filtres-simples",children:"Filtres simples"}),"\n",(0,r.jsx)(n.h4,{id:"sur-l\xe9tat-de-brouillon-boolean",children:"Sur l'\xe9tat de brouillon (boolean)"}),"\n",(0,r.jsx)(n.p,{children:"Renvoie les dasris non brouillons."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-graphql",children:"query {\n  bsdasris(where: { isDraft: false }) {\n    edges {\n      node {\n        id\n      }\n    }\n  }\n}\n"})}),"\n",(0,r.jsx)(n.h4,{id:"sur-un-statut",children:"Sur un statut"}),"\n",(0,r.jsx)(n.p,{children:"Renvoie les dasris SENT."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-graphql",children:"query {\n  bsdasris(where: {  status: {_eq : SENT} }) {\n    edges {\n      node {\n        id\n      }\n    }\n  }\n}\n"})}),"\n",(0,r.jsx)(n.h4,{id:"egalit\xe9-stricte--sur-le-siret-dun-producteur",children:"Egalit\xe9 stricte : Sur le siret d'un producteur"}),"\n",(0,r.jsx)(n.p,{children:'Renvoie les dasris dont le siret de l\'\xe9metteur est "UN-SIRET".'}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-graphql",children:'query {\n  bsdasris(where: { emitter : {company\t: {siret :  {_eq: "UN-SIRET"}}} }) {\n    edges {\n      node {\n        id\n      }\n    }\n  }\n}\n'})}),"\n",(0,r.jsx)(n.h4,{id:"filtres-temporels",children:"Filtres temporels"}),"\n",(0,r.jsxs)(n.p,{children:["Les op\xe9rateurs et formats de date accept\xe9s sont document\xe9s dans ",(0,r.jsx)(n.a,{href:"/reference/api-reference/bsdasri/inputObjects#datefilter",children:"la r\xe9f\xe9rence de DateFilter"}),"."]}),"\n",(0,r.jsx)(n.p,{children:"Renvoie les dasris dont la date de cr\xe9ation est \xe9gale ou post\xe9rieure au 23/11/2021."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-graphql",children:'query {\n  bsdasris(where: { createdAt: { _gte: " 2021-11-23" } }) {\n    edges {\n      node {\n        id\n      }\n    }\n  }\n}\n'})}),"\n",(0,r.jsx)(n.h4,{id:"filtre-dappartenance",children:"Filtre d'appartenance"}),"\n",(0,r.jsx)(n.p,{children:"Il est possible de filtrer certains champs sur un tableau de valeurs."}),"\n",(0,r.jsx)(n.h5,{id:"sur-les-statuts",children:"Sur les statuts"}),"\n",(0,r.jsx)(n.p,{children:"Renvoie les dasri en statut INITIAL ou SENT."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"query {\n  bsdasris(where: { status: { _in: [SENT, INITIAL] } }) {\n    edges {\n      node {\n        id\n      }\n    }\n  }\n}\n"})}),"\n",(0,r.jsx)(n.h4,{id:"sur-des-identifiants",children:"Sur des identifiants"}),"\n",(0,r.jsx)(n.p,{children:'Renvoie les dasris dont l\'identifiant vaut "DASRI-123" ou "DASRI-456".'}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:'query {\n  bsdasris(where: { id: { _in: ["DASRI-123", "DASRI-456"] } }) {\n    edges {\n      node {\n        id\n      }\n    }\n  }\n}\n'})}),"\n",(0,r.jsx)(n.h3,{id:"filtres-combin\xe9s",children:"Filtres combin\xe9s"}),"\n",(0,r.jsx)(n.p,{children:"Il est possible de combiner des filtres avec _and, _or, _not. L'imbrication de tels op\xe9rateurs est n\xe9anmoins limit\xe9e."}),"\n",(0,r.jsx)(n.h3,{id:"not--_not",children:"Not  (_not)"}),"\n",(0,r.jsx)(n.p,{children:"Renvoie les dasris non SENT"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-graphql",children:"query {\n  bsdasris(where: { _not: { status: { _eq: SENT } } }) {\n    edges {\n      node {\n        id\n      }\n    }\n  }\n}\n"})}),"\n",(0,r.jsx)(n.h3,{id:"and-implicite",children:"And implicite"}),"\n",(0,r.jsx)(n.p,{children:"Renvoie les dasris INITIAL non brouillons."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-graphql",children:"query {\n  bsdasris(where: { isDraft: false, status: { _eq: INITIAL } }) {\n    edges {\n      node {\n        id\n      }\n    }\n  }\n}\n\n"})}),"\n",(0,r.jsx)(n.h3,{id:"or-_or",children:"Or (_or)"}),"\n",(0,r.jsx)(n.p,{children:"Renvoie les dasris dont la date de cr\xe9ation est \xe9gale ou post\xe9rieure au 03/05/2022 ou dont le statut est PROCESSED."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-graphql",children:'query {\n  bsdasris(\n    where: {\n      _or: [\n        { createdAt: { _gte: "2022-05-03" } }\n        { status: { _eq: PROCESSED } }\n      ]\n    }\n  ) {\n    edges {\n      node {\n        id\n        updatedAt\n      }\n    }\n  }\n}\n'})}),"\n",(0,r.jsx)(n.h3,{id:"and-_and",children:"And (_and)"}),"\n",(0,r.jsx)(n.p,{children:"Renvoie les dasris dont la date de cr\xe9ation est \xe9gale ou post\xe9rieure au 03/05/2022, dont le statut est INITIAL et non brouillon."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-graphql",children:'query {\n  bsdasris(\n    where: {\n      createdAt: { _gte: "2022-05-03" }\n      _and: [{ status: { _eq: INITIAL } }, { isDraft: false }]\n    }\n  ) {\n    edges {\n      node {\n        id\n        updatedAt\n      }\n    }\n  }\n}\n'})})]})}function c(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(o,{...e})}):o(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>d,x:()=>l});var r=s(6540);const t={},i=r.createContext(t);function d(e){const n=r.useContext(i);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:d(e.components),r.createElement(i.Provider,{value:n},e.children)}}}]);