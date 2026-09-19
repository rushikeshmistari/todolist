/**
 * FocusList 3D — Full Solar System & Deep Universe WebGL Engine
 * Features the glowing Sun at the center and all actual planets revolving
 * in their authentic colors, textures, and orbits (Mercury, Venus, Earth & Moon,
 * Mars, Jupiter, Saturn & Rings, Uranus, Neptune, Pluto).
 * 100% Procedural Generation | Zero External Images | Fully Interactive
 */

'use strict';

class World3D {
  constructor() {
    this.container = document.getElementById('webgl-canvas-container');
    this.canvas = document.getElementById('webgl-canvas');
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Solar System Components
    this.solarSystemGroup = null;
    this.sunMesh = null;
    this.sunCorona = null;
    this.planets = [];
    this.orbitLines = [];
    this.meteors = [];
    this.starfield = null;
    this.nebulaParticles = null;
    this.taskProbesGroup = null;
    this.particleBurst = [];

    // Interaction & Animation
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);
    this.targetMouse = new THREE.Vector2(0, 0);
    this.hoveredObject = null;
    this.clock = new THREE.Clock();

    // Scroll & Velocity Controls
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.rotationSpeed = 1.0;
    this.isWireframe = false;

    // Cinematic Camera Waypoints through the Solar System (Hero -> Tasks -> Matrix -> Deep Space)
    this.cameraKeyframes = [
      // 0. Hero: Cinematic high-angle perspective of Sun & elliptical orbits matching reference
      { pos: new THREE.Vector3(0, 9.5, 20.5), target: new THREE.Vector3(0, -0.6, 0) },
      // 1. Tasks Console: Lateral framing with planets revolving in space on the right
      { pos: new THREE.Vector3(-9.5, 4.5, 14.5), target: new THREE.Vector3(2.5, 0, 0) },
      // 2. 3D Matrix: Close fly-by showcasing planetary orbits and worlds strip
      { pos: new THREE.Vector3(3.5, 7.0, 15.5), target: new THREE.Vector3(0, 0, 0) },
      // 3. Footer & Overview: Deep space wide shot taking in the whole universe
      { pos: new THREE.Vector3(0, 11.0, 24.0), target: new THREE.Vector3(0, 0, 0) }
    ];

    this.currentCameraPos = new THREE.Vector3().copy(this.cameraKeyframes[0].pos);
    this.currentCameraTarget = new THREE.Vector3().copy(this.cameraKeyframes[0].target);

    this.init();
  }

  init() {
    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060c, 0.015);

    // 2. Camera Setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentCameraTarget);

    // 3. Renderer Setup (Performance Optimized for 60 FPS)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // 4. Lighting (Sunlight + Ambient Universe)
    this.setupLighting();

    // 5. Construct Solar System & Deep Universe
    this.createUniverse();
    this.createSolarSystem();

    // 6. Interactive Task Orbit Probes
    this.taskProbesGroup = new THREE.Group();
    this.scene.add(this.taskProbesGroup);

    // 7. Bind Events & Render Loop
    this.bindEvents();

    if (window.todoManager) {
      this.rebuildTaskProbes(window.todoManager.tasks);
    }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Deep cosmic ambient illumination
    const ambient = new THREE.AmbientLight(0x22334e, 1.2);
    this.scene.add(ambient);

    // Sun Point Light: Blazing omnidirectional light illuminating all planets
    this.sunLight = new THREE.PointLight(0xfff5e4, 3.8, 120, 0.5);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    // Directional backlight for volumetric rim highlights
    const backRim = new THREE.DirectionalLight(0x00f2fe, 1.0);
    backRim.position.set(-15, 12, -15);
    this.scene.add(backRim);
  }

  /**
   * Constructs the authentic Solar System:
   * Sun at center + Mercury, Venus, Earth & Moon, Mars, Jupiter,
   * Saturn & Rings, Uranus, Neptune, Pluto revolving along visible orbits.
   */
  createSolarSystem() {
    this.solarSystemGroup = new THREE.Group();
    this.scene.add(this.solarSystemGroup);

    // --- 1. The Central Sun ---
    const sunGeo = new THREE.SphereGeometry(2.1, 48, 48);
    const sunTexture = this.generateSunTexture();
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.solarSystemGroup.add(this.sunMesh);

    // Sun Glowing Corona Flare
    const coronaGeo = new THREE.SphereGeometry(2.35, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    this.sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
    this.solarSystemGroup.add(this.sunCorona);

    // --- 2. Planetary Worlds Definition (Authentic Sizes & Colors) ---
    const planetSpecs = [
      {
        name: 'MERCURY',
        period: '88 DAYS',
        radius: 0.36,
        dist: 3.6,
        speed: 1.6,
        colorHex: 0x9ca3af,
        generator: () => this.generateMercuryTexture()
      },
      {
        name: 'VENUS',
        period: '225 DAYS',
        radius: 0.58,
        dist: 5.0,
        speed: 1.15,
        colorHex: 0xe3bb76,
        generator: () => this.generateVenusTexture()
      },
      {
        name: 'EARTH',
        period: '365 DAYS',
        radius: 0.68,
        dist: 6.8,
        speed: 0.95,
        colorHex: 0x2b82c9,
        hasMoon: true,
        generator: () => this.generateEarthTexture()
      },
      {
        name: 'MARS',
        period: '687 DAYS',
        radius: 0.45,
        dist: 8.5,
        speed: 0.75,
        colorHex: 0xc1440e,
        generator: () => this.generateMarsTexture()
      },
      {
        name: 'JUPITER',
        period: '12 YEARS',
        radius: 1.25,
        dist: 11.2,
        speed: 0.45,
        colorHex: 0xd8ca9d,
        generator: () => this.generateJupiterTexture()
      },
      {
        name: 'SATURN',
        period: '30 YEARS',
        radius: 1.02,
        dist: 14.4,
        speed: 0.32,
        colorHex: 0xe2bf7d,
        hasRings: true,
        generator: () => this.generateSaturnTexture()
      },
      {
        name: 'URANUS',
        period: '84 YEARS',
        radius: 0.68,
        dist: 17.5,
        speed: 0.22,
        colorHex: 0x70d6ff,
        generator: () => this.generateUranusTexture()
      },
      {
        name: 'NEPTUNE',
        period: '165 YEARS',
        radius: 0.65,
        dist: 20.5,
        speed: 0.17,
        colorHex: 0x274687,
        generator: () => this.generateNeptuneTexture()
      },
      {
        name: 'PLUTO',
        period: '248 YEARS',
        radius: 0.26,
        dist: 23.2,
        speed: 0.12,
        colorHex: 0x968570,
        generator: () => this.generatePlutoTexture()
      }
    ];

    planetSpecs.forEach((spec, idx) => {
      // 1. Orbital Trajectory Line (Elliptical Ring matching reference)
      const orbitCurve = new THREE.EllipseCurve(
        0, 0,
        spec.dist, spec.dist * 0.94, // Subtle realistic ellipticity
        0, 2 * Math.PI,
        false, 0
      );
      const orbitPoints = orbitCurve.getPoints(96);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        orbitPoints.map(p => new THREE.Vector3(p.x, 0, p.y))
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.rotation.x = THREE.MathUtils.degToRad(3.0 * (idx % 3 - 1));
      this.solarSystemGroup.add(orbitLine);
      this.orbitLines.push(orbitLine);

      // 2. Planet Mesh
      const pGeo = new THREE.SphereGeometry(spec.radius, 32, 32);
      const pTex = spec.generator();
      const pMat = new THREE.MeshStandardMaterial({
        map: pTex,
        roughness: 0.6,
        metalness: 0.1
      });
      const planetMesh = new THREE.Mesh(pGeo, pMat);

      // Planet Holder to manage orbital position
      const planetHolder = new THREE.Group();
      planetHolder.add(planetMesh);

      // 3. World Label Sprite (Name & Orbital Period from reference diagram)
      const labelTex = this.createPlanetLabelTexture(spec.name, spec.period);
      const labelMat = new THREE.SpriteMaterial({
        map: labelTex,
        transparent: true,
        depthWrite: false
      });
      const labelSprite = new THREE.Sprite(labelMat);
      const labelScale = Math.max(1.8, spec.radius * 2.2);
      labelSprite.scale.set(labelScale, labelScale * 0.5, 1.0);
      labelSprite.position.set(0, spec.radius + (labelScale * 0.42), 0);
      planetHolder.add(labelSprite);

      // 4. Special Additions (Saturn's Rings & Earth's Moon)
      if (spec.hasRings) {
        const ringGeo = new THREE.RingGeometry(spec.radius * 1.35, spec.radius * 2.3, 64);
        ringGeo.rotateX(Math.PI / 2);
        const ringTex = this.generateSaturnRingsTexture();
        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const rings = new THREE.Mesh(ringGeo, ringMat);
        rings.rotation.z = THREE.MathUtils.degToRad(26.7);
        planetMesh.add(rings);
      }

      if (spec.hasMoon) {
        const moonGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        moon.position.set(1.2, 0.3, 0);
        planetMesh.add(moon);
        planetMesh.userData.moon = moon;
      }

      // Initial angle spread
      const initialAngle = (idx / planetSpecs.length) * Math.PI * 2 + 0.5;
      planetHolder.position.set(
        Math.cos(initialAngle) * spec.dist,
        0,
        Math.sin(initialAngle) * spec.dist * 0.94
      );

      planetHolder.userData = {
        name: spec.name,
        period: spec.period,
        distX: spec.dist,
        distZ: spec.dist * 0.94,
        angle: initialAngle,
        speed: spec.speed,
        rotSpeed: 0.02 / spec.speed,
        colorHex: spec.colorHex,
        mesh: planetMesh,
        label: labelSprite
      };

      this.solarSystemGroup.add(planetHolder);
      this.planets.push(planetHolder);
    });
  }

  /**
   * Procedural Canvas Sprite for floating World Name & Orbital Period tags
   * Exactly matching the user's reference diagram
   */
  createPlanetLabelTexture(name, period) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Subtle dark translucent pill badge
    ctx.fillStyle = 'rgba(6, 10, 24, 0.72)';
    if (ctx.roundRect) {
      ctx.roundRect(8, 8, 240, 112, 14);
    } else {
      ctx.fillRect(8, 8, 240, 112);
    }
    ctx.fill();

    // Golden border
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.stroke();

    // Planet Name (Clean white bold)
    ctx.textAlign = 'center';
    ctx.font = '900 24px Orbitron, Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 6;
    ctx.fillText(name, 128, 52);

    // Orbital Period (Glowing golden yellow)
    ctx.font = '700 22px Inter, Orbitron, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.fillText(period, 128, 92);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // --- Procedural Textures for Authentic Planetary Worlds ---

  generateSunTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#ff4500');
    grad.addColorStop(0.3, '#ff8c00');
    grad.addColorStop(0.6, '#ffd700');
    grad.addColorStop(1, '#ff3300');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Turbulent solar plasma flares
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 256, 15 + Math.random() * 35, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  generateMercuryTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#8a8279';
    ctx.fillRect(0, 0, 256, 128);

    // Craters
    ctx.fillStyle = '#6e6760';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 128, 4 + Math.random() * 12, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  generateVenusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#e8be78');
    grad.addColorStop(0.5, '#c99346');
    grad.addColorStop(1, '#dfaf68');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    // Swirling sulfuric cloud stripes
    ctx.fillStyle = 'rgba(255, 240, 200, 0.35)';
    for (let i = 0; i < 15; i++) {
      ctx.fillRect(0, Math.random() * 128, 256, 4 + Math.random() * 8);
    }
    return new THREE.CanvasTexture(canvas);
  }

  generateEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Ocean Base
    ctx.fillStyle = '#15528a';
    ctx.fillRect(0, 0, 512, 256);

    // Continents
    ctx.fillStyle = '#2d6a4f';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, 40 + Math.random() * 176, 25 + Math.random() * 60, 0, Math.PI * 2);
      ctx.fill();
    }

    // Swirling Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * 512, Math.random() * 256, 40 + Math.random() * 80, 10 + Math.random() * 20, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  generateMarsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#b4441e';
    ctx.fillRect(0, 0, 256, 128);

    // Volcanic terrain
    ctx.fillStyle = '#822709';
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 128, 8 + Math.random() * 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Polar ice caps
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 6);
    ctx.fillRect(0, 122, 256, 6);
    return new THREE.CanvasTexture(canvas);
  }

  generateJupiterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Horizontal atmospheric bands
    const colors = ['#e6c896', '#c98a58', '#f2deb8', '#995a32', '#d6a06c'];
    let y = 0;
    while (y < 256) {
      const h = 8 + Math.random() * 24;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillRect(0, y, 512, h);
      y += h;
    }

    // Great Red Spot
    ctx.fillStyle = '#cc3311';
    ctx.beginPath();
    ctx.ellipse(320, 160, 42, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  generateSaturnTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#e2c58e');
    grad.addColorStop(0.4, '#c7a363');
    grad.addColorStop(0.7, '#e8cf9c');
    grad.addColorStop(1, '#b89352');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);
    return new THREE.CanvasTexture(canvas);
  }

  generateSaturnRingsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0.0, 'rgba(215, 185, 135, 0.0)');
    grad.addColorStop(0.2, 'rgba(215, 185, 135, 0.8)');
    grad.addColorStop(0.5, 'rgba(50, 40, 30, 0.1)'); // Cassini Gap
    grad.addColorStop(0.65, 'rgba(195, 165, 115, 0.7)');
    grad.addColorStop(0.9, 'rgba(225, 195, 145, 0.5)');
    grad.addColorStop(1.0, 'rgba(215, 185, 135, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);
    return new THREE.CanvasTexture(canvas);
  }

  generateUranusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#7ce8ff');
    grad.addColorStop(0.5, '#4db8db');
    grad.addColorStop(1, '#66d3f2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);
    return new THREE.CanvasTexture(canvas);
  }

  generateNeptuneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#274796');
    grad.addColorStop(0.5, '#1e3575');
    grad.addColorStop(1, '#3b62ba');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    // Azure Storm Streaks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(40, 50, 60, 5);
    ctx.fillRect(150, 80, 80, 6);
    return new THREE.CanvasTexture(canvas);
  }

  generatePlutoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#9e8d7c';
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = '#c7b8a7';
    ctx.beginPath();
    ctx.arc(60, 32, 18, 0, Math.PI * 2); // Tombaugh Regio Heart
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Deep Space Universe: 6,000 Multi-Colored Stars,
   * Volumetric Nebula Gas Clouds, and Shooting Meteors.
   */
  createUniverse() {
    const starCount = 6000;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const stellarPalette = [
      new THREE.Color(0xdbeafe), // Blue-white giant
      new THREE.Color(0xffffff), // Bright white
      new THREE.Color(0xfef08a), // Golden sun
      new THREE.Color(0x00f2fe), // Cyan pulsar
      new THREE.Color(0xf472b6)  // Magenta star
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 35 + Math.random() * 95;
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
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.starfield = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starfield);

    // Volumetric Cosmic Nebula Clouds
    const nebulaCount = 700;
    const nebulaGeo = new THREE.BufferGeometry();
    const nebPositions = new Float32Array(nebulaCount * 3);
    const nebColors = new Float32Array(nebulaCount * 3);

    for (let i = 0; i < nebulaCount; i++) {
      const nr = 22 + Math.random() * 45;
      const nTheta = Math.random() * Math.PI * 2;
      const nPhi = (Math.random() - 0.5) * 0.8;

      nebPositions[i * 3] = nr * Math.cos(nTheta);
      nebPositions[i * 3 + 1] = nr * Math.sin(nPhi) * 6;
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
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending
    });

    this.nebulaParticles = new THREE.Points(nebulaGeo, nebulaMat);
    this.scene.add(this.nebulaParticles);

    // Meteors
    for (let i = 0; i < 3; i++) {
      const lineGeo = new THREE.BufferGeometry();
      const pts = new Float32Array([0, 0, 0, -3.0, -1.5, -2.0]);
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
        speed: 14 + Math.random() * 8
      };
      this.scene.add(line);
      this.meteors.push(line);
    }
  }

  /**
   * Rebuilds interactive Task Orbital Probes around the planets.
   */
  rebuildTaskProbes(tasks) {
    while (this.taskProbesGroup.children.length > 0) {
      const child = this.taskProbesGroup.children[0];
      this.taskProbesGroup.remove(child);
    }

    if (!tasks || tasks.length === 0) return;

    tasks.forEach((task, index) => {
      const probeGroup = new THREE.Group();

      let priorityColor = 0x00f2fe; // Medium
      if (task.priority === 'high') priorityColor = 0xff4757; // High
      else if (task.priority === 'low') priorityColor = 0x2ed573; // Low
      if (task.completed) priorityColor = 0x10b981; // Completed

      // 1. Crystal Satellite Body
      const probeGeo = new THREE.OctahedronGeometry(task.completed ? 0.28 : 0.36, 0);
      const probeMat = new THREE.MeshStandardMaterial({
        color: priorityColor,
        emissive: priorityColor,
        emissiveIntensity: task.completed ? 1.0 : 0.6,
        metalness: 0.8,
        roughness: 0.2,
        wireframe: this.isWireframe
      });
      const probeMesh = new THREE.Mesh(probeGeo, probeMat);
      probeGroup.add(probeMesh);

      // 2. Dual Solar Wings
      const wingGeo = new THREE.BoxGeometry(1.1, 0.03, 0.3);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        emissive: 0x00f2fe,
        emissiveIntensity: 0.25
      });
      const wings = new THREE.Mesh(wingGeo, wingMat);
      probeGroup.add(wings);

      // Assign to orbit around a specific planet
      const targetPlanetIndex = (index + 2) % this.planets.length; // Orbit Earth, Mars, Jupiter, etc.
      const assignedPlanet = this.planets[targetPlanetIndex];

      probeGroup.userData = {
        taskId: task.id,
        taskTitle: task.title,
        priority: task.priority,
        completed: task.completed,
        planetHolder: assignedPlanet,
        orbitRadius: (assignedPlanet ? assignedPlanet.userData.mesh.geometry.parameters.radius : 1) + 0.85,
        localAngle: Math.random() * Math.PI * 2,
        localSpeed: 1.2 + Math.random() * 0.8
      };

      this.taskProbesGroup.add(probeGroup);
    });

    const countElem = document.getElementById('matrix-crystal-count');
    if (countElem) countElem.innerText = `${tasks.length} Probes In Planetary Orbit`;
  }

  createTaskBurst(x, y, z, colorHex = 0x10b981) {
    const burstCount = 75;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(burstCount * 3);
    const velocities = [];

    for (let i = 0; i < burstCount; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      ));
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.18,
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

    // Mouse movement tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.targetMouse.x = (e.clientX - window.innerWidth / 2) * 0.0006;
      this.targetMouse.y = (e.clientY - window.innerHeight / 2) * 0.0006;
    });

    // Raycaster Click on Planet or Probe
    window.addEventListener('click', (e) => {
      if (e.target.closest('button, input, select, a, .task-item, .task-create-card, .modal-card')) {
        return;
      }

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const allInteractables = [
        ...this.taskProbesGroup.children,
        ...this.planets.map(p => p.userData.mesh)
      ];
      const intersects = this.raycaster.intersectObjects(allInteractables, true);

      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== this.taskProbesGroup && !root.userData.name) {
          root = root.parent;
        }

        // If clicked on Task Probe
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

    // Scroll listener
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.targetScrollProgress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
    }, { passive: true });

    // Reactive State updates
    window.addEventListener('tasksUpdated', (e) => {
      this.rebuildTaskProbes(e.detail.tasks);
    });

    // Task celebration trigger
    window.addEventListener('taskCompletedCelebration', (e) => {
      const task = e.detail.task;
      const probe = this.taskProbesGroup.children.find(c => c.userData.taskId === task.id);
      if (probe) {
        this.createTaskBurst(probe.position.x, probe.position.y, probe.position.z, 0x10b981);
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

  updateCameraByScroll() {
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.065;

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
    targetPos.x += this.targetMouse.x * 2.2;
    targetPos.y -= this.targetMouse.y * 2.2;

    this.currentCameraPos.lerp(targetPos, 0.05);
    this.currentCameraTarget.lerp(targetLookAt, 0.05);

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentCameraTarget);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Camera Scroll Trajectory
    this.updateCameraByScroll();

    // 2. Central Sun Corona Pulse & Rotation
    if (this.sunMesh) {
      this.sunMesh.rotation.y += 0.003 * this.rotationSpeed;
    }
    if (this.sunCorona) {
      const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.04;
      this.sunCorona.scale.set(pulse, pulse, pulse);
    }

    // 3. Planetary Orbital Revolution & Axial Rotation
    this.planets.forEach(holder => {
      const data = holder.userData;
      if (!data) return;

      // Advance orbital revolution around Sun
      data.angle += 0.0035 * data.speed * this.rotationSpeed;

      holder.position.x = Math.cos(data.angle) * data.distX;
      holder.position.z = Math.sin(data.angle) * data.distZ;

      // Axial rotation of the planet itself
      if (data.mesh) {
        data.mesh.rotation.y += data.rotSpeed * this.rotationSpeed;
        if (data.mesh.userData.moon) {
          data.mesh.userData.moon.rotation.y += 0.02;
        }
      }
    });

    // 4. Update Task Orbital Probes relative to their parent planet
    this.taskProbesGroup.children.forEach(probe => {
      const data = probe.userData;
      if (!data || !data.planetHolder) return;

      data.localAngle += 0.015 * data.localSpeed * this.rotationSpeed;
      const pPos = data.planetHolder.position;

      probe.position.x = pPos.x + Math.cos(data.localAngle) * data.orbitRadius;
      probe.position.y = pPos.y + Math.sin(data.localAngle * 0.7) * (data.orbitRadius * 0.5);
      probe.position.z = pPos.z + Math.sin(data.localAngle) * data.orbitRadius;

      probe.rotation.y += 0.02 * this.rotationSpeed;
    });

    // 5. Deep Space Universe Drift & Meteors
    if (this.starfield) {
      this.starfield.rotation.y = elapsedTime * 0.0015 * this.rotationSpeed;
    }
    if (this.nebulaParticles) {
      this.nebulaParticles.rotation.y = elapsedTime * 0.0025 * this.rotationSpeed;
    }

    this.meteors.forEach(meteor => {
      meteor.userData.timer -= delta;
      if (meteor.userData.timer <= 0) {
        meteor.position.set(
          -20 + Math.random() * 40,
          12 + Math.random() * 12,
          -10 + Math.random() * 15
        );
        meteor.material.opacity = 0.95;
        meteor.userData.timer = Math.random() * 7 + 3;
        meteor.userData.active = true;
      }

      if (meteor.userData.active) {
        meteor.position.x += meteor.userData.speed * delta;
        meteor.position.y -= meteor.userData.speed * 0.55 * delta;
        meteor.material.opacity -= 0.02;
        if (meteor.material.opacity <= 0) {
          meteor.userData.active = false;
        }
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

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    this.planets.forEach(p => {
      if (p.userData.mesh) p.userData.mesh.material.wireframe = this.isWireframe;
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

  focusToPlanet(planetName) {
    const planet = this.planets.find(p => p.userData && p.userData.name.toUpperCase() === planetName.toUpperCase());
    if (planet) {
      const pPos = planet.position;
      this.currentCameraTarget.set(pPos.x, pPos.y, pPos.z);
      this.currentCameraPos.set(pPos.x + 3.0, pPos.y + 1.8, pPos.z + 4.2);
      if (window.soundEngine) window.soundEngine.playChime();
    }
  }
}

window.world3D = new World3D();
