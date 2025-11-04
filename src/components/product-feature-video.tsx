"use client";

export default function ProductFeatureVideo() {
  return (
    <div className="relative rounded-lg overflow-hidden shadow-2xl">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-auto rounded-lg"
      >
        <source src="/showcase.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}