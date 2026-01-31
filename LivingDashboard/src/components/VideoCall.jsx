import React, { useEffect, useRef } from "react";

export default function VideoCall() {
  const videoRef = useRef(null);
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        // Peer wiring stub
      } catch (e) {
        console.warn("VideoCall getUserMedia failed", e);
      }
    })();
  }, []);

  return (
    <section aria-label="Video Call" style={{ padding: 12 }}>
      <h3>Video Call</h3>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", maxWidth: 480 }}
      />
    </section>
  );
}
