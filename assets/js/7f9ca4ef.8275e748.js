"use strict";(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[6306],{2577:(e,t,r)=>{r.d(t,{Z:()=>a});var l=r(7294),s=r(7273);s.Z.initialize({startOnLoad:!0});const a=e=>{let{chart:t}=e;return(0,l.useEffect)((()=>{s.Z.contentLoaded()}),[]),l.createElement("div",{className:"mermaid"},t)}},6003:(e,t,r)=>{r.d(t,{Z:()=>c});var l=r(7294),s=r(8084),a=r(814),o=r(2577),n=r(1446);const u=e=>e.split("\n").map((e=>l.createElement(l.Fragment,null,e,l.createElement("br",null))));function c(e){let{path:t}=e;const{workflows:r}=(0,s.eZ)("workflow-doc-plugin"),c=(0,n.D)(t,r);return l.createElement("div",null,c.description&&l.createElement("div",null,u(c.description)),c.chart&&l.createElement(o.Z,{chart:c.chart}),l.createElement("hr",null),c.steps.map(((e,t)=>l.createElement("div",{key:t},l.createElement("div",{className:"margin-bottom--sm"},u(e.description)),l.createElement("div",{className:"margin-bottom--lg"},l.createElement(a.Z,{className:"graphql"},e.mutation??e.query),l.createElement(a.Z,{className:"json"},e.variables))))))}},1446:(e,t,r)=>{function l(e,t,r){return void 0===r&&(r="."),e.split(r).reduce(((e,t)=>e&&e[t]),t)}r.d(t,{D:()=>l})},7138:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>n,default:()=>p,frontMatter:()=>o,metadata:()=>u,toc:()=>i});var l=r(3117),s=(r(7294),r(3905)),a=r(6003);const o={title:"Collecte de fluides par un op\xe9rateur"},n=void 0,u={unversionedId:"tutoriels/examples/bsff/collecte-fluides-par-operateur",id:"tutoriels/examples/bsff/collecte-fluides-par-operateur",title:"Collecte de fluides par un op\xe9rateur",description:"",source:"@site/docs/tutoriels/examples/bsff/collecte-fluides-par-operateur.mdx",sourceDirName:"tutoriels/examples/bsff",slug:"/tutoriels/examples/bsff/collecte-fluides-par-operateur",permalink:"/tutoriels/examples/bsff/collecte-fluides-par-operateur",draft:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/tutoriels/examples/bsff/collecte-fluides-par-operateur.mdx",tags:[],version:"current",frontMatter:{title:"Collecte de fluides par un op\xe9rateur"},sidebar:"docs",previous:{title:"Acheminement d'un centre VHU vers un broyeur",permalink:"/tutoriels/examples/bsvhu/vhu-vers-broyeur"},next:{title:"Groupement sur une plateforme de transit ou un d\xe9p\xf4t distributeur",permalink:"/tutoriels/examples/bsff/groupement"}},c={},i=[],d={toc:i};function p(e){let{components:t,...r}=e;return(0,s.kt)("wrapper",(0,l.Z)({},d,r,{components:t,mdxType:"MDXLayout"}),(0,s.kt)(a.Z,{path:"bsff.collecteFluidesParOperateur",mdxType:"Workflow"}))}p.isMDXComponent=!0}}]);