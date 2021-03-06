define(['d3'], function(d3) {

  /**
   * Object representing a stream graph
   */
  class StreamGraph {

    /**
     * Constructor
     */
    constructor(config) {

      this.element = config.element;
      this.height = config.height;
      this.width = config.width;
      this.margins = config.margins;
      this.data = config.data;
      this.colorMap = config.colorMap;
      this.legend = config.legend;

      // create group for svg elements
      this.svg = d3.select(this.element)
        .append("svg")
        .attr('width', this.width + this.margins.left + this.margins.right + 'px')
        .attr('height', this.height + this.margins.top + this.margins.bottom + 'px')
        .append("g")
        .attr("transform", "translate(" + this.margins.left + "," + this.margins.top + ")");

      this.z = d3.interpolateCool;

      // function to create area
      this.area = d3.area()
        .x(function(d) {
          return this.x(d[0]);
        }.bind(this))
        .y0(function(d) {
          return this.y(d[1]);
        }.bind(this))
        .y1(function(d) {
          return this.y(d[2]);
        }.bind(this));

      drawChart.call(this);
    }

    /**
     * Resizes the chart to passed width, height
     */
    resize(width, height) {
      d3.select(this.element).select("g").attr("transform", "scale(" + width / this.width + "," + height / this.height + ")");
      this.width = width;
      this.height = height;
    }

    /**
     * Removes the chart
     */
    destroy() {
      d3.select(this.element).select("svg").select("g").selectAll('*').remove();
      d3.select('#div-stream-legend').html("");
    }

    /**
     * Updates the data in the chart
     */
    update(data) {
        this.data = data;
        this.destroy();
        drawChart.call(this);
    }

  }

  /**
   * Draws the acutal chart
   */
  function drawChart() {

    // create scales for axes
    let xScale = d3.scaleTime().range([0, this.width]);
    xScale.domain([new Date(2008, 0, 0), new Date(2017, 0, 0)]);
    let yScale = d3.scaleLinear().range([this.height, 0]);
    yScale.domain([-1,1]);

    this.x = d3.scaleLinear()
      .domain([d3.min(this.data, xMin), d3.max(this.data, xMax)])
      .range([0, this.width]);

    this.y = d3.scaleLinear()
      .domain([d3.min(this.data, stackMin), d3.max(this.data, stackMax)])
      .range([this.height, 0]);

    // create areas with mouse events: tooltip
    let that = this;
    this.svg.append('g')
      .attr('id', 'area')
      .selectAll("path")
      .data(this.data)
      .enter().append("path")
      .attr("d", function(d) {
        return this.area(d.data)
      }.bind(this))
      .attr("fill", function(d) {
        return this.colorMap[d.label];
      }.bind(this))
      .on("mouseover", function(d) {
        d3.select("#tooltip").classed("hidden", false);
      })
      .on("mousemove", function(d){
        let rect = document.getElementById('div-stream').getBoundingClientRect();
        let xPosition = d3.event.pageX - rect.x;
        let yPosition = d3.event.pageY;

        let date = xScale.invert(xPosition - that.margins.left);
        let index = date.getYear()+1900-2008;

        let tooltip = d3.select("#tooltip")
          .style("left", xPosition + "px")
          .style("top", yPosition + "px");

        tooltip.select("#tooltip-year")
          .text(date.getYear()+1900);

        let lastVal = 0;
        for (let i =0; i < 5; i++){
          tooltip.select("#value-q-"+i)
            .text((100*(that.data[i].data[index][2] - lastVal)).toFixed(2)+"%");
          lastVal = that.data[i].data[index][2]
        }

        lastVal = 0;
        for (let i =0; i < 5; i++){
          tooltip.select("#value-a-"+i)
            .text((-100*(that.data[i+5].data[index][2] - lastVal)).toFixed(2)+"%");
          lastVal = that.data[i+5].data[index][2]
        }
      })
      .on("mouseout", function() {
        d3.select("#tooltip").classed("hidden", true);
      });

      // add axes
      this.svg.append("g")
          .attr('class', 'axis')
          .attr("transform", "translate(0," + this.height/2 + ")")
          .call(d3.axisBottom(xScale));

      this.svg.append("g")
          .attr('class', 'axis')
          .attr("transform", "translate(0,0)")
          .call(d3.axisLeft(yScale));

      // add legend
      if (this.legend){
         let legend6 = d3.select('#div-stream-legend').selectAll("legend")
               .data(getLabels(that.data));

         let p = legend6.enter().append("div")
         .attr("class","legends")
         .append("p").attr("class","country-name");

          p.append("span").attr("class","key-dot").style("background",function(d) { return that.colorMap[d] } );
          p.insert("text").text(function(d,i) { return d } );
      }
  }

  /**
   * Extracts labels based on json input format
   */
  function getLabels(data){
    console.log(data)
    let labels = []
    for (let i = data.length/2-1; i >= 0; i--){
      labels.push(data[i].label);
    }
    for (let i = data.length/2; i < data.length; i++){
      labels.push(data[i].label);
    }
    return labels;
  }

  /**
   * Calculates the maximum on a layer
   */
  function xMax(layer) {
    let data = layer.data;
    return d3.max(data, function(d) {
      return d[0];
    });
  }

  /**
   * Calculates the minimum on a layer
   */
  function xMin(layer) {
    let data = layer.data;
    return d3.min(data, function(d) {
      return d[0];
    });
  }

  /**
   * Calculates the maximum of several layers
   */
  function stackMax(layer) {
    let data = layer.data;
    return d3.max(data, function(d) {
      return Math.max(d[1], d[2]);
    });
  }

  /**
   * Calculates the minimum of several layers
   */
  function stackMin(layer) {
    let data = layer.data;
    return d3.min(data, function(d) {
      return Math.min(d[1], d[2]);
    });
  }

  return StreamGraph;

});
