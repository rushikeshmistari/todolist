/**
 * FocusList 3D — Planet & Universe WebGL Three.js Engine
 * Features a realistic procedural planet with rotating clouds, atmospheric glow,
 * planetary rings, deep space nebula, 5,000+ stars, shooting meteors, and
 * orbital task satellites responding to scroll-driven camera journeys.
 * 100% Client-Side Procedural Generation | Zero External Image Dependencies
 */

'use strict';

class World3D {
  constructor() {
    this.container = document.getElementById('webgl-canvas-container');
    this.canvas = document.getElementById('webgl-canvas');
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Celestial Planet & Universe Groups
    this.planetGroup = null;
    this.planetMesh = null;
    this.cloudsMesh = null;
    this.atmosphereMesh = null;
    this.ringsMesh = null;
    this.starfield = null;
    this.nebulaParticles = null;
    this.meteors = [];
    this.taskSatellitesGroup = null;
    this.particleBurst = [];

    // Interaction & Animation
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);
    this.targetMouse = new THREE.Vector2(0, 0);
    this.hoveredSatellite = null;
    this.clock = new THREE.Clock();

    // Scroll & Velocity Controls
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.rotationSpeed = 1.0;
    this.isWireframe = false;

    // Cinematic Camera Waypoints: Planetary Orbital Journey
    this.cameraKeyframes = [
      // 0. Hero: High orbital vista overlooking the illuminated planet curvature & rings
      { pos: new THREE.Vector3(0, 2.8, 11.5), target: new THREE.Vector3(0, -0.2, 0) },
      // 1. 3D Matrix: Swooping into the orbital plane among the task satellites
      { pos: new THREE.Vector3(0, 4.2, 7.8), target: new THREE.Vector3(0, 0.5, 0) },
      // 2. Tasks Console: Lateral orbital vantage, framing planet on right side
      { pos: new THREE.Vector3(-4.8, 1.6, 8.5), target: new THREE.Vector3(1.2, 0, 0) },
      // 3. Task Statistics: High polar inclination looking down at the rings and aurora
      { pos: new THREE.Vector3(2.5, 7.2, 7.0), target: new THREE.Vector3(0, -0.6, 0) },
      // 4. Rules & Compliance: Deep cosmic vista, gazing at the planet amidst the starfield
      { pos: new THREE.Vector3(0, 2.5, 14.5), target: new THREE.Vector3(0, 0, 0) }
    ];

    this.currentCameraPos = new THREE.Vector3().copy(this.cameraKeyframes[0].pos);
    this.currentCameraTarget = new THREE.Vector3().copy(this.cameraKeyframes[0].target);

    this.init();
  }

  init() {
    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060c, 0.025);

    // 2. Camera Setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 1000);
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
    this.renderer.toneMappingExposure = 1.15;

    // 4. Lighting (Sunlight & Cosmic Ambient)
    this.setupLighting();

    // 5. Construct Universe and Realistic Planet
    this.createUniverse();
    this.createPlanet();

    // 6. Orbital Task Satellites
    this.taskSatellitesGroup = new THREE.Group();
    this.scene.add(this.taskSatellitesGroup);

    // 7. Bind Events & Render Loop
    this.bindEvents();

    if (window.todoManager) {
      this.rebuildTaskSatellites(window.todoManager.tasks);
    }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Soft deep-space ambient light
    const ambient = new THREE.AmbientLight(0x1a2638, 0.9);
    this.scene.add(ambient);

    // Primary Sun: Crisp directional sunlight casting realistic planet terminator
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    this.sunLight.position.set(16, 12, 14);
    this.scene.add(this.sunLight);

    // Secondary Nebula Backlight: Ethereal cyan/purple rim reflection
    this.rimLight = new THREE.DirectionalLight(0x00f2fe, 1.4);
    this.rimLight.position.set(-14, -8, -12);
    this.scene.add(this.rimLight);
  }

  /**
   * Generates a procedural planet with surface texture, swirling clouds,
   * atmospheric glow, and tilted rings.
   */
  createPlanet() {
    this.planetGroup = new THREE.Group();
    const planetRadius = 2.6;

    // 1. Procedural Surface Texture (Continents, Oceans, Mountain Relief)
    const surfaceTexture = this.generatePlanetCanvasTexture();
    const surfaceBump = this.generatePlanetBumpTexture();

    const planetGeo = new THREE.SphereGeometry(planetRadius, 64, 64);
    this.planetMat = new THREE.MeshStandardMaterial({
      map: surfaceTexture,
      bumpMap: surfaceBump,
      bumpScale: 0.045,
      roughness: 0.65,
      metalness: 0.15
    });
    this.planetMesh = new THREE.Mesh(planetGeo, this.planetMat);
    this.planetGroup.add(this.planetMesh);

    // 2. Swirling Cloud Layer
    const cloudsTexture = this.generateCloudsCanvasTexture();
    const cloudsGeo = new THREE.SphereGeometry(planetRadius * 1.018, 64, 64);
    this.cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      roughness: 1.0
    });
    this.cloudsMesh = new THREE.Mesh(cloudsGeo, this.cloudsMat);
    this.planetGroup.add(this.cloudsMesh);

    // 3. Atmospheric Halo Glow
    const atmosphereGeo = new THREE.SphereGeometry(planetRadius * 1.05, 64, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    this.atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    this.planetGroup.add(this.atmosphereMesh);

    // 4. Planetary Rings (Tilted celestial ring system)
    const ringGeo = new THREE.RingGeometry(3.5, 5.6, 96);
    // Rotate ring geometry to lie flat horizontally before tilt
    ringGeo.rotateX(Math.PI / 2);

    const ringTexture = this.generateRingCanvasTexture();
    this.ringMat = new THREE.MeshStandardMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.82,
      roughness: 0.8
    });
    this.ringsMesh = new THREE.Mesh(ringGeo, this.ringMat);

    // Realistic planetary axial tilt (24.5 degrees)
    this.planetGroup.rotation.z = THREE.MathUtils.degToRad(-24.5);
    this.planetGroup.rotation.x = THREE.MathUtils.degToRad(8.0);
    this.planetGroup.add(this.ringsMesh);

    this.scene.add(this.planetGroup);
  }

  /**
   * Procedural Planet Surface Texture Generator
   */
  generatePlanetCanvasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep Ocean Base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0a1d37');
    oceanGrad.addColorStop(0.5, '#051226');
    oceanGrad.addColorStop(1, '#020914');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Procedural Continents (Organic Noise Blobs)
    ctx.fillStyle = '#1e3f2b'; // Emerald Forest Landmass
    for (let i = 0; i < 35; i++) {
      const cx = Math.random() * 1024;
      const cy = 80 + Math.random() * 352;
      const r = 40 + Math.random() * 130;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Secondary terrain variations (Canyons & Highlands)
      ctx.fillStyle = '#2d5a3c';
      ctx.beginPath();
      ctx.arc(cx + 15, cy - 10, r * 0.65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8f683a'; // Mountain Ridge
      ctx.beginPath();
      ctx.arc(cx - 10, cy + 12, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e3f2b';
    }

    // Polar Ice Caps
    ctx.fillStyle = '#dbeafe';
    ctx.beginPath();
    ctx.ellipse(512, 18, 512, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(512, 494, 512, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Night-side City Lights (Tiny glowing cyan and gold dots)
    ctx.fillStyle = '#00f2fe';
    for (let i = 0; i < 400; i++) {
      const lx = Math.random() * 1024;
      const ly = 100 + Math.random() * 312;
      ctx.fillRect(lx, ly, 1.5, 1.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Procedural Bump Map for Terrain Relief
   */
  generatePlanetBumpTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 256);

    for (let i = 0; i < 40; i++) {
      const bx = Math.random() * 512;
      const by = 40 + Math.random() * 176;
      const br = 15 + Math.random() * 60;
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#808080');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Procedural Swirling Cloud Map
   */
  generateCloudsCanvasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 1024, 512);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';

    for (let i = 0; i < 50; i++) {
      const cx = Math.random() * 1024;
      const cy = 50 + Math.random() * 412;
      const rw = 50 + Math.random() * 160;
      const rh = 15 + Math.random() * 45;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, rh, Math.random() * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Procedural Planetary Ring Bands Texture
   */
  generateRingCanvasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0.0, 'rgba(0, 242, 254, 0.0)');
    grad.addColorStop(0.15, 'rgba(0, 242, 254, 0.7)');
    grad.addColorStop(0.35, 'rgba(121, 40, 202, 0.55)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)'); // Cassini Division Gap
    grad.addColorStop(0.65, 'rgba(255, 0, 128, 0.6)');
    grad.addColorStop(0.85, 'rgba(0, 242, 254, 0.45)');
    grad.addColorStop(1.0, 'rgba(0, 242, 254, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Deep Space Universe: 5,000 Multi-Colored Stars,
   * Volumetric Nebula Gas Clouds, and Shooting Meteors.
   */
  createUniverse() {
    // 1. Stellar Starfield
    const starCount = 5000;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const stellarPalette = [
      new THREE.Color(0xdbeafe), // O/B-type bright blue-white
      new THREE.Color(0xffffff), // A-type pure white
      new THREE.Color(0xfef08a), // G-type golden sun
      new THREE.Color(0x00f2fe), // Cyan pulsar
      new THREE.Color(0xf472b6)  // Soft magenta star
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 25 + Math.random() * 85;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = stellarPalette[Math.floor(Math.random() * stellarPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.starfield = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starfield);

    // 2. Volumetric Cosmic Nebula Clouds
    const nebulaCount = 600;
    const nebulaGeo = new THREE.BufferGeometry();
    const nebPositions = new Float32Array(nebulaCount * 3);
    const nebColors = new Float32Array(nebulaCount * 3);

    for (let i = 0; i < nebulaCount; i++) {
      const nr = 18 + Math.random() * 30;
      const nTheta = Math.random() * Math.PI * 2;
      const nPhi = (Math.random() - 0.5) * 0.9; // Clustered in celestial plane

      nebPositions[i * 3] = nr * Math.cos(nTheta);
      nebPositions[i * 3 + 1] = nr * Math.sin(nPhi) * 4;
      nebPositions[i * 3 + 2] = nr * Math.sin(nTheta);

      const isCyan = Math.random() > 0.45;
      const col = isCyan ? new THREE.Color(0x00f2fe) : new THREE.Color(0x7928ca);
      nebColors[i * 3] = col.r;
      nebColors[i * 3 + 1] = col.g;
      nebColors[i * 3 + 2] = col.b;
    }

    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebPositions, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebColors, 3));

    const nebulaMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });

    this.nebulaParticles = new THREE.Points(nebulaGeo, nebulaMat);
    this.scene.add(this.nebulaParticles);

    // 3. Initialize Shooting Meteor Generator
    this.createMeteors();
  }

  createMeteors() {
    this.meteorMesh = null;
    const meteorCount = 3;

    for (let i = 0; i < meteorCount; i++) {
      const lineGeo = new THREE.BufferGeometry();
      const pts = new Float32Array([0, 0, 0, -2.5, -1.2, -1.8]);
      lineGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.Line(lineGeo, lineMat);
      line.userData = {
        active: false,
        timer: Math.random() * 6 + 2,
        speed: 12 + Math.random() * 8
      };
      this.scene.add(line);
      this.meteors.push(line);
    }
  }

  /**
   * Rebuilds Orbital Task Satellites orbiting around the planet.
   * Each task is a probe with solar panels and priority beacon.
   */
  rebuildTaskSatellites(tasks) {
    while (this.taskSatellitesGroup.children.length > 0) {
      const child = this.taskSatellitesGroup.children[0];
      this.taskSatellitesGroup.remove(child);
    }

    if (!tasks || tasks.length === 0) return;

    const count = tasks.length;
    const baseOrbitRadius = 6.4;

    tasks.forEach((task, index) => {
      const satelliteGroup = new THREE.Group();

      // Priority Color Assignment
      let priorityColor = 0x00f2fe; // Medium
      if (task.priority === 'high') priorityColor = 0xff4757; // High
      else if (task.priority === 'low') priorityColor = 0x2ed573; // Low

      if (task.completed) {
        priorityColor = 0x10b981; // Emerald Completed
      }

      // 1. Central Core Probe
      const coreGeo = new THREE.DodecahedronGeometry(task.completed ? 0.32 : 0.4, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: priorityColor,
        emissive: priorityColor,
        emissiveIntensity: task.completed ? 0.9 : 0.5,
        metalness: 0.85,
        roughness: 0.2,
        wireframe: this.isWireframe
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      satelliteGroup.add(coreMesh);

      // 2. Solar Panel Array Wings
      const wingGeo = new THREE.BoxGeometry(1.3, 0.04, 0.35);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.3,
        emissive: 0x00f2fe,
        emissiveIntensity: 0.2
      });
      const wings = new THREE.Mesh(wingGeo, wingMat);
      satelliteGroup.add(wings);

      // 3. Orbital Beacon Light
      const beaconGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: priorityColor });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 0.45;
      satelliteGroup.add(beacon);

      // 4. Orbital Path Radius and Inclination
      const orbitRadius = baseOrbitRadius + (index % 3) * 0.7;
      const angle = (index / count) * Math.PI * 2;
      const inclination = (index % 2 === 0 ? 1 : -1) * 0.35;

      satelliteGroup.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle) * orbitRadius * inclination,
        Math.sin(angle) * orbitRadius
      );

      satelliteGroup.userData = {
        taskId: task.id,
        taskTitle: task.title,
        priority: task.priority,
        completed: task.completed,
        orbitRadius: orbitRadius,
        orbitAngle: angle,
        orbitSpeed: 0.25 + (index % 4) * 0.08,
        inclination: inclination
      };

      this.taskSatellitesGroup.add(satelliteGroup);
    });

    const countElem = document.getElementById('matrix-crystal-count');
    if (countElem) countElem.innerText = `${tasks.length} Satellites In Orbit`;
  }

  /**
   * Planetary Ion Fireworks celebration burst on task completion
   */
  createTaskBurst(x, y, z, colorHex = 0x10b981) {
    const burstCount = 70;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(burstCount * 3);
    const velocities = [];

    for (let i = 0; i < burstCount; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      ));
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.16,
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
      decay: 0.018
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    // Mouse movement tracking for parallax and raycasting
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.targetMouse.x = (e.clientX - window.innerWidth / 2) * 0.0008;
      this.targetMouse.y = (e.clientY - window.innerHeight / 2) * 0.0008;
    });

    // Raycaster Click on Orbital Satellite
    window.addEventListener('click', (e) => {
      if (e.target.closest('button, input, select, a, .task-item, .task-create-card, .modal-card')) {
        return;
      }

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.taskSatellitesGroup.children, true);

      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== this.taskSatellitesGroup) {
          root = root.parent;
        }

        if (root.userData && root.userData.taskId) {
          const taskId = root.userData.taskId;
          if (window.soundEngine) window.soundEngine.playClick();

          const taskElem = document.getElementById(`task-${taskId}`);
          if (taskElem) {
            taskElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            taskElem.style.boxShadow = '0 0 35px rgba(0, 242, 254, 0.9)';
            setTimeout(() => { taskElem.style.boxShadow = ''; }, 1800);
          }
        }
      }
    });

    // Scroll listener for 3D Camera Trajectory
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.targetScrollProgress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
    }, { passive: true });

    // Reactive State updates from TodoManager
    window.addEventListener('tasksUpdated', (e) => {
      this.rebuildTaskSatellites(e.detail.tasks);
    });

    // Task celebration trigger
    window.addEventListener('taskCompletedCelebration', (e) => {
      const task = e.detail.task;
      const sat = this.taskSatellitesGroup.children.find(c => c.userData.taskId === task.id);
      if (sat) {
        this.createTaskBurst(sat.position.x, sat.position.y, sat.position.z, 0x10b981);
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

  /**
   * Smooth Camera Trajectory interpolation across scrolling sections
   */
  updateCameraByScroll() {
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.07;

    const totalKeyframes = this.cameraKeyframes.length;
    const scaledIndex = this.scrollProgress * (totalKeyframes - 1);
    const currentIndex = Math.floor(scaledIndex);
    const nextIndex = Math.min(currentIndex + 1, totalKeyframes - 1);
    const segmentProgress = scaledIndex - currentIndex;

    const fromKf = this.cameraKeyframes[currentIndex];
    const toKf = this.cameraKeyframes[nextIndex];

    const targetPos = new THREE.Vector3().lerpVectors(fromKf.pos, toKf.pos, segmentProgress);
    const targetLookAt = new THREE.Vector3().lerpVectors(fromKf.target, toKf.target, segmentProgress);

    // Subtle cosmic parallax with mouse
    targetPos.x += this.targetMouse.x * 1.8;
    targetPos.y -= this.targetMouse.y * 1.8;

    this.currentCameraPos.lerp(targetPos, 0.055);
    this.currentCameraTarget.lerp(targetLookAt, 0.055);

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentCameraTarget);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update Camera along Scroll Trajectory
    this.updateCameraByScroll();

    // 2. Planet & Cloud Rotation
    if (this.planetMesh) {
      this.planetMesh.rotation.y += 0.0018 * this.rotationSpeed;
    }
    if (this.cloudsMesh) {
      this.cloudsMesh.rotation.y += 0.0028 * this.rotationSpeed;
    }

    // 3. Universe Starfield & Nebula Drift
    if (this.starfield) {
      this.starfield.rotation.y = elapsedTime * 0.003 * this.rotationSpeed;
    }
    if (this.nebulaParticles) {
      this.nebulaParticles.rotation.y = elapsedTime * 0.005 * this.rotationSpeed;
    }

    // 4. Update Shooting Meteors
    this.meteors.forEach(meteor => {
      meteor.userData.timer -= delta;
      if (meteor.userData.timer <= 0) {
        // Spawn meteor
        meteor.position.set(
          -15 + Math.random() * 30,
          10 + Math.random() * 10,
          -5 + Math.random() * 10
        );
        meteor.material.opacity = 0.9;
        meteor.userData.timer = Math.random() * 8 + 4;
        meteor.userData.active = true;
      }

      if (meteor.userData.active) {
        meteor.position.x += meteor.userData.speed * delta;
        meteor.position.y -= meteor.userData.speed * 0.6 * delta;
        meteor.material.opacity -= 0.02;
        if (meteor.material.opacity <= 0) {
          meteor.userData.active = false;
        }
      }
    });

    // 5. Orbital Task Satellites Animation & Hover Raycasting
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.taskSatellitesGroup.children, true);

    let newlyHovered = null;
    if (intersects.length > 0) {
      let rootObj = intersects[0].object;
      while (rootObj.parent && rootObj.parent !== this.taskSatellitesGroup) {
        rootObj = rootObj.parent;
      }
      newlyHovered = rootObj;
    }

    if (newlyHovered !== this.hoveredSatellite) {
      if (this.hoveredSatellite) {
        document.body.style.cursor = 'default';
        this.hoveredSatellite.scale.set(1, 1, 1);
      }
      if (newlyHovered) {
        document.body.style.cursor = 'pointer';
        if (window.soundEngine) window.soundEngine.playHover();
      }
      this.hoveredSatellite = newlyHovered;
    }

    // Orbit Mechanics
    this.taskSatellitesGroup.children.forEach(satellite => {
      const data = satellite.userData;
      if (!data) return;

      // Update orbital angle around planet
      data.orbitAngle += 0.005 * data.orbitSpeed * this.rotationSpeed;

      const x = Math.cos(data.orbitAngle) * data.orbitRadius;
      const y = Math.sin(data.orbitAngle) * data.orbitRadius * data.inclination;
      const z = Math.sin(data.orbitAngle) * data.orbitRadius;

      satellite.position.set(x, y, z);
      satellite.rotation.y += 0.02 * this.rotationSpeed;

      // Hover expansion
      if (satellite === this.hoveredSatellite) {
        satellite.scale.lerp(new THREE.Vector3(1.4, 1.4, 1.4), 0.2);
      } else {
        satellite.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    });

    // 6. Particle Bursts
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

    // 7. Render Frame
    this.renderer.render(this.scene, this.camera);
  }

  // Matrix HUD Controls API
  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    if (this.planetMat) this.planetMat.wireframe = this.isWireframe;
    if (this.cloudsMat) this.cloudsMat.wireframe = this.isWireframe;
    if (this.ringMat) this.ringMat.wireframe = this.isWireframe;

    this.taskSatellitesGroup.children.forEach(sat => {
      sat.children.forEach(part => {
        if (part.material) part.material.wireframe = this.isWireframe;
      });
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
