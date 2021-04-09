
//select => 특정 요소 찾아줌
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

//힘의 중심??
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

//d3로 json파일 읽기
d3.json("miserables.json", function(error, graph) {
    if (error) throw error;

    // json파일에서 link데이터 바인딩
    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        //stroke = 선의 색상
        //stroke-width = 선의 굴기
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g")

    var circles = node.append("circle")
        .attr("r", 5)
        //color(d.group) 번호별 컬러를 알아서 정해주는듯 1,2,3,4,5,6,7,8,9
        .attr("fill", function(d) { return color(d.group); })
        //노드 드래그시

    // 시작동작코딩 : this은 현재 선택객체이고 active가 true상태
    //     .on("start", function(d){d3.select(this).raise().classed("active", true);})
    // 이동동작코딩 : 현재객체(this)의 좌표 event x,y좌표를 대입
    //     .on("drag", function(d) {d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);})
    // 종료동작코딩 : 현재객체(this)의 active가 false상태
    //     .on("end", function(d) {d3.select(this).classed("active", false);}));

    var lables = node.append("text")
        .text(function(d) {
            return d.id;
        })
        .attr('x', 6)
        .attr('y', 3);

    node.append("title")
        .text(function(d) { return d.id; });

    //tick == 진드기
    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    // simulation.force("link")
    //     .links(graph.links);

    function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
    }
});

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}