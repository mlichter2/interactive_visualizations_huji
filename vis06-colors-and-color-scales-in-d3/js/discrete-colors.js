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
    // get the min and max gdp values for the color scale domain
    var max = d3.max(world.features,
        function (d) {
            return d.properties.gdp_md_est
        });

    var min = d3.min(world.features,
        function (d) {
            if (d.properties.gdp_md_est>0){
            return d.properties.gdp_md_est
            }
        });

    // create an array with the world's countries' gdp
    var gdp = [];

    world.features.forEach(function(item){
        if(item.properties.gdp_md_est>0){
            gdp.push(item.properties.gdp_md_est)
        }

    })
    // sort the array in ascending order
    gdp = gdp.sort(function(a, b){
        return a-b
    });

    //create color scale
    var threshScale = d3.scaleThreshold()
    .domain([min,
         d3.quantile(gdp, 0.25),
         d3.quantile(gdp, 0.5),
         d3.quantile(gdp, 0.75),
         max])
    .range(d3.schemeGreens[4])

    console.log([min,
        d3.quantile(gdp, 0.25),
        d3.quantile(gdp, 0.5),
        d3.quantile(gdp, 0.75),
        max])

    
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
        .attr("fill", function (d) {
            if (d.properties.gdp_md_est>0){
                // console.log(seqScalePal(d.properties.gdp_md_est))
                return threshScale(d.properties.gdp_md_est);
            }else{
                return "lightgray";
            }
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
