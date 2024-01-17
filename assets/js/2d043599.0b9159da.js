"use strict";(self.webpackChunktrackdechets=self.webpackChunktrackdechets||[]).push([[3003],{2137:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>o,contentTitle:()=>c,default:()=>u,frontMatter:()=>i,metadata:()=>d,toc:()=>l});var t=n(5893),s=n(1151);const i={title:"Diff\xe9rences entre les bordereaux"},c=void 0,d={id:"reference/multi-bsd",title:"Diff\xe9rences entre les bordereaux",description:"Le mode op\xe9ratoire de l'API pour les bordereaux DASRI, amiante, VHU et Fluides Frigorig\xe8nes diff\xe8re sensiblement de celui pour le BSDD.",source:"@site/docs/reference/multi-bsd.md",sourceDirName:"reference",slug:"/reference/multi-bsd",permalink:"/reference/multi-bsd",draft:!1,unlisted:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/reference/multi-bsd.md",tags:[],version:"current",frontMatter:{title:"Diff\xe9rences entre les bordereaux"},sidebar:"docs",previous:{title:"BSPAOH",permalink:"/reference/statuts/bspaoh"},next:{title:"Environnements",permalink:"/reference/environments/"}},o={},l=[];function a(e){const r={code:"code",li:"li",p:"p",ul:"ul",...(0,s.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.p,{children:"Le mode op\xe9ratoire de l'API pour les bordereaux DASRI, amiante, VHU et Fluides Frigorig\xe8nes diff\xe8re sensiblement de celui pour le BSDD."}),"\n",(0,t.jsxs)(r.p,{children:["le champ ",(0,t.jsx)(r.code,{children:"id"})," stocke un champ lisible (\xe9quivalent du ",(0,t.jsx)(r.code,{children:"readableId"})," du bsdd). Il n'y a donc pas de champ ",(0,t.jsx)(r.code,{children:"readableId"}),".\nLe ",(0,t.jsx)(r.code,{children:"DRAFT"})," est sorti des statuts, c'est un boolean \xe0 part. Le passage par l'\xe9tape brouillon est facultatif."]}),"\n",(0,t.jsx)(r.p,{children:"Pour donner plus de flexibilit\xe9 et limiter les mutations, les principes suivants sont adopt\xe9s:"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsxs)(r.li,{children:["le nombre de mutations est reduit: ",(0,t.jsx)(r.code,{children:"create/createDraft"}),", ",(0,t.jsx)(r.code,{children:"publish"}),", ",(0,t.jsx)(r.code,{children:"update"}),", ",(0,t.jsx)(r.code,{children:"sign"})]}),"\n",(0,t.jsxs)(r.li,{children:["createDraft cr\xe9e un bordereau dans l'\xe9tat ",(0,t.jsx)(r.code,{children:"INITIAL"}),", ",(0,t.jsx)(r.code,{children:"isDraft=true"}),". Cette mutation est optionelle, on peut commencer avec ",(0,t.jsx)(r.code,{children:"create"})]}),"\n",(0,t.jsxs)(r.li,{children:["create cr\xe9e un bordereau dans l'\xe9tat ",(0,t.jsx)(r.code,{children:"INITIAL"}),", ",(0,t.jsx)(r.code,{children:"isDraft=false"})]}),"\n",(0,t.jsxs)(r.li,{children:["publish passe le bordereau de ",(0,t.jsx)(r.code,{children:"isDraft=true"})," \xe0 ",(0,t.jsx)(r.code,{children:"isDraft=false"})]}),"\n",(0,t.jsx)(r.li,{children:"la mutation update permet de mettre \xe0 jour le bordereau pendant son cycle de vie"}),"\n",(0,t.jsx)(r.li,{children:"la mutation sign (EMISSION, TRANSPORT, RECEPTION, OPERATION) appose une signature sur le cadre correspondant et verrouille les champs correspondants"}),"\n",(0,t.jsx)(r.li,{children:"une fois qu'une signature est appos\xe9e, les champs du cadre correspondant ne sont plus modifiables"}),"\n"]})]})}function u(e={}){const{wrapper:r}={...(0,s.a)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(a,{...e})}):a(e)}},1151:(e,r,n)=>{n.d(r,{Z:()=>d,a:()=>c});var t=n(7294);const s={},i=t.createContext(s);function c(e){const r=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function d(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:c(e.components),t.createElement(i.Provider,{value:r},e.children)}}}]);