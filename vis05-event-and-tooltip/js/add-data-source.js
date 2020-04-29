// define window size
var width = window.innerWidth,
    height = window.innerHeight;

// creating an svg element
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var group = svg.append("g");
var quakesGroup =svg.append("g");

Promise.all([d3.json("data/world.geojson"),
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
]).then(drawMap);

//define the d3 projection
var projection = d3.geoMercator()
.translate([width/2, height/2])
.center([0,0])
.scale(150);


function drawMap(data){
  
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
    .attr("d", function(d){        
        return path(d)
    })
    .attr("stroke", "black")
    .attr("fill", "lightgray")

    drawEarthQuakes(quakes)

}
// drawing earthquakes - only enter data at this point - no update
function drawEarthQuakes(geojson){

    var quakesJoin = quakesGroup.selectAll("circle")
    .data(geojson.features);

    quakesJoin.enter()
    .append("circle")
    .attr("cx", function(d){
        return projection(d.geometry.coordinates)[0];
    })
    .attr("cy", function(d){
        return projection(d.geometry.coordinates)[1];
    })
    .attr("r", function(d){
        if (d.properties.mag>0 ){
            return d.properties.mag*2;
        }else {
            return 0
        }
        
    });

}


