// === [ Layer 1 ] === //


/*
Abstract component:
	- if stands as a root controls displaying of state-related elements in DOM
	- if itself is state-related hiding after changing state

*/

class AbstractComponent{
	
	constructor({
		mode = "default",
		root = this, 		// [Component]
		subscribers = [],
		subscribes = []
	}){
	
		if (this.constructor === AbstractComponent){
			throw "Attempt to create instance of abstract class"
		}
		
		this.subscribers = subscribers
		this.subscribes = subscribes

		this.state = {
			mode:mode
		}

		this.root = root
	}

	// binding instance of this class to HTML-element
	_bind(self){
		try{
			this.self = self
			this.state.name = this.self.dataset.el.split(".").splice(-1)[0]
			delete this._bind
		} catch {
			throw `BindError: 
				component self not given to 
				initialization of ${this.constructor.name} 
				for ${this.root.constructor.name}
			`
		}
	}

	// method for taking messages
	take(message){}

	// observer pattern implementation
	notify(message){
		this
		.subscribers
 		.forEach(
			(subscriber)=>{
				subscriber.take(message)
			}
		)
	}
	subscribe(object){
		this.subscribes.push(object)
		object.subscribers.push(this)
	}
}


// === [ Layer 2 ] === //


class Component extends AbstractComponent{

	// get state-related elements (default:all)
	getByState(state){
		
		if (state) {
			return this.findAll(`[data-state="${state}"]`)
		} else {
			return this.findAll(`[data-state]`)
		}
	}

	// (root) display state-related elements related to given state 
	ioByState(state){
		if (this.isRoot){
			
			this.getByState().forEach((el)=>{
				el.classList.add("d-none")
			})
			
			this.getByState(state).forEach((el)=>{
				el.classList.remove("d-none")
			})
		}
	}

	get isRoot(){

		if(this.root == this){
			return true
		}
	}

	set mode(modeName){

		this.ioByState(modeName)
		this.take(modeName) 
		this.state.mode = modeName
		this.notify(modeName)
		return this.state.mode
	}

	set blocked(value){
		if (value){
			this.state.blocked = true
			this.self.classList.add("blocked")
		} else {
			this.state.blocked = false
			this.self.classList.remove("blocked")
		}
	}

	addChild(constructor,name){
		this[name] = new constructor({
			self:this.get(name),
			root:this.root
		})
		return this[name]
	}

	// get children elements of this component
	getAll(name){
		return this.findAll(`[data-el${name?'~':'*'}="${this.state.name}.${name?name:''}"]`)
	}
	get(name){
		return this.getAll(name)[0]
	}

	// simlified search function for query-based search
	findAll(query){
		return this.self.querySelectorAll(query)
	}
	find(query){
		return this.findAll(query)[0]
	}
}

class Edge extends AbstractComponent{

	constructor({
		self,
		mode,
		root,
		subscribers
	}){
		super({
			mode,
			root,
			subscribers
		})
		this._bind(self)
	}

}


// === [ Layer 3 ] === //


/*
Dynamic elements is a always-standing parts of interface.
*/

class StaticComponent extends Component{

	constructor({
		self,
		mode,
		root,
		subscribers
	}){
		super({
			mode,
			root,
			subscribers
		})

		this._bind(self)

		// hiding/show all mode-binded components
		this.ioByState(this.state.mode)
	}
}


/*
Dynamic elements is a moving parts of interface.

Is possible to define a dynamic element from existing
DOM-element or create last from given template and
optional parametrs
*/

class DynamicComponent extends Component{
	
	constructor({
		mode,	
		root,
		subscribers,

		self,
		
		name,			// [string]			will used during calling method "getAll" for searching components
		tag,			// [String] 		tag name for component wrapper
		template,		// [String(HTML)] 	inner-template of component 
		classes = []	// [Array(String)] 	classes for component wrapper
	}){
		super({
			root,
			mode,
			subscribers
		})

		if (!self){
			this.create({
				name:name,
				tag:tag,
				classes:classes,
				template:template
			})
		} else {
			this._bind(self)
		}
	}

	create({
		name,
		tag = "div",
		classes,
		template
	}){
		
		let element = document.createElement(tag)
		element.innerHTML = `${template}`
		
		if (!this.isRoot) {
			element.dataset.el = `${this.root.state.name}.${name}`
		} else {
			element.dataset.el = `${name}`
		}
		
		classes.forEach(
			(_class)=>{
				element.classList.add(_class)
			}
		)

		this.self = element	
		this.state.name = name
	}

	remove(){
		this.self.remove()
	}
}


// === [ Layer 4 ] === //


class StaticTable extends StaticComponent{

	constructor({
		self,
		mode,
		root,
		subscribers
	}){
		super({
			self,
			mode,
			root,
			subscribers
		})
		this.addChild(Edge,"body")
		this.body.factory = []
		this.heads = this.findAll("thead,tfoot")
	}

	add(
		item // [Component]
	){
		this.body.self.appendChild(item.self)
		this.body.subscribers.push(item)
		this.root.ioByState(this.root.state.mode)
	}
	
	render(){
		this.heads.forEach((head)=>{
			if(head.dataset.state===this.root.state.mode){
				head.classList[
					this.body.subscribers.length?"remove":"add"
				]("d-none")
			}
		})
		this.body.self.innerHTML = ""
		this.notify(this.body.subscribers.length)
		this.body.subscribers.forEach((subscriber) => {
			subscriber.render();
			this.body.self.appendChild(subscriber.self);
		})
	}

	clear(){
		this.body.self.innerText = ""
	}
}

class DynamicTableRow extends DynamicComponent{
	
	constructor({
		name,
		subscribers,
		template,
		root,
		tag="tr",
		self,
		classes
	}){
		super({
			self,
			name,
			subscribers,
			template,
			root,
			tag,
			classes
		})


		this._defineIOs()
	}

	// define inputs & outputs
	_defineIOs(){
		this.IOs = {}
		
		this.findAll(`[data-el*="${name}."]`).forEach((el)=>{
			let name = el.dataset.el.split(".")[1]
			if (name.match(/(^(in|out)[A-Z].*|^checkbox$)/))
			{
				let attr
				if (name.match(/checkbox/)){
					attr = "checked"
				} else if (name.match(/^out.*/)) {
					attr = "innerHTML"
				} else if (name.match(/^in.*/)){
					attr = "value"
				}

				this.IOs[name] = {
					set value(value){
						el[attr] = value
					},
					get value(){
						return el[attr]
					}
				}				
			}
		})
	}
}


class SearchBar extends StaticComponent{

	constructor({
		self,
		name,
		root,
		subscribers,
		api
	}){
		
		super({
			self,
			name,
			root,
			subscribers
		})

		this.state.api = api
		this.take = (message)=>{
			console.log(message)
		}

		// input

		this.addChild(Input,"input").take = (message)=>{
			if (message[0]!==this.input.value){
				this.input.self.setAttribute('list',this.find("datalist").id)
			} else {
				this.input.self.removeAttribute('list')
			}
		}
		this.input.self.addEventListener("input",(e)=>{
			this.input.notify(e.target.value.toUpperCase())
		})
		this.input.self.addEventListener("keydown",(e)=>{
			if (e.key==="Enter"){
				e.preventDefault()
				this.select()
			}
		})

		// select button

		this.addChild(Button,"selectButton").take = (message)=>{
			let op
			if (message[0]?.[0]?.toLowerCase()===this.input.value){
				op = "remove"
			} else {
				op = "add"
			}
			this.selectButton.self.classList[op]("d-none")
		}
		this.selectButton.click(()=>{
			this.select()
		})

		this.addChild(InputResults,"results").input = this.input
		this.results.take = (message)=>{
			this.results.fetchResults(`${this.state.api}/search?pattern=${message}`)
		}

		this.results.subscribers.push(this.input)
		this.results.subscribers.push(this.selectButton)
		this.input.subscribers.push(this.results)

	}

	async select(){
		if(this.results.lastResult===this.input.value){
			fetch(`${this.state.api}/tickers/${this.results.lastResult.toUpperCase()}`).then((response)=>{
				return response.json()
			}).then((data)=>{
				this.root.container.addAsset({
					ticker:data.ticker,
					name:data.name
				})
				this.input.clear()
				this.results.clear()
			})
		}
	}
}


class Input extends Edge{

	constructor({
		self,	// [HTMLElement]
		mode,	// [String]
		root, 	// [Component]
		subscribers,
		caseSensitive = false
	}){
		super({
			self,
			mode,
			root,
			subscribers
		})

		if (!this.self.constructor===HTMLInputElement){
			throw "BindError: Input edge not defined"
		}

		this.caseSensitive = caseSensitive
	}

	get value(){
		return this.caseSensitive?this.self.value:this.self.value.toLowerCase()
	}

	set value(value){
		this.self.value = this.caseSensitive?value:String(value).toLowerCase()
	}

	clear(){
		this.value = ""
	}

	take(message){
		this.value = message
	}
}

class Output extends Edge{
	constructor({
		self,	// [HTMLElement]
		mode,	// [String]
		root,	// [Component]
		subscribers
	}){
		super({
			self,
			mode,
			root,
			subscribers
		})
	}

	set value(value){
		this.self.innerHTML = value
	}
	get value(){
		return this.self.innerHTML
	}

	clear(){
		this.self.innerHTML = ""
	}

	take(message){
		this.value = message
	}
}

class InputResults extends Edge{

	get lastResult(){
		return this.self.options[0]?.value?.toLowerCase()
	}

	async request(adress){
		let response = await fetch(adress)
		return await response.json()
	}

	async fetchResults(adress,filterFunc){
		this.clear()
		this.request(adress).then((response)=>{
			this.set(
				response
			)
		})
	}

	add(value,subValue){
		this.self.insertAdjacentHTML("beforeend",`<option value="${value}">${subValue?subValue:""}</option>`)
	}

	set(resultList){
		resultList = Object.entries(resultList)
		.filter((result)=>{
			return !this.root.container.exist(result[0])
			&& (result[0].toLowerCase().startsWith(this.input.value))
		})
		this.resultList = Object.entries(resultList)
		resultList.forEach((result)=>{
			this.add(result[0],result[1])
		})
		this.notify(resultList)
	}

	clear(){
		this.self.innerHTML = ""
	}

}

class Button extends StaticComponent{

	constructor({
		self,
		mode,
		root,
		subscribers
	}){
		super({
			self,
			mode,
			root,
			subscribers
		})
		
		this.state.blocked = false
	}

	get blocked(){
		return this.state.blocked
	}
	set blocked(bool){
		
		this.state.blocked = bool  
		
		let operation
		if (bool) {
			operation = "add"
		} else {
			operation = "remove"
		}
		this.self.classList[operation]("blocked")
	}

	click(func){
		this.self.addEventListener("click",()=>{
			if(!this.blocked && !this.root.state.blocked){
				func()
			}
		})
		return this
	}
}

class Checkbox extends Edge{
	
	constructor({
		self,
		mode,
		root,
		subscribers
	}){
		super({
			self,
			mode,
			root,
			subscribers
		})
		this.self.addEventListener("click",()=>{
			this.notify(this.value)
		})
	}

	set value(value){
		this.self.checked = value
	}
	get value(){
		return this.self.checked
	}
	set disabled(value){
		this.self.disabled = value
	}

	take(signal){
		this.value = signal
	}
}

// === [ Layer 5 ] === //


class PseudoTable extends StaticTable{

}


// === [ Export ] === //

 
export {
	Edge,
	StaticComponent,
	DynamicComponent,
	StaticTable,
	DynamicTableRow,
	SearchBar,
	Input,
	Output,
	InputResults,
	Button,
	Checkbox
}