import {
	Interface,
	Assets,
	StaticTableAssets,
	Asset,
	Optimize,
	Button
} from './port.js'

// === [ Конфигурация ] === //

window.addEventListener("load",run, false);

function run()
{

	console.log("Running")

	let assets = new Assets({
		self:document.querySelector('[data-el="assets"]')
	})



	let optimize = new Optimize({
		self:document.querySelector('[data-el="optimize"]'),
		mode:"nothing"
	})


	const INTERFACE = new Interface({
		lead:assets,
		components:{
			optimize:optimize,
		},
		buttonUpdate:new Button({
			self:document.querySelector("[data-el='buttonUpdate']")
		})
	}) 


}