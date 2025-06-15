import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";

// 🖼️ Image Component
function ImageHtml({ url, position, onClick }) {
  return (
    <Html position={position} transform occlude>
      <img
        src={url}
        alt=""
        onClick={() => onClick(position)}
        style={{
          width: "300px",
          borderRadius: "20px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
          cursor: "pointer",
        }}
      />
    </Html>
  );
}

// 🎥 CameraRig
function CameraRig({ cameraControl, focusTarget }) {
  const { camera } = useThree();

  const targetX = useRef(0);
  const targetY = useRef(0);
  const targetZ = useRef(camera.position.z);
  const ctrlPressed = useRef(false);

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Update camera target when image is clicked
  useEffect(() => {
    if (focusTarget) {
      targetX.current = focusTarget[0];
      targetY.current = focusTarget[1];
      targetZ.current = focusTarget[2] + 10;
    }
  }, [focusTarget]);

  useEffect(() => {
    if (cameraControl) {
      cameraControl.current = {
        reset: () => {
          targetX.current = 0;
          targetY.current = 0;
          targetZ.current = 10;
        },
      };
    }

    const handleKeyDown = (e) => {
      if (e.key === "Control") ctrlPressed.current = true;
    };
    const handleKeyUp = (e) => {
      if (e.key === "Control") ctrlPressed.current = false;
    };
    const handleWheel = (e) => {
      e.preventDefault();
      if (ctrlPressed.current) {
        targetZ.current += e.deltaY * 0.05;
      } else {
        targetY.current += e.deltaY * 0.06;
      }
    };
    const handleMouseDown = (e) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      targetX.current -= dx * 0.09;
      targetY.current += dy * 0.09;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useFrame(() => {
    camera.position.x += (targetX.current - camera.position.x) * 0.1;
    camera.position.y += (targetY.current - camera.position.y) * 0.1;
    camera.position.z += (targetZ.current - camera.position.z) * 0.1;
  });

  return null;
}

// 🌄 Scene Renderer
function Scene({ images, onImageClick }) {
  const spacingX = 19;
  const spacingY = 16;
  const numCols = 6;

  return (
    <>
      {images.map((img, i) => {
        const col = i % numCols;
        const row = Math.floor(i / numCols);
        const x = (col - numCols / 2) * spacingX;
        const y = -(row * spacingY);
        const z = (Math.random() - 0.5) * 25;
        return (
          <ImageHtml
            key={i}
            url={img}
            position={[x, y, z]}
            onClick={onImageClick}
          />
        );
      })}
    </>
  );
}

// 🚀 App Component
function App() {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const cameraControl = useRef(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(pos.coords),
      (err) => console.warn(err)
    );
  }, []);

  const handleImageClick = (position) => {
    setFocusTarget(position);
  };

  return (
    <>
      {/* UI Buttons */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
        {/* 📁 Select Folder */}
        <label
          style={{
            background: "#222",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginRight: "10px",
          }}
        >
          📁 Select Folder
          <input
            type="file"
            accept="image/*"
            webkitdirectory="true"
            directory=""
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              const imageFiles = files.filter((file) =>
                file.type.startsWith("image/")
              );
              const urls = imageFiles.map((file) =>
                URL.createObjectURL(file)
              );
              setImages(urls);
            }}
            style={{ display: "none" }}
          />
        </label>

        {/* 🔄 Reset View */}
        <button
          onClick={() => {
            cameraControl.current?.reset();
            setFocusTarget(null);
          }}
          style={{
            background: "#007BFF",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🔄 Reset View
        </button>
      </div>

      {/* 🎨 3D Canvas */}
      {location ? (
        <Canvas
          style={{
            height: "100vh",
            width: "100vw",
            background: "white",
            position: "fixed",
            top: 0,
            left: 0,
          }}
          camera={{ position: [0, 0, 10], fov: 75 }}
        >
          <CameraRig
            cameraControl={cameraControl}
            focusTarget={focusTarget}
          />
          <Scene images={images} onImageClick={handleImageClick} />
        </Canvas>
      ) : (
        <p style={{ textAlign: "center", marginTop: "40vh" }}>
          Requesting location...
        </p>
      )}
    </>
  );
}

export default App;
