export default function Loading() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center"
    >
      <style>{`
        @keyframes rawinLoadingFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div
        className="w-5 h-5 rounded-full border-2 border-pacific-cyan/20 border-t-pacific-cyan animate-spin"
        style={{
          opacity: 0,
          animation: "spin 0.8s linear infinite, rawinLoadingFadeIn 0.2s ease-in 150ms forwards",
        }}
      />
    </div>
  );
}
