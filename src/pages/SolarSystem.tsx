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
  const [selectedPlanetInfo, setSelectedPlanetInfo] = useState<{
    name: string;
    description: string;
    temperature: string;
    atmosphere: string;
  } | null>(null);
  const [cameraMode, setCameraMode] = useState<'free' | 'orbit' | 'planet'>('orbit');
  const [targetPlanet, setTargetPlanet] = useState<string | null>(null);
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
  const timeRef = useRef(0); // Add time reference for smooth animations
  const asteroidsRef = useRef<{
    points: THREE.Points;
    positions: Float32Array;
    velocities: Float32Array;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Initializing Solar System scene...');

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    // Add stars
    addStars(scene);

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    cameraRef.current = camera;
    camera.position.set(0, 50, 150);

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x333333, 0.3);
    scene.add(ambientLight);

    // Sun light
    const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Directional lights for better shadows
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Add fog for depth
    scene.fog = new THREE.Fog(0x000000, 100, 1000);

    // Enhanced camera controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 1000;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.screenSpacePanning = true;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls.target.set(0, 0, 0);
    controls.update();

    // Add camera mode controls
    controls.addEventListener('change', () => {
      if (cameraMode === 'planet' && targetPlanet) {
        const planet = planetsRef.current[targetPlanet];
        if (planet) {
          const planetPosition = new THREE.Vector3();
          planet.getWorldPosition(planetPosition);
          controls.target.copy(planetPosition);
        }
      }
    });

    // Create planets
    createPlanets(scene);
    
    // Add planet labels if enabled
    if (showLabels) {
      addPlanetLabels(scene);
    }

    // Add asteroids
    const asteroids = addAsteroids(scene);
    asteroidsRef.current = asteroids;

    // Start animation loop with better timing
    let lastTime = 0;
    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Calculate delta time for smooth animations
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Update time reference
      timeRef.current += deltaTime;
      
      // Rotate planets
      rotatePlanets();
      
      // Update asteroids
      if (asteroidsRef.current) {
        updateAsteroids(
          asteroidsRef.current.points,
          asteroidsRef.current.positions,
          asteroidsRef.current.velocities
        );
      }
      
      // Update controls with smooth damping
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
    
    animate(0);
    setLoading(false);
    console.log('Scene initialization complete');

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

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
  };

  // Create all planets
  const createPlanets = (scene: THREE.Scene) => {
    // Create sun with realistic glow
    const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
    const sunMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 2,
      toneMapped: false
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.name = 'sun';
    scene.add(sun);
    planetsRef.current['sun'] = sun;

    // Add sun glow effect
    const sunGlowGeometry = new THREE.SphereGeometry(5.2, 64, 64);
    const sunGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 1.0 },
        p: { value: 3.0 },
        glowColor: { value: new THREE.Color(0xffff00) },
        viewVector: { value: cameraRef.current?.position || new THREE.Vector3() }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow( dot(vNormal, vNormel), 6.0 );
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sun.add(sunGlow);

    // Add point light at sun's position
    const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
    sun.add(sunLight);

    // Create planets with realistic materials
    planetData.forEach(planet => {
      // Create planet geometry with more segments for better detail
      const planetSize = planet.size * 0.4;
      const planetGeometry = new THREE.SphereGeometry(planetSize, 64, 64);
      
      // Create planet material with PBR properties
      const planetMaterial = new THREE.MeshStandardMaterial({
        color: planet.color,
        metalness: 0.1,
        roughness: 0.8,
        envMapIntensity: 1.0,
        emissive: planet.color,
        emissiveIntensity: 0.1
      });
      
      // Create planet mesh
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      planetMesh.name = planet.id;
      
      // Position planet with random initial angle
      const angle = Math.random() * Math.PI * 2;
      planetMesh.position.x = Math.cos(angle) * planet.orbitRadius;
      planetMesh.position.z = Math.sin(angle) * planet.orbitRadius;
      
      // Add planet to scene
      scene.add(planetMesh);
      planetsRef.current[planet.id] = planetMesh;

      // Create moons with realistic materials
      planet.moons.forEach(moon => {
        const moonSize = moon.diameter / 10000;
        const moonGeometry = new THREE.SphereGeometry(moonSize, 32, 32);
        
        const moonMaterial = new THREE.MeshStandardMaterial({
          color: moon.color,
          metalness: 0.1,
          roughness: 0.8,
          envMapIntensity: 1.0,
          emissive: moon.color,
          emissiveIntensity: 0.05
        });
        
        const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        moonMesh.name = `${planet.id}_${moon.id}`;
        
        // Position moon relative to its planet
        const moonAngle = Math.random() * Math.PI * 2;
        moonMesh.position.x = Math.cos(moonAngle) * moon.orbitRadius;
        moonMesh.position.z = Math.sin(moonAngle) * moon.orbitRadius;
        
        planetMesh.add(moonMesh);
        planetsRef.current[`${planet.id}_${moon.id}`] = moonMesh;
      });

      // Add orbit line with better visibility
      const orbitGeometry = new THREE.RingGeometry(
        planet.orbitRadius - 0.1,
        planet.orbitRadius + 0.1,
        256
      );
      const orbitMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.8
      });
      const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitLine.rotation.x = Math.PI / 2;
      scene.add(orbitLine);

      // Add rings for Saturn with realistic appearance
      if (planet.id === 'saturn') {
        const ringGeometry = new THREE.RingGeometry(
          planetSize * 1.2,
          planetSize * 2,
          128
        );
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: 0xf8e8c0,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          metalness: 0.3,
          roughness: 0.7,
          emissive: 0xf8e8c0,
          emissiveIntensity: 0.1
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 4;
        planetMesh.add(ring);
      }
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
          label.lookAt(cameraRef.current.position);
        }
      }
    });
  };

  // Helper to get planet by ID
  const getPlanetById = (id: string) => {
    return planetData.find(planet => planet.id === id);
  };

  // Rotate planets
  const rotatePlanets = () => {
    timeRef.current += 0.016;

    // Rotate sun with smooth motion
    if (planetsRef.current['sun']) {
      planetsRef.current['sun'].rotation.y = timeRef.current * getSunData().rotationSpeed * 0.01;
    }
    
    // Rotate and orbit planets with smooth motion
    planetData.forEach(planet => {
      const planetMesh = planetsRef.current[planet.id];
      
      if (planetMesh) {
        // Smooth rotation around axis
        planetMesh.rotation.y = timeRef.current * planet.rotationSpeed * 0.01;
        
        // Smooth orbital motion
        const orbitAngle = timeRef.current * planet.orbitSpeed * 0.01 * orbitSpeed;
        planetMesh.position.x = Math.cos(orbitAngle) * planet.orbitRadius;
        planetMesh.position.z = Math.sin(orbitAngle) * planet.orbitRadius;
        
        // Add slight wobble to make it more natural
        planetMesh.position.y = Math.sin(timeRef.current * 0.5) * 0.1;

        // Animate moons
        planet.moons.forEach(moon => {
          const moonMesh = planetsRef.current[`${planet.id}_${moon.id}`];
          if (moonMesh) {
            // Moon rotation
            moonMesh.rotation.y = timeRef.current * moon.rotationSpeed * 0.01;
            
            // Moon orbit around planet
            const moonOrbitAngle = timeRef.current * moon.orbitSpeed * 0.01 * orbitSpeed;
            moonMesh.position.x = Math.cos(moonOrbitAngle) * moon.orbitRadius;
            moonMesh.position.z = Math.sin(moonOrbitAngle) * moon.orbitRadius;
          }
        });
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
                const planetInfo = planetId === 'sun' ? getSunData() : planetData.find(p => p.id === planetId);
                if (planetInfo) {
                  setSelectedPlanetInfo({
                    name: planetInfo.name,
                    description: planetInfo.description,
                    temperature: planetInfo.temperature,
                    atmosphere: planetInfo.atmosphere
                  });
                }
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
          setOrbitSpeed(prev => Math.min(prev + 0.1, 5));
          break;
        case '-':
        case '_':
          setOrbitSpeed(prev => Math.max(prev - 0.1, 0.1));
          break;
        case 'r':
        case 'R':
          if (controlsRef.current) {
            controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
          }
          break;
        case 'Home':
          if (controlsRef.current && cameraRef.current) {
            cameraRef.current.position.set(0, 50, 150);
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Add asteroids
  const addAsteroids = (scene: THREE.Scene) => {
    const asteroidCount = 1000;
    const asteroidGeometry = new THREE.BufferGeometry();
    const asteroidMaterial = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.05,
      transparent: true,
      opacity: 0.8
    });

    const asteroidPositions = new Float32Array(asteroidCount * 3);
    const asteroidVelocities = new Float32Array(asteroidCount * 3);

    for (let i = 0; i < asteroidCount; i++) {
      const radius = 100 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;

      asteroidPositions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
      asteroidPositions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      asteroidPositions[i * 3 + 2] = radius * Math.cos(theta);

      asteroidVelocities[i * 3] = (Math.random() - 0.5) * 0.1;
      asteroidVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      asteroidVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    asteroidGeometry.setAttribute('position', new THREE.BufferAttribute(asteroidPositions, 3));
    const asteroids = new THREE.Points(asteroidGeometry, asteroidMaterial);
    scene.add(asteroids);
    return { points: asteroids, positions: asteroidPositions, velocities: asteroidVelocities };
  };

  // Update asteroid positions
  const updateAsteroids = (asteroids: THREE.Points, positions: Float32Array, velocities: Float32Array) => {
    const asteroidPositions = asteroids.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < asteroidPositions.length; i += 3) {
      asteroidPositions[i] += velocities[i];
      asteroidPositions[i + 1] += velocities[i + 1];
      asteroidPositions[i + 2] += velocities[i + 2];

      // Wrap asteroids around the scene bounds
      const maxDistance = 500;
      if (Math.abs(asteroidPositions[i]) > maxDistance) asteroidPositions[i] *= -0.9;
      if (Math.abs(asteroidPositions[i + 1]) > maxDistance) asteroidPositions[i + 1] *= -0.9;
      if (Math.abs(asteroidPositions[i + 2]) > maxDistance) asteroidPositions[i + 2] *= -0.9;
    }
    asteroids.geometry.attributes.position.needsUpdate = true;
  };

  // Add camera mode change handler
  const handleCameraModeChange = (mode: 'free' | 'orbit' | 'planet') => {
    setCameraMode(mode);
    if (controlsRef.current) {
      controlsRef.current.autoRotate = mode === 'orbit';
      controlsRef.current.enablePan = mode === 'free';
      controlsRef.current.enableZoom = true;
      controlsRef.current.enableRotate = true;
      
      if (mode === 'free') {
        controlsRef.current.target.set(0, 0, 0);
        if (cameraRef.current) {
          cameraRef.current.position.set(0, 50, 150);
        }
      } else if (mode === 'planet' && targetPlanet) {
        const planet = planetsRef.current[targetPlanet];
        if (planet) {
          const planetPosition = new THREE.Vector3();
          planet.getWorldPosition(planetPosition);
          controlsRef.current.target.copy(planetPosition);
        }
      }
    }
  };

  return (
    <div className="relative w-full h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      )}
      
      {/* Planet Info Display */}
      {selectedPlanetInfo && (
        <div className="absolute bottom-4 left-4 z-10 bg-gray-800 bg-opacity-70 p-4 rounded-lg max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">{selectedPlanetInfo.name}</h3>
          <p className="text-gray-300 text-sm mb-2">{selectedPlanetInfo.description}</p>
          <div className="text-gray-300 text-sm space-y-1">
            <p>Temperature: {selectedPlanetInfo.temperature}</p>
            <p>Atmosphere: {selectedPlanetInfo.atmosphere}</p>
          </div>
        </div>
      )}
      
      {/* Camera controls */}
      <div className="absolute top-4 right-4 z-10 bg-gray-800 bg-opacity-70 p-4 rounded-lg">
        <h3 className="text-white font-bold mb-2">Camera Mode</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleCameraModeChange('orbit')}
            className={`w-full px-3 py-1 rounded ${
              cameraMode === 'orbit' ? 'bg-yellow-500' : 'bg-gray-700'
            } text-white`}
          >
            Orbit Mode
          </button>
          <button
            onClick={() => handleCameraModeChange('free')}
            className={`w-full px-3 py-1 rounded ${
              cameraMode === 'free' ? 'bg-yellow-500' : 'bg-gray-700'
            } text-white`}
          >
            Free Mode
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-300">
          <p>• Orbit: Rotate around target</p>
          <p>• Free: Move anywhere in space</p>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-10 bg-gray-800 bg-opacity-70 p-4 rounded-lg max-w-xs">
        <h2 className="text-xl font-bold text-white mb-2">Solar System Explorer</h2>
        <p className="text-gray-300 text-sm mb-2">Click on a planet to learn more about it.</p>
        <div className="text-gray-300 text-sm space-y-1">
          <p>• Mouse: Rotate, scroll to zoom</p>
          <p>• L: Toggle planet labels</p>
          <p>• +/-: Adjust orbit speed</p>
          <p>• R: Toggle auto-rotation</p>
          <p>• Home: Reset camera</p>
          <p>• Right-click + drag: Pan in free mode</p>
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