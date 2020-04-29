// define window size
var width = window.innerWidth,
    height = window.innerHeight;

// creating an svg element
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var group = svg.append("g");

d3.json("data/world.geojson")
.then(drawMap);


function drawMap(geojson){

    var projection = d3.geoMercator()
    .translate([width/2, height/2])
    .center(d3.geoCentroid(geojson))
    .scale(150);

    var path = d3.geoPath()
    .projection(projection);

    group.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", function(d){
        
        return path(d)
    })
    .attr("stroke", "black")
    .attr("fill", "lightgray")

}


