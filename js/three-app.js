/**
 * FocusList 3D - Three.js WebGL Scene & Scroll Animation Engine
 * 100% Client-Side WebGL | Dynamic Scroll Camera Animation | Interactive Task Crystals
 */

'use strict';

class World3D {
  constructor() {
    this.container = document.getElementById('webgl-canvas-container');
    this.canvas = document.getElementById('webgl-canvas');
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Groups & Meshes
    this.coreGroup = null;
    this.taskCrystalsGroup = null;
    this.ringsGroup = null;
    this.particleSystem = null;
    this.particleBurst = [];

    // Interaction & Animation
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);
    this.targetMouse = new THREE.Vector2(0, 0);
    this.hoveredObject = null;
    this.clock = new THREE.Clock();

    // Scroll Control
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.rotationSpeed = 1.0;
    this.isWireframe = false;

    // Camera Waypoints for Smooth Section Scrolling
    this.cameraKeyframes = [
      // Hero (overview, looking front-center)
      { pos: new THREE.Vector3(0, 1.5, 14), target: new THREE.Vector3(0, 0, 0) },
      // 3D Task Matrix (zoomed closer, angled downward)
      { pos: new THREE.Vector3(0, 3.5, 9), target: new THREE.Vector3(0, 0.5, 0) },
      // To-Do Console (panned to right side, viewing tasks from flank)
      { pos: new THREE.Vector3(-4.5, 1.8, 10), target: new THREE.Vector3(1, 0, 0) },
      // Productivity & Analytics (high angle overview of rings)
      { pos: new THREE.Vector3(2.5, 6, 8), target: new THREE.Vector3(0, -0.5, 0) },
      // Rules & Compliance (deep cosmic wide shot)
      { pos: new THREE.Vector3(0, 2, 16), target: new THREE.Vector3(0, 0, 0) }
    ];

    this.currentCameraPos = new THREE.Vector3().copy(this.cameraKeyframes[0].pos);
    this.currentCameraTarget = new THREE.Vector3().copy(this.cameraKeyframes[0].target);

    this.init();
  }

  init() {
    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060810, 0.038);

    // 2. Camera Setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentCameraTarget);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 4. Lighting
    this.setupLighting();

    // 5. Construct 3D Entities
    this.createCore();
    this.createGyroscopicRings();
    this.createStarfield();
    this.taskCrystalsGroup = new THREE.Group();
    this.scene.add(this.taskCrystalsGroup);

    // 6. Bind Events
    this.bindEvents();

    // 7. Initial Tasks Render in 3D
    if (window.todoManager) {
      this.rebuildTaskCrystals(window.todoManager.tasks);
    }

    // 8. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Primary Cyan Rim Light
    this.lightCyan = new THREE.DirectionalLight(0x00f2fe, 2.2);
    this.lightCyan.position.set(10, 15, 12);
    this.scene.add(this.lightCyan);

    // Secondary Magenta Rim Light
    this.lightPink = new THREE.DirectionalLight(0xff0080, 2.0);
    this.lightPink.position.set(-12, -8, -10);
    this.scene.add(this.lightPink);

    // Dynamic Pulsing Center Point Light
    this.corePointLight = new THREE.PointLight(0x00f2fe, 3, 20);
    this.corePointLight.position.set(0, 0, 0);
    this.scene.add(this.corePointLight);
  }

  createCore() {
    this.coreGroup = new THREE.Group();

    // Outer Holographic Wireframe Icosahedron
    const outerGeo = new THREE.IcosahedronGeometry(1.8, 1);
    this.outerMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      wireframe: true,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85
    });
    this.outerCore = new THREE.Mesh(outerGeo, this.outerMat);
    this.coreGroup.add(this.outerCore);

    // Inner Glassy Core
    const innerGeo = new THREE.OctahedronGeometry(1.0, 0);
    this.innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x7928ca,
      emissive: 0x4facfe,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    this.innerCore = new THREE.Mesh(innerGeo, this.innerMat);
    this.coreGroup.add(this.innerCore);

    this.scene.add(this.coreGroup);
  }

  createGyroscopicRings() {
    this.ringsGroup = new THREE.Group();

    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff0080,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    const ringGeo1 = new THREE.TorusGeometry(3.2, 0.03, 12, 64);
    this.ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.ringsGroup.add(this.ring1);

    const ringGeo2 = new THREE.TorusGeometry(4.0, 0.03, 12, 64);
    this.ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.ring2.rotation.x = Math.PI / 3;
    this.ringsGroup.add(this.ring2);

    this.scene.add(this.ringsGroup);
  }

  createStarfield() {
    const particleCount = 3500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0x00f2fe),
      new THREE.Color(0x7928ca),
      new THREE.Color(0xff0080),
      new THREE.Color(0xffffff)
    ];

    for (let i = 0; i < particleCount; i++) {
      // Cylindrical / Spherical Distribution
      const radius = 8 + Math.random() * 32;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  // Rebuild 3D Floating Crystals based on active tasks
  rebuildTaskCrystals(tasks) {
    // Clear existing crystal meshes
    while (this.taskCrystalsGroup.children.length > 0) {
      const obj = this.taskCrystalsGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
      this.taskCrystalsGroup.remove(obj);
    }

    if (!tasks || tasks.length === 0) return;

    const count = tasks.length;
    const radius = 5.2;

    tasks.forEach((task, index) => {
      // Golden angle distribution for natural cosmic arrangement
      const phi = Math.acos(-1 + (2 * index) / Math.max(count, 1));
      const theta = Math.sqrt(count * Math.PI) * phi;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi) * 0.7; // Slightly flattened
      const z = radius * Math.cos(phi);

      // Color mapping by category
      let crystalColor = 0x00f2fe; // Default Work/Blue
      if (task.category === 'hackathon') crystalColor = 0xff0080; // Neon Pink
      else if (task.category === 'personal') crystalColor = 0x9333ea; // Purple
      else if (task.category === 'creative') crystalColor = 0xf59e0b; // Gold
      
      // If completed, shift to vibrant emerald green
      if (task.completed) {
        crystalColor = 0x10b981;
      }

      // Crystal Geometry
      const geo = new THREE.OctahedronGeometry(task.completed ? 0.38 : 0.46, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: crystalColor,
        emissive: crystalColor,
        emissiveIntensity: task.completed ? 0.8 : 0.4,
        metalness: 0.7,
        roughness: 0.2,
        wireframe: this.isWireframe
      });

      const crystalMesh = new THREE.Mesh(geo, mat);
      crystalMesh.position.set(x, y, z);
      crystalMesh.userData = {
        taskId: task.id,
        taskTitle: task.title,
        taskCompleted: task.completed,
        baseColor: crystalColor,
        initialPos: new THREE.Vector3(x, y, z),
        floatSpeed: 1 + Math.random() * 0.8,
        floatOffset: Math.random() * Math.PI * 2
      };

      // Add a faint wireframe aura
      const wireMat = new THREE.MeshBasicMaterial({
        color: crystalColor,
        wireframe: true,
        transparent: true,
        opacity: task.completed ? 0.6 : 0.3
      });
      const wireMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), wireMat);
      crystalMesh.add(wireMesh);

      this.taskCrystalsGroup.add(crystalMesh);
    });

    const countElem = document.getElementById('matrix-crystal-count');
    if (countElem) countElem.innerText = `${tasks.length} Nodes Active`;
  }

  // Trigger celebratory particle explosion in 3D
  createTaskBurst(x, y, z, colorHex = 0x10b981) {
    const burstCount = 60;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(burstCount * 3);
    const velocities = [];

    for (let i = 0; i < burstCount; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );
      velocities.push(vel);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.12,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const pSystem = new THREE.Points(geo, mat);
    this.scene.add(pSystem);

    this.particleBurst.push({
      mesh: pSystem,
      velocities: velocities,
      life: 1.0,
      decay: 0.02
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    // Mouse Movement for Raycasting & Parallax
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.targetMouse.x = (e.clientX - window.innerWidth / 2) * 0.001;
      this.targetMouse.y = (e.clientY - window.innerHeight / 2) * 0.001;
    });

    // Raycaster Click on 3D Crystal
    window.addEventListener('click', (e) => {
      // Ignore clicks on HUD buttons and interactive inputs
      if (e.target.closest('button, input, select, a, .task-item, .task-create-card')) {
        return;
      }

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.taskCrystalsGroup.children, true);

      if (intersects.length > 0) {
        let clickedMesh = intersects[0].object;
        while (clickedMesh.parent && clickedMesh.parent !== this.taskCrystalsGroup) {
          clickedMesh = clickedMesh.parent;
        }

        if (clickedMesh.userData && clickedMesh.userData.taskId) {
          const taskId = clickedMesh.userData.taskId;
          if (window.soundEngine) window.soundEngine.playClick();
          
          // Scroll to tasks console and highlight task
          const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
          if (taskElement) {
            taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            taskElement.style.boxShadow = '0 0 30px rgba(0, 242, 254, 0.8)';
            setTimeout(() => {
              taskElement.style.boxShadow = '';
            }, 1800);
          }
        }
      }
    });

    // Scroll listener for 3D Camera Trajectory
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.targetScrollProgress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
    }, { passive: true });

    // Reactive listener for To-Do updates
    window.addEventListener('tasksUpdated', (e) => {
      this.rebuildTaskCrystals(e.detail.tasks);
    });

    // Celebration burst listener
    window.addEventListener('taskCompletedCelebration', (e) => {
      const task = e.detail.task;
      const crystal = this.taskCrystalsGroup.children.find(c => c.userData.taskId === task.id);
      if (crystal) {
        this.createTaskBurst(crystal.position.x, crystal.position.y, crystal.position.z, 0x10b981);
      } else {
        this.createTaskBurst(0, 0, 0, 0x10b981);
      }
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // Smooth Camera Trajectory Calculation between sections
  updateCameraByScroll() {
    // Smooth lerp scroll progress
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

    const totalKeyframes = this.cameraKeyframes.length;
    const scaledIndex = this.scrollProgress * (totalKeyframes - 1);
    const currentIndex = Math.floor(scaledIndex);
    const nextIndex = Math.min(currentIndex + 1, totalKeyframes - 1);
    const segmentProgress = scaledIndex - currentIndex;

    const fromKf = this.cameraKeyframes[currentIndex];
    const toKf = this.cameraKeyframes[nextIndex];

    const targetPos = new THREE.Vector3().lerpVectors(fromKf.pos, toKf.pos, segmentProgress);
    const targetLookAt = new THREE.Vector3().lerpVectors(fromKf.target, toKf.target, segmentProgress);

    // Apply subtle mouse parallax
    targetPos.x += this.targetMouse.x * 1.5;
    targetPos.y -= this.targetMouse.y * 1.5;

    this.currentCameraPos.lerp(targetPos, 0.06);
    this.currentCameraTarget.lerp(targetLookAt, 0.06);

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentCameraTarget);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Camera Scroll Motion
    this.updateCameraByScroll();

    // 2. Core & Rings Rotation
    if (this.coreGroup) {
      this.coreGroup.rotation.y += 0.008 * this.rotationSpeed;
      this.coreGroup.rotation.x += 0.004 * this.rotationSpeed;
      // Gentle core breathing scale
      const scale = 1 + Math.sin(elapsedTime * 2) * 0.05;
      this.coreGroup.scale.set(scale, scale, scale);
    }

    if (this.ring1) {
      this.ring1.rotation.z += 0.012 * this.rotationSpeed;
      this.ring1.rotation.x += 0.006 * this.rotationSpeed;
    }
    if (this.ring2) {
      this.ring2.rotation.y += 0.010 * this.rotationSpeed;
      this.ring2.rotation.z -= 0.007 * this.rotationSpeed;
    }

    // 3. Starfield Rotation & Twinkle
    if (this.particleSystem) {
      this.particleSystem.rotation.y = elapsedTime * 0.015 * this.rotationSpeed;
    }

    // 4. Floating Task Crystals Animation & Hover Detection
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.taskCrystalsGroup.children, true);

    let newlyHovered = null;
    if (intersects.length > 0) {
      let rootObj = intersects[0].object;
      while (rootObj.parent && rootObj.parent !== this.taskCrystalsGroup) {
        rootObj = rootObj.parent;
      }
      newlyHovered = rootObj;
    }

    if (newlyHovered !== this.hoveredObject) {
      if (this.hoveredObject) {
        document.body.style.cursor = 'default';
        this.hoveredObject.scale.set(1, 1, 1);
      }
      if (newlyHovered) {
        document.body.style.cursor = 'pointer';
        if (window.soundEngine) window.soundEngine.playHover();
      }
      this.hoveredObject = newlyHovered;
    }

    this.taskCrystalsGroup.children.forEach(crystal => {
      const data = crystal.userData;
      if (!data) return;

      // Floating sine wave motion
      const floatY = Math.sin(elapsedTime * data.floatSpeed + data.floatOffset) * 0.25;
      crystal.position.y = data.initialPos.y + floatY;

      crystal.rotation.x += 0.01 * this.rotationSpeed;
      crystal.rotation.y += 0.015 * this.rotationSpeed;

      // Pulse or scale on hover
      if (crystal === this.hoveredObject) {
        crystal.scale.lerp(new THREE.Vector3(1.35, 1.35, 1.35), 0.2);
      } else {
        crystal.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    });

    // 5. Update Particle Bursts
    for (let i = this.particleBurst.length - 1; i >= 0; i--) {
      const burst = this.particleBurst[i];
      const positions = burst.mesh.geometry.attributes.position.array;

      for (let j = 0; j < burst.velocities.length; j++) {
        positions[j * 3] += burst.velocities[j].x * delta;
        positions[j * 3 + 1] += burst.velocities[j].y * delta;
        positions[j * 3 + 2] += burst.velocities[j].z * delta;
      }
      burst.mesh.geometry.attributes.position.needsUpdate = true;

      burst.life -= burst.decay;
      burst.mesh.material.opacity = Math.max(0, burst.life);

      if (burst.life <= 0) {
        this.scene.remove(burst.mesh);
        burst.mesh.geometry.dispose();
        burst.mesh.material.dispose();
        this.particleBurst.splice(i, 1);
      }
    }

    // 6. Final Render Call
    this.renderer.render(this.scene, this.camera);
  }

  // Matrix HUD Controls API
  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    if (this.outerMat) this.outerMat.wireframe = this.isWireframe;
    this.taskCrystalsGroup.children.forEach(c => {
      if (c.material) c.material.wireframe = this.isWireframe;
    });
    return this.isWireframe;
  }

  speedUpRotation() {
    this.rotationSpeed = this.rotationSpeed >= 3.0 ? 1.0 : this.rotationSpeed + 1.0;
    return this.rotationSpeed;
  }

  resetCamera() {
    this.targetScrollProgress = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

window.world3D = new World3D();
