
import { formatDistanceToNow } from 'date-fns';
import { cubicOut, cubicInOut } from 'svelte/easing';


let pbCloudImage = import.meta.env.VITE_IMAGE_POCKETBASE_URL; // Set a default API URL


import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export const formatDateRange = (lastDateStr) => {
  // Convert lastDateStr to Date object
  const lastDate = new Date(lastDateStr);

  // Set the first date to the beginning of the month of lastDate
  const firstDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);

  // Format first and last dates
  const firstDateFormatted = firstDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', day: '2-digit' });
  const lastDateFormatted = lastDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', day: '2-digit' });
  // Construct and return the formatted date range string
  return `${firstDateFormatted} - ${lastDateFormatted}`;
}


export const serializeNonPOJOs = (obj) => {
	return structuredClone(obj);
};

export const generateUsername = (name) => {
	const randomHex = Math.floor(Math.random() * 65536).toString(16);
	const id = randomHex.padStart(4, '0');
	return `${name.slice(0, 5)}${id}`;
  };



export const getImageURL = (collectionId, recordId, fileName, size = '0x0') => {
	//For development or local storage or S3 bucket without CDN Cloudfront
	if(pbCloudImage === 'http://localhost:8090')
	{
		return `${pbCloudImage}/api/files/${collectionId}/${recordId}/${fileName}?thumb=${size}`;	
	}
	return `${pbCloudImage}/${collectionId}/${recordId}/${fileName}?thumb=${size}`;
};


export const validateData = async (formData, schema) => {
	const body = Object.fromEntries(formData)

	try {
		const data = schema.parse(body);
		return {
			formData: data,
			errors: null
		}
	} catch(err) {
		console.log('Error: ', err)
		const errors = err.flatten()
		return {
			formData: body,
			errors
		}
	}
}


export function sumQuarterlyResultsByYear(quarterlyResults, namingList) {
  const yearlySummaries = {};
  const quarterCounts = {};
  //FMP sucks since these keys are up to date only by the last quarter value
  const lastQuarterKeys = new Set([namingList]); // Keys that need last quarter values

  // Define a Set of keys to exclude from summing
  //FMP sucks since these keys are up to date for every quarter hence no summation required
  const excludeKeys = new Set(['weightedAverageShsOut', 'weightedAverageShsOutDil']);

  // Function to get the quarter number from the period string
  function getQuarterNumber(period) {
    switch (period) {
      case 'Q1': return 1;
      case 'Q2': return 2;
      case 'Q3': return 3;
      case 'Q4': return 4;
      default: return 0;
    }
  }

  // Iterate over each quarterly result
  quarterlyResults?.forEach(quarter => {
    // Extract year and quarter from the data
    const year = quarter?.calendarYear;
    const quarterNum = getQuarterNumber(quarter?.period);

    // Initialize the year in summaries and quarter counts if not already present
    if (!yearlySummaries[year]) {
      yearlySummaries[year] = {
        calendarYear: `${year}`, // Use end of the year date
        lastQuarterProcessed: 0 // Keep track of the last quarter processed
      };
      quarterCounts[year] = 0;
    }
    
    // Increment the quarter count for the year
    quarterCounts[year]++;
    
    // Update last quarter processed if current quarter is greater
    if (quarterNum > yearlySummaries[year].lastQuarterProcessed) {
      yearlySummaries[year].lastQuarterProcessed = quarterNum;
    }
    
    // Sum up the numeric fields for the year, excluding specific keys
    Object?.keys(quarter)?.forEach(key => {
      if (typeof quarter[key] === 'number' && !excludeKeys?.has(key) && !lastQuarterKeys.has(key)) {
        yearlySummaries[year][key] = (yearlySummaries[year][key] || 0) + quarter[key];
      } else if (excludeKeys.has(key)) {
        // Directly copy the last quarter value for these keys
        yearlySummaries[year][key] = quarter[key];
      } else if (lastQuarterKeys.has(key) && quarterNum === 4) {
        // Update only if it's the last quarter of the year
        yearlySummaries[year][key] = quarter[key];
      }
    });
  });
  
  // Filter out years with less than 4 quarters
  const validYears = Object.keys(quarterCounts).filter(year => quarterCounts[year] === 4);
  const annualResults = validYears.map(year => yearlySummaries[year]);
  
  // Sort the results by year in descending order
  annualResults.sort((a, b) => b?.calendarYear?.localeCompare(a?.calendarYear));
  
  return annualResults;
}





export const sortPostsByDate = (posts) => {
	return posts.sort(function(a, b) {
	  return new Date(b.created) - new Date(a.created);
	});
  }


export function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
  }



  export function formatString(inputString) {
    // Split the input string into words using space as a delimiter
    const words = inputString?.split(' ');
    
    // Capitalize the first letter of each word and convert the rest to lowercase
    const formattedWords = words?.map((word, index) => {
      if (word.length > 0) {
        // Check if the word is "LTG" or "LLC" and keep them uppercase
        const excludedList = ['n/a','CEO','U.S.','NGL','ETF','SPDR','S&P','USD','US','JPMORGAN','SRS','AQR','XN','TIG','HAP','AB','AKRE','LTG', 'LLC','JVL', 'NJ', 'FMR', 'LP', 'NNS','BPS','BNP','PCG','CTC','IMC', 'PLC','WIT'];
        
        // Check if the word is "black-rock" and format it accordingly
        if (index < words?.length - 1 && word?.toLowerCase() === 'black' && words[index + 1]?.toLowerCase() === 'rock') {
          return 'Black Rock';
        }
        else if (excludedList?.includes(word)) {
          return word;
        } else {
          return word?.charAt(0)?.toUpperCase() + word?.slice(1)?.toLowerCase();
        }
      }
      return word; // Handle empty words if any
    });
    
    // Join the formatted words back together with spaces
    const formattedString = formattedWords?.join(' ');
    
    return formattedString;
  }
  



  export function abbreviateNumber(number, addDollarSign = false) {
    const negative = number < 0;

    // Handle special case for exactly 1000
    if (Math.abs(number) === 1000) {
      return addDollarSign ? (negative ? '-$1K' : '$1K') : (negative ? '-1K' : '1K');
    }

    if (Math.abs(number) !== 0 && Math.abs(number) > 1000) {
        const suffixes = ["", "K", "M", "B", "T", "Q", "Qu", "S", "O", "N", "D"];
        const magnitude = Math.floor(Math.log10(Math.abs(number)));
        let index = Math.min(Math.floor(magnitude / 3), suffixes.length - 1);
        let abbreviation = Math.abs(number) / Math.pow(10, index * 3);

        if (abbreviation >= 1000) {
            abbreviation = abbreviation.toFixed(1);
            index++;
        } else {
            abbreviation = abbreviation.toFixed(2);
        }

        abbreviation = abbreviation.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

        if (Math.abs(number) % 1000 === 0) {
            abbreviation = abbreviation.replace('-', '');
        }

        if (abbreviation?.slice(-3) === '.00') {
            abbreviation = abbreviation.slice(0, -3);
        }

        const formattedNumber = abbreviation + suffixes[index];
        
        if (addDollarSign) {
            return (negative ? '-$' : '$') + formattedNumber;
        } else {
            return negative ? '-' + formattedNumber : formattedNumber;
        }
    }
    else if (Math.abs(number) >= 0 && Math.abs(number) < 1000) {
        if (addDollarSign) {
            return (negative ? '-$' : '$') + number;
        } else {
            return number;
        }
    } 
   
    else {
        return addDollarSign ? '$0' : '0';
    }
}



export const formatDate = (dateString) => {
	const date = new Date(dateString)
	return formatDistanceToNow(date, { addSuffix: false, includeSeconds: false })?.replace(/about /i, '')
  }

export const formatRuleValue = (rule) => {
    if (['interestIncome', 'interestExpenses'].includes(rule.name)) {
        return `$${rule.value === 1000 ? `${rule.value / 1000} Bn` : `${rule.value} Mio`}`;
    } else if (['revenue', 'costOfRevenue', 'costAndExpenses', 'netIncome', 'grossProfit', 'researchAndDevelopmentExpenses', 'marketCap', 'operatingExpenses', 'operatingIncome', 'ebitda'].includes(rule.name)) {
        return `${rule.condition} $${rule.value} Bn`;
    } else if (rule.name === 'aiSignal') {
      return `${rule.value === '2' ? 'Buy' : rule.value === '1' ? 'Hold' : rule.value === '0' ? 'Sell' : 'n/a'} Signal`;
    }
    else if (['avgVolume'].includes(rule.name)) {
      return `${rule.condition} ${rule.value} Mio`;
    }
    else if (['var'].includes(rule.name)) {
      return `${rule.condition} ${rule.value}%`;
    }
    else if (['ratingRecommendation'].includes(rule.name)) {
      return rule.value === 2 ? 'Buy' : rule.value === 1 ? 'Hold' : 'Sell';
    } 
    else if (['trendAnalysis','fundamentalAnalysis'].includes(rule.name)) {
      return `${rule.condition} ${rule.value}% Accuracy`;
    } 
    else {
        return `${rule.condition} ${rule.value}${rule.name.includes('Growth') ? ' %' : ''}`;
    }
}


export function formatETFName(inputString) {
  // Define special cases
  const specialCases = {
      "etf-mg": "ETFMG",
      "ark": "ARK",
      "index-iq": "IndexIQ",
      "bny-mellon": "BNY Mellon",
      "ssc": "SS&C",
      "pgim": "PGIM",
      "jpmorgan-chase": "JPMorgan Chase",
      "us-global-investors": "US Global Investors"
      // Add more special cases as needed
  };

  // Check if the input string is a special case
  const lowerCaseInput = inputString?.toLowerCase();
  if (specialCases?.hasOwnProperty(lowerCaseInput)) {
      return specialCases[lowerCaseInput];
  }

  // Split the input string into an array of words
  const words = inputString?.split('-');

  // Capitalize the first letter of each word
  const capitalizedWords = words?.map(word => word.charAt(0)?.toUpperCase() + word?.slice(1));

  // Join the words back together with a space between them
  const formattedString = capitalizedWords?.join(' ');

  return formattedString;
}


export function pageTransitionIn(node, { duration, screenWidth }) {
  if (screenWidth >= 640)
  {
    return
  }
  return {
    duration,
    css: (t) => {
      const eased = cubicOut(t);

      return `
        transform: translateX(${(1 - eased) * 100}%);
        width: 100%;
        height: 100%;
        opacity: 1;
        z-index: 9999;
        transition: transform ${duration}ms ease-out;
      `;
    }
  };
}

export function pageTransitionOut(node, { duration }) {
  return {
    duration,
    css: (t) => {
      const eased = cubicOut(t);

      return `
      transform: translateX(${(1-eased) * 100}%);
        opacity: 1;
        width: 100%;
        height: 100%;
        z-index: 9999;
        transition: transform ${duration}ms ease-in;
      `;
    },
  };
}



export function getPartyForPoliticians(name) {
  // Predefined list of senators and their parties
  const senatorPartyMap = {
    "Blake Moore": "Republican",
    "Bill Hagerty": "Republican",
    "Scott Peters": "Democratic",
    "Jared Moskowitz": "Democratic",
    "Suzan DelBene": "Democratic",
    "Rudy Yakym": "Republican",
    "Judy Chu": "Democratic",
    "Michael Burgess": "Republican",
    "David Perdue": "Republican",
    "Pat Roberts": "Republican",
    "Sheldon Whitehouse": "Democratic",
    "Shelley Moore Capito": "Republican",
    "Patty Murray": "Democratic",
    "Susan Collins": "Republican",
    "John Hoeven": "Republican",
    "Tommy Tuberville": "Republican",
    "Katie Britt": "Republican",
    "Lisa Murkowski": "Republican",
    "Dan Sullivan": "Republican",
    "Kyrsten Sinema": "Independent",
    "Mark Kelly": "Democratic",
    "John Boozman": "Republican",
    "Tom Cotton": "Republican",
    "Alex Padilla": "Democratic",
    "Laphonza Butler": "Democratic",
    "Michael Bennet": "Democratic",
    "John Hickenlooper": "Democratic",
    "Richard Blumenthal": "Democratic",
    "Chris Murphy": "Democratic",
    "Tom Carper": "Democratic",
    "Chris Coons": "Democratic",
    "Marco Rubio": "Republican",
    "Rick Scott": "Republican",
    "Jon Ossoff": "Democratic",
    "Raphael Warnock": "Democratic",
    "Brian Schatz": "Democratic",
    "Mazie Hirono": "Democratic",
    "Mike Crapo": "Republican",
    "Jim Risch": "Republican",
    "Dick Durbin": "Democratic",
    "Dianne Feinstein": "Democratic",
    "Ben Ray Luján": "Democratic",
    "Martin Heinrich": "Democratic",
    "Catherine Cortez Masto": "Democratic",
    "Jacky Rosen": "Democratic",
    "Kevin Cramer": "Republican",
    "Sherrod Brown": "Democratic",
    "James Lankford": "Republican",
    "Markwayne Mullin": "Republican",
    "Jeff Merkley": "Democratic",
    "Ron Wyden": "Democratic",
    "Ron L Wyden": "Democratic",
    "Bob Casey Jr.": "Democratic",
    "Pat Toomey": "Republican",
    "Jack Reed": "Democratic",
    "Tim Scott": "Republican",
    "Lindsey Graham": "Republican",
    "Mike Rounds": "Republican",
    "John Thune": "Republican",
    "Marsha Blackburn": "Republican",
    "Ted Cruz": "Republican",
    "John Cornyn": "Republican",
    "Mitt Romney": "Republican",
    "Mike Lee": "Republican",
    "Patrick Leahy": "Democratic",
    "Bernie Sanders": "Independent",
    "Mark Warner": "Democratic",
    "Tim Kaine": "Democratic",
    "Maria Cantwell": "Democratic",
    "Joe Manchin": "Democratic",
    "Ron Johnson": "Republican",
    "Tammy Baldwin": "Democratic",
    "John Barrasso": "Republican",
    "Cynthia Lummis": "Republican",
    "James Inhofe": "Republican",
    "Kelly Loeffler": "Republican",
    "Rick Larsen": "Democratic",
    "Dwight Evans": "Democratic",
    "Mark Green": "Republican",
    "Kevin Hern": "Republican",
    "Sean Casten": "Democratic",
    "William Keating": "Democratic",
    "Bill Keating": "Democratic",
    "Max Miller": "Republican",
    "Pete Sessions": "Republican",
    "Jerry Moran": "Republican",
    "Bill Cassidy": "Republican",
    "Cory Booker": "Democratic",
    "Deb Fischer": "Republican",
    "John Ricketts": "Republican",
    "Tammy Duckworth": "Democratic",
    "Angus King": "Other",
    "Gary Peters": "Democratic",
    "Doris Matsui": "Democratic",
    "Thomas Kean": "Republican",
    "Debbie Wasserman Schultz": "Democratic",
    "Josh Gottheimer": "Democratic",
    "Lloyd Doggett": "Democratic",
    "Michael Collins": "Democratic",
    "Kathy Manning": "Democratic",
    "Maria Elvira Salazar": "Republican",
    "Jonathan Jackson": "Democratic",
    "Mike Kelly": "Republican",
    "Richard Allen": "Republican",
    "James French Hill": "Republican",
    "Virginia Foxx": "Republican",
    "Chellie Pingree": "Democratic",
    "Cliff Bentz": "Republican",
    "Katherine Clark": "Democratic",
    "Robert Latta": "Republican",
    "Victoria Spartz": "Republican",
    "Debbie Dingell": "Democratic",
    "Garret Graves": "Republican",
    "Shri Thanedar": "Democratic",
    "Nancy Pelosi": "Democratic",
    "Steve Cohen": "Democratic",
    "Earl Blumenauer": "Democratic",
    "Adrian Smith": "Republican",
    "Michael Patrick Guest": "Republican",
    "Michael Garcia": "Republican",
    "Greg Steube": "Republican",
    "Daniel Meuser": "Republican",
    "Gerald Connolly": "Democratic",
    "Brian Mast": "Republican",
    "Nanette Barragan": "Democratic",
    "Mark Pocan": "Democratic",
    "Kathy Castor": "Democratic",
    "Donald Sternoff Beyer": "Democratic",
    "Thomas Suozzi": "Democratic",
    "Eleanor Holmes Norton": "Democratic",
    "Chip Roy": "Republican",
    "Tracey Robert Mann": "Republican",
    "Felix Barry Moore": "Republican",
    "Dan Newhouse": "Republican",
    "Mike Garcia": "Republican",
    "Scott Franklin": "Republican",
    "Michael McCaul": "Republican",
    "Ro Khanna": "Democratic",
    "Daniel Goldman": "Democratic",
    "Greg Stanton": "Democratic",
    "Chris Jacobs": "Republican",
    "Robert Aderholt": "Republican",
    "David McKinley": "Republican",
    "Kim Schrier": "Democratic",
    "Vicente Gonzalez": "Democratic",
    "Dan Crenshaw": "Republican",
    "Marie Newman": "Democratic",
    "Dean Phillips": "Democratic",
    "Roger Marshall": "Republican",
    "Zoe Lofgren": "Democratic",
    "John Curtis": "Republican",
    "Don Beyer": "Democratic",
    "Ed Perlmutter": "Democratic",
    "James Langevin": "Democratic",
    "Kenny Marchant": "Republican",
    "David Kustoff": "Republican",
    "Marjorie Taylor Greene": "Republican",
    "Deborah Ross": "Democratic",
    "Peter Meijer": "Republican",
    "Donna Shalala": "Democratic",
    "Brenda Lulenar Lawrence": "Democratic",
    "Robert Wittman": "Republican",
    "Diana Harshbarger": "Republican",
    "Morgan McGarvey": "Democratic",
    "Eric Burlison": "Republican",
    "Cynthia Axne": "Democratic",
    "Seth Moulton": "Democratic",
    "Anthony Gonzalez": "Republican",
    "David Joyce": "Republican",
    "Alan Lowenthal": "Democratic",
    "Patrick Fallon": "Republican",
    "David Madison Cawthorn": "Republican",
    "Ashley Hinson Arenholz": "Republican",
    "Gilbert Cisneros": "Democratic",
    "Joseph Morelle": "Democratic",
    "Joe Courtney": "Democratic",
    "Michael Conaway": "Republican",
    "William Timmons": "Republican",
    "Cheri Bustos": "Democratic",
    "Harley Rouda": "Democratic",
    "Susan Brooks": "Republican",
    "Mikie Sherrill": "Democratic",
    "David Cheston Rouzer": "Republican",
    "Bradley Schneider": "Democratic",
    "Justin Amash": "Other",
    "Lamar Smith": "Republican",
    "Gary Palmer": "Republican",
    "Barbara Comstock": "Republican",
    "Thomas Rooney": "Republican",
    "Carlos Curbelo": "Republican",
    "Bob Gibbs": "Republican",
    "Kurt Schrader": "Democratic",
    "August Lee Pfluger": "Republican",
    "Ed Case": "Democratic",
    "Francis Rooney": "Republican",
    "John Rutherford": "Republican",
    "David Roe": "Republican",
    "Sean Patrick Maloney": "Democratic",
    "Peter Welch": "Democratic",
    "Lois Frankel": "Democratic",
    "Carol Devine Miller": "Republican",
    "Mo Brooks": "Republican",
    "Bobby Scott": "Democratic",
    "John Yarmuth": "Democratic",
    "Mike Gallagher": "Republican",
    "Tom O'Halleran": "Democratic",
    "David Price": "Democratic",
    "Tina Smith": "Democratic",
    "Doug Lamborn": "Republican",
    "Gerry Connolly": "Democratic",
    "Chuck Fleischmann": "Republican",
    "James Vance": "Republican",
    "Neal Dunn": "Republican",
    "Anna Paulina Luna": "Republican",
    "Laurel Lee": "Republican",
    "Mitch McConnell": "Republican",
    "Hal Rogers": "Republican",
    "Jennifer McClellan": "Democratic",
    "Patrick McHenry": "Republican",
    "Susie Lee": "Democratic",
    "Jim Banks": "Republican",
    "Michael San Nicolas": "Democratic",
    "Mary Gay Scanlon": "Democratic",
    "Van Taylor": "Republican",
    "Ron Estes": "Republican",
    "Chris Van Hollen": "Democratic",
    "Stephen Lynch": "Democratic",
    "Ann Wagner": "Republican",
    "Michael Simpson": "Republican",
    "Thom Tillis": "Republican",
    "Glenn Grothman": "Republican",
    "Tom Cole": "Republican",
    "David Trone": "Democratic",
    "Fred Upton": "Republican",
    "John Larson": "Democratic",
    "Tom Malinowski": "Democratic",
    "Jeff Duncan": "Republican",
    "Peter Visclosky": "Democratic",
    "Adam Kinzinger": "Republican",
    "Austin Scott": "Republican",
    "Abigail Spanberger": "Democratic",
    "Roger Williams": "Republican",
    "Earl Leroy Carter": "Republican",
    "Daniel Webster": "Republican",
    "Nicole Malliotakis": "Republican",
    "Buddy Carter": "Republican",
};

// Combine first and last name to form the key
  const nameKey = `${name}`?.trim();
  // Return the party, or 'Unknown' if not found
  return senatorPartyMap[nameKey] || "Other";
}



export const listOfCountries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia (Czech Republic)",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini (fmr. 'Swaziland')",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Holy See",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (formerly Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Taiwan",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "UK",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];