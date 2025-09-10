import React, { useState, useEffect, useRef, useCallback } from 'react';
import { knowledgeTracker, KnowledgeNode, LearningPath } from '../../lib/knowledge-tracker';
import { X, Move, Trash2, Link, Unlink, Plus, Minus } from 'lucide-react';

interface GraphNode extends KnowledgeNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
  connections: string[];
}

interface GraphConnection {
  source: string;
  target: string;
  strength: number;
  type: 'prerequisite' | 'related' | 'next_step';
}

export const KnowledgeGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [connections, setConnections] = useState<GraphConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Load knowledge data
  useEffect(() => {
    loadKnowledgeData();
    
    // Subscribe to changes
    const unsubscribe = knowledgeTracker.subscribe(() => {
      loadKnowledgeData();
    });
    
    return unsubscribe;
  }, []);

  const loadKnowledgeData = () => {
    const allNodes = knowledgeTracker.getAllKnowledgeNodes();
    const allPaths = knowledgeTracker.getAllLearningPaths();
    const graphNodes: GraphNode[] = [];
    const allConnections: GraphConnection[] = [];

    // Convert knowledge nodes to graph nodes
    allNodes.forEach((node, index) => {
      // Check if node already exists in current graph
      const existingNode = nodes.find(n => n.id === node.id);
      
      const graphNode: GraphNode = {
        ...node,
        x: existingNode?.x || (index === 0 ? 400 : Math.random() * 600 + 100), // First node in center, others random
        y: existingNode?.y || (index === 0 ? 300 : Math.random() * 400 + 100),
        vx: existingNode?.vx || 0,
        vy: existingNode?.vy || 0,
        connections: existingNode?.connections || []
      };
      
      // If it's a new node, position it on top
      if (!existingNode && index > 0) {
        graphNode.x = 400 + (Math.random() - 0.5) * 200; // Center area
        graphNode.y = 100 + Math.random() * 100; // Top area
      }
      
      graphNodes.push(graphNode);
    });

    // Create connections based on related topics
    graphNodes.forEach(node => {
      node.relatedTopics.forEach(relatedTopic => {
        const relatedNode = graphNodes.find(n => n.topic === relatedTopic && n.id !== node.id);
        if (relatedNode) {
          allConnections.push({
            source: node.id,
            target: relatedNode.id,
            strength: 0.5,
            type: 'related'
          });
        }
      });

      // Create prerequisite connections
      node.prerequisites.forEach(prereq => {
        const prereqNode = graphNodes.find(n => n.title.toLowerCase().includes(prereq.toLowerCase()) && n.id !== node.id);
        if (prereqNode) {
          allConnections.push({
            source: prereqNode.id,
            target: node.id,
            strength: 0.8,
            type: 'prerequisite'
          });
        }
      });
    });

    // Create connections within learning paths
    allPaths.forEach(path => {
      path.nodes.forEach((node, index) => {
        if (index < path.nodes.length - 1) {
          const nextNode = path.nodes[index + 1];
          const currentGraphNode = graphNodes.find(n => n.id === node.id);
          const nextGraphNode = graphNodes.find(n => n.id === nextNode.id);
          
          if (currentGraphNode && nextGraphNode) {
            allConnections.push({
              source: currentGraphNode.id,
              target: nextGraphNode.id,
              strength: 0.7,
              type: 'next_step'
            });
          }
        }
      });
    });

    setNodes(graphNodes);
    setConnections(allConnections);
  };

  // Force simulation for node positioning
  const simulatePhysics = useCallback(() => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      
      // Apply forces
      newNodes.forEach(node => {
        if (node.fx === undefined && node.fy === undefined) {
          // Repulsion force
          newNodes.forEach(otherNode => {
            if (node.id !== otherNode.id) {
              const dx = node.x - otherNode.x;
              const dy = node.y - otherNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = 1000 / (distance * distance);
              
              node.vx += (dx / distance) * force * 0.01;
              node.vy += (dy / distance) * force * 0.01;
            }
          });

          // Attraction force for connections
          connections.forEach(conn => {
            if (conn.source === node.id || conn.target === node.id) {
              const targetId = conn.source === node.id ? conn.target : conn.source;
              const targetNode = newNodes.find(n => n.id === targetId);
              if (targetNode) {
                const dx = targetNode.x - node.x;
                const dy = targetNode.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = conn.strength * 0.1;
                
                node.vx += (dx / distance) * force;
                node.vy += (dy / distance) * force;
              }
            }
          });

          // Apply velocity with damping
          node.vx *= 0.9;
          node.vy *= 0.9;
          node.x += node.vx;
          node.y += node.vy;

          // Keep nodes within bounds
          node.x = Math.max(50, Math.min(750, node.x));
          node.y = Math.max(50, Math.min(550, node.y));
        }
      });

      return newNodes;
    });
  }, [connections]);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(simulatePhysics, 16);
    return () => clearInterval(interval);
  }, [simulatePhysics]);

  // Draw the graph
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    // Draw connections
    connections.forEach(conn => {
      const sourceNode = nodes.find(n => n.id === conn.source);
      const targetNode = nodes.find(n => n.id === conn.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        
        // Color based on connection type
        switch (conn.type) {
          case 'prerequisite':
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            break;
          case 'related':
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            break;
          case 'next_step':
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            break;
        }
        
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const isDragged = draggedNode?.id === node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 25 : 20, 0, 2 * Math.PI);
      
      // Color based on understanding level
      switch (node.understanding) {
        case 'explored':
          ctx.fillStyle = isSelected ? '#3b82f6' : '#1e40af';
          break;
        case 'learning':
          ctx.fillStyle = isSelected ? '#8b5cf6' : '#6d28d9';
          break;
        case 'mastered':
          ctx.fillStyle = isSelected ? '#10b981' : '#059669';
          break;
        default:
          ctx.fillStyle = isSelected ? '#6b7280' : '#374151';
      }
      
      ctx.fill();
      
      // Border
      ctx.strokeStyle = isDragged ? '#f59e0b' : (isSelected ? '#ffffff' : '#4b5563');
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title, node.x, node.y + 4);
    });

    ctx.restore();
  }, [nodes, connections, selectedNode, draggedNode, zoom, pan]);

  // Redraw when data changes
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= 20;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setDraggedNode(clickedNode);
      setIsDragging(true);
      setDragOffset({ x: x - clickedNode.x, y: y - clickedNode.y });
    } else {
      setSelectedNode(null);
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && draggedNode) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - pan.x;
      const y = (e.clientY - rect.top) / zoom - pan.y;

      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === draggedNode.id 
            ? { ...node, x: x - dragOffset.x, y: y - dragOffset.y, fx: x - dragOffset.x, fy: y - dragOffset.y }
            : node
        )
      );
    } else if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && draggedNode) {
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === draggedNode.id 
            ? { ...node, fx: undefined, fy: undefined }
            : node
        )
      );
    }
    setIsDragging(false);
    setIsPanning(false);
    setDraggedNode(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev * delta)));
  };

  // Node actions
  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.source !== nodeId && conn.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const createConnection = (sourceId: string, targetId: string) => {
    const newConnection: GraphConnection = {
      source: sourceId,
      target: targetId,
      strength: 0.5,
      type: 'related'
    };
    setConnections(prev => [...prev, newConnection]);
  };

  const removeConnection = (sourceId: string, targetId: string) => {
    setConnections(prev => 
      prev.filter(conn => !(conn.source === sourceId && conn.target === targetId))
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Controls */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">Knowledge Graph</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
              className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-400">
            {nodes.length} nodes, {connections.length} connections
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-2">Legend</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-gray-300">Explored</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-gray-300">Learning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-gray-300">Mastered</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-4 h-0.5 bg-red-500"></div>
              <span className="text-gray-300">Prerequisite</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span className="text-gray-300">Related</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span className="text-gray-300">Next Step</span>
            </div>
          </div>
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{selectedNode.title}</h3>
              <p className="text-sm text-gray-400">{selectedNode.domain}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-400">Difficulty:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                selectedNode.difficulty === 'beginner' ? 'bg-green-900 text-green-300' :
                selectedNode.difficulty === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'
              }`}>
                {selectedNode.difficulty}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-400">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                selectedNode.understanding === 'explored' ? 'bg-blue-900 text-blue-300' :
                selectedNode.understanding === 'learning' ? 'bg-purple-900 text-purple-300' :
                'bg-green-900 text-green-300'
              }`}>
                {selectedNode.understanding}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-300 mb-4">{selectedNode.snippet}</p>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="flex items-center space-x-1 px-3 py-1 bg-red-900 text-red-300 rounded hover:bg-red-800"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remove</span>
            </button>
            <button
              onClick={() => window.open(selectedNode.url, '_blank')}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-900 text-blue-300 rounded hover:bg-blue-800"
            >
              <Link className="w-4 h-4" />
              <span>Visit</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
