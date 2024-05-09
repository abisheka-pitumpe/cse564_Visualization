document.addEventListener("DOMContentLoaded", function () {
  d3.json("/countries", function (data) {
    var countryDropdown = d3.select("#country");

    data.countries.forEach(function (country) {
      countryDropdown.append("option").text(country);
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  d3.json("/regions", function (data) {
    var regionDropdown = d3.select("#region");

    data.regions.forEach(function (region) {
      regionDropdown.append("option").text(region);
    });
  });
});
document.addEventListener("DOMContentLoaded", function () {
  d3.json("/years", function (data) {
    var yearDropdown = d3.select("#year");

    data.years.forEach(function (year) {
      yearDropdown.append("option").text(year);
    });
  });
});
document.addEventListener("DOMContentLoaded", function () {
  // Initialize with a default year
  updateBarChart(2024);
  
  document.getElementById("year").addEventListener("change", function() {
    updateBarChart(this.value);
  });
});


let countryData = [];
let mapData;
let selectedContinent;
let selectedRegion;
// Load the map data
d3.json(
  "https://unpkg.com/world-atlas@2.0.2/countries-50m.json",
  function (error, data) {
    if (error) throw error;
    mapData = data;

    // Load the country data from the Flask backend
    d3.json("/data", function (error, data) {
      if (error) throw error;
      countryData = data;
      initializeMap(countryData);
    });
  }
);

function initializeMap(countryData) {
  const width = 800;
  const height = 300;

  const svg = d3
    .select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const projection = d3
    .geoMercator()
    .scale(120)
    .translate([width / 2, height / 1.5]);

  const path = d3.geoPath().projection(projection);

  // Set a single color for all countries
  const color = "#19747E";

  // Draw the map with the single color
  const countries = svg
    .selectAll(".country")
    .data(topojson.feature(mapData, mapData.objects.countries).features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", path)
    .style("fill", color);

  // Add emoji markers
  const markers = svg
    .append("g")
    .attr("class", "markers")
    .selectAll(".marker")
    .data(countryData)
    .enter()
    .append("text")
    .attr("class", "marker")
    .attr("x", (d) => projection([d.Longitude, d.Latitude])[0])
    .attr("y", (d) => projection([d.Longitude, d.Latitude])[1])
    .style("font-size", "20px") // Set initial font size
    .text((d) => d.Emoji);

  // Add tooltips
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  markers
    .on("mouseover", function (d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `
                    <strong>${d.Country}</strong><br>
                    Happiness Rank: ${d["Happiness Rank"]}<br>
                    Ladder Score: ${d["Ladder score"]}<br>
                    Population: ${d.Population.toLocaleString()}
                `
        )
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Define zoom behavior
  var zoom = d3
    .zoom()
    .scaleExtent([0.5, 8]) // Set zoom scale limits
    .on("zoom", function () {
      svg.selectAll("path").attr("transform", d3.event.transform); // Apply transform to the map paths
      svg
        .selectAll("text")
        .attr("x", function (d) {
          return d3.event.transform.apply(
            projection([d.Longitude, d.Latitude])
          )[0];
        })
        .attr("y", function (d) {
          return d3.event.transform.apply(
            projection([d.Longitude, d.Latitude])
          )[1];
        });
    });

  // Apply zoom behavior to SVG element
  svg.call(zoom);

  // Reset zoom transform when no zoom is applied
  svg.call(zoom.transform, d3.zoomIdentity);

  // Event listeners for dropdown menus
document.getElementById("country").addEventListener("change", function () {
  const selectedCountry = this.value;
  fetch(`/data?country=${selectedCountry}`)
    .then(response => response.json())
    .then(data => {
      // Update the map with the filtered data
      updateCountry(selectedCountry, width, height,data);

    })
    .catch(error => {
      console.error('Error:', error);
    });
});
var selectedRegion;
document.getElementById("region").addEventListener("change", function () {
  const selectedRegion = this.value;
  updateRegion(selectedRegion,countryData,projection, continentData);
  updatePolylinewithRegions(selectedRegion,data)
});

document.getElementById("year").addEventListener("change", function () {
  const selectedYear = this.value;
  // Make a request to the Flask endpoint with the selected year
  fetch(`/data?year=${selectedYear}`)
    .then(response => response.json())
    .then(data => {
      // Update the map with the filtered data
      updateYear(selectedYear, width, height,data);

    })
    .catch(error => {
      console.error('Error:', error);
    });
});

}

let continentData; // Declare continentData outside of any function
let continentPath; // Declare path for the continent path generator
var projection = d3.geoMercator()
    .scale(120)
    .translate([width / 2, height / 1.5]);

// Fetch continent data from a GeoJSON file
d3.json("https://gist.githubusercontent.com/hrbrmstr/91ea5cc9474286c72838/raw/59421ff9b268ff0929b051ddafafbeb94a4c1910/continents.json", function(error, data) {
  if (error) throw error;
  continentData = data; // Assign the fetched data to continentData
  // Call updateRegion to draw continents initially without highlighting
  updateRegion(null, countryData, projection, continentData);
});
let selectedRegions = {}; // Object to store selected regions and their colors

function updateRegion(selectedRegion, countryData, projection, continentData) {
  // Clear existing markers
  d3.selectAll(".marker").remove();

  const color = d3.scaleOrdinal()
    .domain(["Africa", "Asia", "Europe", "North America", "South America", "Oceania"])
    .range([
      "#e5c494", 
      "#ffd92f", 
      "#8da0cc",
      "#a6d955", 
      "#e88bc4", 
      "#fc8d62"
    ]);

  const svg = d3.select("#map").select("svg");

  // Store the color for the selected region
  selectedRegions[selectedRegion] = color(selectedRegion);

  // Update the map colors based on the selected regions
  d3.selectAll(".country")
    .style("fill", function(d) {
      return selectedRegions[d.properties.region] || "#ccc"; // Use the stored color or default to gray
    });

  // Remove existing continent paths
  svg.selectAll(".continent").remove();

  // Append the continent paths to the SVG
  svg.selectAll(".continent")
    .data(continentData.features)
    .enter().append("path")
    .attr("class", "continent")
    .attr("d", d3.geoPath().projection(projection))
    .style("fill", function(d) {
      console.log("selectedRegions[d.properties.CONTINENT]", selectedRegions[d.properties.CONTINENT])
      return selectedRegions[d.properties.CONTINENT] || "#ccc"; // Use the stored color or default to gray
    })
    .style("stroke", "black") // Add a border
    .style("stroke-width", "0.5px");

  // Add markers for countries in the selected regions
  const markers = svg.selectAll(".marker")
    .data(countryData.filter(d => selectedRegions[d.Region]))
    .enter()
    .append("text")
    .attr("class", "marker")
    .attr("x", (d) => projection([d.Longitude, d.Latitude])[0])
    .attr("y", (d) => projection([d.Longitude, d.Latitude])[1])
    .style("font-size", "20px")
    .text((d) => d.Emoji);

  // Add tooltips
  const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

  markers.on("mouseover", function(d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>${d.Country}</strong><br> Happiness Rank: ${d["Happiness Rank"]}<br> Ladder Score: ${d["Ladder score"]}<br> Population: ${d.Population.toLocaleString()}`)
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    .on("mouseout", function() {
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

function updateYear(selectedYear, width, height, countryData) {
  // Clear existing markers
  d3.selectAll(".marker").remove();

  // Define projection
  var projection = d3
    .geoMercator()
    .scale(120)
    .translate([width / 2, height / 1.5]);

  const svg = d3.select("#map").select("svg");

  // Update the map to show markers for countries in the selected year
  const markers = svg
    .selectAll(".marker")
    .data(countryData.filter(d => +d.Year === +selectedYear)) // Convert to number for comparison
    .enter()
    .append("text")
    .attr("class", "marker")
    .attr("x", d => projection([d.Longitude, d.Latitude])[0])
    .attr("y", d => projection([d.Longitude, d.Latitude])[1])
    .style("font-size", "20px")
    .text(d => d.Emoji);

  // Add tooltips
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  markers
    .on("mouseover", function (d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `<strong>${d.Country}</strong><br> Happiness Rank: ${
            d["Happiness Rank"]
          }<br> Ladder Score: ${d["Ladder score"]}<br> Population: ${
            d.Population.toLocaleString()
          }`
        )
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

function updateCountry(selectedCountry, width, height, countryData) {
  // Clear existing markers
  d3.selectAll(".marker").remove();

  // Define projection
  var projection = d3
    .geoMercator()
    .scale(120)
    .translate([width / 2, height / 1.5]);

  const svg = d3.select("#map").select("svg");

  // Update the map to show markers for countries in the selected year
  const markers = svg
    .selectAll(".marker")
    .data(countryData.filter(d => d.Country === selectedCountry)) // Convert to number for comparison
    .enter()
    .append("text")
    .attr("class", "marker")
    .attr("x", d => projection([d.Longitude, d.Latitude])[0])
    .attr("y", d => projection([d.Longitude, d.Latitude])[1])
    .style("font-size", "20px")
    .text(d => d.Emoji);

  // Add tooltips
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  markers
    .on("mouseover", function (d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `<strong>${d.Country}</strong><br> Happiness Rank: ${
            d["Happiness Rank"]
          }<br> Ladder Score: ${d["Ladder score"]}<br> Population: ${
            d.Population.toLocaleString()
          }`
        )
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

var pcpMargin = {top: 30, right: 10, bottom: 10, left: 80},
    width = 760 - pcpMargin.left - pcpMargin.right,
    height = 300 - pcpMargin.top - pcpMargin.bottom;

var x = d3.scalePoint().rangeRound([0, width]).padding(1),
    y = {},
    dragging = {};


var line = d3.line(),
    //axis = d3.axisLeft(x),
    background,
    foreground,
    extents,
    origDimensions;


 var container = d3.select("#pcp").append("div")
    .attr("class", "parcoords")
    .style("width", width + pcpMargin.left + pcpMargin.right + "px")
    .style("height", height + pcpMargin.top + pcpMargin.bottom + "px");

var svg = container.append("svg")
    .attr("width", width + pcpMargin.left + pcpMargin.right)
    .attr("height", height + pcpMargin.top + pcpMargin.bottom)
  .append("g")
    .attr("transform", "translate(" + pcpMargin.left + "," + pcpMargin.top + ")");

var quant_p = function(v){return (parseFloat(v) == v) || (v == "")};     

d3.json("/pcp_data", function (error, data) {
  if (error) throw error;
 
    dimensions = d3.keys(data[0]);
    origDimensions = dimensions.slice(0);

    x.domain(dimensions);

    dimensions.forEach(function(d) {
    var vals = data.map(function(p) {return p[d];});
    if (vals.every(quant_p)){ 
     y[d] = d3.scaleLinear()
        .domain(d3.extent(data, function(p) { 
            return +p[d]; }))
        .range([height, 0])

       
      }
    else{
     vals.sort();           
      y[d] = d3.scalePoint()
              .domain(vals.filter(function(v, i) {return vals.indexOf(v) == i;}))
              .range([height, 0],1);
       }
        
  })

 extents = dimensions.map(function(p) { return [0,0]; });

  // Add grey background lines for context.
  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("d", path);

  // Add blue foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("d", path);

  // Add a group element for each dimension.

  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) {  return "translate(" + x(d) + ")"; })
      .call(d3.drag()
        .subject(function(d) { return {x: x(d)}; })
        .on("start", function(d) {
          dragging[d] = x(d);
          background.attr("visibility", "hidden");
        })
        .on("drag", function(d) {
          dragging[d] = Math.min(width, Math.max(0, d3.event.x));
          foreground.attr("d", path);
          dimensions.sort(function(a, b) { 
            return position(a) - position(b); 
          });
          // extents.forEach(function(ext, idx) {
          //   if(origDi)  
            
          // })
          x.domain(dimensions);
          g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
        })
        .on("end", function(d) {
          delete dragging[d];
          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
          transition(foreground).attr("d", path);
          background
              .attr("d", path)
            .transition()
              .delay(500)
              .duration(0)
              .attr("visibility", null);
              
              var new_extents = [];
              for(var i=0;i<dimensions.length;++i){
                  new_extents.push(extents[origDimensions.indexOf(dimensions[i])]);
              }
              extents = new_extents;
              origDimensions = dimensions.slice(0);
        }));

        svg
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", -20)
        .text("Parallel Coordinate Plot")
        .attr("text-anchor", "start");
  // Add an axis and title.
   var g = svg.selectAll(".dimension");
  g.append("g")
      .attr("class", "axis")
      .each(function(d) {  d3.select(this).call(d3.axisLeft(y[d]));})
      //text does not show up because previous line breaks somehow
    .append("text")
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .attr("y", -9) 
      .text(function(d) { return d; });

  // Add and store a brush for each axis.
  g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        if(y[d].name == 'r'){
         // console.log(this);

        d3.select(this).call(y[d].brush = d3.brushY().extent([[-8, 0], [8,height]]).on("start", brushstart).on("brush", brush_parallel_chart));
        }
    })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16); 
      
      updatePolylinewithRegions(null,data);

    
});  // closing

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}


// brush start function
function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

 
// Handles a brush event, toggling the display of foreground lines.
function brush_parallel_chart() {
 
    for(var i=0;i<dimensions.length;++i){

            if(d3.event.target==y[dimensions[i]].brush) {
                  extents[i]=d3.event.selection.map(y[dimensions[i]].invert,y[dimensions[i]]);
          }
  }

     foreground.style("display", function(d) {
        return dimensions.every(function(p, i) {
            if(extents[i][0]==0 && extents[i][0]==0) {
                return true;
            }
          return extents[i][1] <= d[p] && d[p] <= extents[i][0];
        }) ? null : "none";
      }); 
}    


function updatePolylinewithRegions(selectedRegion, data) {
  // Define a color scale for regions
  const regionColors = {
    "Africa": "#e5c494",
    "Asia": "#ffd92f",
    "Europe": "#8da0cc",
    "North America": "#a6d955",
    "South America": "#e88bc4",
    "Australia": "#fc8d62"
  };

   // Update the foreground lines based on the selected region
   foreground.style("display", function(d) {
    if (!selectedRegion || selectedRegion === "All") return null;
    return d.Region === selectedRegion ? null : "none";
  });

  // Color the countries based on the selected region
  svg.selectAll(".foreground path").style("stroke", function(d) {
    if (!selectedRegion || selectedRegion === "All") return "#19747E";
    return d.Region === selectedRegion ? regionColors[d.Region] : "#ddd";
  });
}
// Define a function to update the plot based on the selected region
function updatePlot(selectedRegion) {
  d3.json(`/update_pcpdata/${selectedRegion}`, function(error, data) {
    if (error) throw error;

    // Update the plot based on the returned data
    updatePolylinewithRegions(selectedRegion, data);
  });
}

// function brush_parallel_chart() {
//   var actives = [];
//   svg.selectAll(".brush")
//     .filter(function (d) {
//       return d3.brushSelection(this);
//     })
//     .each(function (d) {
//       actives.push({
//         dimension: d,
//         extent: d3.brushSelection(this)
//       });
//     });

//   // Update the polylines based on the selected regions
//   if (actives.length > 0) {
//     var selectedCountries = data.filter(function (d) {
//       return actives.every(function (active) {
//         var dim = active.dimension;
//         return active.extent[0] <= y[dim](d[dim]) && y[dim](d[dim]) <= active.extent[1];
//       });
//     });

//     var selectedRegions = selectedCountries.map(function (d) {
//       return d.region;
//     });

//     selectedRegions.forEach(function (region) {
//       updatePolylinewithRegions(region);
//     });
//   }
// }

// Update the polylines with the initial data
// updatePolylinewithRegions("Africa");


// Define variables
const percent = 0.65;
const barWidth = 34;
const numSections = 3;
const sectionPerc = 1 / numSections / 2;
const padRad = 0.05;
const chartInset = 10;

// Define helper functions
const percToDeg = (perc) => perc * 360;
const percToRad = (perc) => degToRad(percToDeg(perc));
const degToRad = (deg) => (deg * Math.PI) / 180;

// Set up SVG element
const gaugemargin = { top: 20, right: 20, bottom: 5, left: 20 };
const gaugewidth =
  document.querySelector(".chart-gauge").offsetWidth -
  gaugemargin.left -
  gaugemargin.right;
const gaugeheight = gaugewidth - 50;
const gaugeradius = Math.min(gaugewidth, gaugeheight) / 2;

const gaugesvg = d3
  .select(".chart-gauge")
  .append("svg")
  .attr("width", gaugewidth + gaugemargin.left + gaugemargin.right)
  .attr("height", gaugeheight + gaugemargin.top + gaugemargin.bottom);

const chart = gaugesvg
  .append("g")
  .attr(
    "transform",
    `translate(${(gaugewidth + gaugemargin.left) / 2}, ${
      (gaugeheight + gaugemargin.top) / 2
    })`
  );

// Define arc function
const arc = d3
  .arc()
  .outerRadius(gaugeradius - chartInset)
  .innerRadius(gaugeradius - chartInset - barWidth);

// Draw gauge background sections
let totalPercent = 0.75; // Initialize totalPercent
for (let sectionIndx = 1; sectionIndx <= numSections; sectionIndx++) {
  const arcStartRad = percToRad(totalPercent);
  const arcEndRad = arcStartRad + percToRad(sectionPerc);
  totalPercent += sectionPerc;
  const startPadRad = sectionIndx === 1 ? 0 : padRad / 2;
  const endPadRad = sectionIndx === numSections ? 0 : padRad / 2;

  chart
    .append("path")
    .attr("class", `arc chart-color${sectionIndx}`)
    .attr(
      "d",
      arc
        .startAngle(arcStartRad + startPadRad)
        .endAngle(arcEndRad - endPadRad)()
    );
}

// Define Needle class
class Needle {
  constructor(len, radius) {
    this.len = len;
    this.radius = radius;
  }

  drawOn(el, perc) {
    el.append("circle")
      .attr("class", "needle-center")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", this.radius);

    el.append("path").attr("class", "needle").attr("d", this.mkCmd(perc));
  }

  animateOn(el, targetPerc) {
    const self = this;
    el.transition()
      .delay(500)
      .ease(d3.easeCubicInOut)
      .duration(3000)
      .selectAll(".needle")
      .tween("progress", function () {
        const node = this;
        const initialPerc = parseFloat(d3.select(node).attr("data-perc")) || 0; // Get the initial percentage or default to 0
        return function (percentOfPercent) {
          const progress =
            initialPerc + (targetPerc - initialPerc) * percentOfPercent;
          d3.select(node).attr("d", self.mkCmd(progress));
        };
      })
      .attr("data-perc", targetPerc);
  }

  mkCmd(perc) {
    const thetaRad = percToRad(perc / 2); // half circle
    const centerX = 0;
    const centerY = 0;
    const topX = centerX - this.len * Math.cos(thetaRad);
    const topY = centerY - this.len * Math.sin(thetaRad);
    const leftX = centerX - this.radius * Math.cos(thetaRad - Math.PI / 2);
    const leftY = centerY - this.radius * Math.sin(thetaRad - Math.PI / 2);
    const rightX = centerX - this.radius * Math.cos(thetaRad + Math.PI / 2);
    const rightY = centerY - this.radius * Math.sin(thetaRad + Math.PI / 2);

    return `M ${leftX} ${leftY} L ${topX} ${topY} L ${rightX} ${rightY} Z`;
  }
}

const needle = new Needle(50, 10);
needle.drawOn(chart, 0);
needle.animateOn(chart, percent);


const keys = [
  "Economy",
  "Social support",
  "Health",
  "Freedom",
  "Trust",
  "Generosity",
];
const colorScale = d3
  .scaleOrdinal()
  .domain(keys)

  .range([
    "#202020",
    "#202020",
    "#202020",
    "#202020",
    "#202020",
    "#202020",
    "#202020",
    "#202020",
  ]);

// .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf']);


//Bubble chart code
const initialXAttribute = "Economy";
const yAttribute = "Ladder score";

const bubbleMargin = { top: 20, right: 20, bottom: 30, left: 40 };
const bubbleWidth = 500 - bubbleMargin.left - bubbleMargin.right;
const bubbleHeight = 300 - bubbleMargin.top - bubbleMargin.bottom;

const bubbleSvg = d3
  .select("#bubble-chart")
  .append("svg")
  .attr("width", bubbleWidth + bubbleMargin.left + bubbleMargin.right)
  .attr("height", bubbleHeight + bubbleMargin.top + bubbleMargin.bottom)
  .append("g")
  .attr("transform", `translate(${bubbleMargin.left}, ${bubbleMargin.top})`);

const bubbleX = d3.scaleLinear().range([0, bubbleWidth]);

const bubbleY = d3.scaleLinear().range([bubbleHeight, 0]);

const radius = d3.scaleSqrt().range([5, 20]);


// const color = d3.scaleOrdinal().range(d3.schemeCategory10);
// const color = d3.scaleOrdinal().range(d3.schemeCategory10);

  // Color palette
  const color = d3.scaleOrdinal()
  .domain(["Africa", "Asia", "Europe", "North America", "South America", "Australia"])

  .range([
    "#e5c494", 
    "#ffd92f", 
    "#8da0cc",
    "#a6d955", 
    "#e88bc4", 
    "#fc8d62"
  ]);


// Existing axis setup
const xAxisGroup = bubbleSvg.append("g")
  .attr("transform", `translate(0, ${bubbleHeight})`)
  .call(d3.axisBottom(bubbleX));

const yAxisGroup = bubbleSvg.append("g")
  .call(d3.axisLeft(bubbleY));

// Add X Axis Label with a placeholder or initial value
// Assuming you have defined bubbleSvg and its dimensions already

const xAxisLabel = bubbleSvg.append("text")
    .attr("class", "x-axis-label")
    .attr("transform", `translate(${bubbleWidth / 2}, ${bubbleHeight + bubbleMargin.bottom})`)
    .style("text-anchor", "middle")
    // .text("Initial Attribute Label"); // Set an initial label if needed

// Add Y Axis Label
bubbleSvg.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("y",  -55 + bubbleMargin.left)
  .attr("x", 0 - (bubbleHeight / 2))
  .attr("dy", "-1.2em")
  .style("text-anchor", "middle")
  .text("Happiness Score");  // Replace "Your Y-Axis Label" with the actual label

function updateCircles(selectedAttribute) {
    const circles = bubbleSvg.selectAll("circle").data(data);
    const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  
  
    circles.enter()
        .append("circle")
        .attr("cx", d => bubbleX(d[selectedAttribute]))
        .attr("cy", d => bubbleY(d[yAttribute]))
        .attr("r", 0) // Start with radius 0 for a nice transition
        .style("fill", d => color(d.Region))
        .attr("opacity", 0.7)
    // Merge with the update selection
    .merge(circles)
        .transition()
        .duration(500)
        .attr("cx", d => bubbleX(d[selectedAttribute]))
        .attr("cy", d => bubbleY(d[yAttribute]))
        .attr("r", d => radius(d.Population) * 1.2);  // Update the radius

    // Handle the exit selection
    circles.exit()
        .transition()
        .duration(500)
        .attr("r", 0)  // Animate radius to 0 upon exit
        .remove();

    // Add tooltip functionality to both new and updating circles
    circles
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("<strong>Country:</strong> " + d.Country + "<br/>" +
                         "<strong>Continent:</strong> " + d.Region + "<br/>" +
                         "<strong>Economy:</strong> " + d.Economy.toFixed(2) + "<br/>" +
                         "<strong>Ladder Score:</strong> " + d['Ladder score'].toFixed(2))
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}
  
  function updateChart(selectedAttribute) {
    console.log("Selected Attribute:", selectedAttribute);
  
    if (!data) {
      console.log("Data not available yet.");
      return;
    }
  
    updateScales(selectedAttribute);
    updateAxes();
    updateCircles(selectedAttribute);
    xAxisLabel.text(selectedAttribute.replace(/_/g, " "));
  }

const legendmargin = { left: 20 };
const legendElement = createLegend(keys, colorScale, legendmargin).node();
document.getElementById("legend-chart").appendChild(legendElement);

function createLegend(keys, colorScale, bubbleMargin) {
  const legend = d3
    .select("body")
    .append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("min-height", "33px")
    .style("font", "10px sans-serif")
    .style("margin-left", `${bubbleMargin.left}px`);

  const legendItems = legend.append("div");

  const legendItem = legendItems
    .selectAll(".legend-item")
    .data(keys)
    .enter()
    .append("span")
    .classed("legend-item", true)
    .style("display", "inline-flex")
    .style("align-items", "center")
    .style("margin-right", "10px")
    .style("cursor", "pointer")
    .style("padding", "5px 10px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("background-color", "#f8f8f8")
    .on("mouseover", function () {
      d3.select(this).style("background-color", "#e8e8e8");
    })
    .on("mouseout", function () {
      d3.select(this).style("background-color", "#f8f8f8");
    })
    .on("click", function (selectedData) {
      // Remove the check mark from all items
      legendItems.selectAll(".check-mark").style("display", "none");

      // Display the check mark for the clicked item
      const checkMark = d3.select(this).select(".check-mark");
      checkMark.style("display", "inline");

      // Update the chart based on the selected item
      updateChart(selectedData);
    });

  legendItem
    .append("text")
    .classed("check-mark", true)
    .style("display", "none") // Initially hide the check mark
    .style("color", "red")
    .style("margin-right", "0.5em")
    .text("✔"); // Unicode character for the check mark

  legendItem.append("text").text((d) => d);

  return legend;
}

let data;

function updateScales(selectedAttribute) {
  bubbleX.domain(d3.extent(data, (d) => d[selectedAttribute]));
  bubbleY.domain(d3.extent(data, (d) => d[yAttribute]));
  radius.domain(d3.extent(data, (d) => d.Population));
  color.domain(d3.map(data, (d) => d.Region).keys());
}
function updateAxes() {
  const xAxis = d3.axisBottom(bubbleX);
  const yAxis = d3.axisLeft(bubbleY);

  // Update x axis
  xAxisGroup
    .call(xAxis)
    .selectAll("path") // Select the axis line
    .style("stroke", "#EA6A47"); // Change color of x axis line

  xAxisGroup
    .selectAll("text") // Select all text elements of x axis
    .style("fill", "#EA6A47"); // Change color of text labels

  // Update y axis
  yAxisGroup
    .call(yAxis)
    .selectAll("path") // Select the axis line
    .style("stroke", "#EA6A47"); // Change color of y axis line

  yAxisGroup
    .selectAll("text") // Select all text elements of y axis
    .style("fill", "#EA6A47"); // Change color of text labels
}


fetch("/data")
  .then((response) => response.json())
  .then((fetchedData) => {
    data = fetchedData;
    updateChart(initialXAttribute);
  })
  .catch((error) => console.error(error));


  var stackedMargin = { top: 60, right: 230, bottom: 50, left: 50 },
  stackedWidth = 660 - stackedMargin.left - stackedMargin.right,
  stackedHeight = 360 - stackedMargin.top - stackedMargin.bottom;

var stackedSvg = d3
  .select("#my_dataviz")
  .append("svg")
  .attr("width", stackedWidth + stackedMargin.left + stackedMargin.right)
  .attr("height", stackedHeight + stackedMargin.top + stackedMargin.bottom)
  .append("g")
  .attr("transform", "translate(" + stackedMargin.left + "," + stackedMargin.top + ")");

d3.json("/stacked_area_data", function (error, data) {
  if (error) throw error;

  // List of keys
  var keys = [
    "Economy",
    "Social_support",
    "Health",
    "Freedom",
    "Trust",
    "Generosity",
    "Dystopia_Residual",
  ];

  // Color palette
  var color = d3.scaleOrdinal().domain(keys).range(d3.schemeSet2);
  console.log("Data",data.data[0])
  // var data = data.data
  // Stack the data
  // var stackedData = d3.stack().keys(keys).order(d3.stackOrderNone).offset(d3.stackOffsetNone)(data);
  if (data.data && data.data.length > 0) {
    var stackedData = d3.stack().keys(keys).order(d3.stackOrderNone).offset(d3.stackOffsetNone)(data.data);
    console.log("stackedData",stackedData)
  } else {
    console.error("Error: Data is empty or undefined.");
    // Handle the case where there's no data (e.g., display an error message)
  }
  // Add X axis
  var x = d3
    .scaleLinear()
    .domain(d3.extent(data.data, function (d) { return d.year; }))
    .range([0, stackedWidth]);
  var xAxis = stackedSvg
    .append("g")
    .attr("transform", "translate(0," + stackedHeight + ")")
    .call(d3.axisBottom(x).ticks(5));

  // Add X axis label
  stackedSvg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", stackedWidth)
    .attr("y", stackedHeight + 40)
    .text("Time (year)");

  // Add Y axis label
  stackedSvg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", 0)
    .attr("y", -20)
    .text("Stacked Area Chart")
    .attr("text-anchor", "start");

  // Add Y axis
  var y = d3.scaleLinear().domain([0, 800]).range([stackedHeight, 0]);
  stackedSvg.append("g").call(d3.axisLeft(y).ticks(5));

  var area = d3.area()
  .x(function(d) { return x(d.data.year); }) // Assuming 'year' is the x value
  .y0(function(d) { return y(d[0]); }) // The starting y-coordinate of the stack
  .y1(function(d) { return y(d[1]); }); // The ending y-coordinate of the stack


  // Show the areas
  stackedSvg
  .selectAll(".myArea")
  .data(stackedData)
  .enter()
  .append("path")
  .attr("class", function (d) {
      return "myArea " + d.key;
  })
  .style("fill", function (d) {
      return color(d.key);
  })
  .attr("d", function(d) { return area(d); }); // Use the area function here


  var highlight = function (d) {
    d3.selectAll(".myArea").style("opacity", 0.1);
    d3.select("." + d).style("opacity", 1);
  };

  var noHighlight = function () {
    d3.selectAll(".myArea").style("opacity", 1);
  };

  var size = 20;

  stackedSvg
    .selectAll("myrect")
    .data(keys)
    .enter()
    .append("rect")
    .attr("x", 400)
    .attr("y", function (d, i) {
      return 10 + i * (size + 5);
    })
    .attr("width", size)
    .attr("height", size)
    .style("fill", function (d) {
      return color(d);
    })
    .on("mouseover", highlight)
    .on("mouseleave", noHighlight);

  stackedSvg
    .selectAll("mylabels")
    .data(keys)
    .enter()
    .append("text")
    .attr("x", 400 + size * 1.2)
    .attr("y", function (d, i) {
      return 10 + i * (size + 5) + size / 2;
    })
    .style("fill", function (d) {
      return color(d);
    })
    .text(function (d) {
      return d;
    })
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .on("mouseover", highlight)
    .on("mouseleave", noHighlight);
});

// Load the data
function updateBarChart(year) {
  d3.json(`/bar_chart_data?year=${year}`, function(error, data) {
    if (error) {
      console.error('Error fetching the bar chart data:', error);
      return; // Exit if there's an error
    }
    drawBarChart(data); // Draw chart with fetched data
  });
}


function drawBarChart(data) {
  var svg = d3.select("#bar-chart-container").select("svg");
  if (svg.empty()) {
    svg = d3.select("#bar-chart-container")
      .append("svg")
      .attr("width", 600)
      .attr("height", 400);
  } else {
    svg.selectAll("*").remove(); // Clear previous
  }

  var margin = {top: 20, right: 20, bottom: 30, left: 60}, // Adjusted left margin for labels
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

  var g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  var x = d3.scaleLinear().range([0, width]);
  var y = d3.scaleBand().rangeRound([0, height]).padding(0.1);

  // Filter and sort the data to get the top 10 countries by ladder score
  var topCountries = data
    .sort((a, b) => b['Ladder score'] - a['Ladder score']) // Sort descending by score
    .slice(0, 15); // Get the top 10

  // Color palette
  const color = d3.scaleOrdinal()
    .domain(["Africa", "Asia", "Europe", "North America", "South America", "Australia"])
    .range([
      "#e5c494", 
      "#ffd92f", 
      "#8da0cc",
      "#a6d955", 
      "#e88bc4", 
      "#fc8d62"
    ]);

  // Set the domain for the axes
  y.domain(topCountries.map(d => d.Country));
  x.domain([0, d3.max(topCountries, d => d['Ladder score'])]);

  // Bind data to bars
  g.selectAll(".bar")
    .data(topCountries)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", d => y(d.Country))
    .attr("width", d => x(d['Ladder score'])) // Make sure this calculation is correct
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.Region)); // Set fill based on region

  // Add the X axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add the Y axis
  g.append("g")
    .call(d3.axisLeft(y));
}

// d3.json("/get_linedata", function(data) {
//   var margin = {top: 20, right: 20, bottom: 50, left: 20},
//       width = 520 - margin.left - margin.right,
//       height = 340 - margin.top - margin.bottom;

//   var svg = d3.select("#multiline-graph")
//       .append("svg")
//       .attr("width", width + margin.left + margin.right)
//       .attr("height", height + margin.top + margin.bottom)
//       .append("g")
//       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//   var x = d3.scaleLinear()
//       .domain(d3.extent(data, function(d) { return d.Year; }))
//       .range([0, width]);

//   var y = d3.scaleLinear()
//       .domain([0, d3.max(data, function(d) { return d["Ladder score"]; })])
//       .range([height, 0]);

//   // var color = d3.scaleOrdinal(d3.schemeCategory10);
//   const color = d3.scaleOrdinal()
//     .domain(["Africa", "Asia", "Europe", "North America", "South America", "Australia"])
//     .range([
//       "#e5c494", 
//       "#ffd92f", 
//       "#8da0cc",
//       "#a6d955", 
//       "#e88bc4", 
//       "#fc8d62"
//     ]);


//   var line = d3.line()
//       .x(function(d) { return x(d.Year); })
//       .y(function(d) { return y(d["Ladder score"]); });

//   var regions = Array.from(new Set(data.map(function(d) { return d.Region; })));

//   color.domain(regions);

  // var lines = svg.selectAll(".line")
  //     .data(regions)
  //     .enter().append("g")
  //     .attr("class", "line");

  //     lines.append("path")
  //     .attr("class", "line")
  //     .attr("d", function(region) {
  //         return line(data.filter(function(d) { return d.Region === region; }));
  //     })
  //     .style("stroke", function(region) { return color(region); })
  //     .style("fill", "none")
  //     .transition()
  //     .duration(1000)
  //     .attrTween("d", function(region) {
  //         var previous = d3.select(this).attr("d");
  //         var current = line(data.filter(function(d) { return d.Region === region; }));
  //         return d3.interpolateString(previous, current);
  //     });
  

  // // Add markers (circles) at each data point
  // lines.selectAll(".point")
  //     .data(function(region) { return data.filter(function(d) { return d.Region === region; }); })
  //     .enter().append("circle")
  //     .attr("cx", function(d) { return x(d.Year); })
  //     .attr("cy", function(d) { return y(d["Ladder score"]); })
  //     .attr("r", 4)
  //     .style("fill", function(d) { return color(d.Region); })
  //     .style("opacity", 0)
  //     .transition()
  //     .duration(1000)
  //     .style("opacity", 1);

  // // Add tooltips
  // lines.selectAll(".point")
  //     .data(function(region) { return data.filter(function(d) { return d.Region === region; }); })
  //     .append("title")
  //     .text(function(d) { return d.Region + " (" + d.Year + "): " + d["Ladder score"]; });

  // // Add the X Axis
  // svg.append("g")
  //     .attr("transform", "translate(0," + height + ")")
  //     .call(d3.axisBottom(x));

  // // Add the Y Axis
  // svg.append("g")
  //     .call(d3.axisLeft(y));

  // // Add legend
  // var legend = svg.selectAll(".legend")
  //     .data(regions)
  //     .enter().append("g")
  //     .attr("class", "legend")
  //     .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  // legend.append("rect")
  //     .attr("x", width - 18)
  //     .attr("width", 18)
  //     .attr("height", 18)
  //     .style("fill", function(region) { return color(region); });

  // legend.append("text")
  //     .attr("x", width - 24)
  //     .attr("y", 9)
  //     .attr("dy", ".35em")
  //     .style("text-anchor", "end")
  //     .text(function(d) { return d; });
// });

d3.json("/get_linedata", function(data) {
  var margin = { top: 20, right: 20, bottom: 50, left: 50 },
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

  var svg = d3.select("#multiline-graph")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.Year; }))
      .range([0, width]);

  var y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return d["Ladder score"]; })])
      .range([height, 0]);

  var color = d3.scaleOrdinal()
      .domain(["Africa", "Asia", "Europe", "North America", "South America", "Australia"])
      .range([
          "#e5c494",
          "#ffd92f",
          "#8da0cc",
          "#a6d955",
          "#e88bc4",
          "#fc8d62"
      ]);

  var line = d3.line()
      .x(function(d) { return x(d.Year); })
      .y(function(d) { return y(d["Ladder score"]); });
  var regions = Array.from(new Set(data.map(function(d) { return d.Region; })));
  // Store color information for each region
  var regionColors = {};

  // Initial drawing of the lines
  updateLines(data);

  // Add change event listener to the dropdown
  d3.select("#region").on("change", function() {
      var selectedRegion = this.value;
      var filteredData = (selectedRegion === "All") ? data : data.filter(function(d) { return d.Region === selectedRegion; });
      updateLines(filteredData);
  });
// Add change event listener to the country dropdown
d3.select("#country").on("change", function() {
  var selectedCountry = this.value;
  
  // Make a request to the Flask endpoint
  d3.json("/get_lineregion?country=" + selectedCountry, function(error, response) {
    if (error) {
      console.error("Error fetching region for country:", selectedCountry, error);
      return;
    }

    var selectedRegion = response.region;
    if (selectedRegion) {
      var filteredData = data.filter(d => d.Region === selectedRegion);
      updateLines(filteredData);
    } else {
      console.log("Region not found for country:", selectedCountry);
    }
  });
});





  function updateLines(data) {
      var regions = Array.from(new Set(data.map(function(d) { return d.Region; })));

      svg.selectAll(".line").remove();

      var lines = svg.selectAll(".line")
          .data(regions)
          .enter().append("g")
          .attr("class", "line");

      lines.append("path")
          .attr("class", "line")
          .attr("d", function(region) {
              return line(data.filter(function(d) { return d.Region === region; }));
          })
          .style("stroke", function(region) {
              // Use stored color information for each region
              if (!regionColors[region]) {
                  regionColors[region] = color(region);
              }
              return regionColors[region];
          })
          .style("fill", "none")
          .transition()
          .duration(1000)
          .attrTween("d", function(region) {
              var previous = d3.select(this).attr("d");
              var current = line(data.filter(function(d) { return d.Region === region; }));
              return d3.interpolateString(previous, current);
          });

      // Add markers (circles) at each data point
      lines.selectAll(".point")
          .data(function(region) { return data.filter(function(d) { return d.Region === region; }); })
          .enter().append("circle")
          .attr("cx", function(d) { return x(d.Year); })
          .attr("cy", function(d) { return y(d["Ladder score"]); })
          .attr("r", 4)
          .style("fill", function(d) { return color(d.Region); })
          .style("opacity", 0)
          .transition()
          .duration(1000)
          .style("opacity", 1);

      // Add tooltips
      lines.selectAll(".point")
          .data(function(region) { return data.filter(function(d) { return d.Region === region; }); })
          .append("title")
          .text(function(d) { return d.Region + " (" + d.Year + "): " + d["Ladder score"]; });
  }

  // Add the X Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // Add the Y Axis
  svg.append("g")
      .call(d3.axisLeft(y));

  // Add legend
  var legend = svg.selectAll(".legend")
      .data(regions)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function(region) { return color(region); });

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
});
