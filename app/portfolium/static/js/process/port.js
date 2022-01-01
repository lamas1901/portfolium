import {
	StaticComponent,
	DynamicComponent,
	Edge,
	StaticTable,
	DynamicTableRow,
	SearchBar,
	Input,
	Output,
	InputResults,
	Button,
	Checkbox,
} from "./component/component.js";

import {TO_FETCH} from "./fetch.js"

// === [ Компоненты прямого назначения ] === ///

/* Адрес RestAPI */

/*
Класс для проверки 
готовности логики 
виджетов выгрузить 
изменения
*/

class Interface {
	constructor({ lead, components, buttonUpdate }) {
		this.lead = lead;
		this.leadReady = false;
		this.componentsReady = false
		this.lead.INTERFACE = this;

		this.components = components;

		this.components.optimize.collect = () => {
			return this.lead.data;
		};

		this.buttonUpdate = buttonUpdate;
		this.buttonUpdate.click(() => {
			this.update().then((result) => {
				if (result){
					fetch(`?portfolio=${JSON.stringify(result)}`).then((result)=>{
						this.buttonUpdate.blocked = true
						return result.json()
					}).then((data)=>{
						if (Number(data)!==0){
							window.location.href = "/portfolio/"+data
						}
					})
				}
			});
		});
		this.buttonUpdate.blocked = true

		for (let component in this.components) {
			this.components[component].INTERFACE = this;
		}

		lead.brokeUploadDependency = () => {
			this.leadReady = false;
			for (let component in this.components) {
				this.components[component].state.ready = false
			}
			this.buttonUpdate.blocked = true
		};
	}

	// Проверка готовности системы выгрузить инструменты
	check(){
		if (!this.lead.state.ready){
			return false
		}
		for (let component in this.components) {
			if (!this.components[component].state.ready) {
				return false
			}
		}
		this.buttonUpdate.blocked = false
	}

	async update() {
		let preset = {};
		preset["currentPortfolio"] = this.lead.preset;
		for (let component in this.components) {
			preset[component] = this.components[component].preset;
		}

		let pnumber = document.querySelector("#portfolioNumber") 
		let pname = document.querySelector("#portfolioName")  
		if (pnumber){
			preset["number"] = Number(pnumber.innerHTML)
		} else if(pname){
			if (pname.value.length>=5){
				preset["name"] = pname.value
			} else {
				alert("Название портфолио должно состоять из более чем 4-x знаков")
				return
			}
		}

		return preset;
	}
}

/*
Виджет инструментов
*/

class Assets extends StaticComponent {
	constructor({ self, root }) {
		super({
			self: self,
		});

		this._set();
	}

	_set() {

		this.state.ready = false

		this.addChild(Edge, "intro").take = (number) => {
			this.intro.self.classList[number ? "add" : "remove"]("d-none");
		};

		this.addChild(Output, "number").take = (number) => {
			this.number.value = number;
		};

		this.addChild(StaticComponent, "sortOptions").take = (message) => {
			if (typeof message === "number") {
				let op = Number(message) ? "remove" : "add";
				this.sortOptions?.self.classList[op]("d-none");
			} else if (message === "default") {
				this;
			}
		};
		this.sortOptions.find("select").addEventListener("change", () => {
			this.container.sort({
				subscribers: this.container.body.subscribers,
				by: this.sortOptions.find("select").value,
			});
		});

		this.addChild(SearchBar, "searchBar");
		this.searchBar.state.api = TO_FETCH;
		this.searchBar.take = (number) => {
			this.searchBar.blocked = number >= 10 ? true : false;
		};

		this.addChild(Checkbox, "selectAllCheckbox").take = (value) => {
			this.selectAllCheckbox.disabled = value === 0 ? true : false;
			this.selectAllCheckbox.value = false;
		};
		this.selectAllCheckbox.self.addEventListener("click", () => {
			let checked = this.get("selectAllCheckbox").checked;
			this.container.selectAll(checked);
		});

		this.addChild(Button, "dCSV").take = (number) => {
			let op = number ? "remove" : "add";
			this.dCSV.self.classList[op]("d-none");
		};

		this.addChild(StaticComponent, "intro").take = (number) => {
			let op = number ? "add" : "remove";
			this.intro.self.classList[op]("d-none");
		};

		this.editButtons = [
			new Button({
				self: this.getAll("editButton")[0],
				root: this,
			}).click(() => {
				this.container.take("edit");
				this.mode = "edit";
				for (let component in this.INTERFACE.components){
					this.INTERFACE.components[component].blocked = true
				}
			}),

			new Button({
				self: this.getAll("editButton")[1],
				root: this,
			}).click(() => {
				this.container.take("edit");
				this.mode = "edit";
				for (let component in this.INTERFACE.components){
					this.INTERFACE.components[component].blocked = true
				}
			}),
		];

		this.addChild(Button, "saveButton").click(() => {
			this.mode = this.container.take("save")?"default":this.state.mode;
			for (let component in this.INTERFACE.components){
				this.INTERFACE.components[component].blocked = false
			}
			this.state.ready = true
			this.brokeUploadDependency()
		});

		this.addChild(Button, "applyButton").click(() => {
			switch (this.get("applyOptions").value) {
				case "eqVal": {
					this.container.pricesEq();
					break;
				}

				case "zeroVal": {
					this.container.pricesZero();
					break;
				}

				case "delete": {
					this.container.removeSelected();
					break;
				}
			}

		});

		this.addChild(Button, "factoryButton").click(() => {
			this.container.take("factory");
			this.mode = "default";
		});

		this.addChild(StaticTableAssets, "container").subscribers = [
			this.intro,
			this.selectAllCheckbox,
			this.sortOptions,
			this.number,
			this.searchBar,
			this.dCSV,
		];
		this.addChild(Output, "sum").take = () => {
			this.sum.value = this.container.pricesSum();
		};
		this.container.subscribers.push(this.sum);

		this.getAll("asset").forEach((self)=>{
			this.container.addAsset(
				null,
				self
			)
		})

		delete this._set
	}

	get data() {
		let brief = []
		this.container.body.subscribers.forEach((subscriber) => {
			brief.push({
				number: subscriber.number,
				ticker: subscriber.get("ticker").innerHTML,
				weight: Math.round(subscriber.IOs.outPrice.value/this.container.pricesSum()*100)/100
			});
		});
		return brief;
	}
	get preset(){
		let brief = []
		this.container.body.subscribers.forEach((subscriber)=>{
			brief.push({
				number: subscriber.number,
				ticker: subscriber.get("ticker").innerHTML,
				name: subscriber.get("name").innerHTML,
				price: Math.round(Number(subscriber.IOs.outPrice.value)*1000)/1000,
			})
		})
		return brief
	}

	get tickers() {
		let output = [];
		this.container.body.subscribers.forEach((subscriber) => {
			output.push(subscriber.ticker)
			console.log(subscriber.ticker)
		});
		return output;
	}

	// call warning
	set alert(message) {
		this.get("alert").classList.remove("d-none");
		setTimeout(() => {
			this.get("alert").classList.add("d-none");
		}, 5000);
		this.get("alertMessage").innerHTML = message;
	}

	async fetchAssets() {
		let result = await fetch(`${TO_FETCH}/my`);
		return await result.json();
	}

	async takeAssets() {
		return await this.fetchAssets().then((assets) =>
			assets.forEach((asset) => {
				this.container.addAsset(asset);
			})
		);
	}
}

class AssetsSearchBar {}

// Notifies - n of assets

class StaticTableAssets extends StaticTable {
	constructor({ self, root }) {
		super({
			self: self,
			root: root,
		});

		this.body.take = (message) => {
			switch (message) {
				case "edit": {
					this.sort({
						by: "default",
					});
					this.body.factory = [...this.body.subscribers];
					break;
				}
				case "save": {
					if (this.pricesDone) {
						this.body.notify(message);
						this.body.factory = [...this.body.subscribers];
						this.sort({
							by: this.root.sortOptions.find("select").value,
						});
						return true;
					} else {
						this.root.alert =
							"Заполните стоимость всех инструментов";
						return false;
					}
					break;
				}
				case "factory": {
					this.body.notify(message);
					this.body.subscribers = this.body.factory;
					this.sort({
						by: this.root.sortOptions.find("select").value,
					});
					this.body.factory = [...this.body.subscribers];
					break;
				}
			}
		};

		// this.render(this.body.subscribers);
	}

	get checkboxedAll() {
		let output = [];
		this.body.subscribers.forEach((subscriber) => {
			if (subscriber.checkbox.value) {
				output.push(subscriber);
			}
		});
		return output;
	}

	get checkboxedLen() {
		return this.checkboxedAll.length;
	}

	get pricesDone() {
		let subscribers = this.body.subscribers;
		for (let index in subscribers) {
			let subscriber = subscribers[index];
			if (Number(subscriber.inPrice.value) <= 0) {
				setTimeout(() => {
					subscriber.self.classList.add("add-bar-item--animated");
					setTimeout(() => {
						subscriber.self.classList.remove(
							"add-bar-item--animated"
						);
					}, 3000);
				}, 0);
				return false;
			}
		}
		return true;
	}

	addAsset(asset, self) {
		if (this.body.subscribers.length<10){
			if (asset) {
				this.add(
					new Asset({
						name: "asset",
						root: this.root,
						template: tempAssets.asset({
							number: this.body.subscribers.length + 1,
							...asset,
						}),
					})
				);
			} else if (self) {
				this.add(
					new Asset({
						root: this.root,
						self: self,
					})
				);
			}
			this.render();
			this.refreshIndexes();
		} else{
			this.root.alert = "Вы достигли максимального количества инструментов"
		}
	}

	selectAll(bool) {
		this.body.subscribers.forEach((subscriber) => {
			subscriber.checkbox.value = bool;
		});
	}

	removeSelected() {
		this.body.subscribers = this.body.subscribers.filter((subscriber) => {
			if (subscriber.checkbox.value) {
				subscriber.remove();
				return false;
			}
			return true;
		});
		this.sort({
			by: "default",
		});
		this.body.subscribers.forEach((subscriber) => subscriber.render());
		this.refreshIndexes();
	}

	pricesSum(checkboxed) {
		let sum = 0;
		this.body.subscribers.forEach((subscriber) => {
			if (checkboxed) {
				if (subscriber.checkbox.value) {
					sum += Number(subscriber.inPrice.value);
				}
			} else {
				sum += Number(subscriber.inPrice.value);
			}
		});
		return sum;
	}

	pricesZero() {
		this.body.subscribers.forEach((subscriber) => {
			if (subscriber.checkbox.value) {
				subscriber.inPrice.value = 0;
			}
		});
	}

	pricesEq() {
		let sum = this.pricesSum(true);
		let checkboxed = this.checkboxedLen;
		this.body.subscribers.forEach((subscriber) => {
			if (subscriber.checkbox.value) {
				subscriber.inPrice.value = Math.round(sum / checkboxed);
			}
		});
	}

	exist(ticker) {
		let subscribers = this.body.subscribers;
		for (let index in subscribers) {
			let subscriber = subscribers[index];
			if (ticker === subscriber.get("ticker").innerHTML) {
				return true;
			}
		}
		return false;
	}

	replace(a, b) {
		let aVal = this.body.subscribers[a - 1].number;
		let bVal = this.body.subscribers[b - 1].number;

		this.body.subscribers[a - 1].number = bVal;
		this.body.subscribers[b - 1].number = aVal;

		this.body.subscribers[a - 1].render();
		this.body.subscribers[b - 1].render();

		this.sort({
			subscribers: this.body.subscribers,
			by: "default",
		});
	}

	refreshIndexes() {
		let counter = 0;
		this.body.subscribers.forEach((subscriber) => {
			counter += 1;
			subscriber.number = counter;
		});
	}

	sort({ by }) {
		switch (by) {
			case "default": {
				this.body.subscribers.sort((a, b) => {
					return a.number - b.number;
				});
				break;
			}
			case "name": {
				this.body.subscribers.sort((a, b) =>
					a
						.get("name")
						.innerHTML.localeCompare(b.get("name").innerHTML)
				);
				break;
			}
			case "price": {
				this.body.subscribers.sort(
					(a, b) =>
						parseInt(b.outPrice.value) - parseInt(a.outPrice.value)
				);
				break;
			}
		}

		this.render();
	}

	take(message) {
		return this.body.take(message);
	}
}

class Asset extends DynamicTableRow {
	constructor({
		self,
		name,
		template,
		root,
		classes = ["add-bar-item", "bg-gray-100", "border-left-warning"],
	}) {
		super({
			self: self,
			name: name,
			template: template,
			root: root,
			classes: classes,
		});

		this._set();
	}

	_set() {
		this.addChild(Output, "name");
		this.addChild(Output, "ticker");
		this.addChild(Output, "factoryNumber");

		this.inputs = [this.addChild(Input, "inPrice")];

		this.outputs = [this.addChild(Output, "outPrice")];

		this.outPrice.subscribers.push(this.inPrice);
		this.inPrice.subscribers.push(this.outPrice);
		this.inPrice.self.addEventListener("keydown", (e) => {
			if (e.key === "-") {
				e.preventDefault();
			}
		});
		this.inPrice.self.addEventListener("input",(e)=>{
			this.root.sum.take()
		})

		this.addChild(Checkbox, "checkbox").subscribers.push(
			this.root.selectAllCheckbox
		);

		this.addChild(Button, "moveDown").click(() => {
			if (!(this.root.container.subscribers.length === this.number)) {
				this.root.container.replace(this.number, this.number + 1);
			}
		});
		this.addChild(Button, "moveUp").click(() => {
			if (this.number !== 1) {
				this.root.container.replace(this.number, this.number - 1);
			}
		});

		delete this._set;
	}

	render() {
		this.moveUp.blocked = this.number === 1 ? true : false;
		this.moveDown.blocked = this.root.container.body.subscribers.length === this.number?true:false;
	}

	get number() {
		return Number(this.get("number").innerHTML);
	}

	set number(value) {
		this.get("number").innerHTML = value;
	}

	take(state) {
		if (typeof state !== "string") {
			return false;
		}

		switch (state) {
			case "factory":
			case "save": {
				this.checkbox.value = false;
				switch (state) {
					case "factory": {
						this.number = this.factoryNumber.value;
						this.outputs.forEach((output) => {
							output.notify(output.value);
						});
						break;
					}
					case "save": {
						this.factoryNumber.value = this.number;
						this.inputs.forEach((input) => {
							input.notify(input.value);
						});
						break;
					}
				}
			}
		}
	}
}

class Optimize extends StaticComponent {
	constructor({ self, mode }) {
		super({
			self: self,
			mode: mode,
		});
		this.state.ready = false
		this.addChild(Button, "optimizeButton").click(() => {
			if (this.collect().length>=2){
				this.optimizeButton.getAll().forEach((element)=>{
					element.classList.toggle("d-none")
				})
				this.optimizeButton.blocked = true;
				this.optimize(this.collect()).then((result) => {
					this.display(result);
					this.optimizeButton.getAll().forEach((element)=>{
						element.classList.toggle("d-none")
					})
					this.optimizeButton.blocked = false;
					this.state.ready = true
					this.INTERFACE.lead.state.ready = true
					this.INTERFACE.check()
				});
			} else {
				this.alert = "Для того что бы оптимизировать портфолио в нём должно быть минимум 2 инструмента..."
			}
		});
		this.addChild(StaticTable, "table");
	}
	async optimize(tickers) {
		let request_w = ""
		let request_t = "" 
		let data = this.INTERFACE.lead.data
		for (let ticker in data){
			request_w += Math.round(data[ticker]["weight"]*10)/10 + ","
			request_t += data[ticker]["ticker"]	 + ","
		}
		let result = await fetch(TO_FETCH+`/analyze?t=${request_t.slice(0,-1)}&w=${request_w.slice(0,-1)}&edge=${this.edge}`)

		return await result.json();
	}

	get edge() {
		return Math.round(this.get("edge").value*100)/100
	}
	set currentVolatility(value) {
		this.get("currentVolatility").innerHTML = value;
	}
	set currentReturn(value) {
		this.get("currentReturn").innerHTML = value;
	}

	set optimizedVolatility(value) {
		this.get("optimizedVolatility").innerHTML = value;
	}
	set optimizedReturn(value) {
		this.get("optimizedReturn").innerHTML = value;
	}

	// call warning
	set alert(message) {
		this.get("alert").classList.remove("d-none");
		setTimeout(() => {
			this.get("alert").classList.add("d-none");
		}, 5000);
		this.get("alertMessage").innerHTML = message;
	}

	display(result) {
		this.preset = result
		this.preset.edge = Number(this.edge)
		this.get("last").innerHTML = new Date().toLocaleDateString()
		this.get("from").innerHTML = new Date(1092873600* 1e3).toLocaleDateString()
		this.table.clear()
		for (let weight in result.optimized.weights){
			this.table.add(
				new DynamicTableRow({
					template: tempOptimize.data({
						ticker: weight,
						weight: Number(result.optimized.weights[weight]),
					}),
				})
			)
		}
		this.currentVolatility = Math.round(result.current.volatility*100);
		this.currentReturn = Math.round(result.current.return*100);
		this.optimizedVolatility = Math.round(result.optimized.volatility*100);
		this.optimizedReturn = Math.round(result.optimized.return*100);
		this.mode = "default";
		this.INTERFACE.componentsReady = true
	}

	take(message) {
		switch (message) {
			case "optimize": {
				this.optimize().then((result) => {
					display(result);
				});
				break;
			}
		}
	}
}

export { Interface, Assets, StaticTableAssets, Asset, Optimize, Button };
