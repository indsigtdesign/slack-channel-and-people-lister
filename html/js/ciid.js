var chartDiv = document.getElementById("chart");
var svg = d3.select(chartDiv).append("svg")
var width = chartDiv.clientWidth;
var height = chartDiv.clientHeight;

var infoDiv = document.getElementById("content");

var fader = function(color) {
        return d3.interpolateRgb(color, "#fff")(0.2);
    },
    color = d3.scaleOrdinal(d3.schemeCategory10.map(fader)),
    format = d3.format(",d");

var treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(1);

d3.json("js/ciid.json", function(error, data) {
	jsonData = data.children;

    if (error) throw error;

    var root = d3.hierarchy(data)
        .sum(sumBySize)
        .sort(function(a, b) {
            return b.height - a.height || b.value - a.value;
        });

    treemap(root);

    var cell = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform", function(d) {
            return "translate(" + d.x0 + "," + d.y0 + ")";
        });

    cell.append("rect")
        .attr("id", function(d) {
            return d.data.id;
        })
        .attr("width", function(d) {
            return d.x1 - d.x0;
        })
        .attr("height", function(d) {
            return d.y1 - d.y0;
        })
        .attr("fill", "lightBlue")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleMouseClick);

    cell.append("clipPath")
        .attr("id", function(d) {
            return "clip-" + d.data.id;
        })
        .append("use")
        .attr("xlink:href", function(d) {
            return "#" + d.data.id;
        });

    cell.append("text")
        .attr("clip-path", function(d) {
            return "url(#clip-" + d.data.id + ")";
        })
        .selectAll("tspan")
        .data(function(d) {
            return d.data.name.split(/(?=[A-Z][^A-Z])/g);
        })
        .enter().append("tspan")
        .attr("x", 4)
        .attr("y", function(d, i) {
            return 13 + i * 10;
        })
        .text(function(d) {
            return d;
        });

    cell.append("title")
        .text(function(d) {
            return d.data.name + "\n" + "members: " + format(d.value);
        });

    function changed(sum) {
        timeout.stop();

        treemap(root.sum(sum));

        cell.transition()
            .duration(750)
            .attr("transform", function(d) {
                return "translate(" + d.x0 + "," + d.y0 + ")";
            })
            .select("rect")
            .attr("width", function(d) {
                return d.x1 - d.x0;
            })
            .attr("height", function(d) {
                return d.y1 - d.y0;
            });
    }
});

function sumByCount(d) {
    return d.children ? 0 : 1;
}

function sumBySize(d) {
    return d.size;
}

// Create Event Handlers for mouse
function handleMouseOver(d, i) { // Add interactivity
    // Use D3 to select element, change color and size
    d3.select(this).attr("fill", "orange");

    // Specify where to put label of text
    svg.append("text").attr({
            id: "t" + d.x + "-" + d.y + "-" + i, // Create an id for text so we can select it later for removing on mouseout
            x: function() {
                return xScale(d.x) - 30;
            },
            y: function() {
                return yScale(d.y) - 15;
            }
        })
}

function handleMouseOut(d, i) {
    // Use D3 to select element, change color back to normal
    d3.select(this).attr("fill", "lightBlue");

    // Select text by id and then remove
    d3.select("#t" + d.x + "-" + d.y + "-" + i).remove(); // Remove text location
}

function handleMouseClick(d, i) {
	
	for (var i = 0; i < jsonData.length; i++) {
		if (d.data.name == jsonData[i].name) {
			// console.log(jsonData[i])
			var theContent = document.getElementById("theContent");
			var content = '<div id="theContent">'
		    		+'<h2 id="channel_name">Channel name: <a target="_blank" href="https://slack.com/app_redirect?channel='+jsonData[i].id+'">'+jsonData[i].name+'</a></h2>'
		    		+'<p id="topic">Topic: <br>'+jsonData[i].topic+'</p>'
		    		+'<p id="purpose"> Purpose: <br>'+jsonData[i].purpose+'</p>'
		    		+'<p id="created"> Created: <br>'+timestamp_to_time(jsonData[i].created)+'</p>'
		    		+'<p id="created"> Created by: <br>'+get_creator(jsonData[i].creator,jsonData[i].members)+'</p>'
		    		+'<p id="members"> Member count: <br>'+jsonData[i].members.length+' </p>'
		    		
		    		+'</div>'
		    		+'<p id="members"> Members: <br> </p>'
		    		+'<div id="theMembers">'+'</div>'
		    		

		    if(theContent){
		    	$("#theContent").remove();
		    	$("#theMembers").remove();
		    	$("#members").remove();
		    	$( "#content" ).append(content);
		    	getMembers(jsonData[i].members);
		    } else {
		    	$( "#content" ).append(content);
		    	getMembers(jsonData[i].members);
		    }
		}
	}
}

function timestamp_to_time(unix_timestamp) {
	// Create a new JavaScript Date object based on the timestamp
	// multiplied by 1000 so that the argument is in milliseconds, not seconds.
	var date = new Date(unix_timestamp * 1000);

	return date;
}

function get_creator(id, array) {
	console.log(id)
	console.log(array)

	for (var i = 0; i < array.length; i++) {
		console.log(array[i].id)
		if (id == array[i].id) {
			return array[i].name
		}
	}
	return "Creator not found or not a member anymore"
}

function getMembers(members) {
	for (var i = 0; i < members.length; i++) {
		var membersObj = '<div class="member">'
			+'<p id="name"> Name: <br>'+members[i].name+' </p>'
			+'<p id="alias"> Alias: <br>'+members[i].alias+' </p>'
			+'<p id="admin"> Admin status: <br>'+members[i].admin+' </p>'
			+'</div>'

		$( "#theMembers" ).append(membersObj);
	}
}