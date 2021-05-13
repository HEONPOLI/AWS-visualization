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

  let labelGroup = null;
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


  const res_list = document.querySelectorAll('.select');
  const dropList = document.querySelectorAll('.dropdown-list');
  const rightSide = document.querySelector('.side-right');

  const arrlist = ['vpc','subnet','i','rds','natgw','s3','itngw'];
//<<<================== init DEFINITION ==================>>>

  const init = function (root) {
    root = d3
        .hierarchy(root)
        .sum((d) => d.size)
        .sort((a, b) => b.value - a.value);


    const nodes = pack(root).descendants();
    let focus = root;
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


    //왼쪽사이드 리소스목록에서 클릭시 해당리소스들을 표시해주는기능
    res_list.forEach(function (d) {
      d.addEventListener("click", function (e) {
        const val1 = e.target.id;
        if (val1 !== "init") {
          zoomAble = false;
          retButton.disabled = true;

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
        }
      })
    })

    //리소스들을 해당 리소스칸으로 넣어주기 + 클릭이벤트(줌인)추가
    nodes.forEach(function (d,i){
      if(typeof d.data.id !== "undefined") {
        for(var i in arrlist){
          if(d.data.id.startsWith(arrlist[i])){
            var newDIV = document.createElement('div');
            newDIV.className = "dropdown-list__item";
            newDIV.textContent = d.data.id;
            newDIV.addEventListener('click',function (e){
              //해당 리소스 클릭시 오른쪽 사이드바 Information 글씨빼고 전부삭제
              while(rightSide.childElementCount > 1){
                rightSide.lastChild.remove();
              }
              //해당 리소스 클릭시 정보 하나하나를 div태그로 만들어서 으론쪽 사이드바에 채워주기

              //*************************************************
              //어떻게 나타낼지는 다시 생각하고 바꿔줘야함 *************
              //*************************************************
              for(var j in Object.values(d.data)){
                if(Object.keys(d.data)[j] != 'children'
                    && Object.keys(d.data)[j] != 'href'
                    && Object.keys(d.data)[j] != 'size') {
                  var newdiv = document.createElement('div');
                  newdiv.className = 'information';
                  newdiv.textContent = Object.keys(d.data)[j] + ": " + Object.values(d.data)[j];
                  rightSide.appendChild(newdiv);
                }
              }
              zoom(d);
              e.stopPropagation();
            })
            dropList[i].appendChild(newDIV);
            break;
          }
        }
      }
    })


    // 중복기능 지워야함 ********************************************
    dropDown.addEventListener("change", function (event) {
      const val = event.target.value;

      if (val !== "init") {
        zoomAble = false;
        retButton.disabled = true;

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
      }
    });

    retButton.addEventListener("click", (event) => zoom(root));
    viewButton.addEventListener("click", function (event) {
      zoomAble = true;
      retButton.disabled = false;

      nodeGroup.selectAll("circle").style("opacity", (d) => 1);

      nodeGroup
          .selectAll("image")
          .style("opacity", (d) => (d.height === 1 ? 1 : 0));

      dropDown.selectedIndex = 0;
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

      image.attr("y", (d) => (-d.r / 4) * k);
      image.attr("x", (d) => (-d.r / 4) * k);
      image.attr("width", (d) => (d.r / 2) * k);
      image.attr("height", (d) => (d.r / 2) * k);

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
    let end = new Date();
    console.log(end - start);
  };
  let start = new Date();
  d3.json("./json/packed_circle2.json").then(init);