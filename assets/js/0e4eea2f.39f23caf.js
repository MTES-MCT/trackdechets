"use strict";(self.webpackChunktd_doc=self.webpackChunktd_doc||[]).push([[1193],{2577:function(e,t,r){var n=r(7294),i=r(7273);i.Z.initialize({startOnLoad:!0});t.Z=e=>{let{chart:t}=e;return(0,n.useEffect)((()=>{i.Z.contentLoaded()}),[]),n.createElement("div",{className:"mermaid"},t)}},6003:function(e,t,r){r.d(t,{Z:function(){return d}});var n=r(7294),i=r(8084),s=r(814),a=r(2577),o=r(1446);const c=e=>e.split("\n").map((e=>n.createElement(n.Fragment,null,e,n.createElement("br",null))));function d(e){let{path:t}=e;const{workflows:r}=(0,i.eZ)("workflow-doc-plugin"),d=(0,o.D)(t,r);return n.createElement("div",null,d.description&&n.createElement("div",null,c(d.description)),d.chart&&n.createElement(a.Z,{chart:d.chart}),n.createElement("hr",null),d.steps.map(((e,t)=>n.createElement("div",{key:t},n.createElement("div",{className:"margin-bottom--sm"},c(e.description)),n.createElement("div",{className:"margin-bottom--lg"},n.createElement(s.Z,{className:"graphql"},e.mutation),n.createElement(s.Z,{className:"json"},e.variables))))))}},1446:function(e,t,r){function n(e,t,r){return void 0===r&&(r="."),e.split(r).reduce(((e,t)=>e&&e[t]),t)}r.d(t,{D:function(){return n}})},3600:function(e,t,r){r.r(t),r.d(t,{assets:function(){return d},contentTitle:function(){return o},default:function(){return u},frontMatter:function(){return a},metadata:function(){return c},toc:function(){return l}});var n=r(3117),i=(r(7294),r(3905)),s=r(6003);const a={title:"Emport direct d'un dasri sans signature producteur"},o=void 0,c={unversionedId:"tutoriels/examples/bsdasri/emport-direct",id:"tutoriels/examples/bsdasri/emport-direct",title:"Emport direct d'un dasri sans signature producteur",description:"",source:"@site/docs/tutoriels/examples/bsdasri/emport-direct.mdx",sourceDirName:"tutoriels/examples/bsdasri",slug:"/tutoriels/examples/bsdasri/emport-direct",permalink:"/tutoriels/examples/bsdasri/emport-direct",draft:!1,editUrl:"https://github.com/MTES-MCT/trackdechets/edit/dev/doc/docs/tutoriels/examples/bsdasri/emport-direct.mdx",tags:[],version:"current",frontMatter:{title:"Emport direct d'un dasri sans signature producteur"},sidebar:"docs",previous:{title:"Acheminement direct du PRED \xe0 l'installation de traitement",permalink:"/tutoriels/examples/bsdasri/acheminement-direct"},next:{title:"Acheminement direct \xe0 l'installation de traitement, d\xe9tenteur \xe9co-organisme",permalink:"/tutoriels/examples/bsdasri/acheminement-direct-ecoorganisme"}},d={},l=[],m={toc:l};function u(e){let{components:t,...r}=e;return(0,i.kt)("wrapper",(0,n.Z)({},m,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)(s.Z,{path:"bsdasri.emportDirect",mdxType:"Workflow"}))}u.isMDXComponent=!0}}]);