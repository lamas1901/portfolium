const tempAssets = {
	
	asset(
		{
			ticker,
			name,
			price,
			resource=0,
			number=0
		}
	) 
	{
		return `
			<td class="add-bar-item__cell">
                <span>
                    <span class="asset__name" data-el="asset.number">${number}</span>.
                </span>
                <span class="d-none">
                    <span class="asset__name" data-el="asset.factoryNumber">${number}</span>.
                </span>
                <span data-el="asset.name">${name}</span>
                <br>
                (<span class="asset__name" data-el="asset.ticker">${ticker}</span>)
            </td>

            <td>
                <div class="text-right" data-state="default">
                        <div class="mr-4"><span class="asset__weight" data-el="asset.outPrice"></span>$</div>
                </div> 
                <input class="add-input text-right form-control ml-2 mr-2 float-right d-none" type="number" min="0" data-el="asset.inPrice" data-state="edit">
            </td>

            <td class="pr-4 text-right" data-state="edit">
                <div class="float-right">
                    <div class="d-flex align-items-center">
                        <div data-state="edit" class="d-none">
                            <span class="d-flex">
                                <i class="fas fa-arrow-up cursor-pointer add-appear ml-2 blocked" data-el="asset.moveUp"></i>
                                <i class="fas fa-arrow-down cursor-pointer add-appear ml-2" data-el="asset.moveDown"></i>
                            </span>
                        </div>
                        <input class="add-checkbox align-middle d-none" type="checkbox" data-el="asset.checkbox" data-state="edit">
                    </div>
                </div>
            </td>
		`
	}
}

const tempAnalyze = {
	
	data({
		ticker,
		variance,
		volatility,
		exist,
		weight,
		price
	}){
		return `
		    <td>${ticker}</td>
		    <td>${variance}</td>
		    <td>${volatility}</td>
		    <td>${exist}</td>
		    <td>${weight}</td>
		    <td>${price}</td>
		`;
	},
};

const tempOptimize = {
	data({
		ticker,
		weight
	}){

		return `
			<td>${ticker}</td>
            <td>${weight}</td>
        `
	}
}