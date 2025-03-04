import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useNavigate } from 'react-router-dom';
import { planetData, getSunData } from '../utils/planetData';

const SolarSystem: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [orbitSpeed, setOrbitSpeed] = useState(1);
  const navigate = useNavigate();
  
  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const planetsRef = useRef<{[key: string]: THREE.Object3D}>({});
  const labelsRef = useRef<{[key: string]: THREE.Object3D}>({});
  const animationFrameRef = useRef<number | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    // Add stars
    addStars(scene);

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.set(0, 30, 80);

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 200;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // Create sun
    createSun(scene);

    // Create planets
    createPlanets(scene);

    // Add orbit lines
    addOrbitLines(scene);

    // Add planet labels
    if (showLabels) {
      addPlanetLabels(scene);
    }

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Rotate planets
      rotatePlanets();
      
      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Update planet labels to face camera
      if (showLabels) {
        updateLabels();
      }
      
      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    setLoading(false);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    };
  }, []);

  // Update when showLabels changes
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Remove all existing labels
    Object.values(labelsRef.current).forEach(label => {
      sceneRef.current?.remove(label);
    });
    labelsRef.current = {};
    
    // Add labels if enabled
    if (showLabels) {
      addPlanetLabels(sceneRef.current);
    }
  }, [showLabels]);

  // Add stars to the scene
  const addStars = (scene: THREE.Scene) => {
    // Create small stars (points)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.1,
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Add some larger, glowing stars
    const largeStarGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const largeStarMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 50; i++) {
      const star = new THREE.Mesh(largeStarGeometry, largeStarMaterial);
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      
      star.position.set(x, y, z);
      scene.add(star);
    }
  };

  // Create the sun
  const createSun = (scene: THREE.Scene) => {
    const sunData = getSunData();
    
    // Try to load sun texture, fall back to basic material if not available
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    let sunMaterial: THREE.Material;
    
    try {
      // Create a glowing sun material
      const sunTexture = textureLoaderRef.current.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/sun.jpg');
      sunMaterial = new THREE.MeshBasicMaterial({
        map: sunTexture,
        color: sunData.color,
      });
    } catch (error) {
      console.warn('Failed to load sun texture, using fallback', error);
      sunMaterial = new THREE.MeshBasicMaterial({
        color: sunData.color,
        emissive: sunData.color,
        emissiveIntensity: 1,
      });
    }
    
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.name = 'sun';
    scene.add(sun);
    planetsRef.current['sun'] = sun;

    // Add point light at sun's position
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 1000);
    sun.add(sunLight);
    
    // Add a glow effect
    const sunGlowGeometry = new THREE.SphereGeometry(5.5, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.3,
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sun.add(sunGlow);
  };

  // Create all planets
  const createPlanets = (scene: THREE.Scene) => {
    planetData.forEach(planet => {
      // Create planet geometry
      const planetSize = planet.size * 0.4; // Scale down for better visualization
      const planetGeometry = new THREE.SphereGeometry(planetSize, 32, 32);
      
      // Try to load planet texture, fall back to basic material if not available
      let planetMaterial: THREE.Material;
      
      try {
        // Use placeholder URLs for textures
        const textureUrl = getTextureUrl(planet.id);
        if (textureUrl) {
          const texture = textureLoaderRef.current.load(textureUrl);
          planetMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7,
            metalness: 0.1
          });
        } else {
          throw new Error('No texture URL available');
        }
      } catch (error) {
        console.warn(`Failed to load texture for ${planet.name}, using fallback`, error);
        planetMaterial = new THREE.MeshStandardMaterial({
          color: planet.color,
          roughness: 0.7,
          metalness: 0.1
        });
      }
      
      // Create planet mesh
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      planetMesh.name = planet.id;
      planetMesh.castShadow = true;
      planetMesh.receiveShadow = true;
      
      // Position planet
      const angle = Math.random() * Math.PI * 2;
      planetMesh.position.x = Math.cos(angle) * planet.orbitRadius;
      planetMesh.position.z = Math.sin(angle) * planet.orbitRadius;
      
      // Create planet pivot for orbit
      const planetPivot = new THREE.Object3D();
      planetPivot.name = `${planet.id}-pivot`;
      planetPivot.add(planetMesh);
      scene.add(planetPivot);
      
      // Store reference to planet
      planetsRef.current[planet.id] = planetMesh;
      planetsRef.current[`${planet.id}-pivot`] = planetPivot;
      
      // Add rings for Saturn
      if (planet.id === 'saturn') {
        addSaturnRings(planetMesh, planetSize);
      }
    });
  };

  // Add rings for Saturn
  const addSaturnRings = (saturnMesh: THREE.Object3D, planetSize: number) => {
    const innerRadius = planetSize * 1.2;
    const outerRadius = planetSize * 2;
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    
    // Rotate the ring geometry to be horizontal
    const positionAttribute = ringGeometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      vertex.z = vertex.y;
      vertex.y = 0;
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xf8e8c0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 4; // Tilt the rings
    saturnMesh.add(ring);
  };

  // Add orbit lines
  const addOrbitLines = (scene: THREE.Scene) => {
    planetData.forEach(planet => {
      const orbitGeometry = new THREE.BufferGeometry();
      const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x444444,
        transparent: true,
        opacity: 0.3
      });
      
      const orbitPoints = [];
      const segments = 128;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * planet.orbitRadius;
        const z = Math.sin(angle) * planet.orbitRadius;
        orbitPoints.push(x, 0, z);
      }
      
      orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbit);
    });
  };

  // Add planet labels
  const addPlanetLabels = (scene: THREE.Scene) => {
    // Add sun label
    createLabel('sun', 'Sun', scene);
    
    // Add planet labels
    planetData.forEach(planet => {
      createLabel(planet.id, planet.name, scene);
    });
  };

  // Create a text label for a planet
  const createLabel = (planetId: string, name: string, scene: THREE.Scene) => {
    const planetObj = planetsRef.current[planetId];
    if (!planetObj) return;
    
    // Create a canvas for the label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 256;
    canvas.height = 128;
    
    // Draw text on canvas
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'Bold 24px Arial';
    context.textAlign = 'center';
    context.fillStyle = 'white';
    context.fillText(name, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create sprite material with the texture
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Scale and position the sprite
    sprite.scale.set(5, 2.5, 1);
    
    // Position above the planet
    const planetPosition = new THREE.Vector3();
    planetObj.getWorldPosition(planetPosition);
    
    // Get planet size
    let planetSize = 1;
    if (planetId === 'sun') {
      planetSize = 5;
    } else {
      const planet = planetData.find(p => p.id === planetId);
      if (planet) {
        planetSize = planet.size * 0.4;
      }
    }
    
    sprite.position.copy(planetPosition);
    sprite.position.y = planetSize + 2; // Position above the planet
    
    scene.add(sprite);
    labelsRef.current[planetId] = sprite;
  };

  // Update label positions to follow planets
  const updateLabels = () => {
    Object.keys(labelsRef.current).forEach(planetId => {
      const planet = planetsRef.current[planetId];
      const label = labelsRef.current[planetId];
      
      if (planet && label) {
        const planetPosition = new THREE.Vector3();
        planet.getWorldPosition(planetPosition);
        
        // Get planet size
        let planetSize = 1;
        if (planetId === 'sun') {
          planetSize = 5;
        } else {
          const planetData = getPlanetById(planetId);
          if (planetData) {
            planetSize = planetData.size * 0.4;
          }
        }
        
        label.position.copy(planetPosition);
        label.position.y = planetSize + 2; // Position above the planet
        
        // Make label face the camera
        if (cameraRef.current) {
          const labelDirection = new THREE.Vector3();
          label.getWorldPosition(labelDirection);
          labelDirection.sub(cameraRef.current.position);
          label.lookAt(cameraRef.current.position);
        }
      }
    });
  };

  // Helper to get planet by ID
  const getPlanetById = (id: string) => {
    return planetData.find(planet => planet.id === id);
  };

  // Helper to get texture URL based on planet ID
  const getTextureUrl = (planetId: string): string => {
    const textureMap: {[key: string]: string} = {
      'mercury': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mercury.jpg',
      'venus': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus.jpg',
      'earth': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth.jpg',
      'mars': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars.jpg',
      'jupiter': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/jupiter.jpg',
      'saturn': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn.jpg',
      'uranus': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/uranus.jpg',
      'neptune': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/neptune.jpg'
    };
    
    return textureMap[planetId] || '';
  };

  // Rotate planets
  const rotatePlanets = () => {
    // Rotate sun
    if (planetsRef.current['sun']) {
      planetsRef.current['sun'].rotation.y += getSunData().rotationSpeed * 0.01;
    }
    
    // Rotate and orbit planets
    planetData.forEach(planet => {
      const planetMesh = planetsRef.current[planet.id];
      const planetPivot = planetsRef.current[`${planet.id}-pivot`];
      
      if (planetMesh && planetPivot) {
        // Rotate planet around its axis
        planetMesh.rotation.y += planet.rotationSpeed * 0.01;
        
        // Orbit planet around the sun
        planetPivot.rotation.y += planet.orbitSpeed * 0.01 * orbitSpeed;
      }
    });
  };

  // Handle planet click
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      if (cameraRef.current && sceneRef.current) {
        raycaster.setFromCamera(mouse, cameraRef.current);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

        if (intersects.length > 0) {
          // Find the first intersected object that is a planet
          for (let i = 0; i < intersects.length; i++) {
            const object = intersects[i].object;
            
            // Check if the object is a planet
            if (object instanceof THREE.Mesh) {
              const planetId = object.name;
              
              // Check if it's a valid planet or the sun
              if (planetId === 'sun' || planetData.some(p => p.id === planetId)) {
                setSelectedPlanet(planetId);
                navigate(`/planet/${planetId}`);
                break;
              }
            }
          }
        }
      }
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [navigate]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'l':
        case 'L':
          setShowLabels(prev => !prev);
          break;
        case '+':
        case '=':
          setOrbitSpeed(prev => Math.min(prev + 0.5, 5));
          break;
        case '-':
        case '_':
          setOrbitSpeed(prev => Math.max(prev - 0.5, 0.1));
          break;
        case 'r':
        case 'R':
          if (controlsRef.current) {
            controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
          }
          break;
        case 'Home':
          if (controlsRef.current && cameraRef.current) {
            cameraRef.current.position.set(0, 30, 80);
            controlsRef.current.target.set(0, 0, 0);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      )}
      <div className="absolute top-4 left-4 z-10 bg-gray-800 bg-opacity-70 p-4 rounded-lg max-w-xs">
        <h2 className="text-xl font-bold text-white mb-2">Solar System Explorer</h2>
        <p className="text-gray-300 text-sm mb-2">Click on a planet to learn more about it.</p>
        <div className="text-gray-300 text-sm space-y-1">
          <p>• Mouse: Rotate, scroll to zoom</p>
          <p>• L: Toggle planet labels</p>
          <p>• +/-: Adjust orbit speed</p>
          <p>• R: Toggle auto-rotation</p>
          <p>• Home: Reset camera</p>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Orbit Speed:</span>
            <span className="text-sm text-yellow-400">{orbitSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={orbitSpeed}
            onChange={(e) => setOrbitSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"
          />
        </div>
        <div className="mt-3 flex items-center">
          <input
            type="checkbox"
            id="showLabels"
            checked={showLabels}
            onChange={() => setShowLabels(!showLabels)}
            className="mr-2"
          />
          <label htmlFor="showLabels" className="text-sm text-gray-300">Show Labels</label>
        </div>
      </div>
      <div ref={containerRef} className="w-full h-full"></div>
    </div>
  );
};

export default SolarSystem;