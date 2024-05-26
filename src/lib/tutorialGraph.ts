function generateDateList(val) {
    var currentDate = new Date(); // Get the current date
  
    var dateList = [];
    dateList.push(formatDate(currentDate)); // Add current date to the list
  
    for (var i = 1; i <= val; i++) { // Generate 10 more dates, 30 days apart
      var previousDate = new Date(currentDate.getTime() - (i * 1 * 24 * 60 * 60 * 1000)); // Calculate the previous date
      dateList.unshift(formatDate(previousDate)); // Add the previous date to the beginning of the list
    }
  
    return dateList;
  }
  
  function formatDate(date) {
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2); // Month is zero-based, so we add 1
    var day = ('0' + date.getDate()).slice(-2);
  
    return year + '-' + month + '-' + day;
  }
  
  var dateList = generateDateList(30);


function generateRandomNumberList() {
    var numberList = [];
  
    for (var i = 0; i < 30; i++) {
      var randomNumber = Math.floor(Math.random() * (80 - 20 + 1)) + 20; // Generate random number between 20 and 80
      numberList.push(randomNumber); // Add the random number to the list
    }
  
    return numberList;
  }

  function generateTrigonometricNumberList(val) {
    var numberList = [];
  
    for (var i = 0; i < 100; i++) {
      var angle = (i / 100) * Math.PI * 2 ; // Calculate the angle based on the index
      var value = Math.sin(angle) * val; // Calculate the sine value
      numberList.push(value); // Add the value to the list
    }
  
    return numberList;
  }
  
  
var rsiList = generateRandomNumberList();
export const rsiGraph = {
    xAxis: {
      type: 'category',
      data: dateList
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: rsiList,
        type: 'line',
        symbol: 'none', // Remove the dots
        lineStyle: {
          type: 'solid', // Make the line solid
          color: '#FFF' // Red color for the line
        }
      },
      {
        type: 'line',
        symbol: 'none', // Remove the dots
        data: Array(30).fill(30),
        lineStyle: {
          type: 'solid', // Make the line solid
          color: '#0BA111', // Red color for the line
          width: 4,
        }
      },
      {
        type: 'line',
        symbol: 'none', // Remove the dots
        data: Array(30).fill(70),
        lineStyle: {
          type: 'solid', // Make the line solid
          color: '#FF0000', // Red color for the line
          width: 4,
        }
      }
    ]
  };
  

//MACD Indicator
var macdList = generateTrigonometricNumberList(1);
var macdLineList = generateTrigonometricNumberList(1.5);

var macdDateList = generateDateList(100);
export const macdGraph = {
    xAxis: {
    type: 'category',
    data: macdDateList
    },
    yAxis: {
    type: 'value'
    },
    series: [
    {
        data: macdList,
        type: 'line',
        symbol: 'none', // Remove the dots
        lineStyle: {
        type: 'solid', // Make the line solid
        color: '#0BA111' // Red color for the line
        }
    },
    {
        data: macdLineList,
        type: 'line',
        symbol: 'none', // Remove the dots
        lineStyle: {
        type: 'solid', // Make the line solid
        color: '#FF0000' // Red color for the line
        }
    },
    ]
};




//MACD Indicator
var sma50List = generateTrigonometricNumberList(100);
var sma200List = generateTrigonometricNumberList(120);


var smaDateList = generateDateList(100);
export const smaGraph = {
    xAxis: {
    type: 'category',
    data: smaDateList
    },
    yAxis: {
    type: 'value'
    },
    series: [
    {
        data: sma50List,
        type: 'line',
        symbol: 'none', // Remove the dots
        lineStyle: {
        type: 'solid', // Make the line solid
        color: '#0BA111' // Red color for the line
        }
    },
    {
        data: sma200List,
        type: 'line',
        symbol: 'none', // Remove the dots
        lineStyle: {
        type: 'solid', // Make the line solid
        color: '#FF0000' // Red color for the line
        }
    },
    ]
};
