
var basemapProviders = {

    'ESRI_World_Light_Gray_Base': L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        'attribution': 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 19,
        minZoom: 3
    }),

    'ESRI_World_Dark_Gray_Base': L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        'attribution': 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 19,
        minZoom: 3
    }),
    'OSM': L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        'attribution': '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        minZoom: 3
    }),
    'MapBox': L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-zr0njcqy/{z}/{x}/{y}.png', {
        attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
        maxZoom: 19,
        minZoom: 3
    }),
}
// define window size
var width = window.innerWidth,
    height = window.innerHeight;

//define basemap defaults
var zoom = 3
var layer = basemapProviders['ESRI_World_Light_Gray_Base']
var center = [0, 0]

var map = new L.Map("container", {
    center: [center[1], center[0]],
    zoom: zoom,

}).addLayer(layer);

map.zoomControl.setPosition('bottomright');

function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}

var transform = d3.geoTransform({
    point: projectPoint
});

var path = d3.geoPath()
    .projection(transform);



// creating an svg element
var svg = d3.select(map.getPanes().overlayPane)
    .append("svg")

var g = svg.append('g')
    .attr("class", "leaflet-zoom-hide")


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
var group = g.append("g")
    .attr("id", "world");
var quakesGroup = g.append("g")
    .attr("id", "quakes");

//load both datasets
Promise.all([d3.json("data/world.geojson"),
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
]).then(drawMap);


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
function parseDate(time) {
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

    //bind the data (no exit and update in this case)
    group.selectAll("path")
        .data(world.features)
        .enter()
        .append("path")
        .attr("d", function (d) {
            return path(d)
        })
        .attr("stroke", "black")
        .attr("fill", "transparent")

    drawEarthQuakes(quakes)

    map.on("viewreset", reset);
    reset();

    function reset() {

        var bounds = path.bounds(world),
            topLeft = bounds[0],
            bottomRight = bounds[1];

        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        group.selectAll("path").attr("d", path)
        quakesGroup.selectAll("circle")
            .attr("cx", function (d) {
                return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x
            })
            .attr("cy", function (d) {
                return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y
            })

        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");
    }

}
// drawing earthquakes - only enter data at this point - no update
function drawEarthQuakes(geojson) {

    var earthquakes = geojson.features

    //calculate the min and max time of all earthquakes
    var maxTime = d3.max(earthquakes, function (d) {
        return d.properties.time;
    });

    var minTime = d3.min(earthquakes, function (d) {
        return d.properties.time;
    });

    //calculate the min and max magnitude of all earthquakes
    var maxMag = d3.max(earthquakes, function (d) {
        return d.properties.mag;
    });

    var minMag = d3.min(earthquakes, function (d) {
        if (d.properties.mag > 0) {
            return d.properties.mag;
        }
    });

    // create a sequantial color scale
    var seqScale = d3.scaleSequential()
        .domain([minTime, maxTime])
        .interpolator(d3.interpolateGnBu)



    //****************************************************/
    //            legend
    //****************************************************/


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

    


    //****************************************************/
    //            interaction
    //****************************************************/
    var timeDropdown = d3.select("#time-filter")
        .selectAll("a")
        .data(['Day', 'Week'])
        .enter()
        .append("a")
        .attr("class", "dropdown-item")
        .text(function (d) {
            return d;
        })

    timeDropdown.on("click", function (d) {

        if (d === 'Day') {
            minTime = maxTime - (24 * 60 * 60 * 1000)
            updateData(minTime, maxTime, minMag, maxMag)
        } else {
            minTime = maxTime - (7 * 24 * 60 * 60 * 1000)
            updateData(minTime, maxTime, minMag, maxMag)
        }
    })

    var buttonStart = d3.select("#button-start");
    var buttonStop = d3.select("#button-stop");

    var days = 1;

    function createInterval() {
        maxTime = minTime + (days * 24 * 60 * 60 * 1000)

        days += 1
        if (days >= 8) {
            days = 1
        }

        updateData(minTime, maxTime, minMag, maxMag)
    }

    var interval;

    buttonStart.on("click", function () {
        clearInterval(interval)

        interval = setInterval(createInterval, 3000)

    });

    var buttonStop = d3.select("#button-stop");

    buttonStop.on("click", function () {
        clearInterval(interval)
    });







    //****************************************************/
    //           update data
    //****************************************************/
    updateData(minTime, maxTime, minMag, maxMag)

    function updateData(minTimeMap, maxTimeMap, minMagMap, maxMagMap) {
        //add title
        title.html(`${parseDate(minTimeMap)}<br/>${parseDate(maxTimeMap)}`)
        // create a sequantial color scale
        seqScale = d3.scaleSequential()
            .domain([minTimeMap, maxTimeMap])
            .interpolator(d3.interpolateGnBu)



        //****************************************************/
        //            legend
        //****************************************************/

        //create magnitudes and dates arrays for the legend elements
        var eqMags = [];
        var eqDates = [];


        for (var i = minMag; i <= maxMag; i += 1) {
            eqMags.push(i)
        }

        for (var i = minTime; i <= maxTime; i += (maxTime - minTime) / 7) {
            eqDates.push(i)
        }

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

        legendCircleJoin.exit()
        .remove();

        legendCircleJoin
            .attr("cx", function (d, i) {
                return 100 + i * space;
            })
            .attr("r", function (d) {
                return d * 4;
            })
          


        //create the legend magnitude mag labels join, bind the earthquakes mag array        
        var legendLabelsJoin = legendSvg.selectAll(".labels")
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
            .text(function (d) {
                return d;// add the text
            });

        legendLabelsJoin.exit()
        .remove();

        legendLabelsJoin
            .attr("x", function (d, i) {
                return 100 + i * space;// i is for index - every element is spaces by its index times the constant space
            })
            .text(function (d) {
                return d;// add the text
            });


        //create the legend dates labels join, bind the earthquakes dates array     
        var legendDatesJoin = legendSvg.selectAll(".dates")
            .data(eqDates);

        //enter and append        
        legendDatesJoin.enter()
            .append("text")
            .attr("class", "dates")
            .attr("x", function (d, i) {
                return 100 + i * (space * 7) / eqDates.length;
            })
            .attr("y", 230)
            .style("fill", color)
            .style("writing-mode", "vertical-rl")
            .text(function (d) {
                return parseDate(d);
            });

        legendDatesJoin.exit()
            .remove();

        legendDatesJoin
            .attr("x", function (d, i) {
                return 100 + i * (space * 7) / eqDates.length;
            })
            .text(function (d) {
                return parseDate(d);
            });







        //****************************************************/
        //            earthquaks
        //****************************************************/

        earthquakes = [];
        geojson.features.forEach(function (item) {
            if (item.properties.time >= minTimeMap && item.properties.time <= maxTimeMap
                && item.properties.mag >= minMagMap && item.properties.mag <= maxMagMap) {
                earthquakes.push(item)
            }
        })
        //bind the geojson point data
        var quakesJoin = quakesGroup.selectAll("circle")
            .data(earthquakes);

        //append svg elements and style them
        quakesJoin.enter()
            .append("circle")
            .attr("cx", function (d) {
                return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x;
            })
            .attr("cy", function (d) {
                return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y;
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
            .style("fill", function (d) {
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

        quakesJoin.exit()
            .remove();

        quakesJoin
            .attr("cx", function (d) {
                return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).x;
            })
            .attr("cy", function (d) {
                return map.latLngToLayerPoint([d.geometry.coordinates[1], d.geometry.coordinates[0]]).y;
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
            .style("fill", function (d) {
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




}


