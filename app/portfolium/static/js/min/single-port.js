import{Interface,Assets,StaticTableAssets,Asset,Optimize,Button}from"./port.js";function run(){console.log("Running");let e=new Assets({self:document.querySelector('[data-el="assets"]')}),t=new Optimize({self:document.querySelector('[data-el="optimize"]'),mode:"default"});new Interface({lead:e,components:{optimize:t},buttonUpdate:new Button({self:document.querySelector("[data-el='buttonUpdate']")})})}window.addEventListener("load",run,!1);