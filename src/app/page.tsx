"use client"
import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  price: string;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const booksRef = useRef<THREE.Group[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(null);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [hoveredBook, setHoveredBook] = useState<number | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  const books: Book[] = useMemo(() => [
    {
      id: 0,
      title: "The Quantum Mind",
      author: "Dr. Sarah Chen",
      description: "Explore the fascinating intersection of quantum physics and consciousness in this groundbreaking work.",
      price: "$24.99",
      color: "#ff6b6b",
      position: [-3, 0, 0],
      rotation: [0, 0.3, 0]
    },
    {
      id: 1,
      title: "Digital Dreams",
      author: "Alex Rivera",
      description: "A cyberpunk thriller that questions the nature of reality in our increasingly digital world.",
      price: "$19.99",
      color: "#4ecdc4",
      position: [0, 0, 0],
      rotation: [0, 0, 0]
    },
    {
      id: 2,
      title: "The Last Garden",
      author: "Emma Thompson",
      description: "A beautiful tale of hope and renewal in a world where nature struggles to survive.",
      price: "$22.99",
      color: "#45b7d1",
      position: [3, 0, 0],
      rotation: [0, -0.3, 0]
    }
  ], []);

  const createBookGeometry = (color: string): THREE.Group => {
    const bookGroup = new THREE.Group();

    const coverGeometry = new THREE.BoxGeometry(1.5, 2, 0.1);
    const coverMaterial = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 100,
      specular: 0x444444
    });
    const cover = new THREE.Mesh(coverGeometry, coverMaterial);

    const spineGeometry = new THREE.BoxGeometry(0.1, 2, 1);
    const spineMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color).multiplyScalar(0.8)
    });
    const spine = new THREE.Mesh(spineGeometry, spineMaterial);
    spine.position.set(-0.75, 0, 0);

    const pagesGeometry = new THREE.BoxGeometry(1.4, 1.9, 0.8);
    const pagesMaterial = new THREE.MeshPhongMaterial({
      color: 0xf5f5f5
    });
    const pages = new THREE.Mesh(pagesGeometry, pagesMaterial);
    pages.position.set(0, 0, -0.1);

    bookGroup.add(cover);
    bookGroup.add(spine);
    bookGroup.add(pages);

    return bookGroup;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Responsive zoom
    if (window.innerWidth < 640) {
      camera.position.set(0, 1, 12);
    } else if (window.innerWidth < 1024) {
      camera.position.set(0, 1, 10);
    } else {
      camera.position.set(0, 1, 8);
    }

    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xff6b6b, 0.8, 10);
    pointLight1.position.set(-4, 2, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4ecdc4, 0.8, 10);
    pointLight2.position.set(4, 2, 2);
    scene.add(pointLight2);

    // Create books
    books.forEach((bookData, index) => {
      const bookGroup = createBookGeometry(bookData.color);
      bookGroup.position.set(...bookData.position);
      bookGroup.rotation.set(...bookData.rotation);
      bookGroup.castShadow = true;
      bookGroup.receiveShadow = true;
      bookGroup.userData = { bookId: index };

      scene.add(bookGroup);
      booksRef.current[index] = bookGroup;
    });

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

      mouse.x = mouseRef.current.x;
      mouse.y = mouseRef.current.y;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(booksRef.current, true);

      if (intersects.length > 0) {
        const bookGroup = intersects[0].object.parent;
        if (bookGroup && bookGroup.userData.bookId !== undefined) {
          setHoveredBook(bookGroup.userData.bookId);
        }
      } else {
        setHoveredBook(null);
      }
    };

    const onClick = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(booksRef.current, true);

      if (intersects.length > 0) {
        const bookGroup = intersects[0].object.parent;
        if (bookGroup && bookGroup.userData.bookId !== undefined) {
          setSelectedBook(books[bookGroup.userData.bookId]);
        }
      } else {
        setSelectedBook(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      camera.position.x += (mouseRef.current.x * 2 - camera.position.x) * 0.02;
      camera.position.y += (mouseRef.current.y * 1 - camera.position.y + 1) * 0.02;
      camera.lookAt(0, 0, 0);

      booksRef.current.forEach((book, index) => {
        if (hoveredBook === index) {
          book.position.y += (0.5 - book.position.y) * 0.1;
          book.rotation.y += (books[index].rotation[1] + 0.1 - book.rotation.y) * 0.1;
        } else {
          book.position.y += (0 - book.position.y) * 0.1;
          book.rotation.y += (books[index].rotation[1] - book.rotation.y) * 0.1;
        }

        book.position.y += Math.sin(Date.now() * 0.001 + index) * 0.005;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;

        if (window.innerWidth < 640) {
          camera.position.set(0, 1, 12);
        } else if (window.innerWidth < 1024) {
          camera.position.set(0, 1, 10);
        } else {
          camera.position.set(0, 1, 8);
        }

        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [books, hoveredBook]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Header */}
      <div className="absolute top-6 sm:top-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-10 px-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light bg-gradient-to-r from-pink-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
          Fabio Books
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-white/80 mt-2 font-light">
          Discover Stories That Transform Reality
        </p>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-10 px-4">
        <p className="text-sm sm:text-lg text-white/70 animate-bounce">
          Move your mouse to explore • Tap books to learn more
        </p>
      </div>

      {/* Book Info Panel */}
      {selectedBook && (
        <div className="absolute bottom-22 sm:bottom-24 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 w-[90%] sm:max-w-md text-center z-20 transition-all duration-500 animate-in slide-in-from-bottom-4">
          <button
            onClick={(e) => {
              e.stopPropagation();   // ✅ prevents click going through to the 3D scene
              setSelectedBook(null);
            }} className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>

          <h3 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-2">
            {selectedBook.title}
          </h3>
          <p className="text-lg sm:text-xl text-white/90 mb-4">
            by {selectedBook.author}
          </p>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-6">
            {selectedBook.description}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-pink-400 mb-6">
            {selectedBook.price}
          </p>

          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
              Add to Cart
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewMessage("The preview is not available for now.");
                setTimeout(() => setPreviewMessage(null), 3000); // auto-hide after 3s
              }}
              className="w-full border border-white/30 hover:bg-white/10 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-300"
            >
              Preview
            </button>
            {previewMessage && (
  <p className="text-sm text-red-400 mt-3 animate-pulse">
    {previewMessage}
  </p>
)}


          </div>
        </div>
      )}

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-pulse opacity-80"></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce opacity-70"></div>
      </div>
    </div>
  );
};
