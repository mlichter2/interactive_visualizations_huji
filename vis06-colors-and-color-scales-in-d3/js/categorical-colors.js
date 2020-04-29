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


//load both datasets
Promise.all([d3.json("data/world.geojson"),
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
        .html(`<h3>${properties.name}</h3>` +
            `<b>GDP: </b>${properties.gdp_md_est}</br>` +
            `<b>Population: </b>${properties.pop_est}`)

}

function drawMap(data) {
    // the world geojson
    var world = data[0];

    //create a continents array for the color scale domain
    var continents = []
    world.features.forEach(function(item){
        if(!continents.includes(item.properties.continent)){
            continents.push(item.properties.continent)
        }
    });

    //create color scales
    var catScale = d3.scaleOrdinal()
    .domain(continents)
    .range(["red", "blue", "cyan", "pink","yellow", "purple"])

    var catScalePal = d3.scaleOrdinal()
    .domain(continents)
    .range(d3.schemeAccent )




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
        .attr("fill", function(d){
            return catScalePal(d.properties.continent)
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
