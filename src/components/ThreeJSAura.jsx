import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as TWEEN from '@tweenjs/tween.js';

const ThreeJSAura = ({ auraState }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const orbitControlsRef = useRef(null);
  const platePivotsRef = useRef([]);
  const plateDataRef = useRef([]);
  const armoredSphereRef = useRef(null);
  const energyCoreRef = useRef(null);
  const activeWaveRef = useRef(null);
  const activePulsesRef = useRef([]);
  const clockRef = useRef(new THREE.Clock());
  const neuronSpawnTimerRef = useRef(0);

  const SPHERE_RADIUS = 2;
  const TAIL_LENGTH = 6;
  const basePlateColor = new THREE.Color(0x7B7B7B);
  const idleColor = new THREE.Color(0x00ffff);
  const processingColor = new THREE.Color(0xff4500);
  const thoughtColor = new THREE.Color(0x00bfff);
  const receivedColor = new THREE.Color(0xffd700);
  const plateMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.1,
    roughness: 0.8,
    transparent: true,
    vertexColors: true
  });

  plateMaterial.onBeforeCompile = shader => {
    shader.uniforms.pulseColor = { value: idleColor };
    shader.uniforms.thoughtColor = { value: thoughtColor };
    shader.vertexShader = 'attribute float intensity;\n' + 'attribute float thoughtIntensity;\n' + 'varying float vIntensity;\n' + 'varying float vThoughtIntensity;\n' + shader.vertexShader;
    shader.fragmentShader = 'uniform vec3 pulseColor;\n' + 'uniform vec3 thoughtColor;\n' + 'varying float vIntensity;\n' + 'varying float vThoughtIntensity;\n' + shader.fragmentShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvIntensity = intensity;\nvThoughtIntensity = thoughtIntensity;'
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
        #include <color_fragment>
        vec3 finalColor = mix(diffuseColor.rgb, pulseColor, vIntensity);
        finalColor = mix(finalColor, thoughtColor, vThoughtIntensity);
        diffuseColor.rgb = finalColor;
        diffuseColor.a *= mix(1.0, 0.4, vIntensity + vThoughtIntensity);
      `
    );
  };

  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8
  });

  useEffect(() => {
    // Scene setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current.position.z = 7;

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(rendererRef.current.domElement);

    // Controls
    orbitControlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    orbitControlsRef.current.enableDamping = true;
    orbitControlsRef.current.dampingFactor = 0.05;
    orbitControlsRef.current.enableRotate = false; // Disable rotation

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    sceneRef.current.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(8, 10, 8);
    sceneRef.current.add(pointLight);

    armoredSphereRef.current = new THREE.Group();
    sceneRef.current.add(armoredSphereRef.current);

    createArmoredSphere();
    createEnergyCore();

    // Resize handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const time = clockRef.current.getElapsedTime();

      animateState(delta, time);
      animateWave(time);
      updatePlateIntensities();

      if (auraState !== 'SLEEP' && auraState !== 'IDLE' && energyCoreRef.current) {
        const pulseFactor = (Math.sin(time * 3) + 1) / 2;
        if (TWEEN.getAll().every(t => t._object !== energyCoreRef.current.scale)) {
          energyCoreRef.current.scale.setScalar(1 + pulseFactor * 0.15);
        }
        if (TWEEN.getAll().every(t => t._object !== energyCoreRef.current.material)) {
          coreMaterial.opacity = 0.6 + pulseFactor * 0.4;
        }
      }

      TWEEN.update();
      orbitControlsRef.current.update();

      if (TWEEN.getAll().length === 0 && armoredSphereRef.current) {
        armoredSphereRef.current.rotation.y += 0.001;
        armoredSphereRef.current.rotation.x += 0.0005;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      // Dispose Three.js objects
      sceneRef.current.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      rendererRef.current.dispose();
      TWEEN.removeAll();
      platePivotsRef.current = [];
      plateDataRef.current = [];
      activePulsesRef.current = [];
      activeWaveRef.current = null;

    };
  }, []); // Empty dependency array ensures this runs only once on mount and cleanup on unmount

  const createPlate = (vHingeA, vHingeB, vPeak, plateId) => {
    const pivot = new THREE.Group();
    const hingeCenter = new THREE.Vector3().addVectors(vHingeA, vHingeB).multiplyScalar(0.5);
    pivot.position.copy(hingeCenter);
    const hingeAxis = new THREE.Vector3().subVectors(vHingeB, vHingeA).normalize();
    pivot.userData = { hingeAxis, currentAngle: 0 };
    const local_vA = vHingeA.clone().sub(hingeCenter);
    const local_vB = vHingeB.clone().sub(hingeCenter);
    const local_vPeak = vPeak.clone().sub(hingeCenter);
    const plateThickness = 0.01;
    const tempVec1 = new THREE.Vector3().subVectors(local_vB, local_vA);
    const tempVec2 = new THREE.Vector3().subVectors(local_vPeak, local_vA);
    const frontNormal = new THREE.Vector3().crossVectors(tempVec1, tempVec2).normalize();
    const back_vA = local_vA.clone().addScaledVector(frontNormal, -plateThickness);
    const back_vB = local_vB.clone().addScaledVector(frontNormal, -plateThickness);
    const back_vPeak = local_vPeak.clone().addScaledVector(frontNormal, -plateThickness);
    const plateGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array([...local_vA.toArray(), ...local_vB.toArray(), ...local_vPeak.toArray(),...back_vA.toArray(), ...back_vPeak.toArray(), ...back_vB.toArray(),...local_vA.toArray(), ...back_vA.toArray(), ...back_vB.toArray(),...local_vA.toArray(), ...back_vB.toArray(), ...local_vB.toArray(),...local_vB.toArray(), ...back_vB.toArray(), ...back_vPeak.toArray(),...local_vB.toArray(), ...back_vPeak.toArray(), ...local_vPeak.toArray(),...local_vPeak.toArray(), ...back_vPeak.toArray(), ...back_vA.toArray(),...local_vPeak.toArray(), ...back_vA.toArray(), ...local_vA.toArray(),]);
    plateGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    plateGeometry.computeVertexNormals();
    const numVertices = 24;
    const intensityArray = new Float32Array(numVertices).fill(0);
    const thoughtIntensityArray = new Float32Array(numVertices).fill(0);
    plateGeometry.setAttribute('intensity', new THREE.BufferAttribute(intensityArray, 1));
    plateGeometry.setAttribute('thoughtIntensity', new THREE.BufferAttribute(thoughtIntensityArray, 1));
    const colorArray = new Float32Array(numVertices * 3);
    for (let i = 0; i < numVertices; i++) {
      basePlateColor.toArray(colorArray, i * 3);
    }
    plateGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
    plateMesh.userData.plateId = plateId;
    pivot.add(plateMesh);
    armoredSphereRef.current.add(pivot);
    platePivotsRef.current.push(pivot);
    const plateCenter = new THREE.Vector3().add(vHingeA).add(vHingeB).add(vPeak).divideScalar(3);
    plateDataRef.current[plateId] = {id: plateId,mesh: plateMesh,center: plateCenter, vertices: [vHingeA, vHingeB, vPeak],neighbors: [],intensity: 0, thoughtIntensity: 0};
  }

  const buildPlateGraph = () => {
    const vertexMap = new Map();
    plateDataRef.current.forEach(data => {
      data.vertices.forEach(vertex => {
        const key = `${vertex.x.toFixed(3)},${vertex.y.toFixed(3)},${vertex.z.toFixed(3)}`;
        if (!vertexMap.has(key)) vertexMap.set(key, []);
        vertexMap.get(key).push(data.id);
      });
    });
    plateDataRef.current.forEach(data => {
      const neighborCounts = new Map();
      data.vertices.forEach(vertex => {
        const key = `${vertex.x.toFixed(3)},${vertex.y.toFixed(3)},${vertex.z.toFixed(3)}`;
        vertexMap.get(key).forEach(plateId => {
          if (plateId !== data.id) {
            neighborCounts.set(plateId, (neighborCounts.get(plateId) || 0) + 1);
          }
        });
      });
      for (const [plateId, count] of neighborCounts.entries()) {
        if (count === 2) data.neighbors.push(plateId);
      }
    });
  }

  const createArmoredSphere = (radius = SPHERE_RADIUS, detail = 3, plateHeight = 0.1) => {
    const baseGeometry = new THREE.IcosahedronGeometry(radius, detail);
    let plateIdCounter = 0;
    for (let i = 0; i < baseGeometry.attributes.position.count; i += 3) {
      const v1 = new THREE.Vector3().fromBufferAttribute(baseGeometry.attributes.position, i);
      const v2 = new THREE.Vector3().fromBufferAttribute(baseGeometry.attributes.position, i + 1);
      const v3 = new THREE.Vector3().fromBufferAttribute(baseGeometry.attributes.position, i + 2);
      const faceCenter = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);
      const extrusionVector = faceCenter.clone().normalize().multiplyScalar(plateHeight);
      const peakVertex = faceCenter.clone().add(extrusionVector);
      for (const [va, vb] of [[v1, v2], [v2, v3], [v3, v1]]) {
           createPlate(va, vb, peakVertex, plateIdCounter++);
      }
    }
    buildPlateGraph();
  }

  const createEnergyCore = () => {
    const coreGeometry = new THREE.SphereGeometry(0.75, 32, 32);
    energyCoreRef.current = new THREE.Mesh(coreGeometry, coreMaterial);
    energyCoreRef.current.visible = true;
    sceneRef.current.add(energyCoreRef.current);
  }

  const animatePlates = (targetAngle) => {
    TWEEN.removeAll(); // This might be too aggressive, consider removing only plate animations
    platePivotsRef.current.forEach((pivot) => {
        const currentAngle = { value: pivot.userData.currentAngle };
        new TWEEN.Tween(currentAngle).to({ value: targetAngle }, 1500).easing(TWEEN.Easing.Exponential.Out).onUpdate(() => {
                pivot.setRotationFromAxisAngle(pivot.userData.hingeAxis, currentAngle.value);
            }).onComplete(() => {
                pivot.userData.currentAngle = targetAngle;
            }).start();
    });
    const isOpening = targetAngle > 0;
    const flare = { value: 1.0 };
    new TWEEN.Tween(flare).to({ value: isOpening ? 1.5 : 0.8 }, 300).easing(TWEEN.Easing.Quadratic.InOut).yoyo(true).repeat(1).onUpdate(() => {
            if (energyCoreRef.current) energyCoreRef.current.scale.setScalar(flare.value);
        }).start();
  }


  const animateState = (delta, time) => {
    let spawnRate = 0;
    let pulseSpeed = 0.075;
    let maxPulses = 0;

    if (plateMaterial.uniforms && plateMaterial.uniforms.pulseColor) {
        switch(auraState) {
            case 'IDLE': // Mapped from existing IDLE
            case 'LISTENING':
                plateMaterial.uniforms.pulseColor.value.copy(idleColor);
                break;
            case 'PROCESSING':
                plateMaterial.uniforms.pulseColor.value.copy(processingColor);
                break;
            case 'RECEIVED':
                 plateMaterial.uniforms.pulseColor.value.copy(receivedColor);
                break;
            // Add cases for SUCCESS and ERROR if needed, or map them to existing visuals
        }
    }

    switch(auraState) {
        case 'SLEEP':
            const breatheFactor = (Math.sin(time * 0.5) + 1) / 2;
            const scale = 1 + breatheFactor * 0.01;
            if (armoredSphereRef.current) armoredSphereRef.current.scale.set(scale, scale, scale);
            if (energyCoreRef.current) {
                const heartbeatFactor = (Math.sin(time * 0.8) + 1) / 2;
                energyCoreRef.current.material.opacity = 0.1 + heartbeatFactor * 0.15;
            }
            break;
        case 'IDLE': // Mapped from existing IDLE
            spawnRate = 0.1;
            maxPulses = 15;
            pulseSpeed = 0.08;
            break;
        case 'LISTENING':
            spawnRate = 0.02;
            maxPulses = 50;
            pulseSpeed = 0.055;
            break;
        case 'PROCESSING':
            spawnRate = 0.02;
            maxPulses = 60;
            pulseSpeed = 0.1;
            if (Math.random() < 0.01 && !activeWaveRef.current && activePulsesRef.current.length > 0) {
                const randomPulseIndex = Math.floor(Math.random() * activePulsesRef.current.length);
                const originPlateId = activePulsesRef.current[randomPulseIndex].path[0];
                const originPlate = plateDataRef.current[originPlateId];
                if (originPlate) {
                     activeWaveRef.current = {
                        origin: originPlate.center.clone(),
                        startTime: clockRef.current.getElapsedTime(),
                        speed: 6.0,
                        tailLength: 2.0,
                        active: true,
                        isThought: true
                    };
                }
            }
            break;
        case 'RECEIVED':
            // Handled by animateWave and initial trigger in useEffect watching auraState
            break;
        // Handle SUCCESS and ERROR states from AuraProvider
        case 'SUCCESS': // Example: Map to a specific color or brief animation
            plateMaterial.uniforms.pulseColor.value.copy(new THREE.Color(0x10b981)); // Emerald
            // Could trigger a specific short animation or effect
            break;
        case 'ERROR': // Example: Map to a specific color or brief animation
            plateMaterial.uniforms.pulseColor.value.copy(new THREE.Color(0xef4444)); // Red
            // Could trigger a specific short animation or effect
            break;
    }

    if (auraState === 'IDLE' || auraState === 'LISTENING' || auraState === 'PROCESSING') {
        neuronSpawnTimerRef.current += delta;
        if (neuronSpawnTimerRef.current > spawnRate) {
            neuronSpawnTimerRef.current = 0;
            if (activePulsesRef.current.length < maxPulses) {
                const startPlateId = Math.floor(Math.random() * plateDataRef.current.length);
                activePulsesRef.current.push({ path: [startPlateId], timeSinceLastMove: 0 });
            }
        }
    }

    const newActivePulses = [];
    activePulsesRef.current.forEach(pulse => {
        pulse.timeSinceLastMove += delta;
        if (pulse.timeSinceLastMove > pulseSpeed) {
            pulse.timeSinceLastMove = 0;
            const headId = pulse.path[0];
            const headPlate = plateDataRef.current[headId];
            if (headPlate && headPlate.neighbors.length > 0) {
                let nextPlateId;
                if (auraState === 'PROCESSING' && Math.random() > 0.3) {
                    nextPlateId = headPlate.neighbors[Math.floor(Math.random() * headPlate.neighbors.length)];
                } else {
                    const validNeighbors = headPlate.neighbors.filter(id => !pulse.path.includes(id));
                    if (validNeighbors.length > 0) {
                        nextPlateId = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                    }
                }
                if (nextPlateId !== undefined) {
                    pulse.path.unshift(nextPlateId);
                    if (pulse.path.length > TAIL_LENGTH) pulse.path.pop();
                } else {
                    pulse.path.pop(); // Remove if no valid move
                }
            } else {
                 pulse.path.pop(); // Remove if no valid move
            }
        }
        if (pulse.path.length > 0) { // Keep pulse if it still has a path
            newActivePulses.push(pulse);
        }
    });
    activePulsesRef.current = newActivePulses;


    plateDataRef.current.forEach(data => data.intensity = 0);
    activePulsesRef.current.forEach(pulse => {
        pulse.path.forEach((plateId, index) => {
            const plate = plateDataRef.current[plateId];
            if (plate) {
                const intensity = 1.0 - (index / TAIL_LENGTH);
                plate.intensity = Math.max(plate.intensity, intensity);
            }
        });
    });
  }

  const animateWave = (time) => {
    if (!activeWaveRef.current || !activeWaveRef.current.active) return;

    const elapsedTime = time - activeWaveRef.current.startTime;
    const currentRadius = elapsedTime * activeWaveRef.current.speed;

    plateDataRef.current.forEach(data => {
        const distance = activeWaveRef.current.origin.distanceTo(data.center);
        let intensity = 0;
        if (distance < currentRadius && distance > currentRadius - activeWaveRef.current.tailLength) {
            intensity = (1.0 - (currentRadius - distance) / activeWaveRef.current.tailLength);
        }

        if (activeWaveRef.current.isThought) {
            data.thoughtIntensity = intensity;
        } else {
            data.intensity = intensity; // This will be overridden by pulse animation if both active
        }
    });

    if (currentRadius - activeWaveRef.current.tailLength > SPHERE_RADIUS * 2.5) {
        activeWaveRef.current.active = false;
        const fadeProp = activeWaveRef.current.isThought ? 'thoughtIntensity' : 'intensity';
        new TWEEN.Tween({val: 1}).to({val: 0}, 500).onUpdate((obj) => {
            plateDataRef.current.forEach(data => data[fadeProp] *= obj.val);
        }).onComplete(() => {
            activeWaveRef.current = null;
        }).start();
    }
  }

  const updatePlateIntensities = () => {
     plateDataRef.current.forEach(data => {
        const intensity = Math.max(0, data.intensity);
        const thoughtIntensity = Math.max(0, data.thoughtIntensity);
        const intensityAttr = data.mesh.geometry.attributes.intensity;
        const thoughtIntensityAttr = data.mesh.geometry.attributes.thoughtIntensity;
        for(let i = 0; i < intensityAttr.count; i++) {
            intensityAttr.setX(i, intensity);
            thoughtIntensityAttr.setX(i, thoughtIntensity);
        }
        intensityAttr.needsUpdate = true;
        thoughtIntensityAttr.needsUpdate = true;
    });
  }

  // Effect to handle auraState changes
  useEffect(() => {
    // Reset effects from previous state
    activePulsesRef.current = [];
    activeWaveRef.current = null; // Stop any ongoing wave
    plateDataRef.current.forEach(data => {
        data.intensity = 0;
        data.thoughtIntensity = 0;
    });
    if (armoredSphereRef.current) armoredSphereRef.current.scale.set(1, 1, 1);
    if (energyCoreRef.current) {
        new TWEEN.Tween(energyCoreRef.current.scale).to({ x: 1, y: 1, z: 1 }, 200).start();
        // Ensure material exists before tweening opacity
        if (energyCoreRef.current.material) {
            new TWEEN.Tween(energyCoreRef.current.material).to({ opacity: 0.8 }, 200).start();
        }
    }
    // Stop all tweens related to plate opening/closing to avoid conflicts
    // TWEEN.removeAll(); // This might be too broad, consider more targeted tween removal

    const openAngle = Math.PI / 2.5;
    switch (auraState) {
        case 'OPEN': // Hypothetical state, maps to open button
            animatePlates(openAngle);
            break;
        case 'CLOSE': // Hypothetical state, maps to close button
            animatePlates(0);
            break;
        case 'RECEIVED':
            if (plateDataRef.current.length > 0) {
                const originPlate = plateDataRef.current[Math.floor(Math.random() * plateDataRef.current.length)];
                activeWaveRef.current = {
                    origin: originPlate.center.clone(),
                    startTime: clockRef.current.getElapsedTime(),
                    speed: 4.0,
                    tailLength: 3.5,
                    active: true,
                    isThought: false
                };
            }
            break;
        // Other states are handled in animateState's switch for continuous effects
    }
  }, [auraState]);


  return <div ref={mountRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
};

export default ThreeJSAura;
