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

class Portfolios extends StaticComponent{
	
	constructor({
		self,
		mode,
		root,
		csv
	}){
		super({
			self:self,
			mode:mode,
			root:root
		})


		this.csv = csv
		this.portfolios = []
		this.to_delete = []

		this.addButton = new Button({
			self:this.get("addButton"),
			root:this
		})
		this.editButton = new Button({
			self:this.get("editButton"),
			root:this
		}).click(
			()=>{
				this.table.body.factory = [
					...this.table.body.subscribers
				]
				this.mode = "edit"
			}
		)
		this.saveButton = new Button({
			self:document.querySelector("#saveChanges"),
			root:this
		})
		this.saveButton.click(
			(e)=>{
				let confirm = document.querySelector("#saveChangesInput")
				// if (true){
				if (confirm.placeholder === confirm.value){
					let before = JSON.stringify(this.data)
					this.table.body.notify("save")
					this.render()
					let after = JSON.stringify(this.data)
					this.mode = "default"
					if (after!==before){
						before = JSON.parse(before).map((value,index)=>{
							value["name"]=JSON.parse(after)[index]["name"]
							return value
						})
						fetch(`?update=${JSON.stringify(before)}&to_delete=${JSON.stringify(this.to_delete)}`)
					} else if (this.to_delete[0]){
						fetch(`?to_delete=${JSON.stringify(this.to_delete)}`)
					}
					confirm.value=""
					this.to_delete = []
				}
			}
		)
		this.addChild(Button,"factoryButton").click(
			()=>{
				this.table.body.notify("factory")
				this.table.body.subscribers = this.table.body.factory
				this.table.body.factory = [
					...this.table.body.subscribers
				]
				this.render()
				this.mode = "default"
			}
		)

		this.addChild(Button,"addButton")
		this.addChild(StaticTable,"table")
		this.addButton.subscribe(this.table)
		this.addButton.take = (message)=>{
			if (Number(message)<10){
				this.addButton.blocked = false
			} else {
				this.addButton.blocked = true
			}
		}

		this.addChild(Output,"used")
		this.used.subscribe(this.table)
		this.used.take = (message)=>{
			this.used.value = message
		}

		this.ioByState(this.state.mode)

		this.getAll("portfolio").forEach((portfolio)=>{
			this.table.add(
				new Portfolio({
					self:portfolio,
					root:this
				})
			)
		})
	

		this.addChild(Edge,"nothing")
		this.nothing.subscribe(this.table)
		this.nothing.take = (message)=>{
			let op = null 
			if (message){
				op = "add"
			} else {
				op = "remove"
			}
			this.nothing.self.classList[op]("d-none")
		}
		this.addChild(Edge,"exist")
		this.exist.subscribe(this.table)
		this.exist.take = message =>{
			let op = null 
			if (message){
				op = "remove"
			}
			else {
				op = "add"
			}
			this.exist.self.classList[op]("d-none")
		}
		this.table.render()
		this.used.value = this.table.body.subscribers.length
		this.editButton.self.classList[this.table.body.subscribers.length?"remove":"add"]("d-none")

	}

	get data(){
		let data = []
		this.table.body.subscribers.forEach((portfolio)=>{
			data.push({
				dbnumber: portfolio.numberFactory.value,
				number: portfolio.number.value,
				name: portfolio.IOs.outName.value

			})
		})
		return data
	}
	replace(a,b){
		this.table.body.subscribers[a-1].number.value = b
		this.table.body.subscribers[b-1].number.value = a
		this.render()
	}
	render(){
		this.table.body.subscribers.sort((a,b)=>Number(a.number.value)-Number(b.number.value))
		let counter = 0
		this.table.body.subscribers.forEach((subscriber)=>{
			counter+=1
			subscriber.number.value = counter
		})
		this.table.clear()
		this.table.render()
	}
}

class Portfolio extends DynamicTableRow{
	constructor({
		self,
		name = "portfolio",
		root,
	}){
		super({
			self:self,
			root:root ,
			name: name
		})
		this.addChild(Button,"deleteButton").click(()=>{
			this.root.table.body.subscribers = this.root.table.body.subscribers.filter((a)=>a.number.value!==this.number.value)
			this.root.to_delete.push(Number(this.numberFactory.value))
			// this.remove()
			this.root.render()
		})
		this.addChild(Button,"moveUp").click(()=>{
			if (Number(this.number.value)!==1){
				this.root.replace(Number(this.number.value),Number(this.number.value)-1)
			}
		})
		this.addChild(Button,"moveDown").click(()=>{
			if (Number(this.number.value)!==this.root.table.body.subscribers.length){
				this.root.replace(Number(this.number.value),Number(this.number.value)+1)
			}
		})

		this.addChild(Output,"number")
		this.addChild(Output,"numberFactory")

	}
	render(){
		this.moveDown.blocked =  this.number.value>=this.root.table.body.subscribers.length
		this.moveUp.blocked = this.number.value<=1
	}
	take(message){
		switch(message){
			case "save":{
				this.IOs.outName.value = this.IOs.inName.value
			}
			case "factory":{
				this.IOs.inName.value = this.IOs.outName.value
			}
		}
	}
}

window.addEventListener("load",run, false);

let $portfolios,
	$csvButton

function run(){

	$portfolios = new Portfolios({
		self:document.querySelector('[data-el="portfolios"]'),
		csv: new Button({
			self:document.querySelector('[data-el="portfoliosCsv"]')
		})
	})

}