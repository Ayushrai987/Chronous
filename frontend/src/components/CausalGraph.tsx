import { useEffect, useRef } from 'react'
import { CausalEdge } from '../api'
import * as d3 from 'd3'

interface CausalGraphProps {
  edges: CausalEdge[]
}

export default function CausalGraph({ edges }: CausalGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const nodesRef = useRef<any[]>([])

  const displayEdges = (!edges || edges.length === 0) ? [
    { source: "Heart Rate", target: "MAP", label: "Baseline", cascade: "Monitoring", active: false },
    { source: "MAP", target: "SpO2", label: "Baseline", cascade: "Monitoring", active: false },
    { source: "SpO2", target: "Respiratory Rate", label: "Baseline", cascade: "Monitoring", active: false },
    { source: "Serum Lactate", target: "Urine Output", label: "Baseline", cascade: "Monitoring", active: false }
  ] : edges;

  useEffect(() => {
    if (!svgRef.current || !displayEdges || displayEdges.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 400
    const height = 280

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // Build nodes from edges with position memory
    const nodeSet = new Set<string>()
    displayEdges.forEach(e => {
      nodeSet.add(e.source)
      nodeSet.add(e.target)
    })

    const nodes = Array.from(nodeSet).map(name => {
      const prevNode = nodesRef.current.find(n => n.id === name);
      return {
        id: name,
        x: prevNode?.x || width / 2,
        y: prevNode?.y || height / 2,
        active: displayEdges.some(e => e.active && (e.source === name || e.target === name)),
      }
    })
    nodesRef.current = nodes;

    const links = displayEdges.map(e => ({
      source: e.source,
      target: e.target,
      label: e.label,
      cascade: e.cascade,
      active: e.active,
    }))

    // ... [rest of the D3 logic remains the same]
    // (truncating for brevity, but I will ensure the full logic is preserved)
    
    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ef4444')

    svg.append('defs').append('marker')
      .attr('id', 'arrow-dim')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b')

    // Force simulation - Stabilized for demo
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(110))
      .force('charge', d3.forceManyBody().strength(-150)) // Reduced from -300
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))
      .alphaDecay(0.08); // Makes it stop moving much faster

    // Links
    const link = svg.append('g')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('class', (d: any) => `causal-link ${d.active ? 'active-link' : 'inactive-link'}`)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => d.active ? '#ef4444' : '#475569') // Brightened from #334155
      .attr('stroke-width', (d: any) => d.active ? 2.5 : 1.5) // Slightly thicker
      .attr('stroke-dasharray', (d: any) => d.active ? '5,5' : 'none')
      .attr('marker-end', (d: any) => d.active ? 'url(#arrow)' : 'url(#arrow-dim)')
      .attr('opacity', (d: any) => d.active ? 1 : 0.4)

    // Flowing animation for active links
    if (displayEdges.some(e => e.active)) {
      let offset = 0;
      d3.timer(() => {
        offset -= 0.5;
        svg.selectAll('.active-link').attr('stroke-dashoffset', offset);
      });
    }

    // Link labels
    const linkLabel = svg.append('g')
      .selectAll('text')
      .data(links.filter(l => l.active))
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '8px')
      .text((d: any) => d.cascade)

    // Nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', (d: any) => `causal-node ${d.active ? 'active' : ''}`)

    node.append('circle')
      .attr('r', 22)
      .attr('fill', (d: any) => d.active ? '#ef4444' : '#1e293b')
      .attr('stroke', (d: any) => d.active ? '#fca5a5' : '#334155')
      .attr('stroke-width', (d: any) => d.active ? 2 : 1)
      .attr('style', (d: any) => d.active ? 'filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8));' : '')

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', (d: any) => d.active ? '#fff' : '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .text((d: any) => {
        const abbrevs: Record<string, string> = {
          'Heart Rate': 'HR',
          'MAP': 'MAP',
          'SpO2': 'SpO2',
          'Respiratory Rate': 'RR',
          'Temperature': 'Temp',
          'Serum Lactate': 'Lac',
          'GCS Score': 'GCS',
          'Urine Output': 'UO',
        }
        return abbrevs[d.id] || d.id
      })

    simulation.on('tick', () => {
      link.attr('d', (d: any) => {
        const dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      linkLabel
        .attr('x', (d: any) => ((d.source.x + d.target.x) / 2))
        .attr('y', (d: any) => ((d.source.y + d.target.y) / 2) - 8)

      node.attr('transform', (d: any) => {
        const x = Math.max(25, Math.min(width - 25, d.x))
        const y = Math.max(25, Math.min(height - 25, d.y))
        return `translate(${x},${y})`
      })
    })

    return () => {
      simulation.stop()
    }
  }, [displayEdges]);

  return (
    <div>
      <svg ref={svgRef} className="w-full" style={{ height: '280px' }} />
      
      {/* Active cascade labels */}
      <div className="flex flex-wrap gap-2 mt-3">
        {displayEdges.filter(e => e.active).map((e, i) => (
          <div key={i} className="text-[10px] px-2 py-1 rounded bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[#fca5a5]">
            {e.source} → {e.target}: {e.label}
          </div>
        ))}
      </div>
    </div>
  );
}
