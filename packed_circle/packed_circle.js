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

const color = d3
  .scaleLinear()
  .domain([-1, 5])
  .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
  .interpolate(d3.interpolateHcl);

const pack = d3
  .pack()
  .size([diameter - MARGIN, diameter - MARGIN])
  .padding(8);

const dd = d3.select("body").select("select");

//<<<================== init DEFINITION ==================>>>

const init = function (root) {
  root = d3
    .hierarchy(root)
    .sum((d) => d.size)
    .sort((a, b) => b.value - a.value);

  let focus = root;
  const nodes = pack(root).descendants();
  let view;

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
    .style("opacity", (d) => (d.depth > 1 ? OPACITY : 1))
    .on("click", function (event, d) {
      if (d.height === 1) {
        // zoom(root);
      } else if (d.parent === focus) {
        zoom(d);
        event.stopPropagation();
      } else if (focus === d) {
        // zoom(root);
        zoom(d.parent);
      }
    });

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
    .style("opacity", (d) => (d.depth > 1 ? 0 : 1))
    .style("display", (d) => (d === root ? "none" : "inline"));

  const node = nodeGroup.selectAll("circle, image");

  zoomTo([root.x, root.y, root.r * 2 + MARGIN]);

  dd.on("change", function (event) {
    const val = event.target.value;

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
  });

  //<<<================== zoom DEFINITION ==================>>>

  function zoom(d) {
    const focus0 = focus;
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

    transition
      .selectAll("image")
      .filter((d) => focus.descendants().includes(d))
      .style("opacity", (d) => (d.parent === focus ? 1 : 0));

    transition
      .selectAll("circle")
      .filter((d) => focus.descendants().includes(d))
      .style("opacity", function (d) {
        if (focus.depth + 1 < d.depth) {
          return OPACITY;
        } else if (focus.depth + 1 === d.depth) {
          return 1;
        }
      });
  }

  //<<<================== zoomTo DEFINITION ==================>>>

  function zoomTo(v) {
    const k = diameter / v[2];
    view = v;

    node.attr("transform", function (d) {
      return `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`;
    });

    circle.attr("r", (d) => d.r * k);

    image.attr("y", (d) => (-d.r / 4) * k);
    image.attr("x", (d) => (-d.r / 4) * k);
    image.attr("width", (d) => (d.r / 2) * k);
    image.attr("height", (d) => (d.r / 2) * k);

    appendLabel(v, k);
  }

  //<<<================== appendLabel DEFINITION ==================>>>

  function appendLabel(v, k) {
    d3.selectAll(".labelGroup").remove();

    const labelGroup = svg
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
        // d.height === 0 || d === root ? "none" : "inline";
        if (d.height === 0 || d === root || focus.depth + 1 < d.depth) {
          return "none";
        } else if (focus.depth + 1 === d.depth) {
          return "inline";
        }
      })
      .attr("startOffset", "50%")
      .style("fill-opacity", 0)
      .append("textPath")
      .attr("href", (d, i) => `#circleArc_${i}`)
      .text((d) => d.data.name)
      .transition()
      .duration(SPAN / 3)
      .style("fill-opacity", 1);
  }
};

d3.json("json/packed_circle.json").then(init);
