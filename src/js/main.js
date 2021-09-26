exports.kmeans = function() {
  var gColors = null;
  const radius = 5;
  var svg = null;
  var prevRoots = null;
  var gHeight = null;
  var gWidth = null;
  var gSelectedDataSet = null;
  var gSelectedColumns = null;

  var xp = null;
  var yp = null;
  var xColumnName = null;
  var yColumnName = null;

  function emptyChild(ele) {
    while (ele.firstChild) {
      ele.removeChild(ele.firstChild);
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function l2distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  function drawLegend(k) {
    var legend = document.getElementById('legend');
    for (var i=0; i<k; ++i) {
      var dt = document.createElement("dt");
      dt.setAttribute("style", `float: left; width: 20px; height: 20px; vertical-align: middle; background: ${gColors[i]}`);
      legend.appendChild(dt);
      
      var dd = document.createElement("dd");
      dd.innerText = `Group ${i+1}`;
      legend.appendChild(dd);
    };
  }

  function pickItemsRandomly(k) {
    var items = [];
    while (items.length < k) {
      const idx = getRandomInt(gSelectedDataSet.length);
      if (!items.includes(idx)) {
        items.push(idx);
      }
    }

    return items;
  }

  function InitRoots(items) {
    var roots = [];
    
    for (var i=0; i<items.length; i++) {
      const selected = svg.select(`circle[idx='${items[i]}']`);
      roots.push({
        "cx": selected.attr("cx"),
        "cy": selected.attr("cy"),
        "color": gColors[i]
      });
    }

    return roots;
  }
  
  function getNewRoots(groups) {
    var roots = [];

    Object.keys(groups).forEach(function(key) {
      var xCenter = 0.0;
      var yCenter = 0.0;
      for (var i=0; i<groups[key].length; i++) {
        xCenter += parseFloat(groups[key][i]["x"]);
        yCenter += parseFloat(groups[key][i]["y"]);
      }

      roots.push({
        "cx": xCenter/groups[key].length,
        "cy": yCenter/groups[key].length,
        "color": key
      });
    });

    return roots;
  }

  function kmeans(roots, x, y) {
    var distances = [];
    for (var i=0; i<roots.length; i++) {
      distances.push({
        "d": l2distance(roots[i]["cx"], roots[i]["cy"], x, y),
        "color": roots[i]["color"]
      });
    }

    distances.sort((a, b) => (a.d > b.d) ? 1 : -1);
    return distances[0]["color"];
  }

  function drawTrainingData(x, y, xColName, yColName) {
    svg.append('g')
      .selectAll("dot")
      .data(gSelectedDataSet)
      .enter()
      .append("circle")
      .attr("idx", function(d, i) { return i; })
      .attr("class", "training")
      .attr("cx", function (d) { return x(d[xColName]); })
      .attr("cy", function (d) { return y(d[yColName]); })
      .attr("r", radius)
      .style("fill", function(d) {
        return "black";
      });
  }

  function drawRoots(roots, iter, totalIter) {
    for (var i=0; i<roots.length; i++) {
      const star = d3.symbol()
        .type(d3.symbolStar)
        .size(80);

      const center = svg.append('g')
        // .append("circle")
        .append("path")
        .attr("d", star)
        .attr("class", "roots")
        // .attr("cx", roots[i].cx)
        // .attr("cy", roots[i].cy)
        // .attr("r", radius)
        .attr("transform", `translate(${roots[i].cx}, ${roots[i].cy})`)
        .style("stroke", "black")
        .style("fill", roots[i].color);

      const text = svg.append("text")
        .attr("y", roots[i].cy)
        .attr("x", roots[i].cx)
        .attr("dy", "1.25em")
        .style("text-anchor", "middle")
        .text(iter);

      if (iter != 1 && iter != totalIter) {
        text.transition().duration(2500).style("opacity", 0.0);
      }

      if (iter != totalIter) {
        center.transition().duration(2500).style("opacity", 0.0);
      }

      if (iter != 1) {
        svg.append("line")
          .attr("x1", prevRoots[i].cx)
          .attr("x2", roots[i].cx)
          .attr("y1", prevRoots[i].cy)
          .attr("y2", roots[i].cy)
          .attr("stroke", "black")
          .attr("stroke-width", 2);
      }
    }
  }

  function buildKmeansHtml(td) {
    var divBtn = document.createElement("div");
    var btn = document.createElement("button");
    btn.addEventListener('click', function() {
      initInternal();
      start();
    });
    btn.setAttribute("id", "btnStart");
    btn.innerText = "Start";
    divBtn.appendChild(btn);

    var select = document.createElement("select");
    select.setAttribute("name", "kvalue");
    select.setAttribute("id", "kvalue");
    var opt1 = document.createElement("option");
    opt1.innerText="2";
    select.appendChild(opt1);
    var opt2 = document.createElement("option");
    opt2.innerText="3";
    select.appendChild(opt2);
    var opt3 = document.createElement("option");
    opt3.innerText="4";
    select.appendChild(opt3);
    select.addEventListener('change', function() {
      initInternal();
    });

    var labelK = document.createElement("label");
    labelK.setAttribute("for", "kvalue");
    labelK.innerText = "Choose a value for K: ";

    var divDl = document.createElement("div");
    var dl = document.createElement("dl");
    dl.setAttribute("id", "legend");
    dl.setAttribute("class", "kmeans-dl");
    divDl.appendChild(dl);

    var divStatus = document.createElement("div");
    divStatus.setAttribute("id", "status");
    divStatus.style.border = "1px solid black";
    divStatus.style.height = "400px";
    divStatus.style.overflowY = "scroll";
    
    var h3 = document.createElement("h3");
    h3.innerText = "Status";

    var labelIter = document.createElement("label");
    labelIter.innerText = "Iterations: ";

    var input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("value", "10");
    input.setAttribute("id", "iter");
    
    td.appendChild(labelK);
    td.appendChild(select);
    td.appendChild(divDl);
    td.appendChild(labelIter);
    td.appendChild(input);
    td.appendChild(divBtn);
    td.appendChild(h3);
    td.appendChild(divStatus);
  }

  function buildTable() {
    var table = document.createElement("table");
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    var td2 = document.createElement("td");
    var divViz = document.createElement("div");
    divViz.setAttribute("id", "kmeans-data-vis");

    buildKmeansHtml(td2);
    td1.appendChild(divViz);
    tr.appendChild(td1);
    tr.appendChild(td2);
    table.appendChild(tr);

    return table;
  }

  function isValidOptions(options) {
    if (options.selectedDataSet == null || options.selectedDataSet.length <= 0) {
      return false;
    }

    if (options.selectedColumns == null || options.selectedColumns.length < 2) {
      return false;
    }

    return true;
  }

  let publicScope = {};
  publicScope.init = function(ele, options) {
    if (!isValidOptions(options)) {
      return;
    }

    var extend = function(a, b){
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          a[key] = b[key];
        }
      }
      return a;
    }

    options = extend({
      colors: ["#FFB000", "#DC267F", "#648FFB", "#785EF0"],
      height: 640,
      width: 690,
      selectedDataSet: null, 
      selectedColumns: null, 
    }, options);

    gColors = options.colors;
    gHeight = options.height;
    gWidth = options.width;
    gSelectedDataSet = options.selectedDataSet; 
    gSelectedColumns = options.selectedColumns;
    
    ele.replaceChildren();
    ele.appendChild(buildTable());
    initInternal();
  }

  function initInternal() {
    const xColName = gSelectedColumns[0];
    const yColName = gSelectedColumns[1];
    // console.log(xColName);
    // console.log(yColName);
    xColumnName = xColName;
    yColumnName = yColName;
    
    // reset everything
    d3.select('div#kmeans-data-vis > *').remove();

    var status = document.getElementById('status');
    emptyChild(status);

    var legend = document.getElementById('legend');
    emptyChild(legend);
    
    var margin = {top: 10, right: 30, bottom: 40, left: 60},
        width = gWidth - margin.left - margin.right,
        height = gHeight - margin.top - margin.bottom;

    svg = d3.select("#kmeans-data-vis")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const xMinVal = Math.min(...gSelectedDataSet.map(ele => ele[xColName]));
    const xMaxVal = Math.max(...gSelectedDataSet.map(ele => ele[xColName]));

    const yMinVal = Math.min(...gSelectedDataSet.map(ele => ele[yColName]));
    const yMaxVal = Math.max(...gSelectedDataSet.map(ele => ele[yColName]));
    const step = Math.max(xMaxVal - xMinVal, yMaxVal - yMinVal) / 7.0;

    var x = d3.scaleLinear()
      .domain([xMinVal - step, xMaxVal + step])
      .range([0, width]);

    xp = d3.scaleLinear()
      .domain([0, width])
      .range([xMinVal - step, xMaxVal + step]);
    
    svg.append("g").attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("text")             
      .attr("transform", `translate(${width / 2}, ${(height + margin.top + 20)})`)
      .style("text-anchor", "middle")
      .text(xColName);

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(yColName);
  
    var y = d3.scaleLinear()
      .domain([yMinVal - step, yMaxVal + step])
      .range([height, 0]);

    yp = d3.scaleLinear()
      .domain([height, 0])
      .range([yMinVal - step, yMaxVal + step]);
    
    svg.append("g")
      .call(d3.axisLeft(y));
 
    const k = parseInt(document.getElementById("kvalue").value);
    gColors = gColors.slice(0, k);
    
    drawLegend(k);
    drawTrainingData(x, y, xColName, yColName);
  }

  async function start()  {
    const k = parseInt(document.getElementById("kvalue").value);
    document.getElementById("btnStart").disabled = true;

    const items = pickItemsRandomly(k);
    var roots = InitRoots(items);

    const iter = parseInt(document.getElementById("iter").value);
    for (var i=0; i<iter; i++) {
      var groups = {};
      for (var c=0; c<gColors.length; c++) {
        groups[gColors[c]] = [];
      }

      drawRoots(roots, i+1, iter);
      prevRoots = roots;

      svg.selectAll("circle.training")
        .style("fill", function(d) {
          const color = kmeans(
            roots,
            d3.select(this).attr("cx"), 
            d3.select(this).attr("cy")
          );
          
          groups[color].push({
            "x": d3.select(this).attr("cx"),
            "y": d3.select(this).attr("cy")
          });

          return color;
        });

      roots = getNewRoots(groups);

      var divOut = document.createElement("div");
      var divIter = document.createElement("div");
      divIter.innerText = `iteration: ${i+1}`;
      divOut.appendChild(divIter);
      for (var j=0; j<k; j++) {
        var divX = document.createElement("div");
        divX.style.background = roots[j]["color"];
        divX.innerHTML = `${xColumnName}: ${xp(roots[j]["cx"])}`;

        var divY = document.createElement("div");
        divY.style.background = roots[j]["color"];
        divY.innerHTML = `${yColumnName}: ${yp(roots[j]["cy"])}`;

        divOut.appendChild(divX);
        divOut.appendChild(divY);
      }
      divOut.appendChild(document.createElement("hr"));
      var status = document.getElementById("status");
      status.appendChild(divOut);

      await sleep(750);
      
      status.scrollTo(0, status.scrollHeight);
    }

    document.getElementById("btnStart").disabled = false;
  }

  return publicScope;
};
