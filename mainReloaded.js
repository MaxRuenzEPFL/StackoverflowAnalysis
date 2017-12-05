'use strict';

$(function() {
  // Wait until HTML is loaded

  $('.carousel').carousel({
    interval: false,
    wrap: false
  });

  let optionsHist = {
    scales: {
      yAxes: [{
        type: 'logarithmic',
        ticks: {
          beginAtZero: true,
          padding: 20,
          fontColor: '#ffffff'
        },
        gridLines: {
          color: '#d3d3d3'
        },
        scaleLabel: {}
      }],
      xAxes: [{
        gridLines: {
          color: '#ffffff',
          display: false
        },
        ticks: {
          fontColor: '#ffffff'
        }
      }]
    },
    legend: {
      position: 'bottom'
    }
  };

  let ctx = document.getElementById("chart-descre");
  let myChart;

  d3.json("data/reputation_hist.json", function(json) {
    let data = json;
    data.datasets[0].backgroundColor = ["#4292c6", "#4292c6", "#4292c6", "#4292c6", "#4292c6", "#4292c6", "#4292c6", "#4292c6", "#4292c6", "#4292c6"];
    myChart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: optionsHist
    });
  });

  let ctx2 = document.getElementById("chart-class");
  let myChart2

  d3.json("data/classes.json", function(json) {
    let data = json;
    data.datasets[0].backgroundColor = ['#eff3ff', '#bdd7e7', '#bdd7e7', '#6baed6', '#6baed6', '#3182bd', '#3182bd', '#3182bd', '#3182bd', '#08519c'];

    myChart2 = new Chart(ctx2, {
      type: 'bar',
      data: data,
      options: optionsHist
    });

  });


  let ctx3 = document.getElementById("chart-contrib");
  let myChart3;
  let user_classes_feature = "Votes";
  d3.json("data/users_classes.json", function(json) {
    let data = json;
    data[user_classes_feature].datasets[0].backgroundColor = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];

    // TODO fill table


    myChart3 = new Chart(ctx3, {
      type: 'horizontalBar',
      data: data[user_classes_feature],
      options: {
        legend: {
          position: 'bottom'
        }
      }
    });
  });


  // stream Chart

  let colorMap = {
    "Questions One Time User": '#ffffff'
  };

  d3.json("data/QA_time.json", function(json) {
    let layers = json;

    var svg = d3.select("#div-stream").append("svg").attr('width', 1200).attr('height', 400),
      width = 1200,
      height = 400;

    var x = d3.scaleLinear()
      .domain([d3.min(layers, xMin), d3.max(layers, xMax)])
      .range([0, width]);

    var y = d3.scaleLinear()
      .domain([d3.min(layers, stackMin), d3.max(layers, stackMax)])
      .range([height, 0]);

    var z = d3.interpolateCool;

    var area = d3.area()
      .x(function(d) {
        return x(d[0]);
      })
      .y0(function(d) {
        return y(d[1]);
      })
      .y1(function(d) {
        return y(d[2]);
      });

    svg.selectAll("path")
      .data(layers)
      .enter().append("path")
      .attr("d", function(d) {
        return area(d.data)
      })
      .attr("fill", function(d) {
        return colorMap[d.label];
      })
      .on("mouseover", function(d) {

        let rect = document.getElementById('div-stream').getBoundingClientRect();
        var xPosition = d3.event.pageX - rect.x;
        var yPosition = d3.event.pageY;

        d3.select("#tooltip")
          .style("left", xPosition + "px")
          .style("top", yPosition + "px")
          .select("#value")
          .text(d.label);

        d3.select("#tooltip").classed("hidden", false);
      })
      .on("mouseout", function() {
        d3.select("#tooltip").classed("hidden", true);
      });

    function xMax(layer) {
      let data = layer.data;
      return d3.max(data, function(d) {
        return d[0];
      });
    }

    function xMin(layer) {
      let data = layer.data;
      return d3.min(data, function(d) {
        return d[0];
      });
    }

    function stackMax(layer) {
      let data = layer.data;
      return d3.max(data, function(d) {
        return d[2];
      });
    }

    function stackMin(layer) {
      let data = layer.data;
      return d3.min(data, function(d) {
        return d[1];
      });
    }

  });



  // parallel cordinates

  let widthPC = 500 - 50,
    heightPC = 500 - 50;

  var x = d3.scalePoint().range([0, widthPC], 1),
    y = {},
    dragging = {};

  var line = d3.line(),
    axis = d3.axisLeft(),
    background,
    foreground,
    dimensions;

  var svg = d3.select("#div-cordinates").append("svg")
    .attr("width", widthPC + 'px')
    .attr("height", heightPC + 'px')
    .append("g");

  d3.csv("data/users.csv", function(error, cars) {

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(cars[0]).filter(function(d) {
      return (y[d] = d3.scaleLinear()
        .domain(d3.extent(cars, function(p) {
          return +p[d];
        }))
        .range([heightPC, 0]));
    }));

    let valRanges = dimensions.map(function(d) {
      return d3.extent(cars, function(p) {
        return +p[d];
      })
    });

    let valRangesObj = {};
    for (let i = 0; i < dimensions.length; i++) {
      valRangesObj[dimensions[i]] = valRanges[i];
    }

    // Add grey background lines for context.
    background = svg.append("g")
      .attr("class", "background")
      .selectAll("path")
      .data(cars)
      .enter().append("path")
      .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
      .attr("class", "foreground")
      .selectAll("path")
      .data(cars)
      .enter().append("path")
      .attr("d", path);

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
      .data(dimensions)
      .enter().append("g")
      .attr("class", "dimension")
      .attr("class", "brush")
      .attr("transform", function(d) {
        return "translate(" + x(d) + ")";
      })
      .call(d3.drag()
        .subject(function(d) {
          return {
            x: x(d)
          };
        })
        .on("start", function(d) {
          dragging[d] = x(d);
          background.attr("visibility", "hidden");
        })
        .on("drag", function(d) {
          dragging[d] = Math.min(widthPC, Math.max(0, d3.event.x));
          foreground.attr("d", path);
          dimensions.sort(function(a, b) {
            return position(a) - position(b);
          });
          x.domain(dimensions);
          g.attr("transform", function(d) {
            return "translate(" + position(d) + ")";
          })
        })
        .on("end", function(d) {
          delete dragging[d];
          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
          transition(foreground).attr("d", path);
          background
            .attr("d", path)
            .transition()
            .delay(500)
            .duration(0)
            .attr("visibility", null);
        }));

    // Add an axis and title.
    g.append("g")
      .attr("class", "axis")
      .each(function(d) {
        d3.select(this).call(axis.scale(y[d]));
      })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) {
        return d;
      });

    // Add and store a brush for each axis.
    g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(y[d].brush = d3.brushY(y[d])
          .extent([
            [-8, 0],
            [8, heightPC]
          ])
          .on("start", brushstart)
          .on("brush", brush));
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);



    function position(d) {
      var v = dragging[d];
      return v == null ? x(d) : v;
    }

    function transition(g) {
      return g.transition().duration(500);
    }

    // Returns the path for a given data point.
    function path(d) {
      return line(dimensions.map(function(p) {
        return [position(p), y[p](d[p])];
      }));
    }

    function brushstart() {
      d3.event.sourceEvent.stopPropagation();
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {

      var actives = [];
      svg.selectAll(".brush")
        .filter(function(d) {
          return d3.brushSelection(this);
        })
        .each(function(d) {
          actives.push({
            dimension: d,
            extent: d3.brushSelection(this)
          });
        });

      foreground.style("display", function(d) {
        return actives.every(function(p) {
          let scaled = d3.scaleLinear().domain(valRangesObj[p.dimension]).range([heightPC, 0])(d[p.dimension]);
          return p.extent[0] <= scaled && scaled <= p.extent[1];
        }) ? null : "none";
      });
    }
  });

  let optionsBubble = {
    aspectRatio: 1,
    elements: {
      point: {
        radius: function(context) {
          var value = context.dataset.data[context.dataIndex];
          var size = context.chart.width;
          var base = Math.abs(value.v) / 10;
          return (size / 24) * base;
        },
        backgroundColor: function(context) {
          var value = context.dataset.data[context.dataIndex];
          return ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'][value.y];
        }
      }
    },
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          padding: 20,
          fontColor: '#ffffff'
        },
        gridLines: {
          color: '#d3d3d3'
        },
        scaleLabel: {}
      }],
      xAxes: [{
        type: 'logarithmic',
        gridLines: {
          color: '#ffffff',
          display: false
        },
        ticks: {
          fontColor: '#ffffff'
        }
      }]
    },
    legend: false
  };

  let ctx4 = document.getElementById("chart-evol");
  let myChart4,
    year = "2008";
  d3.json("data/users_classes_evol.json", function(json) {
    let data = json[year]
    myChart4 = new Chart(ctx4, {
      type: 'bubble',
      data: data,
      options: optionsBubble
    });

    $('#ex1').slider({
      formatter: function(value) {
        return 'Current value: ' + value;
      }
    });
  });


  let ctx5 = document.getElementById("chart-cust");
  d3.csv("data/users.csv", function (csv) {
      // TODO calcuate classes and create table
      let myChart5 = new Chart(ctx5, {
        type: 'horizontalBar',
        data: {
          labels: ["One time users",
            "Occasinal users",
            "Common users",
            "Frequent users",
            "Super users"
          ].reverse(),
          datasets: [{
            label: "",
            data: [1, 2, 4, 8, 16].reverse(),
            backgroundColor: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'].reverse()
          }]
        },
        options: {
          legend: {
            position: 'bottom'
          }
        }
      });
  });

  $('#slider').slider({
    formatter: function(value) {
      return 'Current value: ' + value;
    }
  });
  $("#slider").on("slide", function(slideEvt) {
    $("#vote-current").text(slideEvt.value);
  });
});
