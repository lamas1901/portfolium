import{StaticComponent,DynamicComponent,Edge,StaticTable,DynamicTableRow,SearchBar,Input,Output,InputResults,Button,Checkbox}from"./component/component.js";import{TO_FETCH}from"./fetch.js";class Interface{constructor({lead:t,components:e,buttonUpdate:s}){this.lead=t,this.leadReady=!1,this.componentsReady=!1,this.lead.INTERFACE=this,this.components=e,this.components.optimize.collect=()=>this.lead.data,this.buttonUpdate=s,this.buttonUpdate.click((()=>{this.update().then((t=>{t&&fetch(`?portfolio=${JSON.stringify(t)}`).then((t=>(this.buttonUpdate.blocked=!0,t.json()))).then((t=>{0!==Number(t)&&(window.location.href="/portfolio/"+t)}))}))})),this.buttonUpdate.blocked=!0;for(let t in this.components)this.components[t].INTERFACE=this;t.brokeUploadDependency=()=>{this.leadReady=!1;for(let t in this.components)this.components[t].state.ready=!1;this.buttonUpdate.blocked=!0}}check(){if(!this.lead.state.ready)return!1;for(let t in this.components)if(!this.components[t].state.ready)return!1;this.buttonUpdate.blocked=!1}async update(){let t={};t.currentPortfolio=this.lead.preset;for(let e in this.components)t[e]=this.components[e].preset;let e=document.querySelector("#portfolioNumber"),s=document.querySelector("#portfolioName");if(e)t.number=Number(e.innerHTML);else if(s){if(!(s.value.length>=5))return void alert("Название портфолио должно состоять из более чем 4-x знаков");t.name=s.value}return t}}class Assets extends StaticComponent{constructor({self:t,root:e}){super({self:t}),this._set()}_set(){this.state.ready=!1,this.addChild(Edge,"intro").take=t=>{this.intro.self.classList[t?"add":"remove"]("d-none")},this.addChild(Output,"number").take=t=>{this.number.value=t},this.addChild(StaticComponent,"sortOptions").take=t=>{if("number"==typeof t){let e=Number(t)?"remove":"add";this.sortOptions?.self.classList[e]("d-none")}},this.sortOptions.find("select").addEventListener("change",(()=>{this.container.sort({subscribers:this.container.body.subscribers,by:this.sortOptions.find("select").value})})),this.addChild(SearchBar,"searchBar"),this.searchBar.state.api=TO_FETCH,this.searchBar.take=t=>{this.searchBar.blocked=t>=10},this.addChild(Checkbox,"selectAllCheckbox").take=t=>{this.selectAllCheckbox.disabled=0===t,this.selectAllCheckbox.value=!1},this.selectAllCheckbox.self.addEventListener("click",(()=>{let t=this.get("selectAllCheckbox").checked;this.container.selectAll(t)})),this.addChild(Button,"dCSV").take=t=>{let e=t?"remove":"add";this.dCSV.self.classList[e]("d-none")},this.addChild(StaticComponent,"intro").take=t=>{let e=t?"add":"remove";this.intro.self.classList[e]("d-none")},this.editButtons=[new Button({self:this.getAll("editButton")[0],root:this}).click((()=>{this.container.take("edit"),this.mode="edit";for(let t in this.INTERFACE.components)this.INTERFACE.components[t].blocked=!0})),new Button({self:this.getAll("editButton")[1],root:this}).click((()=>{this.container.take("edit"),this.mode="edit";for(let t in this.INTERFACE.components)this.INTERFACE.components[t].blocked=!0}))],this.addChild(Button,"saveButton").click((()=>{this.mode=this.container.take("save")?"default":this.state.mode;for(let t in this.INTERFACE.components)this.INTERFACE.components[t].blocked=!1;this.state.ready=!0,this.brokeUploadDependency()})),this.addChild(Button,"applyButton").click((()=>{switch(this.get("applyOptions").value){case"eqVal":this.container.pricesEq();break;case"zeroVal":this.container.pricesZero();break;case"delete":this.container.removeSelected()}})),this.addChild(Button,"factoryButton").click((()=>{this.container.take("factory"),this.mode="default"})),this.addChild(StaticTableAssets,"container").subscribers=[this.intro,this.selectAllCheckbox,this.sortOptions,this.number,this.searchBar,this.dCSV],this.addChild(Output,"sum").take=()=>{this.sum.value=this.container.pricesSum()},this.container.subscribers.push(this.sum),this.getAll("asset").forEach((t=>{this.container.addAsset(null,t)})),delete this._set}get data(){let t=[];return this.container.body.subscribers.forEach((e=>{t.push({number:e.number,ticker:e.get("ticker").innerHTML,weight:Math.round(e.IOs.outPrice.value/this.container.pricesSum()*100)/100})})),t}get preset(){let t=[];return this.container.body.subscribers.forEach((e=>{t.push({number:e.number,ticker:e.get("ticker").innerHTML,name:e.get("name").innerHTML,price:Math.round(1e3*Number(e.IOs.outPrice.value))/1e3})})),t}get tickers(){let t=[];return this.container.body.subscribers.forEach((e=>{t.push(e.ticker),console.log(e.ticker)})),t}set alert(t){this.get("alert").classList.remove("d-none"),setTimeout((()=>{this.get("alert").classList.add("d-none")}),5e3),this.get("alertMessage").innerHTML=t}async fetchAssets(){let t=await fetch(`${TO_FETCH}/my`);return await t.json()}async takeAssets(){return await this.fetchAssets().then((t=>t.forEach((t=>{this.container.addAsset(t)}))))}}class AssetsSearchBar{}class StaticTableAssets extends StaticTable{constructor({self:t,root:e}){super({self:t,root:e}),this.body.take=t=>{switch(t){case"edit":this.sort({by:"default"}),this.body.factory=[...this.body.subscribers];break;case"save":return this.pricesDone?(this.body.notify(t),this.body.factory=[...this.body.subscribers],this.sort({by:this.root.sortOptions.find("select").value}),!0):(this.root.alert="Заполните стоимость всех инструментов",!1);case"factory":this.body.notify(t),this.body.subscribers=this.body.factory,this.sort({by:this.root.sortOptions.find("select").value}),this.body.factory=[...this.body.subscribers]}}}get checkboxedAll(){let t=[];return this.body.subscribers.forEach((e=>{e.checkbox.value&&t.push(e)})),t}get checkboxedLen(){return this.checkboxedAll.length}get pricesDone(){let t=this.body.subscribers;for(let e in t){let s=t[e];if(Number(s.inPrice.value)<=0)return setTimeout((()=>{s.self.classList.add("add-bar-item--animated"),setTimeout((()=>{s.self.classList.remove("add-bar-item--animated")}),3e3)}),0),!1}return!0}addAsset(t,e){this.body.subscribers.length<10?(t?this.add(new Asset({name:"asset",root:this.root,template:tempAssets.asset({number:this.body.subscribers.length+1,...t})})):e&&this.add(new Asset({root:this.root,self:e})),this.render(),this.refreshIndexes()):this.root.alert="Вы достигли максимального количества инструментов"}selectAll(t){this.body.subscribers.forEach((e=>{e.checkbox.value=t}))}removeSelected(){this.body.subscribers=this.body.subscribers.filter((t=>!t.checkbox.value||(t.remove(),!1))),this.sort({by:"default"}),this.body.subscribers.forEach((t=>t.render())),this.refreshIndexes()}pricesSum(t){let e=0;return this.body.subscribers.forEach((s=>{t?s.checkbox.value&&(e+=Number(s.inPrice.value)):e+=Number(s.inPrice.value)})),e}pricesZero(){this.body.subscribers.forEach((t=>{t.checkbox.value&&(t.inPrice.value=0)}))}pricesEq(){let t=this.pricesSum(!0),e=this.checkboxedLen;this.body.subscribers.forEach((s=>{s.checkbox.value&&(s.inPrice.value=Math.round(t/e))}))}exist(t){let e=this.body.subscribers;for(let s in e){if(t===e[s].get("ticker").innerHTML)return!0}return!1}replace(t,e){let s=this.body.subscribers[t-1].number,i=this.body.subscribers[e-1].number;this.body.subscribers[t-1].number=i,this.body.subscribers[e-1].number=s,this.body.subscribers[t-1].render(),this.body.subscribers[e-1].render(),this.sort({subscribers:this.body.subscribers,by:"default"})}refreshIndexes(){let t=0;this.body.subscribers.forEach((e=>{t+=1,e.number=t}))}sort({by:t}){switch(t){case"default":this.body.subscribers.sort(((t,e)=>t.number-e.number));break;case"name":this.body.subscribers.sort(((t,e)=>t.get("name").innerHTML.localeCompare(e.get("name").innerHTML)));break;case"price":this.body.subscribers.sort(((t,e)=>parseInt(e.outPrice.value)-parseInt(t.outPrice.value)))}this.render()}take(t){return this.body.take(t)}}class Asset extends DynamicTableRow{constructor({self:t,name:e,template:s,root:i,classes:r=["add-bar-item","bg-gray-100","border-left-warning"]}){super({self:t,name:e,template:s,root:i,classes:r}),this._set()}_set(){this.addChild(Output,"name"),this.addChild(Output,"ticker"),this.addChild(Output,"factoryNumber"),this.inputs=[this.addChild(Input,"inPrice")],this.outputs=[this.addChild(Output,"outPrice")],this.outPrice.subscribers.push(this.inPrice),this.inPrice.subscribers.push(this.outPrice),this.inPrice.self.addEventListener("keydown",(t=>{"-"===t.key&&t.preventDefault()})),this.inPrice.self.addEventListener("input",(t=>{this.root.sum.take()})),this.addChild(Checkbox,"checkbox").subscribers.push(this.root.selectAllCheckbox),this.addChild(Button,"moveDown").click((()=>{this.root.container.subscribers.length!==this.number&&this.root.container.replace(this.number,this.number+1)})),this.addChild(Button,"moveUp").click((()=>{1!==this.number&&this.root.container.replace(this.number,this.number-1)})),delete this._set}render(){this.moveUp.blocked=1===this.number,this.moveDown.blocked=this.root.container.body.subscribers.length===this.number}get number(){return Number(this.get("number").innerHTML)}set number(t){this.get("number").innerHTML=t}take(t){if("string"!=typeof t)return!1;switch(t){case"factory":case"save":switch(this.checkbox.value=!1,t){case"factory":this.number=this.factoryNumber.value,this.outputs.forEach((t=>{t.notify(t.value)}));break;case"save":this.factoryNumber.value=this.number,this.inputs.forEach((t=>{t.notify(t.value)}))}}}}class Optimize extends StaticComponent{constructor({self:t,mode:e}){super({self:t,mode:e}),this.state.ready=!1,this.addChild(Button,"optimizeButton").click((()=>{this.collect().length>=2?(this.optimizeButton.getAll().forEach((t=>{t.classList.toggle("d-none")})),this.optimizeButton.blocked=!0,this.optimize(this.collect()).then((t=>{this.display(t),this.optimizeButton.getAll().forEach((t=>{t.classList.toggle("d-none")})),this.optimizeButton.blocked=!1,this.state.ready=!0,this.INTERFACE.lead.state.ready=!0,this.INTERFACE.check()}))):this.alert="Для того что бы оптимизировать портфолио в нём должно быть минимум 2 инструмента..."})),this.addChild(StaticTable,"table")}async optimize(t){let e="",s="",i=this.INTERFACE.lead.data;for(let t in i)e+=Math.round(10*i[t].weight)/10+",",s+=i[t].ticker+",";let r=await fetch(TO_FETCH+`/analyze?t=${s.slice(0,-1)}&w=${e.slice(0,-1)}&edge=${this.edge}`);return await r.json()}get edge(){return Math.round(100*this.get("edge").value)/100}set currentVolatility(t){this.get("currentVolatility").innerHTML=t}set currentReturn(t){this.get("currentReturn").innerHTML=t}set optimizedVolatility(t){this.get("optimizedVolatility").innerHTML=t}set optimizedReturn(t){this.get("optimizedReturn").innerHTML=t}set alert(t){this.get("alert").classList.remove("d-none"),setTimeout((()=>{this.get("alert").classList.add("d-none")}),5e3),this.get("alertMessage").innerHTML=t}display(t){this.preset=t,this.preset.edge=Number(this.edge),this.get("last").innerHTML=(new Date).toLocaleDateString(),this.get("from").innerHTML=new Date(10928736e5).toLocaleDateString(),this.table.clear();for(let e in t.optimized.weights)this.table.add(new DynamicTableRow({template:tempOptimize.data({ticker:e,weight:Number(t.optimized.weights[e])})}));this.currentVolatility=Math.round(100*t.current.volatility),this.currentReturn=Math.round(100*t.current.return),this.optimizedVolatility=Math.round(100*t.optimized.volatility),this.optimizedReturn=Math.round(100*t.optimized.return),this.mode="default",this.INTERFACE.componentsReady=!0}take(t){switch(t){case"optimize":this.optimize().then((t=>{display(t)}))}}}export{Interface,Assets,StaticTableAssets,Asset,Optimize,Button};