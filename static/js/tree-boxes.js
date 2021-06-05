
"use strict";

function treeBoxes(urlService, jsonData)
{
    var urlService_ = '';

    var blue = '#337ab7',
        green = '#5cb85c',
        yellow = '#f0ad4e',
        blueText = '#4ab1eb',
        purple = '#9467bd';

    var margin = {
            top : 0,
            right : 0,
            bottom : 100,
            left : 0
        },
        width = 800 - margin.right - margin.left,
        height = 400 - margin.top - margin.bottom;

    document.querySelector(".fa-spinner").classList.remove("fa-spin");
    document.querySelector("svg").innerHTML="";

    var rectNode_root = { width : 200, height : 50, textMargin : 5},
        rectNode_group = { width : 200, height : 75, textMargin : 5},
        rectNode = { width : 300, height : 210, textMargin : 5 },
        tooltip = { width : 150, height : 40, textMargin : 5 };
    var i = 0,
        duration = 750,
        root;

    var mousedown; // Use to save temporarily 'mousedown.zoom' value
    var mouseWheel,
        mouseWheelName,
        isKeydownZoom = false;

    var tree;
    var baseSvg,
        svgGroup,
        nodeGroup, // If nodes are not grouped together, after a click the svg node will be set after his corresponding tooltip and will hide it
        nodeGroupTooltip,
        linkGroup,
        // linkGroupToolTip,
        defs;

    init(urlService, jsonData);

    function init(urlService, jsonData)
    {
        urlService_ = urlService;
        if (urlService && urlService.length > 0)
        {
            if (urlService.charAt(urlService.length - 1) != '/')
                urlService_ += '/';
        }

        if (jsonData)
            drawTree(jsonData);
        else
        {
            console.error(jsonData);
            alert('Invalides data.');
        }
    }

    function drawTree(jsonData)
    {
        tree = d3.layout.tree().size([ height, width ]);
        root = jsonData;
        root.fixed = true;
        
        var maxDepth = 0;
        var maxTreeWidth = breadthFirstTraversal(tree.nodes(root), function(currentLevel) {
            maxDepth++;
            currentLevel.forEach(function(node) {
                if (node.user_name == 'root')
                    node.color = blue;
                if (node.group_id)
                    node.color = green;
                if (node.user_id)
                    node.color = yellow;
            });
        });
        height = maxTreeWidth * (rectNode.height + 80) + tooltip.height + 200 - margin.right - margin.left;
        width = maxDepth * (rectNode.width * 1.5) + tooltip.width / 2 - margin.top - margin.bottom;
        tree = d3.layout.tree().size([ height, width ]);
        root.x0 = height / 2;
        root.y0 = 0;

        baseSvg = d3.select('#tree-container svg')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .attr('class', 'svgContainer')
            .call(d3.behavior.zoom()
                //.scaleExtent([0.5, 1.5]) // Limit the zoom scale
                .on('zoom', zoomAndDrag));

        // Mouse wheel is desactivated, else after a first drag of the tree, wheel event drags the tree (instead of scrolling the window)
        getMouseWheelEvent();
        d3.select('#tree-container').select('svg').on(mouseWheelName, null);
        d3.select('#tree-container').select('svg').on('dblclick.zoom', null);

        svgGroup = baseSvg.append('g')
            .attr('class','drawarea')
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        nodeGroup = svgGroup.append('g')
            .attr('id', 'nodes');
        linkGroup = svgGroup.append('g')
            .attr('id', 'links');

        defs = baseSvg.append('defs');
        initArrowDef();
        initDropShadow();

        update(root);
    }

    function update(source)
    {
        // Compute the new tree layout
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Check if two nodes are in collision on the ordinates axe and move them
        breadthFirstTraversal(tree.nodes(root), collision);
        // Normalize for fixed-depth
        nodes.forEach(function(d) {
            /**************************************/
            d.y = d.depth * (rectNode.width * 1.5);
        });

        // 1) ******************* Update the nodes *******************
        var node = nodeGroup.selectAll('g.node').data(nodes, function(d) {
            return d.id || (d.id = ++i);
        });
        var nodeEnter = node.enter().insert('g', 'g.node')
            .attr('class', 'node')
            .attr('transform', function(d) {
                return 'translate(' + source.y0 + ',' + source.x0 + ')'; })
            .on('click', function(d) {
                click(d);
            });
        // var nodeEnterTooltip = nodesTooltip.enter().append('g')
        //     .attr('transform', function(d) {
        //         return 'translate(' + source.y0 + ',' + source.x0 + ')'; });

        nodeEnter.append('g').append('rect')
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('width', rectNode.width)
            .attr('height', function (d){
                if(d.user_id) {
                    return rectNode.height;
                }else if(d.group_id){
                    return "130";
                }else{
                    return "60";
                }
            })
            .attr('class', 'node-rect')
            .attr('fill', function (d) { return d.color; })
            .attr('filter', 'url(#drop-shadow)');

        nodeEnter.append('foreignObject')
            .attr('x', rectNode.textMargin)
            .attr('y', rectNode.textMargin)
            .attr('width', function() {
                return (rectNode.width - rectNode.textMargin * 2) < 0 ? 0
                    : (rectNode.width - rectNode.textMargin * 2)
            })
            .attr('height', function(d) {
                if(d.user_id){
                    return (rectNode.height - rectNode.textMargin * 2) < 0 ? 0
                        : (rectNode.height - rectNode.textMargin * 2)
                }
                return (rectNode.height - rectNode.textMargin * 2) < 0 ? 0
                    : (rectNode.height - rectNode.textMargin * 2)
            })
            .append('xhtml').html(function(d) {
            if(d.user_name == 'root'){
                return '<div style="width: '
                    + (rectNode.width - rectNode.textMargin * 2) + 'px; height: '
                    + (rectNode.height - rectNode.textMargin * 2) + 'px;" class="node-text wordwrap">'
                    + '<b>User name: </b>' + '<span>'+d.user_name+'</span>' + '</b><br><br>'
                    + '</div>';
            }else if(d.user_id) {
                var a = '<div style="width: '
                    + (rectNode.width - rectNode.textMargin * 2) + 'px; height: '
                    + (rectNode.height - rectNode.textMargin * 2) + 'px;" class="node-text wordwrap">'
                    + '<b>User name: </b>'+'<span>'+d.user_name+'</span>' + '</b><br><br>'
                    + '<b>User id: </b>' + '<br>'+ d.user_id + '<br>'
                    + '<b>Arn: </b>' + '<br>'+ d.user_arn + '<br>'
                    + '<b>Create Date: </b>' + '<br>'+ d.user_create_date + '<br>'
                    + '<b>Policy: </b>' + '<br>'

                for(var i in d.user_attached_policies){
                    a += d.user_attached_policies[i] + '<br>'
                }
                a += '</div>';
                return a;
            }else if(d.group_id){
                var a = '<div style="width: '
                    + (rectNode.width - rectNode.textMargin * 2) + 'px; height: '
                    + (rectNode.height - rectNode.textMargin * 2) + 'px;" class="node-text wordwrap">'
                    + '<b>Group name: </b>' + '<span>'+d.group_name+'</span>' + '</b><br><br>'
                    + '<b>Group id: </b>' + '<br>'+ d.group_id + '<br>'
                    + '<b>GroupPolicy </b>' + '<br>'
                for(var i in d.group_attached_policies){
                    a += d.group_attached_policies[i] + '<br>'
                }
                a += '</div>';
                return a;
            }
        })
            .on('mouseover', function(d) {
                $('#nodeInfoID' + d.id).css('visibility', 'visible');
                $('#nodeInfoTextID' + d.id).css('visibility', 'visible');
            })
            .on('mouseout', function(d) {
                $('#nodeInfoID' + d.id).css('visibility', 'hidden');
                $('#nodeInfoTextID' + d.id).css('visibility', 'hidden');
            });
        var nodeUpdate = node.transition().duration(duration)
            .attr('transform', function(d) {
                if(d.user_name === 'root'){
                    var dx = d.x + 70;
                    return 'translate(' + d.y + ',' + dx +')';
                }else if(d.user_id){
                    return 'translate(' + d.y + ',' + d.x + ')';
                }
                else{
                    var dx = d.x + 35;
                    return 'translate(' + d.y + ',' + dx + ')';
                } });
        nodeUpdate.select('rect')
            .attr('class', function(d) { return d._children ? 'node-rect-closed' : 'node-rect'; });
        nodeUpdate.select('text').style('fill-opacity', 1);
        var nodeExit = node.exit().transition().duration(duration)
            .attr('transform', function(d) { return 'translate(' + source.y + ',' + source.x + ')'; })
            .remove();
        nodeExit.select('text').style('fill-opacity', 1e-6);


        var link = linkGroup.selectAll('path').data(links, function(d) {
            return d.target.id;
        });
        function linkMarkerStart(direction, isSelected) {
            if (direction == 'SYNC')
            {
                return isSelected ? 'url(#start-arrow-selected)' : 'url(#start-arrow)';
            }
            return '';
        }
        d3.selection.prototype.moveToFront = function() {
            return this.each(function(){
                this.parentNode.appendChild(this);
            });
        };
        var linkenter = link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr('id', function(d) { return 'linkID' + d.target.id; })
            .attr('d', function(d) { return diagonal(d); })
            .attr('marker-end', 'url(#end-arrow)')
            .attr('marker-start', function(d) { return linkMarkerStart("ASYN", false); })
            .on('mouseover', function(d) {
                d3.select(this).moveToFront();

                d3.select(this).attr('marker-end', 'url(#end-arrow-selected)');
                d3.select(this).attr('marker-start', linkMarkerStart("ASYN", true));
                d3.select(this).attr('class', 'linkselected');
            })
            .on('mouseout', function(d) {
                d3.select(this).attr('marker-end', 'url(#end-arrow)');
                d3.select(this).attr('marker-start', linkMarkerStart("ASYN", false));
                d3.select(this).attr('class', 'link');
            });

        var linkUpdate = link.transition().duration(duration)
            .attr('d', function(d) { return diagonal(d); });
        link.exit().transition()
            .remove();
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }
    function zoomAndDrag() {
        var scale = 1,
            translation = d3.event.translate,
            tbound = -height * scale,
            bbound = height * scale,
            lbound = (-width + margin.right) * scale,
            rbound = (width - margin.left) * scale;
        translation = [
            Math.max(Math.min(translation[0], rbound), lbound),
            Math.max(Math.min(translation[1], bbound), tbound)
        ];
        d3.select('.drawarea')
            .attr('transform', 'translate(' + translation + ')' +
                ' scale(' + scale + ')');
    }
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
    function breadthFirstTraversal(tree, func)
    {
        var max = 0;
        if (tree && tree.length > 0)
        {
            var currentDepth = tree[0].depth;
            var fifo = [];
            var currentLevel = [];

            fifo.push(tree[0]);
            while (fifo.length > 0) {
                var node = fifo.shift();
                if (node.depth > currentDepth) {
                    func(currentLevel);
                    currentDepth++;
                    max = Math.max(max, currentLevel.length);
                    currentLevel = [];
                }
                currentLevel.push(node);
                if (node.children) {
                    for (var j = 0; j < node.children.length; j++) {
                        fifo.push(node.children[j]);
                    }
                }
            }
            func(currentLevel);
            return Math.max(max, currentLevel.length);
        }
        return 0;
    }

    function collision(siblings) {
        var minPadding = 5;
        if (siblings) {
            for (var i = 0; i < siblings.length - 1; i++)
            {
                if (siblings[i + 1].x - (siblings[i].x + rectNode.height) < minPadding)
                    siblings[i + 1].x = siblings[i].x + rectNode.height + minPadding;
            }
        }
    }

    function removeMouseEvents() {
        // Drag and zoom behaviors are temporarily disabled, so tooltip text can be selected
        mousedown = d3.select('#tree-container').select('svg').on('mousedown.zoom');
        d3.select('#tree-container').select('svg').on("mousedown.zoom", null);
    }

    function reactivateMouseEvents() {
        // Reactivate the drag and zoom behaviors
        d3.select('#tree-container').select('svg').on('mousedown.zoom', mousedown);
    }
    function getMouseWheelEvent() {
        if (d3.select('#tree-container').select('svg').on('wheel.zoom'))
        {
            mouseWheelName = 'wheel.zoom';
            return d3.select('#tree-container').select('svg').on('wheel.zoom');
        }
        if (d3.select('#tree-container').select('svg').on('mousewheel.zoom') != null)
        {
            mouseWheelName = 'mousewheel.zoom';
            return d3.select('#tree-container').select('svg').on('mousewheel.zoom');
        }
        if (d3.select('#tree-container').select('svg').on('DOMMouseScroll.zoom'))
        {
            mouseWheelName = 'DOMMouseScroll.zoom';
            return d3.select('#tree-container').select('svg').on('DOMMouseScroll.zoom');
        }
    }
    function diagonal(d) {
        var p0 = {
            x : d.source.x + rectNode.height / 2 ,
            y : (d.source.y + rectNode.width)
        }, p3 = {
            x : d.target.x + rectNode.height / 2,
            y : d.target.y  - 12 // -12, so the end arrows are just before the rect node
        }, m = (p0.y + p3.y) / 2, p = [ p0, {
            x : p0.x,
            y : m
        }, {
            x : p3.x,
            y : m
        }, p3 ];
        p = p.map(function(d) {
            return [ d.y, d.x ];
        });
        return 'M' + p[0] + 'C' + p[1] + ' ' + p[2] + ' ' + p[3];
    }
    function initDropShadow() {
        var filter = defs.append("filter")
            .attr("id", "drop-shadow")
            .attr("color-interpolation-filters", "sRGB");

        filter.append("feOffset")
            .attr("result", "offOut")
            .attr("in", "SourceGraphic")
            .attr("dx", 0)
            .attr("dy", 0);

        filter.append("feGaussianBlur")
            .attr("stdDeviation", 2);

        filter.append("feOffset")
            .attr("dx", 2)
            .attr("dy", 2)
            .attr("result", "shadow");

        filter.append("feComposite")
            .attr("in", 'offOut')
            .attr("in2", 'shadow')
            .attr("operator", "over");
    }

    function initArrowDef() {
        // Build the arrows definitions
        // End arrow
        defs.append('marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .attr('class', 'arrow')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5');

        // End arrow selected
        defs.append('marker')
            .attr('id', 'end-arrow-selected')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .attr('class', 'arrowselected')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5');

        // Start arrow
        defs.append('marker')
            .attr('id', 'start-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .attr('class', 'arrow')
            .append('path')
            .attr('d', 'M10,-5L0,0L10,5');

        // Start arrow selected
        defs.append('marker')
            .attr('id', 'start-arrow-selected')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .attr('class', 'arrowselected')
            .append('path')
            .attr('d', 'M10,-5L0,0L10,5');
    }
}

function render() {
    document.querySelector(".fa-spinner").classList.add("fa-spin");
    d3.json("/fetch_iam", function (error, json) {
        treeBoxes("", json.tree);
    }); 
}