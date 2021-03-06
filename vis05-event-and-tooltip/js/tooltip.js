// define window size
var width = window.innerWidth,
    height = window.innerHeight;

// creating an svg element
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

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
    .center([0, 0])
    .scale(180);

//create a tooltip div element 
var tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")


//make the tooltip visible, populate with data and locate
function showToolTip(properties, coords) {
    //event screen coordinates
    var x = coords[0];
    var y = coords[1];
    //parse the date
    var date = new Date(properties.time).toString();
    date = date.split('GMT')
    date = date[0] + "UTC"
    //style the tooltip and add nested html content 
    d3.select("#tooltip")
        .style("display", "block")
        .style("top", y + 'px')
        .style("left", x + 'px')
        .html(`<h3>${properties.title}</h3>` +
            `<b>Margnitude:</b>${properties.mag}</br>` +
            `<b>Date:</b>${date}`)

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
                return d.properties.mag * 2;
            } else {
                return 0
            }
        })
        .style("opacity", 0.5)
        .style("fill", "red")
        //change point color event
        .on("mouseover", function (d) {
            this.style.fill = "blue"
        })
        .on("mouseout", function (d) {
            this.style.fill = "red"
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


