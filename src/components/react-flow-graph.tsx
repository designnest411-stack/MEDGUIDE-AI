import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface Props {
  nodes: Node[];
  edges: Edge[];
}

export default function ReactFlowGraph({ nodes, edges }: Props) {
  return (
    <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
      <Background color="rgba(120,170,255,0.15)" gap={22} />
      <Controls className="!bg-card/80 !text-foreground" />
    </ReactFlow>
  );
}
