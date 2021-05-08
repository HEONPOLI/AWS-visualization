const MARGIN = 20;
const ANGLE = 78.5;
const SPAN = 750;
const OPACITY = 0.14;

const svg = d3.select("body").select("svg");
const diameter = +svg.attr("width");

const nodeGroup = svg
  .append("g")
  .attr("class", "nodeGroup")
  .attr("transform", `translate(${diameter / 2}, ${diameter / 2})`);

const defs = svg.append("defs");

let labelGroup = null;
let linkGroup = null;

let showLink = true;
let zoomAble = true; // unable to zoom while searching

const color = d3
  .scaleLinear()
  .domain([-1, 5])
  .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
  .interpolate(d3.interpolateHcl);

const pack = d3
  .pack()
  .size([diameter - MARGIN, diameter - MARGIN])
  .padding(8);

const dropDown = document.querySelector("select");
const retButton = document.querySelector(".button--return");
const viewButton = document.querySelector(".button--view");
const linkButton = document.querySelector(".button--link");

//<<<================== init DEFINITION ==================>>>

const init = function (graph) {
  root = d3
    .hierarchy(graph.root)
    .sum((d) => d.size)
    .sort((a, b) => b.value - a.value);

  const nodes = pack(root).descendants();
  const links = graph.links;

  let focus = root;
  let view;

  defs
    .append("marker")
    .attr("id", "marker-dot")
    .attr("markerHeight", 5)
    .attr("markerWidth", 5)
    .attr("markerUnits", "strokeWidth")
    .attr("orient", "auto")
    .attr("refX", 0)
    .attr("refY", 0)
    .attr("viewBox", "-6 -6 12 12")
    .append("path")
    .attr("d", "M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0")
    .attr("fill", "white");

  defs
    .append("marker")
    .attr("id", "marker-arrow")
    .attr("markerHeight", 5)
    .attr("markerWidth", 5)
    .attr("markerUnits", "strokeWidth")
    .attr("orient", "auto")
    .attr("refX", 0)
    .attr("refY", 0)
    .attr("viewBox", "-5 -5 10 10")
    .append("path")
    .attr("d", "M 0,0 m -5,-5 L 5,0 L -5,5 Z")
    .attr("fill", "white");

  const circle = nodeGroup
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", function (d) {
      return d.parent
        ? d.children
          ? "node"
          : "node node--leaf"
        : "node node--root";
    })
    .style("display", (d) => (d.height === 0 ? "none" : "inline"))
    .style("fill", (d) => color(d.depth))
    // .style("opacity", (d) => (d.depth > 1 ? OPACITY : 1))
    .on("click", function (event, d) {
      if (d.height === 0 || zoomAble === false) {
        //pass
      } else if (focus === d) {
        zoom(d.parent);
      } else {
        zoom(d);
        event.stopPropagation();
      }
    });
  // .call(
  //   d3
  //     .drag()
  //     .on("start", dragstarted)
  //     .on("drag", dragged)
  //     .on("end", dragended)
  // );

  const image = nodeGroup
    .selectAll("image")
    .data(nodes)
    .enter()
    .append("image")
    .attr("class", "label")
    .attr("x", (d) => -d.r / 4)
    .attr("y", (d) => -d.r / 4)
    .attr("width", (d) => d.r / 2)
    .attr("height", (d) => d.r / 2)
    .attr("href", (d) => d.data.href)
    // .style("opacity", (d) => (d.depth > 1 ? 0 : 1))
    .style("opacity", (d) => (d.height === 1 ? 1 : 0))
    .style("display", (d) => (d === root ? "none" : "inline"));

  const node = nodeGroup.selectAll("circle, image");

  //<<<================== event listeners ==================>>>

  zoomTo([root.x, root.y, root.r * 2 + MARGIN]);

  dropDown.addEventListener("change", function (event) {
    const val = event.target.value;

    if (val !== "init") {
      zoomAble = false;
      retButton.disabled = true;
      linkButton.disabled = true;

      nodeGroup
        .selectAll("circle")
        .style("opacity", (d) =>
          d.data.name.startsWith(val) ? 1 : d !== root ? OPACITY : null
        );

      nodeGroup
        .selectAll("image")
        .style("opacity", (d) =>
          d.data.name.startsWith(val) ? 1 : d !== root ? 0 : null
        );

      linkGroup.selectAll("path").style("display", "none");
      showLink = false;
    }
  });

  retButton.addEventListener("click", (event) => zoom(root));

  viewButton.addEventListener("click", function (event) {
    zoomAble = true;
    retButton.disabled = false;
    linkButton.disabled = false;

    nodeGroup
      .selectAll("image")
      .style("opacity", (d) => (d.height === 1 ? 1 : 0));

    nodeGroup.selectAll("circle").style("opacity", (d) => 1);

    linkGroup.selectAll("path").style("display", "inline");
    showLink = true;

    dropDown.selectedIndex = 0;
  });

  linkButton.addEventListener("click", function (event) {
    linkGroup.selectAll("path").style("display", () => {
      return showLink ? "none" : "inline";
    });

    showLink = !showLink;
  });

  //<<<================== zoom DEFINITION ==================>>>

  function zoom(d) {
    focus = d;

    const transition = d3
      .transition()
      .duration(SPAN)
      .tween("zoom", function (d) {
        const i = d3.interpolateZoom(view, [
          focus.x,
          focus.y,
          focus.r * 2 + MARGIN,
        ]);
        return (t) => zoomTo(i(t));
      });

    // transition
    //   .selectAll("image")
    //   .filter((d) => focus.descendants().includes(d))
    //   .style("opacity", (d) => (d.parent === focus ? 1 : 0));

    // transition
    //   .selectAll("circle")
    //   .filter((d) => focus.descendants().includes(d))
    //   .style("opacity", function (d) {
    //     if (focus.depth + 1 < d.depth) {
    //       return OPACITY;
    //     } else if (focus.depth + 1 === d.depth) {
    //       return 1;
    //     }
    //   });
  }

  //<<<================== zoomTo DEFINITION ==================>>>

  function zoomTo(v) {
    const k = diameter / v[2];
    view = v;

    node.attr("transform", function (d) {
      return `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`;
    });

    circle.attr("r", (d) => d.r * k);

    image.attr("x", (d) => (-d.r / 4) * k);
    image.attr("y", (d) => (-d.r / 4) * k);
    image.attr("width", (d) => (d.r / 2) * k);
    image.attr("height", (d) => (d.r / 2) * k);

    //<<<================== link Generation ==================>>>

    d3.selectAll(".linkGroup").remove();
    linkGroup = svg
      .append("g")
      .attr("class", "linkGroup")
      .attr("transform", `translate(${diameter / 2}, ${diameter / 2})`);

    for (let i = 0; i < links.length; i++) {
      const from = root.find((d) => d.data.id === links[i].source);
      const to = root.find((d) => d.data.id === links[i].target);

      const lineStart = [(from.x - v[0]) * k, (from.y - v[1]) * k];
      const lineEnd = [(to.x - v[0]) * k, (to.y - v[1]) * k];

      const path = linkGroup
        .append("path")
        .attr("d", d3.line()([lineStart, lineEnd]))
        .attr("stroke-width", 2.5)
        .attr("stroke-linecap", "round")
        .attr("stroke", "white")
        .attr("marker-start", "url(#marker-dot)")
        .attr("marker-end", "url(#marker-arrow)");

      let totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", "10, 20")
        // .attr("stroke-dasharray", totalLength + " " + 20)
        .attr("stroke-dashoffset", totalLength)
        .each(cycle);

      function cycle() {
        d3.select(this)
          .transition()
          .duration(3000)
          .ease(d3.easeLinear)
          .attrTween("stroke-dashoffset", function () {
            return d3.interpolateNumber(totalLength, 0);
          })
          .on("end", cycle);
      }
    }

    appendLabel(v, k);
  }

  //<<<================== appendLabel DEFINITION ==================>>>

  function appendLabel(v, k) {
    d3.selectAll(".labelGroup").remove();

    labelGroup = svg
      .append("g")
      .attr("class", "labelGroup")
      .attr("transform", `translate(${diameter / 2}, ${diameter / 2})`);

    const path = labelGroup
      .selectAll("path")
      .data(nodes)
      .enter()
      .append("path")
      .attr("id", (d, i) => `circleArc_${i}`)
      .style("fill", "none")
      .attr("d", function (d, i) {
        return `M ${-d.r * k} 0 A ${d.r * k} ${d.r * k} 0 0 1 ${d.r * k} 0`;
      })
      .attr("transform", function (d, i) {
        return `translate(${
          (d.x - v[0]) * k
        }, ${(d.y - v[1]) * k})rotate(${ANGLE})`;
      });

    const text = labelGroup
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("class", "circleText")
      .style("font-size", (d) => Math.round((d.r / 7) * k) + "px")
      .style("text-anchor", "start")
      .style("display", function (d) {
        return d.height === 0 || d === root ? "none" : "inline";
        // if (d.height === 0 || d === root || focus.depth + 1 < d.depth) {
        //   return "none";
        // } else if (focus.depth + 1 === d.depth) {
        //   return "inline";
        // }
      })
      .attr("startOffset", "50%")
      .style("fill-opacity", 0)
      .append("textPath")
      .attr("href", (d, i) => `#circleArc_${i}`)
      .text((d) => d.data.name)
      .transition()
      .duration(SPAN / 3)
      .style("fill-opacity", 1);

    dropDown.addEventListener("change", function (event) {
      const val = event.target.value;

      if (val !== "init") {
        labelGroup
          .selectAll("text")
          .style("display", (d) =>
            d.data.name.startsWith(val) ? "inline" : "none"
          );
      }
    });

    viewButton.addEventListener("click", function (event) {
      labelGroup
        .selectAll("text")
        .style("display", (d) =>
          d.height === 0 || d === root ? "none" : "inline"
        );
    });
  }
};

d3.json("json/packed_circle.json").then(init);
