var width = 500,
height = 500,
start = 0,
end = 1.25,
numSpirals = 4;

var theta = function(r) {
return numSpirals * Math.PI * r;
};

var r = d3.min([width, height]) / 2 - 40;

var radius = d3.scaleLinear()
.domain([start, end])
.range([40, r]);

var svg = d3.select("#chart").append("svg")
.attr("width", width)
.attr("height", height)
.append("g")
.attr("transform", "translate(" + width / 2 + "," + height/2 + ")");

// create the spiral
var points = d3.range(start, end + 0.001, (end - start) / 10000);

var spiral = d3.radialLine()
.curve(d3.curveCardinal)
.angle(theta)
.radius(radius);

var path = svg.append("path")
.datum(points)
.attr("id", "spiral")
.attr("d", spiral)
.style("fill", "none")
.style("stroke", "black");


var spiralLength = path.node().getTotalLength(),
  N = 730,
  barWidth = (spiralLength / N) - 1;
const parseDate = d3.timeParse('%Y-%m-%d');
const formatTime = d3.timeFormat("%B %d, %Y");


var cityName = 'Weather Data/CLT.csv';


function onChanged() {
  var select = d3.select('#citySelect').node();
  // Get current value of select element
  var city = select.options[select.selectedIndex].value;
  // Update chart with the selected city
  cityName = 'Weather Data/' + city + '.csv'
  updateChart(cityName);
}


function updateChart(cityName) {
  console.log(cityName)
  d3.csv(cityName).then(function(dataset) {
    // time scale
    dataset.forEach(function(d) {
      d.date = parseDate(d.date);
    });


    var timeScale = d3.scaleTime()
    .domain(d3.extent(dataset, function(d){
      return d.date;
    }))
    .range([0, spiralLength]);

    // yScale for the bar height
    var yScale = d3.scaleLinear()
    .domain([0, d3.max(dataset, function(d){
      return d.actual_mean_temp;
    })])
    .range([0, (r / numSpirals) - 30]);

    // append our rects
    var rects = svg.selectAll('.bar')
    .data(dataset, function(d) {return d.record_precipitation})

    var rectsEnter = rects.enter()
    .append('g')
    .attr('class', 'bar')

    rectsEnter.merge(rects)
    .append("rect")
    .attr("x", function(d,i){
      
      // placement calculations
      var linePer = timeScale(d.date),
          posOnLine = path.node().getPointAtLength(linePer),
          angleOnLine = path.node().getPointAtLength(linePer - barWidth);

      d.linePer = linePer; // % distance are on the spiral
      d.x = posOnLine.x; // x postion on the spiral
      d.y = posOnLine.y; // y position on the spiral
      
      d.a = (Math.atan2(angleOnLine.y, angleOnLine.x) * 180 / Math.PI) - 90; //angle at the spiral position

      return d.x;
    })
    .attr("y", function(d){
      return d.y;
    })
    .attr("width", function(d){
      return barWidth;
    })
    .attr("height", function(d){
      return yScale(d.record_precipitation * 25);
    })
    .style("fill", "steelblue")
    .style("stroke", "none")
    .attr("transform", function(d){
      return "rotate(" + d.a + "," + d.x  + "," + d.y + ")"; // rotate the bar
    });
    rects.exit().remove();

    var Tooltip = d3.select("#chart")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "2px")
      .style("font", "3px times")

    var mouseover = function(d) {
      Tooltip
        .style("opacity", 1)
      d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
    }
    var mousemove = function(d) {
      Tooltip
        .html("Date: "+ formatTime(d.date)+"<br>The highest precipitation record: " + d.record_precipitation + " in.")
        .style("left", (d3.mouse(this)[0]+150) + "px")
        .style("top", (d3.mouse(this)[1]+280) + "px")
    }
    var mouseleave = function(d) {
      Tooltip
        .style("opacity", 0)
      d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8)
    }

    svg.selectAll("rect")
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseout", mouseleave);

    // add date labels
    var tF = d3.timeFormat("%b %Y"),
      firstInMonth = {};
    svg.selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .attr("dy", 10)
    .style("text-anchor", "start")
    .style("font", "10px arial")
    .append("textPath")
    // only add for the first of each month
    .filter(function(d){
      var sd = tF(d.date);
      if (!firstInMonth[sd]){
        firstInMonth[sd] = 1;
        return true;
      }
      return false;
    })
    .text(function(d){
      return tF(d.date);
    })
    // place text along spiral
    .attr("xlink:href", "#spiral")
    .style("fill", "grey")
    .attr("startOffset", function(d){
      return ((d.linePer / spiralLength) * 100) + "%";
    })

  });
}

updateChart(cityName);
