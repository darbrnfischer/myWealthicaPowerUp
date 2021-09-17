var addon, addonOptions;
var symChain, symClosedChain, symOpenChain, symIncompleteChain;
var gainsChart;


$(function () {
    addon = new Addon();
    symChain = new SymChain("All");
    symClosedChain = new SymChain("Closed");
    symOpenChain = new SymChain("Open");
    symIncompleteChain = new SymChain("Incomplete");
    gainsChart = new GainsChart([],[]);
    currentSymChain = symChain;
    var gainsTableId;
    var filterState = txStates.NONE;

    
    addon.on('init', function (options) {
        // Dashboard is ready and is signaling to the add-on that it should
        // render using the passed in options (filters, language, etc.)
        addonOptions = options;
        $('button').removeAttr('disabled');
        showAddonData(addonOptions.data, true);
	gainsTableId = document.getElementById("gainsTable");
	gainsTableId.style.display = "none";
	var y = document.getElementById("showHideTransactions");
	y.innerText = "Show Transactions";
	
	console.log("addon init: v23-1");
	getTransactions ();
	
    }).on('update', function (options) {
        // Filters have been updated and Dashboard is passing in updated options
        addonOptions = _.extend(addonOptions, options);
        showAddonData(addonOptions.data);
	gainsTableId = document.getElementById("gainsTable");
	gainsTableId.style.display = "none";
	var y = document.getElementById("showHideTransactions");
	y.innerText = "Show Transactions";
	
	console.log("addon update: : v23-1");
	getTransactions ();
    });
    
      // Show addon data in result box and optionally update the text input.
      function showAddonData(data, updateInput) {
//        $('#result').html('Addon data:<br><code>' + JSON.stringify(data) + '</code>');
//        if (updateInput && data) {
//          $('#data').val(JSON.stringify(data));
//        }
      }

      // Compose a query object from the addon options to pass to the API calls.
      function getQueryFromOptions (options) {
        return {
          from: options.dateRangeFilter && options.dateRangeFilter[0],
          to: options.dateRangeFilter && options.dateRangeFilter[1],
          groups: options.groupsFilter,
          institutions: options.institutionsFilter,
          investments: options.investmentsFilter === 'all' ? null: options.investmentsFilter,
        }
      }

    $('#showHideTransactions').on('click', function () {
	var y = document.getElementById("showHideTransactions");
	console.log("showHideTransactions.on gains table", gainsTable.txArray.length);
	if (gainsTable.txArray.length == 0) {
	    gainsTableId.style.display = "none";
	    y.innerText = "Show Transactions";
	}
	else if (gainsTableId.style.display === "none") {
	    gainsTableId.style.display = "block";
	    y.innerText = "Hide Transactions";
	}
	else {
	    gainsTableId.style.display = "none";
	    y.innerText = "Show Transactions";
	}
    })

//    $('#getTransactions').on('click', function () {
//        $(this).attr('disabled', 'disabled');
//	  getTransactions ();
//      });

    var modal = document.getElementById("myModal");

    // Get the button that opens the modal
    // var statisticsButton = document.getElementById("statistics-button");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    $('#statistics-button').on('click', function () {
	var modalID = document.getElementById("modal-text");
	var ttx = document.getElementById("totaltx");
	var twtx = document.getElementById("totalwtx");
	var tltx = document.getElementById("totalltx");
	var ttxsum = document.getElementById("totaltxsum");
	var twtxsum = document.getElementById("totalwtxsum");
	var tltxsum = document.getElementById("totalltxsum");
	ttx.innerText=currentSymChain.chain.length;
	twtx.innerText=currentSymChain.nwin;
	tltx.innerText=currentSymChain.nlos;
	ttxsum.innerText=currentSymChain.sum.toFixed(2);
	twtxsum.innerText=currentSymChain.wsum.toFixed(2);
	tltxsum.innerText=currentSymChain.lsum.toFixed(2);
	modalID.innerText="Trade Statistics";
	console.log("statistics: T,W,L   nT, nW, nL", currentSymChain.sum, currentSymChain.win, currentSymChain.los, currentSymChain.n, currentSymChain.nwin, currentSymChain.nlos);
	 modal.style.display = "block";
     })

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
	modal.style.display = "none";
    }
    
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
	if (event.target == modal) {
	    modal.style.display = "none";
	}
    }
    
    
    $('#totals').on('click', function () {
	console.log("totals clicked", filterState);
	showTotals(filterState);
     })

    function showTotals (f) {
	var popup = document.getElementById("total-popup");
	popup.innerText="Total is: " + currentSymChain.sum;
	//popup.innerText="Total is: 100";
	popup.classList.toggle("show");
    }

    
    $('#all').on('click', function () {
	console.log("all clicked", symChain.sum);
	drawGains(symChain);
	filterState = txStates.ALL;
	currentSymChain = symChain;
     })
    
     $('#closed').on('click', function () {
	 console.log("Closed clicked", symClosedChain.sum);
	 drawGains(symClosedChain);
	 filterState = txStates.CLOSED;
	 currentSymChain = symClosedChain;
     })
    
     $('#open').on('click', function () {
	 console.log("Open clicked", symOpenChain.sum);
	 drawGains(symOpenChain);
	 filterState = txStates.OPEN;
	 currentSymChain = symOpenChain;
     })
    
     $('#incomplete').on('click', function () {
	 console.log("Incomplete clicked", symIncompleteChain.sum);
	 drawGains(symIncompleteChain);
	 filterState = txStates.INCOMPLETE;
	 currentSymChain = symIncompleteChain;
     })

    function drawGains (s) {
	//console.log("drawGains");
	 if (typeof(gainsChart) != "undefined") {
	     gainsChart.destroy();
	 }

	gainsChart = new GainsChart(s.symbols, s.gains);
	gainsChart.create();
	gainsTable = new GainsHTMLTable(s.chain);	
	gainsTable.fill();
    }
    
      // Compose a query object from the addon options to pass to the API calls.
    function getTransactions () {
	//console.log("getTransactions");
        addon.api.getTransactions(getQueryFromOptions(addonOptions)).then(function (response) {
	    processRsp(response);
	    drawGains(symChain);
	    $('#all').click();

	    filterSymChains();
									  
        }).catch(function (err) {
          $('#result').html('Error:<br><code>' + err + '</code>');
        }).finally(function () {
          $('#getTransactions').removeAttr('disabled');
        });
    }

    function filterSymChains () {
	//console.log("filterSymChainss");
	symChain.filterSymChains();
    }

    function processRsp(response) {
	//console.log("build chain from response len=",response.length);
	symChain = new SymChain("All");
	for (let i=0; i < response.length; ++i) {
	    //console.log("Processing Rsp: ",i);
	    if (response[i].deleted != true)
	    {
		let symbol = response[i].security.symbol;
		let desc = response[i].description;
		let txElm = {
		    type : response[i].type,
		    date : response[i].date,
		    price : 0,
		    amount : response[i].currency_amount,
		    quantity : response[i].quantity,
		}
		symChain.buildLink(symbol, desc, txElm);
	    }
	    
	}
	symChain.calcGains();
	
    } // process response
    
});  // End of function()

const BarColor = {
    PINK:"rgba(235,127,235,1.0)" ,
    PURPLE:"rgba(179,127,235,1.0)"
};
const txStates = {
    ALL: "All",
    NONE: "None",
    OPEN: "Open",
    CLOSED: "Closed",
    INCOMPLETE: "Incomplete"
};

class SymChainLink {
    constructor(symbol, desc, txElm) {
	this.symbol = symbol;
	this.desc = desc.substr(0, 50);
        this.name = "";
	this.state = txStates.NONE;
	this.ntx = 0;
	this.tx = [];
	this.gain = 0;
	this.ramount = 0;
	this.rquantity = 0;
	this.setHeadData(txElm);
    };
    setHeadData(txElm) {
	this.tx.push(txElm);
	this.ramount = txElm.amount;
	this.rquantity = txElm.quantity;
	this.ntx = 1;
	if (txElm.type == "buy") {this.state = txStates.OPEN;}
	else if (txElm.type == "sell") {this.state = txStates.INCOMPLETE; }
    }
    updateHeadData(txElm) {
	this.tx.push(txElm);
	this.ramount += txElm.amount;
	this.rquantity += txElm.quantity;
	this.ntx++;
	if (txElm.type == "buy") {this.state = txStates.OPEN;}
	else if (txElm.type == "sell") {
	    if (this.rquantity == 0) { this.state = txStates.CLOSED; }
	    else {this.state = txStates.INCOMPLETE; }
	}
    }


} // Class SymChainLink

class SymChain {
    constructor(name) {
	this.name = name;
	this.chain = [];
	this.symbols = [];
	this.gains = [];
	this.sum = 0;
	this.wsum = 0;
	this.lsum = 0;
	this.nwin = 0;
	this.nlos = 0;
    }
    destroy() {
	//console.log("destroying", this.chain.length);
	if (this.chain.length > 0) {
	    this.chain = [];
	    this.symbols = [];
	    this.gains = [];
	    this.sum = 0;
	}
    } 

    buildLink(symbol, desc, txElm) {
	//console.log("buildLink");
	let link = this.findLink(symbol);
	if (typeof(link) == "undefined") {
	    this.addNewLink(symbol, desc, txElm);
	}
	else
	    this.updateLink(link, txElm);
    }

    findLink(symbol) {
	//console.log("findLink");
	return this.chain.find(function (value, index, array) {return value.symbol == symbol});
    }

    
    addNewLink(symbol, desc, txElm ) {
	//console.log("addNewLink");
	let link = new SymChainLink(symbol, desc, txElm);
	this.chain.push(link);
	//console.log("Adding new element to this.chain", this.chain[this.chain.length-1].symbol);
    }
    updateLink(link, txElm) {
	//console.log("updateLink");
	link.updateHeadData(txElm)
    }

    calcGains() {
	console.log("calcGains:", this.name, this.chain.length)
	
	this.chain.sort(function (a,b) {
	    let x = a.symbol.toLowerCase();
	    let y = b.symbol.toLowerCase();
	    if (x < y) {return -1;}
	    if (x > y) {return 1;}
	    return 0;
	})

	if (this.chain.length > 0) {
	    for (let i=0; i < this.chain.length; ++i) {
		this.symbols.push(this.chain[i].symbol)
		this.gains.push(this.chain[i].ramount)
	    }
	    
	    this.sum = this.gains.reduce(function(t,v) {return t + v;})
	    let winners = this.gains.filter(function(v,i,a) {return v > 0;})
	    let losers = this.gains.filter(function(v,i,a) {return v <= 0;})

	    this.nwin = winners.length; this.nlos = losers.length;
	    if (this.nwin > 0)
		this.wsum = winners.reduce(function(t,v) {return t + v;})
	    if (this.nlos > 0)
		this.lsum = losers.reduce(function(t,v) {return t + v;})

	}
	else {
	    console.log("Empty chain");
	}
    }

    // Walk thru symbol chain and buildup the closed, open, and incomplete chains
    filterSymChains() {
	symClosedChain = new SymChain("Closed");
	symOpenChain = new SymChain("Open");
	symIncompleteChain = new SymChain("Incomplete");
	for (let i=0; i<this.chain.length; ++i) {
	    let link = this.chain[i];
	    // console.log("xxx link", link.symbol);
	    let tx = link.tx.slice();

	    while (tx.length > 0) { // While there are still transactions in tx array
		let newLink = this.filterTx(link, tx);
		// console.log("xxx filtered link ", newLink.symbol, newLink.ramount, newLink.rquantity);

		let state = newLink.state;
		if (state == txStates.CLOSED) {  
		    symClosedChain.chain.push(newLink);
		    // console.log("xxx pushing closed link", newLink.symbol);
		}
		if (state == txStates.OPEN) {  
		    symOpenChain.chain.push(newLink);
		    // console.log("xxx pushing open link", newLink.symbol);
		}
		if (state == txStates.INCOMPLETE) {
		    symIncompleteChain.chain.push(newLink);
		    // console.log("xxx pushing incomplete link", newLink.symbol);
		}
		tx.splice(0,newLink.ntx);   // Removed processed transactions
	    }  //While
	} // for
	symClosedChain.calcGains();
	symOpenChain.calcGains();
	symIncompleteChain.calcGains();
    }

    filterTx(link, tx) {
	//console.log("filterTx symbol", link.symbol);

	let newLink = new SymChainLink(link.symbol, link.desc, tx[0]);
	if (tx[0].type == "sell") { // clear out all the sells
	    // console.log("it is a sell");
	    for (let i=1; i<tx.length; ++i) {
		if (tx[i].type == "sell") { // Go thru all the initial sells
		    newLink.updateHeadData(tx[i]);
		}
		else {
		    break; // leave this loop
		}
	    }	
	}
	else { // we are starting with a buy
	    // console.log("it is a buy")
	    for (let i=1; i<tx.length; ++i) {
		newLink.updateHeadData(tx[i]);
		if (newLink.state == txStates.CLOSED) {
		    break; // leave this loop
		} // if
	    } // for
	} // else
	return newLink;
    } // filterTx

    
} // Class SymChain


// GainsTable
class GainsHTMLTable {
    constructor(txArray) {
	//console.log("GainsTable constructor length", txArray.length);
	this.txArray = txArray;
	this.table = document.getElementById("gainsTable");
	this.clear();
    }
    clear() {
	let nRows = this.table.rows.length;
	while (nRows > 3) {
	    this.table.deleteRow(-1);
	    --nRows;
	}
    }
    fill() {
	console.log ("fill()", this.txArray.length);
	for (let i=0; i < this.txArray.length; ++i) {
            let what = this.txArray[i];
	    this.addSymbol(what);
	    for (let j=0; j < what.ntx; ++j) {
		this.addTx(what, j);
	    }
	    this.addTotal(what);
	}
    }
    addSymbol(what) {
	//console.log("addSymbol", what.symbol);
	var row = this.table.insertRow(-1);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	var cell3 = row.insertCell(2);
	var cell4 = row.insertCell(3);
	var cell5 = row.insertCell(4);
	var cell6 = row.insertCell(5);
	var cell7 = row.insertCell(6);
	
	cell1.innerHTML = what.symbol;
	cell2.innerHTML = what.desc;
	cell3.innerHTML = what.ntx;
    }

    addTotal(what) {
	var row = this.table.insertRow(-1);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	var cell3 = row.insertCell(2);

	var cell4 = row.insertCell(3);
	var cell5 = row.insertCell(4);
	var cell6 = row.insertCell(5);
	var cell7 = row.insertCell(6);

	cell1.innerHTML = ""
	cell2.innerHTML = ("-----Totals");
	cell2.style.textAlign = "right";
	cell2.style.border = "1px solid black";
	//console.log("cell2 length is", cell2.width);
	cell3.innerHTML = ""
	cell4.innerHTML = ""
	cell5.innerHTML = ""
	cell6.innerHTML = "$" + what.ramount.toFixed(2);
	cell7.innerHTML = what.rquantity.toFixed(2);
    }
    
    addTx(what, i) {
	var row = this.table.insertRow(-1);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	var cell3 = row.insertCell(2);

	var cell4 = row.insertCell(3);
	var cell5 = row.insertCell(4);
	var cell6 = row.insertCell(5);
	var cell7 = row.insertCell(6);

	cell1.innerHTML = ""
	cell2.innerHTML = ""
	cell3.innerHTML = ""
	const d = new Date(what.tx[i].date);
	let mydate = d.toDateString();
	cell4.innerHTML = mydate.slice(3,mydate.legnth);
	//cell4.innerHTML = what.tx[i].date;
	cell5.innerHTML = what.tx[i].type;
	cell6.innerHTML = "$" + what.tx[i].amount.toFixed(2);
	cell7.innerHTML = what.tx[i].quantity;
    }
	
} // GainsTable

// GainsChart
class GainsChart {
    constructor(symbols, gains) {
	// console.log("GainsChart constructor", symbols, gains);
	this.xValues = symbols;
	this.yValues = gains.map(function(value,i,a) {return value.toFixed(2)});
	this.barColors = gains.map(function(value, i, a) {
	return (value > 0) ? BarColor.PURPLE:BarColor.PINK;
	});
    }
    destroy() {
	if (this.chart!=null) {
	    this.chart.destroy();
	}
    }
    recreate() {
	this.destroy();
	this.create();
    }
    create() {
	this.chart = new Chart("myChart", {
	    type: "bar",
	    data: {
		labels: this.xValues,
		datasets: [{
		    backgroundColor: this.barColors,
		    data: this.yValues
		}]
	    },
	    options: {
		title:  {display: true, text: "Transaction Gains"},
		legend: {display: false},
		scales: {
		    yAxes: [{
			ticks: {
			    beginAtZero: true
			}
		    }],
		},
		tooltips: {
		    callbacks: {
			label: function(tooltipItem) {
			    //console.log("Tooltip Item", tooltipItem);
			    return "$" + Number(tooltipItem.yLabel);
			}
		    }
		},
	    }
	});
    } // Create
} // GainsChart

