// Define tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Initialize the map with default year
updateMap(2024);


// Function to update the map based on the selected year
d3.select("#year-slider").on("input", function () {
  var year = +this.value;
  updateMap(year);

});

document.addEventListener('DOMContentLoaded', function() {
  d3.json('/years').then(function(data) {
      var yearDropdown = d3.select('#year');

      data.years.forEach(function(year) {
          yearDropdown.append('option').text(year);
      });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  d3.json('/countries').then(function(data) {
      var countryDropdown = d3.select('#country');

      data.countries.forEach(function(country) {
          countryDropdown.append('option').text(country);
      });
  });
});

// Update map function
function updateMap(year) {
    document.getElementById('selected-year').innerText = year;
    fetch("/data?year=" + year)
      .then(response => response.json())
      .then(function(data) {
        // Your code to handle the data goes here
        console.log(data);
    // Your code to handle the data goes here
    console.log(data);

      console.log(data)


        // Calculate width and height of the map container
        var mapContainer = document.getElementById('map-container');
        var mapWidth = mapContainer.offsetWidth;
        var mapHeight = mapContainer.offsetHeight;

        // Remove existing map if any
        d3.select("#map svg").remove();

        // Create SVG element for the map with calculated dimensions
        var svg = d3
    .select("#map-container")
    .append("svg")
    .attr("width", "100%") // Set width to 100% of container
    .attr("height", "100%") // Set height to 100% of container
    .attr("viewBox", "0 0 " + mapWidth + " " + mapHeight) // Maintain aspect ratio
    .attr("preserveAspectRatio", "xMidYMid meet"); // Center SVG content

        // Define projection
        var projection = d3.geoMercator().scale(160).translate([510, 240]);

        // Define path generator
        var path = d3.geoPath().projection(projection);

        // Define zoom behavior
var zoom = d3.zoom()
.scaleExtent([0.5, 8]) // Set zoom scale limits
.on("zoom", function() {
    svg.selectAll("path").attr("transform", d3.event.transform); // Apply transform to the map paths
    svg.selectAll("text")
        .attr("x", function(d) { return d3.event.transform.apply(projection([d.Longitude, d.Latitude]))[0]; })
        .attr("y", function(d) { return d3.event.transform.apply(projection([d.Longitude, d.Latitude]))[1]; });
});

// Apply zoom behavior to SVG element
svg.call(zoom);

// Reset zoom transform when no zoom is applied
svg.call(zoom.transform, d3.zoomIdentity);

        // Load world map data
        fetch("https://raw.githubusercontent.com/d3/d3.github.com/master/world-110m.v1.json")
        .then(response => response.json())
        .then(function(world) {
            // Draw world map
            svg
                .selectAll("path")
                .data(topojson.feature(world, world.objects.countries).features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("fill", "#20948B")
                .style("stroke", "white");

            // Append emojis to the map
            svg.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("x", function(d) {
              return projection([d.Longitude, d.Latitude])[0];
            })
            .attr("y", function(d) {
              return projection([d.Longitude, d.Latitude])[1];
            })
            .text(function(d) {
              // Assign emojis based on score
              if (d['Ladder score'] >= 6 && d['Ladder score'] <= 8) {
                return '🤩';
              } else if (d['Ladder score'] >= 4.5 && d['Ladder score'] < 6) {
                return '😑';
              } else if (d['Ladder score'] >= 1 && d['Ladder score'] < 4.5) {
                return '😡';
              } else {
                return '';
              }
            })
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("fill", function(d) {
              // Assign colors based on score
              if (d['Ladder score'] >= 6 && d['Ladder score'] <= 8) {
                return 'green';
              } else if (d['Ladder score'] >= 4.5 && d['Ladder score'] < 6) {
                return 'yellow';
              } else if (d['Ladder score'] >= 1 && d['Ladder score'] < 4.5) {
                return 'red';
              } else {
                return 'black';
              }
            })
            .on("mouseover", function(event, d) {
              // Get mouse coordinates relative to the SVG element
              var [x, y] = d3.mouse(this);
        
          
              // Show tooltip on mouseover
              tip
                .style("opacity", 1)
                .html(
                  `${d.Country}<br/>Happiness Score: ${d['Ladder score']}${d['Emoji']}<br/>Year: ${d.Year}`
                )
                .style("left", `${x - 25}px`)
                .style("top", `${y - 75}px`);
            })
            .on("mouseout", function() {
              // Hide tooltip on mouseout
              tip.style("opacity", 0);
            });
          
          var tip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        }).catch(function(error) {
          // Handle any errors that occur during the fetch
          console.error('Error fetching world data:', error);
        });
    })
  .catch(function(error) {
    // Handle any errors that occur during the fetch
    console.error('Error fetching data:', error);
  });
  
}
// Get references to the slider and the span element for the selected year
const slider = document.getElementById('year-slider');
const selectedYearSpan = document.getElementById('selected-year');

// Function to update the position of the selected year span
function updateSelectedYearPosition() {
    // Get the value (year) selected by the user
    const year = slider.value;

    // Update the text content of the span element to display the selected year
    selectedYearSpan.textContent = year;

    // Calculate the position of the span element based on the slider's value
    const sliderRect = slider.getBoundingClientRect();
    const sliderWidth = slider.offsetWidth;
    const sliderMin = parseInt(slider.min, 10);
    const sliderMax = parseInt(slider.max, 10);
    const percent = ((year - sliderMin) / (sliderMax - sliderMin)) * 100;
    const offsetX = (percent / 100) * sliderWidth;

    // Set the left position of the span element to align with the slider handle
    selectedYearSpan.style.left = `${sliderRect.left + offsetX}px`;
}

// Call the function to initially position the selected year span
updateSelectedYearPosition();

// Add event listener to the slider for input change
slider.addEventListener('input', updateSelectedYearPosition);



// Function to create the horizontal bar chart
function createBarChart(data) {
  const marginTop = 3;

  // Specify the chart’s dimensions, based on a bar’s height.
  const margin = { top: 20, right: 30, bottom: 40, left: 150 };
  const width = 730 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG container
  const svg = d3.select("#bar-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Sort the data by happiness score in descending order
  data.sort((a, b) => b["Ladder score"] - a["Ladder score"]);

  // Extract top 10 countries
  const topCountries = data.slice(0, 10);

  // Define scales
  const xScale = d3.scaleLinear()
      .domain([0, d3.max(topCountries, d => d["Ladder score"])])
      .range([0, width]);

  const yScale = d3.scaleBand()
      .domain(topCountries.map(d => d.Country))
      .range([0, height])
      .padding(0.1);

  // Create a value format.
  const format = xScale.tickFormat(20, "%");

  // Append a rect for each data entry.
  svg.append("g")
      .attr("fill", "#202020")
      .selectAll()
      .data(topCountries)
      .join("rect")
      .attr("x", xScale(0))
      .attr("y", d => yScale(d.Country))
      .attr("width", d => xScale(d["Ladder score"]))
      .attr("height", yScale.bandwidth())
      .on("mouseover", (event, d) => handleMouseOver(event, d))
      .on("mouseout", handleMouseOut);

  // Append a label for each data entry.
  svg.append("g")
      .attr("fill", "white")
      .attr("text-anchor", "end")
      .selectAll()
      .data(topCountries)
      .join("text")
      .attr("x", (d) => xScale(d["Ladder score"]))
      .attr("y", (d) => yScale(d.Country) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("dx", -4)
      .text((d) => d["Ladder score"])
      .attr("fill", "#EA6A47")
      .call((text) => text.filter(d => xScale(d["Ladder score"]) - xScale(0) < 20) // short bars
          .attr("dx", +4)
          .attr("fill", "#EA6A47")
          .attr("text-anchor", "start"));

      svg.append("g")
      .attr("transform", `translate(0,${marginTop})`)
      .call(d3.axisTop(xScale))
      .call(g => g.select(".domain").remove());

  // Add y-axis
  svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).tickSizeOuter(0));

  // Function to handle mouseover event
function handleMouseOver(event, d) {
  // Show tooltip with country name and happiness score
  tooltip.transition()
    .duration(200)
    .style("opacity", .9);
  tooltip.html(`<strong>${d.Country}</strong>: ${d["Ladder score"]}`)
    .style("left", (event.pageX) + "px")
    .style("top", (event.pageY - 28) + "px");
}


  // Function to handle mouseout event
  function handleMouseOut() {
    // Hide tooltip
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);
  }
}


const keys = ['Economy', 'Social support', 'Health', 'Freedom', 'Trust', 'Generosity'];
    const colorScale = d3.scaleOrdinal()
      .domain(keys)
      
      .range(['#202020', '#202020', '#202020', '#202020', '#202020', '#202020', '#202020', '#202020']);

      // .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf']);

    const initialXAttribute = 'Economy';
    const yAttribute = 'Ladder score';

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select('#bubble-chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
      .range([0, width]);

    const y = d3.scaleLinear()
      .range([height, 0]);

    const radius = d3.scaleSqrt()
      .range([5, 20]);

    const color = d3.scaleOrdinal()
      .range(d3.schemeCategory10);

    const xAxisGroup = svg.append('g')
      .attr('transform', `translate(0, ${height})`);

    const yAxisGroup = svg.append('g');

    const legendmargin = { left: 20 };
    const legendElement = createLegend(keys, colorScale, legendmargin).node();
    document.getElementById('legend-chart').appendChild(legendElement);

    function createLegend(keys, colorScale, margin) {
      const legend = d3.select('body')
        .append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('min-height', '33px')
        .style('font', '10px sans-serif')
        .style('margin-left', `${margin.left}px`);
    
      const legendItems = legend.append('div');
    
      const legendItem = legendItems.selectAll('.legend-item')
        .data(keys)
        .enter()
        .append('span')
        .classed('legend-item', true)
        .style('display', 'inline-flex')
        .style('align-items', 'center')
        .style('margin-right', '10px')
        .style('cursor', 'pointer')
        .style('padding', '5px 10px')
        .style('border', '1px solid #ccc')
        .style('border-radius', '4px')
        .style('background-color', '#f8f8f8')
        .on('mouseover', function() { d3.select(this).style('background-color', '#e8e8e8'); })
        .on('mouseout', function() { d3.select(this).style('background-color', '#f8f8f8'); })
        .on('click', function(selectedData) {
          // Remove the check mark from all items
          legendItems.selectAll('.check-mark').style('display', 'none');
    
          // Display the check mark for the clicked item
          const checkMark = d3.select(this).select('.check-mark');
          checkMark.style('display', 'inline');
    
          // Update the chart based on the selected item
          updateChart(selectedData);
        });
    
      legendItem.append('text')
        .classed('check-mark', true)
        .style('display', 'none')  // Initially hide the check mark
        .style('color', 'red')
        .style('margin-right', '0.5em')
        .text('✔');  // Unicode character for the check mark
    
      legendItem.append('text')
        .text(d => d);
    
      return legend;
    }
    
    
    
    let data;

    function updateScales(selectedAttribute) {
      x.domain(d3.extent(data, d => d[selectedAttribute]));
      y.domain(d3.extent(data, d => d[yAttribute]));
      radius.domain(d3.extent(data, d => d.Population));
      color.domain(d3.map(data, d => d.Region).keys());
    }
    function updateAxes() {
      const xAxis = d3.axisBottom(x);
      const yAxis = d3.axisLeft(y);
    
      // Update x axis
      xAxisGroup.call(xAxis)
        .selectAll("path") // Select the axis line
        .style("stroke", "#EA6A47"); // Change color of x axis line
      
      xAxisGroup.selectAll("text") // Select all text elements of x axis
        .style("fill", "#EA6A47"); // Change color of text labels
    
      // Update y axis
      yAxisGroup.call(yAxis)
        .selectAll("path") // Select the axis line
        .style("stroke", "#EA6A47"); // Change color of y axis line
      
      yAxisGroup.selectAll("text") // Select all text elements of y axis
        .style("fill", "#EA6A47"); // Change color of text labels
    }
    
    
    function updateCircles(selectedAttribute) {
      const circles = svg.selectAll('circle')
        .data(data);

        circles.enter()
        .append('circle')
        .attr('cx', d => x(d[selectedAttribute]))
        .attr('cy', d => y(d[yAttribute]))
        .attr('r', d => radius(d.Population) * 1.2) // Double the radius for larger bubbles
        .attr('fill', d => color(d.Region))
        .attr('opacity', 0.7) // Set transparency to 0.7 (adjust as needed)
        // .on('mouseover', function(event, d) {
        //   const tooltip = d3.select('body')
        //     .append('div')
        //     .style('position', 'absolute')
        //     .style('background-color', 'rgba(0, 0, 0, 0.8)') // Semi-transparent background
        //     .style('color', 'white')
        //     .style('padding', '5px')
        //     .style('border-radius', '5px')
        //     .style('pointer-events', 'none');
      
        //   tooltip.html(`
        //     <p>Country: ${d.Country}</p>
        //     <p>Region: ${d.Region}</p>
        //     <p>${yAttribute}: ${d[yAttribute]}</p>
        //     <p>${selectedAttribute}: ${d[selectedAttribute]}</p>
        //   `);
      
        //   // Replace const tooltipWidth = tooltip.node().offsetWidth;
        //   const tooltipWidth = tooltip.style('width');
      
        //   // Replace const tooltipHeight = tooltip.node().offsetHeight;
        //   const tooltipHeight = tooltip.style('height');
      
        //   const left = event.pageX + 10;
        //   const top = event.pageY - tooltipHeight - 10;
      
        //   tooltip
        //     .style('left', `${left}px`)
        //     .style('top', `${top}px`);
        // })
        // .on('mouseout', function() {
        //   d3.select('body').selectAll('div').remove();
        // })
        .merge(circles)
        .transition()
        .duration(500)
        .attr('cx', d => x(d[selectedAttribute]))
        .attr('cy', d => y(d[yAttribute]));
      circles.exit().remove();
    }
 
    // function updateRegionLegend() {
    //   const regionLegendGroup = svg.selectAll('.region-legend-group')
    //     .data([null]);

    //   const newRegionLegendGroup = regionLegendGroup.enter()
    //     .append('g')
    //     .classed('region-legend-group', true)
    //     .attr('transform', `translate(${width - 120}, ${height - 120})`);

    //   const regionLegend = newRegionLegendGroup.selectAll('.region-legend')
    //     .data(color.domain());

    //   const newRegionLegend = regionLegend.enter()
    //     .append('g')
    //     .classed('region-legend', true);

    //   newRegionLegend.append('rect')
    //     .classed('region-legend-color', true)
    //     .attr('x', 0)
    //     .attr('y', (d, i) => i * 20)
    //     .attr('width', 10)
    //     .attr('height', 10)
    //     .style('fill', d => color(d));

    //   newRegionLegend.append('text')
    //     .attr('x', 15)
    //     .attr('y', (d, i) => i * 20 + 9)
    //     .text(d => d);

    //   regionLegend.exit().remove();
    // }

    function updateChart(selectedAttribute) {
      console.log('Selected Attribute:', selectedAttribute);

      if (!data) {
        console.log('Data not available yet.');
        return;
      }

      updateScales(selectedAttribute);
      updateAxes();
      updateCircles(selectedAttribute);
    }

    fetch('/data')
      .then(response => response.json())
      .then(fetchedData => {
        data = fetchedData;
        updateChart(initialXAttribute);
      })
      .catch(error => console.error(error));


      var marginPCP = { top: 50, right: 10, bottom: 10, left: 40 };
      var widthPCP = 600 - marginPCP.left - marginPCP.right;
      let heightPCP = 350 - marginPCP.top - marginPCP.bottom;
      
      var xScale = d3.scalePoint().rangeRound([0, widthPCP]).padding(1),
      yScale = {},
      dragging = {};
      var c = d3
      .select("#parallel-coordinates-plot")
      .append("div")
      .attr("class", "parcoords")
      .style("width", widthPCP + marginPCP.left + marginPCP.right + "px")
      .style("height", heightPCP + marginPCP.top + marginPCP.bottom + "px");
      
      var svgDiv = c
      .append("svg")
      .attr("width", widthPCP + marginPCP.left + marginPCP.right)
      .attr("height", heightPCP + marginPCP.top + marginPCP.bottom)
      .append("g")
      .attr("transform", "translate(" + marginPCP.left + "," + marginPCP.top + ")");
      
      var num_line = d3.line(),
      //axis = d3.axisLeft(x),
      num_background,
      num_foreground,
      num_extents,
      // dimensions,
      origDimensions;
        var quant_p = function (v) {
          return parseFloat(v) == v || v == "";
        };
      
      //numerical data
      fetch("/pcp_data")
        .then((response) => response.json())
        .then((data) => {
          console.log("pcp data",data)

          dimensions = d3.keys(data[0]);
          origDimensions = dimensions.slice(0);
      
          xScale.domain(dimensions);
      
          dimensions.forEach(function (d) {
            var vals = data.map(function (p) {
              return p[d];
            });
            if (vals.every(quant_p)) {
              yScale[d] = d3
                .scaleLinear()
                .domain(
                  d3.extent(data, function (p) {
                    return +p[d];
                  })
                )
                .range([height, 0]);
            } else {
              vals.sort();
              yScale[d] = d3
                .scalePoint()
                .domain(
                  vals.filter(function (v, i) {
                    return vals.indexOf(v) == i;
                  })
                )
                .range([height, 0], 1);
            }
          });
      
          num_extents = dimensions.map(function (p) {
            return [0, 0];
          });
      
          // Add grey background lines for context.
          num_background = svgDiv
            .append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", path_num);
      
          // Add blue foreground lines for focus.
          num_foreground = svgDiv
            .append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", path_num);
      
          var g = svgDiv
            .selectAll(".dimension")
            .data(dimensions)
            .enter()
            .append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) {
              return "translate(" + xScale(d) + ")";
            })
            .call(
              d3
                .drag()
                .subject(function (d) {
                  return { x: xScale(d) };
                })
                .on("start", function (d) {
                  dragging[d] = xScale(d);
                  num_background.attr("visibility", "hidden");
                })
                .on("drag", function (d) {
                  dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                  num_foreground.attr("d", path_num);
                  dimensions.sort(function (a, b) {
                    return position_num(a) - position_num(b);
                  });
                  // extents.forEach(function(ext, idx) {
                  //   if(origDi)
      
                  // })
                  xScale.domain(dimensions);
                  g.attr("transform", function (d) {
                    return "translate(" + position_num(d) + ")";
                  });
                })
                .on("end", function (d) {
                  delete dragging[d];
                  transition_num(d3.select(this)).attr(
                    "transform",
                    "translate(" + xScale(d) + ")"
                  );
                  transition_num(num_foreground).attr("d", path_num);
                  num_background
                    .attr("d", path_num)
                    .transition()
                    .delay(500)
                    .duration(0)
                    .attr("visibility", null);
      
                  var new_extents = [];
                  for (var i = 0; i < dimensions.length; ++i) {
                    new_extents.push(num_extents[origDimensions.indexOf(dimensions[i])]);
                  }
                  num_extents = new_extents;
                  origDimensions = dimensions.slice(0);
                })
            );
      
          // Add an axis and title.
          var g = svgDiv.selectAll(".dimension");
          g.append("g")
            .attr("class", "axis")
            .each(function (d) {
              d3.select(this).call(d3.axisLeft(yScale[d]));
            })
            //text does not show up because previous line breaks somehow
            .append("text")
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function (d) {
              return d;
            });
      
          // Add and store a brush for each axis.
          g.append("g")
            .attr("class", "brush")
            .each(function (d) {
              if (yScale[d].name == "r") {
                // console.log(this);
      
                d3.select(this).call(
                  (yScale[d].brush = d3
                    .brushY()
                    .extent([
                      [-8, 0],
                      [8, height],
                    ])
                    .on("start", brushstart_num)
                    .on("brush", brush_parallel_chart_num))
                );
              }
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
      
             // Add title
             svgDiv
        .append("text")
        .attr("x", 300)
        .attr("y", -35 )
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("fill", "#202020")
        .style("font-weight", "bold")
        .text("Parallel Coordinates Plot (PCP)");
        });
        function position_num(d) {
          var v = dragging[d];
          return v == null ? xScale(d) : v;
        }
        
        function transition_num(g) {
          return g.transition().duration(500);
        }
        
        // Returns the path for a given data point.
        function path_num(d) {
          return num_line(
            dimensions.map(function (p) {
              return [position_num(p), yScale[p](d[p])];
            })
          );
        }
        
        // brush start function
        function brushstart_num() {
          d3.event.sourceEvent.stopPropagation();
        }
        
        // Handles a brush event, toggling the display of foreground lines.
        function brush_parallel_chart_num() {
          for (var i = 0; i < dimensions.length; ++i) {
            if (d3.event.target == yScale[dimensions[i]].brush) {
              num_extents[i] = d3.event.selection.map(
                yScale[dimensions[i]].invert,
                yScale[dimensions[i]]
              );
            }
          }
        
          num_foreground.style("display", function (d) {
            return dimensions.every(function (p, i) {
              if (num_extents[i][0] == 0 && num_extents[i][0] == 0) {
                return true;
              }
              return num_extents[i][1] <= d[p] && d[p] <= num_extents[i][0];
            })
              ? null
              : "none";
          });
        }
        
        function redrawPCP(selectedDimensions,data) {
          // Update axis labels
          // svgDiv.selectAll(".dimension")
          //   .style("display", function(d) {
          //     return selectedDimensions.includes(d) ? null : "none";
          //   })
          //   .attr("transform", function(d) {
          //     return "translate(" + xScale(d) + ")";
          //   });
          // svgDiv.selectAll(".background").remove();
          //  // Update scale domains
          //  xScale.domain(selectedDimensions);
        
          //  // Update axis labels
          //  svgDiv.selectAll(".dimension")
          //      .attr("transform", function(d) {
          //          return "translate(" + xScale(d) + ")";
          //      });
        
          //  // Redraw polylines
          //  svgDiv.selectAll(".foreground path")
          //      .attr("d", path_num)
          //      .style("display", function(d) {
          //     return selectedDimensions.every(function(dim) {
          //       return !isNaN(d[dim]);
          //     }) ? null : "none";
          //   })
          //   .attr("d", function(d) {
          //     return path_num(d);
          //   });
        
        // Reorder dimensions based on the selectedDimensions
        dimensions = selectedDimensions.concat(dimensions.filter(d => !selectedDimensions.includes(d)));
            
        // Update xScale domain
        xScale.domain(dimensions);
        
        // Update dimension groups
        svgDiv.selectAll(".dimension")
            .transition()
            .duration(1000)
            .attr("transform", function (d) {
                return "translate(" + xScale(d) + ")";
            });
        
        // Update axis labels
        svgDiv.selectAll(".dimension .axis")
            .each(function (d) {
                d3.select(this).call(d3.axisLeft(yScale[d]));
            });
        
        // Update brush for each axis
        svgDiv.selectAll(".dimension .brush")
            .each(function (d) {
                if (yScale[d].name == "r") {
                    d3.select(this).call(yScale[d].brush);
                }
            });
        
        // Update foreground lines
        svgDiv.selectAll(".foreground path")
            .transition()
            .duration(1000)
            .attr("d", path_num);
        }
        
        function generatePath(selectedDimensions, d) {
        return path_num(selectedDimensions.map(function(dim) {
            return [xScale(dim), yScale[dim](d[dim])];
        }));
        }

 

// Define variables
const percent = 0.65;
const barWidth = 40;
const numSections = 3;
const sectionPerc = 1 / numSections / 2;
const padRad = 0.05;
const chartInset = 10;

// Define helper functions
const percToDeg = (perc) => perc * 360;
const percToRad = (perc) => degToRad(percToDeg(perc));
const degToRad = (deg) => (deg * Math.PI) / 180;

// Set up SVG element
const gaugemargin = { top: 20, right: 20, bottom: 30, left: 20 };
const gaugewidth = document.querySelector('.chart-gauge').offsetWidth - gaugemargin.left - gaugemargin.right;
const gaugeheight = gaugewidth;
const gaugeradius = Math.min(gaugewidth, gaugeheight) / 2;

const gaugesvg = d3.select('.chart-gauge')
  .append('svg')
  .attr('width', gaugewidth + gaugemargin.left + gaugemargin.right)
  .attr('height', gaugeheight + gaugemargin.top + gaugemargin.bottom);

const chart = gaugesvg.append('g')
  .attr('transform', `translate(${(gaugewidth + gaugemargin.left) / 2}, ${(gaugeheight + gaugemargin.top) / 2})`);

// Define arc function
const arc = d3.arc()
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

  chart.append('path')
    .attr('class', `arc chart-color${sectionIndx}`)
    .attr('d', arc.startAngle(arcStartRad + startPadRad).endAngle(arcEndRad - endPadRad)());
}

// Define Needle class
class Needle {
  constructor(len, radius) {
    this.len = len;
    this.radius = radius;
  }

  drawOn(el, perc) {
    el.append('circle')
      .attr('class', 'needle-center')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', this.radius);

    el.append('path')
      .attr('class', 'needle')
      .attr('d', this.mkCmd(perc));
  }

  animateOn(el, targetPerc) {
    const self = this;
    el.transition()
      .delay(500)
      .ease(d3.easeCubicInOut)
      .duration(3000)
      .selectAll('.needle')
      .tween('progress', function() {
        const node = this;
        const initialPerc = parseFloat(d3.select(node).attr('data-perc')) || 0; // Get the initial percentage or default to 0
        return function(percentOfPercent) {
          const progress = initialPerc + (targetPerc - initialPerc) * percentOfPercent;
          d3.select(node).attr('d', self.mkCmd(progress));
        };
      })
      .attr('data-perc', targetPerc);
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

const needle = new Needle(90, 15);
needle.drawOn(chart, 0);
needle.animateOn(chart, percent);


// Create the table
const table = d3.select('#table-container')
  .append('table')
  .style('border-collapse', 'collapse');

// Create the table header
const thead = table.append('thead');
const headerRow = thead.append('tr');
headerRow.append('th').text('Score Range');
headerRow.append('th').text('Emoji');

// Create the table body
const tbody = table.append('tbody');

// Add rows for each score range and emoji
const rows = [
  { range: '6 - 8', emoji: '🤩' },
  { range: '4.5 - 6', emoji: '😑' },
  { range: '1 - 4.5', emoji: '😡' }
];


const tableRows = tbody.selectAll('tr')
  .data(rows)
  .enter()
  .append('tr');

tableRows.append('td')
  .text(d => d.range);

tableRows.append('td')
  .html(d => d.emoji);


