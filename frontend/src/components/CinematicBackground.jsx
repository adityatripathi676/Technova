import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CinematicBackground({
  particlesCount = 1500,
  particleSize = 0.15,
  particleColor = 0xffffff,
  particleOpacity = 0.8,
  rotationSpeedY = 0.0005,
  rotationSpeedX = 0.0002,
  mouseSensitivity = 0.1,
  background = 'radial-gradient(circle at center, #111111 0%, #050505 100%)'
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Create particles
    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
      // Spread them across a wide area
      posArray[i] = (Math.random() - 0.5) * 100;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    // Premium monochrome material
    const material = new THREE.PointsMaterial({
      size: particleSize,
      color: particleColor,
      transparent: true,
      opacity: particleOpacity,
      blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = width / 2;
    const windowHalfY = height / 2;

    const onDocumentMouseMove = (event) => {
      mouseX = (event.clientX - windowHalfX) * 0.05;
      mouseY = (event.clientY - windowHalfY) * 0.05;
    };
    document.addEventListener('mousemove', onDocumentMouseMove);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      particlesMesh.rotation.y += rotationSpeedY;
      particlesMesh.rotation.x += rotationSpeedX;

      // Premium cursor hover feel - smooth interpolation
      camera.position.x += (mouseX * mouseSensitivity - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * mouseSensitivity - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [particlesCount, particleSize, particleColor, particleOpacity, rotationSpeedY, rotationSpeedX, mouseSensitivity]);

  return (
    <div 
      ref={mountRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0, // Behind everything
        pointerEvents: 'none', // Allow clicks to pass through
        background: background
      }}
    />
  );
}
