import { useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Play, Undo, Redo, Trash2, Copy, ZoomIn, ZoomOut } from "lucide-react";
import { nodeTypes } from "./FlowNodes";
import { NodePalette } from "./NodePalette";
import { PropertyEditor } from "./PropertyEditor";
import type { FlowNode, FlowNodeData, FlowNodeType, FlowEdge } from "./types";
import { cn } from "@/lib/utils";

interface FlowBuilderProps {
  flowId?: string;
  flowName?: string;
  initialNodes?: FlowNode[];
  initialEdges?: FlowEdge[];
  onSave?: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  onTest?: () => void;
}

function FlowBuilderInner({
  flowId,
  flowName = "New Flow",
  initialNodes = [],
  initialEdges = [],
  onSave,
  onTest,
}: FlowBuilderProps) {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes.length > 0 ? initialNodes : getDefaultNodes()
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as FlowNodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: FlowNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: { label: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ") },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNode(newNode);
      setIsDragging(false);
    },
    [screenToFlowPosition, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as FlowNode);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<FlowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, ...data } } : null
        );
      }
    },
    [setNodes, selectedNode]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
    toast({
      title: "Node deleted",
      description: "The selected node has been removed.",
    });
  }, [selectedNode, setNodes, setEdges, toast]);

  const duplicateSelected = useCallback(() => {
    if (!selectedNode) return;
    const newNode: FlowNode = {
      ...selectedNode,
      id: `${selectedNode.type}_${Date.now()}`,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50,
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNode(newNode);
    toast({
      title: "Node duplicated",
      description: "A copy of the node has been created.",
    });
  }, [selectedNode, setNodes, toast]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes as FlowNode[], edges);
      toast({
        title: "Flow saved",
        description: "Your changes have been saved successfully.",
      });
    }
  }, [nodes, edges, onSave, toast]);

  const handleTest = useCallback(() => {
    if (onTest) {
      onTest();
    }
    toast({
      title: "Testing flow",
      description: "Opening flow tester...",
    });
  }, [onTest, toast]);

  return (
    <div className="flex h-full" data-testid="flow-builder">
      <NodePalette onDragStart={() => setIsDragging(true)} />

      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          className={cn(
            "bg-background transition-colors",
            isDragging && "ring-2 ring-primary ring-inset"
          )}
        >
          <Panel position="top-right" className="flex gap-2">
            <div className="flex gap-1 p-1 bg-card rounded-lg border shadow-sm">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => zoomOut()}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => zoomIn()}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fitView()}
                data-testid="button-fit-view"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </Button>
            </div>
            <div className="flex gap-1 p-1 bg-card rounded-lg border shadow-sm">
              {selectedNode && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={duplicateSelected}
                    data-testid="button-duplicate-node"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={deleteSelected}
                    className="text-destructive"
                    data-testid="button-delete-node"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </Panel>

          <Panel position="bottom-center" className="flex gap-2 mb-4">
            <Button onClick={handleSave} data-testid="button-save-flow">
              <Save className="w-4 h-4 mr-2" />
              Save Flow
            </Button>
            <Button variant="outline" onClick={handleTest} data-testid="button-test-flow">
              <Play className="w-4 h-4 mr-2" />
              Test Flow
            </Button>
          </Panel>

          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-card border rounded-lg"
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>

      <PropertyEditor
        node={selectedNode}
        onUpdate={updateNodeData}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}

function getDefaultNodes(): FlowNode[] {
  return [
    {
      id: "start_1",
      type: "start",
      position: { x: 250, y: 50 },
      data: { label: "Start" },
    },
  ];
}

export function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
