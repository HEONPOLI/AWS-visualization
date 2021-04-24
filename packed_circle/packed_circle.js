const svg = d3.select("body").select("svg");
const margin = 20;
const diameter = +svg.attr("width");
const g = svg
  .append("g")
  .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

// const color = d3
//   .scaleLinear()
//   .domain([-1, 5])
//   .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
//   .interpolate(d3.interpolateHcl);

const pack = d3
  .pack()
  .size([diameter - margin, diameter - margin])
  .padding(8);

const init = function (root) {
  root = d3
    .hierarchy(root)
    .sum((d) => d.size)
    .sort((a, b) => b.value - a.value);

  let focus = root;
  // console.log(root.children.length);
  // const nodes = pack(root).descendants();
  const nodes = pack(root);
  let view;

  const circle = g
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
    .style("display", function (d) {
      return d.data.name === "null" ? "none" : "inline";
    })
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

  const image = g
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
    .style("display", function (d) {
      return d.parent === root ? "inline" : "none";
    });

  const node = g.selectAll("circle, image");

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    const focus0 = focus;
    focus = d;

    const transition = d3
      .transition()
      .duration(750)
      .tween("zoom", function (d) {
        const i = d3.interpolateZoom(view, [
          focus.x,
          focus.y,
          focus.r * 2 + margin,
        ]);
        return function (t) {
          zoomTo(i(t));
        };
      });

    transition
      .selectAll("image")
      .filter(function (d) {
        return d.parent === focus || this.style.display === "inline";
      })
      .style("opacity", function (d) {
        return d.parent === focus ? 1 : 0;
      })
      .on("start", function (d) {
        if (d.parent === focus) this.style.display = "inline";
      })
      .on("end", function (d) {
        if (d.parent !== focus) this.style.display = "none";
      });
  }

  function zoomTo(v) {
    const k = diameter / v[2];
    view = v;

    node.attr("transform", function (d) {
      return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
    });

    circle.attr("r", function (d) {
      return d.r * k;
    });

    image.attr("y", (d) => (-d.r / 5) * k);
    image.attr("x", (d) => (-d.r / 5) * k);
    image.attr("width", (d) => (d.r / 2.5) * k);
    image.attr("height", (d) => (d.r / 2.5) * k);
  }
};

d3.json("json/packed_circle.json").then(init);
