"use client";

import dynamic from "next/dynamic";

const GridScan = dynamic(() => import("@/components/GridScan"), {
  ssr: false,
});

export default function GridScanOrbitBackground() {
  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none bg-[#09090e]"
      aria-hidden="true"
    >
      {/* Base dark backdrop */}
      <div className="absolute inset-0 w-full h-full bg-[#09090e]" />

      <div className="relative w-full h-full">
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#2F293A"
          gridScale={0.1}
          scanColor="#a2f2ff"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
        />
      </div>
    </div>
  );
}
