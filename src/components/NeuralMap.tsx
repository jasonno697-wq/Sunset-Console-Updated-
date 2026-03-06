import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category: string;
  connected: boolean;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

interface NeuralMapProps {
  nodes: Node[];
  isBypassActive: boolean;
}

export const NeuralMap: React.FC<NeuralMapProps> = ({ nodes, isBypassActive }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = 400;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const links: Link[] = nodes.slice(1).map((node, i) => ({
      source: nodes[0].id,
      target: node.id
    }));

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", isBypassActive ? "#ef4444" : "#f97316")
      .attr("stroke-opacity", 0.2)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", d => (d as Node).connected ? 8 : 5)
      .attr("fill", d => (d as Node).connected ? (isBypassActive ? "#ef4444" : "#f97316") : "#334155")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.2)
      .attr("class", d => (d as Node).connected ? "animate-pulse" : "");

    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(d => (d as Node).name)
      .attr("font-size", "8px")
      .attr("fill", "#94a3b8")
      .attr("font-weight", "bold");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${(d as any).x},${(d as any).y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [nodes, isBypassActive]);

  return (
    <div className="w-full h-[400px] bg-black/40 rounded-3xl border border-white/5 overflow-hidden relative group">
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[10px] text-white/40 uppercase font-black tracking-widest">Neural Map Visualization</h3>
          <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-500 text-[6px] font-black rounded-full border border-orange-500/20 tracking-widest">MASTERED</span>
        </div>
        <p className="text-[8px] text-white/20 uppercase">Interactive Node Topology</p>
      </div>
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" />
    </div>
  );
};
