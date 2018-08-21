$(document).ready(function () {
    // create refresh variable which will be recursively assigned with the inner function updatePrices() and cleared when a new row is selected for more information
    // issue: as functions are nested within AJAX calls and click handlers without nomenclature, the refreshes on prices can only occur once an item is selected
    // restructuring of functions is needed in order to call updatePrices() as soon as the document loads

    var refresh;

    // test variable in order to control the amount of time between refreshes in seconds
    var refreshPeriod = 30;

    var loggedIn = sessionStorage.getItem("userProfile");

    var userRef;

    var userWalletRef;

    var portfolioRef;

    console.log("Logged in as: " + loggedIn);

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyAlIEi8_mjg-nMMp7wD1cFfqq22H8Oz75I",
        authDomain: "project-x-b0368.firebaseapp.com",
        databaseURL: "https://project-x-b0368.firebaseio.com",
        projectId: "project-x-b0368",
        storageBucket: "project-x-b0368.appspot.com",
        messagingSenderId: "377881918863"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    if (loggedIn != null) {
        $("#loginPage").html("Logged in as " + loggedIn);
        userRef = database.ref("/" + loggedIn);
        userWalletRef = database.ref("/" + loggedIn + "/balance");
        portfolioRef = database.ref("/" + loggedIn + "/portfolio");
    };


    var username = "";
    var email = "";
    var pwd = "";
    var cfmPwd = "";


    //register user
    $("#btnSubmit").on("click", function (event) {

        event.preventDefault();

        username = $("#usernameRegister").val().trim();
        email = $("#emailInput1").val().trim();
        pwd = $("#inputPwd1").val().trim();
        cfmPwd = $("#confirmPassword").val().trim();


        //push to firebase
        var userRef = database.ref("/" + username);
        console.log(userRef);
        database.ref("/" + username + "/email").set(email);
        database.ref("/" + username + "/balance").set(10000);
        if (pwd == cfmPwd) {
            database.ref("/" + username + "/password").set(pwd);
        } else {
            alert("Passwords do not match");
        };
        database.ref("/" + username + "/accountBday").set(firebase.database.ServerValue.TIMESTAMP);
        database.ref("/" + username + "/portfolio").set(false);
        database.ref("/" + username + "/earnings").set(0);
        database.ref("/" + username + "/portfolioValue").set(0);

        //clear fields
        clear();

    });

    //login user
    $("#logIn").on("click", function (event) {
        event.preventDefault();

        var username2 = $("#usernameInput").val().trim();
        var loginPwd = $("#passwordInput2").val().trim();

        database.ref("/" + username2).once("value").then(function (snapshot) {
            if (snapshot.val() == null) {
                alert("There is no username with that name")
            } else {
                if (loginPwd == snapshot.val().password) {
                    // successful login
                    sessionStorage.setItem("userProfile", username2);
                    window.location.replace("index.html");
                } else {
                    alert("Incorrect password");
                }
            };
        });

        clear();
    });



    //clear all user fields
    function clear() {
        $("#usernameInput").val("");
        $("#emailInput1").val("");
        $("#inputPwd1").val("");
        $("#confirmPassword").val("");
        $("#usernameInput").val("");
        $("#passwordInput2").val("");
    };


    $("#signOut").on("click", function (event) {
        // to be built in later stages
    });

    // parameters for AJAX queries
    var priceParams;
    var portfolioPriceParams;

    // get top 5 currencies for test build, will increase to higher amounts later
    var top20QueryURL = "https://min-api.cryptocompare.com/data/top/totalvol?limit=20&tsym=USD&extraParams=CryptoPlay"

    // two asynchronous calls are made, values are appended once both calls are complete
    // second call is dependent on symbol values returned by the first call
    var loggedIn = sessionStorage.getItem("userProfile");
    if (loggedIn != null) {
        if (document.URL.includes("portfolio.html")) {
            database.ref("/" + loggedIn).once("value").then(function (userSnap) {
                console.log(Object.keys(userSnap.val().portfolio));
                portfolioPriceParams = Object.keys(userSnap.val().portfolio).join();
                var portfolioQuery = "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=" + portfolioPriceParams + "&tsyms=USD"
                $.ajax({
                    url: portfolioQuery,
                    method: "GET"
                }).then(function (portfolioResponse) {
                    console.log(portfolioResponse)
                    database.ref().on("child_added", function (userSnap) {
                        console.log(userSnap.val().portfolio);
                        var portfolioKeyArray = Object.keys(userSnap.val().portfolio)
    
                        for (var m = 0; m <= portfolioKeyArray.length - 1; m++) {
                            var purchasedObj = portfolioKeyArray[m];
                            var amountOwned = userSnap.val().portfolio[purchasedObj].amountOwned;
                            var paidPerCoin = userSnap.val().portfolio[purchasedObj].avgPaidPerCoin.toFixed(2);
    
                            var trow = $("<tr>");
                            var coinName = $("<td>");
                            var coinAmount = $("<td>");
                            var paidForCoin = $("<td>");
                            var currentPortfolioPrice = $("<td>");
                            coinName.append(purchasedObj);
                            coinAmount.append(amountOwned);
                            paidForCoin.append(paidPerCoin);
                            currentPortfolioPrice.append(portfolioResponse.DISPLAY[Object.keys(portfolioResponse.DISPLAY)[m]].USD.PRICE);
                            trow.append(coinName).append(coinAmount).append(paidForCoin).append(currentPortfolioPrice);
                            $("#portfolio").append(trow);
                        };
                    });
                })
                $("#userBalance").html("Available Funds: " + "&#8353;" + userSnap.val().balance.toFixed(2));
                //updating wallet with coins
            });

        }
    } else {
        $("#userBalance").append("<a href='signup.html'>Login/Register</a>");
        loggedIn = undefined;
    };


    if (document.URL.includes("index.html")) {
        $.ajax({
            // get top 20 coins
            url: top20QueryURL,
            method: "GET"
        }).then(function (topCoinsResponse) {

            // create parameters for the second AJAX call based on the values returned by the first
            priceParams = Object.keys(topCoinsResponse.Data).map(n => topCoinsResponse.Data[n].CoinInfo.Internal).join();

            var priceQueryURL = "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=" + priceParams + "&tsyms=USD";

            // second AJAX call
            $.ajax({
                url: priceQueryURL,
                method: "GET"
            }).then(function (pricesResponse) {
                var pricesObj = pricesResponse.DISPLAY;

                for (var i = 0; i <= Object.keys(pricesObj).length - 1; i++) {

                    var coinObjTopCoins = topCoinsResponse.Data[i];
                    var coinObjPrices = pricesObj[Object.keys(pricesObj)[i]];
                    var coinName = coinObjTopCoins.CoinInfo.Name;
                    var row = $("<tr>").addClass("coinRow clickable").attr("id", coinName).attr("chart-loaded", "false").attr("index", i).attr("currentPrice", pricesResponse.RAW[Object.keys(pricesResponse.RAW)[i]].USD.PRICE);

                    // adding accordion functionality
                    row.attr("data-toggle", "collapse").attr("data-target", "#" + coinName + "-info").attr("aria-expanded", "false").attr("aria-controls", coinName + "-info").attr("role", "button");

                    var icon = "http://www.cryptocompare.com" + coinObjTopCoins.CoinInfo.ImageUrl;

                    // Int elements under '#' column
                    var colNum = $("<td>").addClass("num").attr("index", i).text(i + 1);

                    // Coin symbol under 'Symbol' column
                    var colCoinSymbol = $("<td>").addClass("coinSymbol").attr("index", i).html("<img src='" + icon + "' width=\"35\">");

                    // Coin names under 'Name' column
                    var colCoinName = $("<td>").addClass("coinName").attr("index", i).text(coinObjTopCoins.CoinInfo.FullName);

                    // Market Cap under 'Market Cap' column
                    var colMarketCap = $("<td>").addClass("marketCap").attr("index", i).text(coinObjPrices.USD.MKTCAP);

                    // Price value under 'Price' column
                    var colPrice = $("<td>").addClass("price").attr("index", i).attr("emboldened", "false").text(coinObjPrices.USD.PRICE);

                    // Supply amount under 'Available Supply' column
                    var colSupply = $("<td>").addClass("availableSupply").attr("index", i).text(Math.round(coinObjTopCoins.ConversionInfo.Supply));

                    // Raw value of 24 hour change, used to conditionally evaluate style of column
                    var pcnt24val = coinObjPrices.USD.CHANGEPCT24HOUR
                    // 24 hour change value under '%24hr' column
                    var col24hrChange = $("<td>").addClass("pcnt24hr").attr("index", i).text(pcnt24val + "%");

                    // This is the dummy 'more info' row
                    var moreInfoRow = $("<tr>").addClass("moreInfoRow collapse").attr("id", coinName + "-info").attr("aria-labelledby", coinName).attr("data-parent", "#topCoinsTable");
                    var moreInfoTd = $("<td>").attr("colspan", "7").addClass("moreInfoContainer");
                    var buyAndSell = $("<form>").attr("forindex", i).addClass("buyAndSell").css("float", "right");
                    var howMuch = $("<input>").addClass("howMuch").attr("type", "text").attr("placeholder", "Enter amount to Buy or Sell").attr("index", i);
                    var buyBtn = $("<button>").addClass("btn btn-success buySellBtn buy").text("Buy").attr("index", i);
                    var sellBtn = $("<button>").addClass("btn btn-danger buySellBtn sell").text("Sell").attr("index", i);
                    var totalDisplayP = $("<p>").addClass("totalDisplay lead").attr("index", i);


                    buyAndSell.append(howMuch);
                    buyAndSell.append(buyBtn);
                    buyAndSell.append(sellBtn);
                    buyAndSell.append(totalDisplayP);
                    moreInfoTd.append(buyAndSell);
                    moreInfoRow.append(moreInfoTd);

                    row.append(colNum).append(colCoinSymbol).append(colCoinName).append(colMarketCap).append(colPrice).append(colSupply).append(col24hrChange);
                    $("#topcoins").append(row);
                    $("#topcoins").append(moreInfoRow);

                    // Coloration of percent change
                    if (parseInt(pcnt24val) > 0) {
                        col24hrChange.css("color", "#00ce30");
                    } else if (!(pcnt24val == 0)) {
                        col24hrChange.css("color", "#e20000");
                    };
                    canvasWrapper = $("<div>").addClass("canvasWrapper");
                    canvasWrapper.append($("<canvas>").attr("width", "500").attr("height", "250").attr("id", coinName + "-chart"));
                    moreInfoTd.append(canvasWrapper);
                    // adding click handler to row
                    row.on("click", function () {
                        function selectRowCallback(selectedRow) {
                            // embolden text
                            emboldenText(selectedRow.find(".price"));
                            // if this row's chart was not already loaded...
                            if (!(JSON.parse(selectedRow.attr("chart-loaded")))) {
                                // let the program know that this row's chart is now loaded
                                $(this).attr("chart-loaded", "true");

                                // get the ID of this row
                                var thisCoin = selectedRow.attr("id");

                                // get context of corresponding canvas
                                var ctx = document.getElementById(thisCoin + "-chart").getContext("2d");

                                // create the query for the new AJAX call
                                var historyQueryURL = "https://min-api.cryptocompare.com/data/histoday?fsym=" + thisCoin + "&tsym=USD&limit=14";

                                $.ajax({
                                    url: historyQueryURL,
                                    method: "GET"
                                }).then(function (historyResponse) {
                                    var responseArray = historyResponse.Data;

                                    // create data object to be read by Chart.js and rendered
                                    var chartData = {
                                        labels: [],
                                        datasets: [{
                                            label: "Daily Low",
                                            data: [],
                                            backgroundColor: [
                                                "rgba(23, 162, 184, 1)"
                                            ],
                                            borderColor: [
                                                "rgba(52, 58, 64, 1)" // black
                                            ],
                                            pointBackgroundColor: "rgba(140, 0, 0)",
                                            borderWidth: 1
                                        },
                                        {
                                            label: "Closing Price at 00:00 GMT",
                                            data: [],
                                            backgroundColor: [
                                                "rgba(255, 255, 255, 1)"
                                            ],
                                            borderColor: [
                                                "rgba(23, 162, 184, 1)"
                                            ],
                                            pointBackgroundColor: "rgba(255, 0, 0, 1)",
                                            borderWidth: 1
                                        },
                                        {
                                            label: "Daily High",
                                            data: [],
                                            backgroundColor: [
                                                "rgba(52, 58, 64, 1)"

                                            ],
                                            borderColor: [
                                                "rgba(255, 255, 255, 1)" // white
                                            ],
                                            pointBackgroundColor: "rgba(255, 160, 160, 1)",
                                            borderWidth: 1
                                        }
                                        ]
                                    };

                                    // for the data returned from the AJAX response, modify the chartData variable in order to be rendered correctly by Chart.js
                                    for (var j = 0; j <= responseArray.length - 1; j++) {
                                        chartData.labels.push(moment.unix(responseArray[j].time).format("MM/DD/YY"));

                                        // Add Closing Price
                                        chartData.datasets[1].data.push(responseArray[j].close);

                                        // Add Daily High
                                        chartData.datasets[2].data.push(responseArray[j].high);

                                        // Add Daily Low
                                        chartData.datasets[0].data.push(responseArray[j].low);
                                    };

                                    var chart = new Chart(ctx, {
                                        type: 'line',
                                        data: chartData,
                                        options: {
                                            elements: {
                                                point: {
                                                    radius: 0,
                                                    hitRadius: 10,
                                                    hoverRadius: 5
                                                }
                                            },
                                            scales: {
                                                yAxes: [{
                                                    ticks: {
                                                        // include a currency sign in the ticks
                                                        callback: function (value, index, values) {
                                                            return "$" + value;
                                                        }
                                                    }
                                                }]
                                            }
                                        }
                                    });
                                });
                            };
                        } // callback function ends here
                        function emboldenText(textObject) {
                            // select other bold object if they exist. If they do not, this selector will equate to undefined.
                            // do this in order to highlight the price when a user is considering to buy a coin
                            var otherBolds = $(".price[emboldened='true']").not(textObject);

                            // if this object is already bold, 
                            if (textObject.attr("emboldened") == "true") {
                                textObject.attr("emboldened", "false");
                                textObject.css("font-weight", "normal");
                                textObject.css("text-decoration", "none");
                                // otherwise, if it is not already bold, make it bold
                            } else {
                                // textObject.attr("emboldened", "false");
                                textObject.css("font-weight", "normal");
                                textObject.attr("emboldened", "true");
                                textObject.css("font-weight", "bolder");
                                textObject.css("text-decoration", "underline");
                            };

                            // if there exists other bold items, undo it when this object is clicked on
                            if (otherBolds) {
                                otherBolds.css("font-weight", "normal");
                                otherBolds.css("text-decoration", "none");
                                otherBolds.attr("emboldened", "false");
                            };
                        };

                        function updatePrices(callback) {
                            /* this is similar to the inital population of the table rows, except only the prices are being modified so that users buy coins with live results,
                            and so that this is compatible to be called with setInterval without a callback */

                            var innerPriceQueryURL = "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=" + priceParams + "&tsyms=USD";

                            $.ajax({
                                url: innerPriceQueryURL,
                                method: "GET"
                            }).then(function (innerPriceResponse) {
                                innerPricesObj = innerPriceResponse.DISPLAY;
                                for (var k = 0; k <= Object.keys(innerPricesObj).length - 1; k++) {
                                    var innerCoinObjPrices = innerPricesObj[Object.keys(innerPricesObj)[k]];
                                    var innerColPrice = innerCoinObjPrices.USD.PRICE;
                                    $(".price[index='" + k + "']").html(innerColPrice);
                                };
                                callback;
                            });
                            if (refresh) {
                                clearTimeout(refresh);
                            };
                            refresh = setTimeout(function () {
                                updatePrices()
                            }, refreshPeriod * 1000);
                        }
                        // initial function on click handler
                        updatePrices(selectRowCallback($(this)));
                    });
                };

                // buy and sell buttons' event handler
                $(".buySellBtn").on("click", function () {
                    event.preventDefault();
                    var thisIndex = $(this).attr("index");
                    var howMuchInput = $(".howMuch[index='" + thisIndex + "']");
                    var selectedPrice = parseFloat($(".coinRow[index='" + thisIndex + "']").attr("currentPrice"));
                    var selectedCoin = $(".coinRow[index='" + thisIndex + "']").attr("id");

                    if (loggedIn) {
                        if (/^[0-9]*\.?[0-9]+$/.test(howMuchInput.val()) && parseInt(howMuchInput.val()) > 0) {
                            // reset placeholder if it was set to show invalidation
                            howMuchInput.attr("placeholder", "Enter amount to buy..");
                            // get how much the transaction would cost
                            var total = parseFloat(howMuchInput.val()) * parseFloat(selectedPrice);

                            if ($(this).hasClass("buy")) {
                                userRef.once("value").then(function (snap) {
                                    if (total > snap.val().balance) {
                                        howMuchInput.attr("placeholder", "Insufficient Funds");
                                        howMuchInput.val("");
                                        // this condition represents the actual purchase
                                    } else {
                                        // Reduce the wallet balance                                    
                                        userWalletRef.set(snap.val().balance - total);

                                        // modify portfolio
                                        // if the user does not already have that coin in their portfolio
                                        if (!(snap.val().portfolio[selectedCoin])) {
                                            // calculate new amount owned
                                            database.ref("/" + loggedIn + "/portfolio/" + selectedCoin + "/amountOwned").set(parseFloat(howMuchInput.val()));
                                            // calculate average paid per coin
                                            database.ref("/" + loggedIn + "/portfolio/" + selectedCoin + "/avgPaidPerCoin").set(selectedPrice);
                                            // otherwise, if the user already has that coin in their portfolio
                                        } else {
                                            // calculate new amount owned
                                            database.ref("/" + loggedIn + "/portfolio/" + selectedCoin + "/amountOwned").set(parseFloat(howMuchInput.val()) + snap.val().portfolio[selectedCoin].amountOwned);
                                            // calculate average paid per coin
                                            database.ref("/" + loggedIn + "/portfolio/" + selectedCoin + "/avgPaidPerCoin").set(((snap.val().portfolio[selectedCoin].amountOwned * snap.val().portfolio[selectedCoin].avgPaidPerCoin) + total) / (snap.val().portfolio[selectedCoin].amountOwned + parseFloat(howMuchInput.val())));
                                        };

                                        // display purchase amount and fade after 5 seconds
                                        if (totalDisplay) {
                                            fadeOut.clearTimeout();
                                        };
                                        var totalDisplay = $(".totalDisplay[index='" + thisIndex + "']");
                                        totalDisplay.show();
                                        totalDisplay.html("Bought: &#8353;" + total.toFixed(2));
                                        var fadeTotal = setTimeout(function () {
                                            totalDisplay.fadeOut();
                                        }, 5 * 1000);
                                    };
                                });
                            } else if ($(this).hasClass("sell")) {
                                userRef.once("value").then(function (snap) {
                                    // if the user does not have the selected coin in their portfolio
                                    if (!(snap.val().portfolio[selectedCoin])) {
                                        howMuchInput.attr("placeholder", "You don't own any " + selectedCoin);
                                        howMuchInput.val("");
                                    } else {
                                        // if the user tries to sell more coins than they own
                                        if (howMuchInput.val() > snap.val().portfolio[selectedCoin].amountOwned) {
                                            howMuchInput.attr("placeholder", "You only have " + snap.val().portfolio[selectedCoin].amountOwned.toFixed(2) + " " + selectedCoin);
                                            howMuchInput.val("");
                                        } else {
                                            // increase the user's wallet balance
                                            userWalletRef.set(snap.val().balance + total);

                                            // calculate and increase the user's earnings
                                            var earning = total - (snap.val().portfolio[selectedCoin].avgPaidPerCoin * snap.val().portfolio[selectedCoin].amountOwned);
                                            database.ref("/" + loggedIn + "/earnings").set(snap.val().earnings + earning);

                                            // if the new amount owned would equal to zero, just remove the branch from the portfolio
                                            if (snap.val().portfolio[selectedCoin].amountOwned - parseFloat(howMuchInput.val()) == 0) {
                                                database.ref("/" + loggedIn + "/portfolio/" + selectedCoin).remove();
                                            } else {
                                                // calculate new amount owned
                                                database.ref("/" + loggedIn + "/portfolio/" + selectedCoin + "/amountOwned").set(snap.val().portfolio[selectedCoin].amountOwned - parseFloat(howMuchInput.val()));
                                                // calculate new average paid per coin
                                                database.ref("/" + loggedIn + "/portfolio/" + selectedCoin + "/avgPaidPerCoin").set(((snap.val().portfolio[selectedCoin].amountOwned * snap.val().portfolio[selectedCoin].avgPaidPerCoin) - total) / (snap.val().portfolio[selectedCoin].amountOwned - parseFloat(howMuchInput.val())));
                                            };
                                        };
                                    };
                                });
                            };
                        } else {
                            howMuchInput.val("");
                            howMuchInput.attr("placeholder", "Invalid Number");
                        }
                    } else {
                        alert("You must first sign in to buy or sell any coins")
                        window.location.replace("signup.html");
                    };
                });

            });
        });
    }
    // Initial AJAX calls and table creation complete

    // whenever if the wallet value changes at any point, update the user's balance status
    userWalletRef.on("value", function (walletSnap) {
        $("#userBalance").html("Available Funds: " + "&#8353;" + walletSnap.val().toFixed(2));
    });
});