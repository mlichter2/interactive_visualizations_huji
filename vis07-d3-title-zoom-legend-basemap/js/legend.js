// define window size
var width = window.innerWidth,
    height = window.innerHeight;

// creating an svg element
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
     //add a call to the zoom behaviour api
    .call(d3.zoom().on("zoom", function () {
        svg.attr("transform", d3.event.transform)
    }));

//legend svg
var legendSvg = d3.select("body")
    .append("svg")
    .attr("width", "500px")
    .attr("height", "400px")
    .style("position", "absolute")
    .style("bottom", "1px")
    .style("left", "1px")

// create two svg group elements, one for the base map
//and one for the earthquake points
var group = svg.append("g");
var quakesGroup = svg.append("g");

//load both datasets
Promise.all([d3.json("data/world.geojson"),
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
]).then(drawMap);

//define the d3 projection
var projection = d3.geoMercator()
    .translate([width / 2, height / 2])
    .center([0, 35])
    .scale(180);

//create a tooltip div element 
var tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")

//create title
var title = d3.select("body")
    .append("h2")
    .attr("id", "title")
    .style("position", "absolute")
    .style("left", "50%")
    .style("top", "5%")
    .style("transform", "translate(-50%, 0)")

//parse date
function parseDate(time){
    var date = new Date(time).toString();
    date = date.split('GMT')
    date = date[0]
    date = date.slice(4, -4)
    return date
}

//make the tooltip visible, populate with data and locate
function showToolTip(properties, coords) {
    //event screen coordinates
    var x = coords[0];
    var y = coords[1];
    //parse the date
    var date = parseDate(properties.time);

    //style the tooltip and add nested html content 
    d3.select("#tooltip")
        .style("display", "block")
        .style("top", y + 'px')
        .style("left", x + 'px')
        .html(`<h3>${properties.title}</h3>` +
            `<b>Margnitude </b>${properties.mag}</br>` +
            `<b>Date: </b>${date}`)

}

function drawMap(data) {

    var world = data[0];
    var quakes = data[1];

    // create a d3 geopath
    var path = d3.geoPath()
        .projection(projection);

    //bind the data (no exit and update in this case)
    group.selectAll("path")
        .data(world.features)
        .enter()
        .append("path")
        .attr("d", function (d) {
            return path(d)
        })
        .attr("stroke", "black")
        .attr("fill", "lightgray")

    drawEarthQuakes(quakes)

}
// drawing earthquakes - only enter data at this point - no update
function drawEarthQuakes(geojson) {

    //bind the geojson point data
    var quakesJoin = quakesGroup.selectAll("circle")
        .data(geojson.features);

    //calculate the min and max time of all earthquakes
    var maxTime = d3.max(geojson.features, function(d){
        return d.properties.time;
    });

    var minTime = d3.min(geojson.features, function(d){
        return d.properties.time;
    });

    //calculate the min and max magnitude of all earthquakes
    var maxMag = d3.max(geojson.features, function(d){
        return d.properties.mag;
    });

    var minMag = d3.min(geojson.features, function(d){
        if (d.properties.mag>0){
        return d.properties.mag;
        }
    });

    //create magnitudes and dates arrays for the legend elements
    var eqMags = [];
    var eqDates = [];
  

    for(var i=minMag; i<=maxMag; i+=1){
        eqMags.push(i)
    }

    for(var i=minTime; i<=maxTime; i+=(maxTime-minTime)/7){
        eqDates.push(i)
    }


    //add title
    title.html(`${parseDate(minTime)}<br/>${parseDate(maxTime)}`)

    // create a sequantial color scale
    var seqScale = d3.scaleSequential()
    .domain([minTime, maxTime])
    .interpolator(d3.interpolateGnBu)

    //populate legend

    //legend title
    legendSvg.append("text")
        .text("Legend")
        .attr("x", 100)
        .attr("y", 20)
        .attr("font-size", "30px")
    //mangs title
    legendSvg.append("text")
        .text("Magnitude")
        .attr("x", 100)
        .attr("y", 70)
        .attr("font-size", "20px")

    var space = 50;// a constant space to use between legend elements
    var color = "black";// a default color to use for legend elements

    //create the legend magnitude circle join, bind the earthquakes mag array
    var legendCircleJoin = legendSvg.selectAll("circle")
        .data(eqMags);

    //enter and append
    legendCircleJoin.enter()
        .append("circle")
        .attr("cx", function (d, i) {
            return 100 + i * space;
        })
        .attr("cy", 100)
        .attr("r", function (d) {
            return d * 4;
        })
        .style("fill", color)

    //create the legend magnitude mag labels join, bind the earthquakes mag array        
    var legendLabelsJoin = legendSvg.selectAll(".lables")
        .data(eqMags);

    //enter and append       
    legendLabelsJoin.enter()
        .append("text")
        .attr("class", "labels")
        .attr("x", function (d, i) {
            return 100 + i * space;// i is for index - every element is spaces by its index times the constant space
        })
        .attr("y", 150)
        .style("fill", color)
        .style("text-anchor", "middle")
        .text(function(d){
            return d;// add the text
        });

    //dates title
    legendSvg.append("text")
        .text("Dates")
        .attr("x", 100)
        .attr("y", 180)
        .attr("font-size", "20px")

    // append the defs for the svg ractange gradient        
    var svgDefs = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "my-grad")

    svgDefs.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", seqScale(minTime))// get the color of the ninimum date

    svgDefs.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", seqScale(maxTime))// get the color of the maximum date

    // append the ractangle
    legendSvg.append("rect")
        .attr("id", "legend-rect")
        .attr("x", 100)
        .attr("y", 190)
        .attr("width", space * 6)
        .attr("height", 35)
        .attr("fill", "url(#my-grad)");// define the fill as the linear gradiend defined in defs

    //create the legend dates labels join, bind the earthquakes dates array     
    var legendDatesJoin = legendSvg.selectAll(".dates")
        .data(eqDates);

    //enter and append        
    legendDatesJoin.enter()
        .append("text")
        .attr("class", "dates")
        .attr("x", function (d, i) {
            return 100 + i * space;
        })
        .attr("y", 230)
        .style("fill", color)
        .style("writing-mode", "vertical-rl")
        .text(function(d){
            return parseDate(d);
        });



    //append svg elements and style them
    quakesJoin.enter()
        .append("circle")
        .attr("cx", function (d) {
            return projection(d.geometry.coordinates)[0];
        })
        .attr("cy", function (d) {
            return projection(d.geometry.coordinates)[1];
        })
        // scale the points by magnitude, send negative mag values to 0
        .attr("r", function (d) {
            if (d.properties.mag > 0) {
                return d.properties.mag * 4;
            } else {
                return 0
            }
        })
        .style("opacity", 0.5)
        .style("fill", function(d){
            return seqScale(d.properties.time)
        })
        //change point color event
        .on("mouseover", function (d) {
            this.style.fill = "#0077b3"
        })
        .on("mouseout", function (d) {
            this.style.fill = seqScale(d.properties.time)
        })
        //show tooltip event
        .on("mousemove", function (d) {
            showToolTip(d.properties, [d3.event.clientX, d3.event.clientY + 30])
        })
        .on("mouseleave", function () {
            d3.select("#tooltip")
                .style("display", "none")
        })



}


