const MARGIN = 20;
const SPAN = 750;
const OPACITY = 0.14;

const svg = d3.select("body").select("svg");
const diameter = +svg.attr("width");

const nodeGroup = svg
    .append("g")
    .attr("class", "nodeGroup")
    .attr("transform", `translate(${diameter / 2}, ${diameter / 2})`);

const defs = svg.append("defs"); // definition for mark element

let labelGroup = null; // global variable for labels - text & path
let linkGroup = null; // global variable for links - path

let path = null; // global variable for labelGroup's path selection
let text = null; // gloabl variable for labelGroup's text selection
let link = null; // global variable for linkGroup's path selection

let showLink = true; // show or hide links
let zoomAble = true; // unable to zoom while searching

const color = {
  vpc: "hsl(259, 55%, 48%)",
  private_subnet: "hsl(202, 81%, 40%)",
  public_subnet: "hsl(112, 74%, 31%)",
  empty_subnet: "hsl(58, 73%, 52%)",
  db: "hsl(235, 57%, 51%)",
  i: "hsl(29, 88%, 47%)",
  elb: "hsl(259, 55%, 48%)",
  s3: "hsl(112, 74%, 31%)",
  route53: "hsl(259, 55%, 48%)",
  cloudtrail: "hsl(337, 68%, 50%)",
  nat: "hsl(259, 55%, 48%)",
  igw: "hsl(259, 55%, 48%)",
};

const pack = d3
    .pack()
    .size([diameter - MARGIN, diameter - MARGIN])
    .padding(8);

const retButton = document.querySelector(".button--return");
const viewButton = document.querySelector(".button--view");
const linkButton = document.querySelector(".button--link");

const res_list = document.querySelectorAll(".select");
const dropdown = document.querySelectorAll('.dropdown');
const dropList = document.querySelectorAll(".dropdown-list");
const rightSide = document.querySelector(".side-right");

// const arrlist = ["vpc", "subnet", "i", "rds", "natgw", "s3", "itngw"];
const arrlist = ["vpc", "subnet", "i", "rds", "nat", "s3", "igw"];
const rid = document.querySelector('.rid');
const rtag = document.querySelector('.rtag');
const rattr = document.querySelector('.rattr');
//#########################################################
//#################### init DEFINITION ####################
//#########################################################

const init = function (graph) {
  root = d3
      .hierarchy(graph.root)
      .sum((d) => d.size)
      .sort((a, b) => b.value - a.value);

  const nodes = pack(root).descendants();
  const links = graph.links; // array of links

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
      .attr("fill", "grey");

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
      .attr("fill", "grey");

  function get_color(d) {
    const id = d.data.id;

    if (d === root || d.height === 0) {
      return "hsl(0, 0%, 0%)";
    } else if (id.startsWith("subnet")) {
      return color[`${d.data.type}_subnet`];
    } else {
      return color[id.split("-")[0]];
    }
  }

  const circle = nodeGroup
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", function (d) {
        return d.parent
            ? d.children
                ? "node node--middle"
                : "node node--leaf"
            : "node node--root";
      })
      .style("display", (d) => (d.height === 0 ? "none" : "inline"))
      .style("stroke", (d) => get_color(d))
      .style("fill", (d) => {
        const c = get_color(d).split(",");
        return `${c[0]},${c[1]}, 86%)`;
      });

  const image = nodeGroup
      .selectAll("image")
      .data(nodes)
      .enter()
      .append("image")
      .attr("class", "icon")
      .attr("x", (d) => d.r / 3)
      .attr("y", (d) => d.r / 3)
      .attr("width", (d) => (2 * d.r) / 3)
      .attr("height", (d) => (2 * d.r) / 3)
      .attr("href", (d) => d.data.href)
      .style("opacity", (d) => (d.height === 1 ? 1 : 0))
      .style("display", (d) => (d === root ? "none" : "inline"));

  const node = nodeGroup.selectAll("circle, image");
  zoomTo([root.x, root.y, root.r * 2 + MARGIN]);

  //#########################################################
  //############ functions for dragging nodes ###############
  //#########################################################

  function recurOnChildren(d, delta) {
    d.x += delta.x;
    d.y += delta.y;

    if (!d.children) return;

    d.children.forEach((c) => {
      recurOnChildren(c, delta);
    });
  }

  // Same as zoomTo([root.x, root.y, root.r * 2 + MARGIN])
  function draw(focus) {
    const k = diameter / (focus.r * 2 + MARGIN);

    node.attr(
        "transform",
        (d) => `translate(${(d.x - focus.x) * k}, ${(d.y - focus.y) * k})`
    );

    path.attr(
        "transform",
        (d) => `translate(${(d.x - focus.x) * k}, ${(d.y - focus.y) * k})`
    );

    link.attr("d", function (l) {
      let from = root.find((d) => d.data.id === l.source);
      let to = root.find((d) => d.data.id === l.target);

      from = [(from.x - focus.x) * k, (from.y - focus.y) * k];
      to = [(to.x - focus.x) * k, (to.y - focus.y) * k];

      return d3.line()([from, to]);
    });
  }

  //#########################################################
  //#################### event listeners ####################
  //#########################################################

  //왼쪽사이드 리소스목록에서 클릭시 해당리소스들을 표시해주는기능
  res_list.forEach(function (d) {
    d.addEventListener("click", function (e) {
      const val1 = e.target.id;
      if (val1 !== "init") {
        zoomAble = false;
        retButton.disabled = true;
        linkButton.disabled = true;

        nodeGroup
            .selectAll("circle")
            .style("opacity", (d) =>
                d.data.name.startsWith(val1) ? 1 : d !== root ? OPACITY : null
            );

        nodeGroup
            .selectAll("image")
            .style("opacity", (d) =>
                d.data.name.startsWith(val1) ? 1 : d !== root ? 0 : null
            );

        linkGroup.selectAll("path").style("display", "none");
        showLink = false;
      }
    });
  });

  //리소스들을 해당 리소스칸으로 넣어주기 + 클릭이벤트(줌인)추가
  nodes.forEach(function (d,i){
    if(typeof d.data.id !== "undefined") {
      for(var i in arrlist){
        if(d.data.id.startsWith(arrlist[i])){
          if(!dropdown[i].classList.contains('active')){
            dropdown[i].classList.add('active');
          }
          var newDIV = document.createElement('div');
          newDIV.className = "dropdown-list__item";
          newDIV.textContent = d.data.id;
          newDIV.addEventListener('click',function (e){
            //해당 리소스 클릭시 오른쪽 사이드바 Information 글씨빼고 전부삭제
            while(rid.childElementCount > 0){
              rid.removeChild(rid.lastChild);
            }
            while(rtag.childElementCount > 0){
              rtag.removeChild(rtag.lastChild);
            }
            while(rattr.childElementCount > 0){
              rattr.removeChild(rattr.lastChild);
            }
            //해당 리소스 클릭시 정보 하나하나를 div태그로 만들어서 으론쪽 사이드바에 채워주기

            //*************************************************
            //어떻게 나타낼지는 다시 생각하고 바꿔줘야함 *************
            //*************************************************
            for(var j in Object.values(d.data)){
              if(Object.keys(d.data)[j] != 'children'
                  && Object.keys(d.data)[j] !== 'href'
                  && Object.keys(d.data)[j] !== 'size'
                  && Object.values(d.data)[j] !== 'null'
                  && Object.values(d.data)[j] !== '') {
                var newdivc = document.createElement('div');
                if(Object.keys(d.data)[j] === 'id'){
                  newdivc.className = 'r_id info';
                  newdivc.textContent = 'id : ' + Object.values(d.data)[j];
                  rid.appendChild(newdivc);
                }else if(Object.keys(d.data)[j] === 'name'){
                  newdivc.className = 'r_tag info';
                  newdivc.textContent = 'name : ' + Object.values(d.data)[j];
                  rtag.appendChild(newdivc);
                }else if(Object.keys(d.data)[j] === 'type'){
                  newdivc.className = 'r_type info';
                  newdivc.textContent = "type : " + Object.values(d.data)[j];
                  rtag.appendChild(newdivc);
                }else{
                  newdivc.className = 'info';
                  if(typeof Object.values(d.data)[j] === 'object'){
                    newdivc.textContent = Object.keys(d.data)[j] + ": "
                    for(var k in Object.values(d.data)[j]){
                      console.log(Object.values(d.data)[j][k]);
                      // var newdivcc = document.createElement('div');
                      // newdivcc.className = 'info_child';
                      // newdivcc.textContent = Object.values(d.data)[j][k] + ": " + Object.values(d.data)[j][k];
                      // newdivc.appendChild(newdivcc);
                    }
                  }else {
                    newdivc.textContent = Object.keys(d.data)[j] + ": " + Object.values(d.data)[j];
                  }
                  rattr.appendChild(newdivc);
                }
              }
            }
            zoom(d);
            e.stopPropagation();
          })
          dropList[i].appendChild(newDIV);
          dropList[i].classList.add('active');
          break;
        }
      }
    }
  })
  retButton.addEventListener("click", (event) => {
        zoom(root);
        while(rid.childElementCount > 0){
          rid.removeChild(rid.lastChild);
        }
        while(rtag.childElementCount > 0){
          rtag.removeChild(rtag.lastChild);
        }
        while(rattr.childElementCount > 0){
          rattr.removeChild(rattr.lastChild);
        }
      }
  );

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
  });

  linkButton.addEventListener("click", function (event) {
    linkGroup.selectAll("path").style("display", () => {
      return showLink ? "none" : "inline";
    });

    showLink = !showLink;
  });

  //#########################################################
  //#################### zoom DEFINITION ####################
  //#########################################################

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
  }

  //#########################################################
  //################### zoomTo DEFINITION ###################
  //#########################################################

  function zoomTo(v) {
    const k = diameter / v[2];
    view = v;

    node.attr("transform", function (d) {
      return `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`;
    });

    circle.attr("r", (d) => d.r * k);

    image.attr("x", (d) => (-d.r / 3) * k);
    image.attr("y", (d) => (-d.r / 3) * k);
    image.attr("width", (d) => ((2 * d.r) / 3) * k);
    image.attr("height", (d) => ((2 * d.r) / 3) * k);

    //#########################################################
    //#################### link Generation ####################
    //#########################################################

    d3.selectAll(".linkGroup").remove();

    linkGroup = svg
        .append("g")
        .attr("class", "linkGroup")
        .attr("transform", `translate(${diameter / 2}, ${diameter / 2})`);

    link = linkGroup
        .selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("d", function (l) {
          let from = root.find((d) => d.data.id === l.source);
          let to = root.find((d) => d.data.id === l.target);

          from = [(from.x - v[0]) * k, (from.y - v[1]) * k];
          to = [(to.x - v[0]) * k, (to.y - v[1]) * k];

          return d3.line()([from, to]);
        })
        .attr("stroke-width", 2.5)
        .attr("stroke-linecap", "round")
        .attr("stroke", "grey")
        .style("opacity", 0.5)
        .attr("stroke-dasharray", "10, 20")
        .attr("marker-start", "url(#marker-dot)")
        .attr("marker-end", "url(#marker-dot)");

    appendLabel(v, k);

    node.call(
        d3.drag().on("drag", (event, d) => {
          draw(focus);

          const dist = Math.sqrt(
              Math.pow(event.x - d.parent.x, 2) + Math.pow(event.y - d.parent.y, 2)
          );

          const theta = Math.atan2(event.y - d.parent.y, event.x - d.parent.x);
          const bound = d.parent.r - d.r;

          if (dist > bound) {
            recurOnChildren(d, {
              x: d.parent.x + bound * Math.cos(theta) - d.x,
              y: d.parent.y + bound * Math.sin(theta) - d.y,
            });
          } else {
            recurOnChildren(d, { x: event.dx, y: event.dy });
          }
        })
    );
  }

  //#########################################################
  //################ appendLabel DEFINITION #################
  //#########################################################

  function appendLabel(v, k) {
    d3.selectAll(".labelGroup").remove();

    labelGroup = svg
        .append("g")
        .attr("class", "labelGroup")
        .attr("transform", `translate(${diameter / 2}, ${diameter / 2})`);

    path = labelGroup
        .selectAll("path")
        .data(nodes)
        .enter()
        .append("path")
        .attr("id", (d, i) => `circleArc_${i}`)
        .style("fill", "none")
        .attr("d", function (d) {
          return `M ${-d.r * k} 0 a ${d.r * k} ${d.r * k} 0 0 1 ${2 * d.r * k} 0`;
        })
        .attr("transform", function (d) {
          return `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`;
        });

    text = labelGroup
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", "circleText")
        .style("font-size", (d) => Math.round((d.r / 5) * k) + "px")

        .style("text-anchor", "middle")
        .style("display", function (d) {
          return d.height === 0 || d === root ? "none" : "inline";
        })
        .style("fill-opacity", 0)
        .append("textPath")
        .attr("href", (d, i) => `#circleArc_${i}`)
        .attr("startOffset", "50%")
        .text((d) => d.data.name)
        .transition()
        .duration(SPAN / 3)
        .style("fill-opacity", 1);

    res_list.forEach(function (d) {
      d.addEventListener("click", function (e) {
        const val1 = e.target.id;
        if (val1 !== "init") {
          labelGroup
              .selectAll("text")
              .style("display", (d) =>
                  d.data.name.startsWith(val1) ? "inline" : "none"
              );
        }
      });
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
