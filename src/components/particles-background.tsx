import dynamic from 'next/dynamic';
import { memo } from 'react';

// Import the particles component with SSR disabled
// This ensures it only loads on the client side
const ParticlesClient = dynamic(() => import('./particles-client'), {
  ssr: false,
  loading: () => null
});

// Use React.memo to prevent unnecessary re-renders
function ParticlesBackground() {
  return (
    <div className="particles-container" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <ParticlesClient />
    </div>
  );
}

// Export a memoized version of the component
export default memo(ParticlesBackground);
