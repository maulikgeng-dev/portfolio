import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DecorativeLine = THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;

function makeLine(points: THREE.Vector3[], material: THREE.LineBasicMaterial): DecorativeLine {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
}

function makeRing(
  scene: THREE.Scene,
  path: THREE.CatmullRomCurve3,
  progress: number,
  radius: number,
  material: THREE.MeshStandardMaterial,
  tube = 0.035,
) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 80), material);
  group.add(mesh);
  group.position.copy(path.getPointAt(progress));
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), path.getTangentAt(progress).normalize());
  scene.add(group);
  return group;
}

function buildEnvironment(scene: THREE.Scene, path: THREE.CatmullRomCurve3, mobile: boolean) {
  const resources: { geometries: Set<THREE.BufferGeometry>; materials: Set<THREE.Material> } = {
    geometries: new Set(),
    materials: new Set(),
  };
  const trackMaterial = new THREE.MeshStandardMaterial({
    color: '#6bc9dc', emissive: '#338da2', emissiveIntensity: 0.72, roughness: 0.34, metalness: 0.48,
  });
  const archMaterial = new THREE.MeshStandardMaterial({
    color: '#829ab0', emissive: '#3c8097', emissiveIntensity: 0.31, metalness: 0.68, roughness: 0.3,
  });
  const violetMaterial = new THREE.MeshStandardMaterial({
    color: '#a995ce', emissive: '#6a4e92', emissiveIntensity: 0.34, metalness: 0.52, roughness: 0.36,
  });
  const floorMaterial = new THREE.LineBasicMaterial({ color: '#6ba4b7', transparent: true, opacity: 0.15 });
  const networkMaterial = new THREE.LineBasicMaterial({ color: '#9adfed', transparent: true, opacity: 0.46 });
  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: '#a9edf5', emissive: '#67cce0', emissiveIntensity: 1.3, roughness: 0.22,
  });
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: '#172a38', emissive: '#102c3b', emissiveIntensity: 0.45, metalness: 0.78, roughness: 0.26,
  });
  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: '#687e91', emissive: '#3e6d83', emissiveIntensity: 0.35, metalness: 0.8, roughness: 0.28,
  });
  const orbMaterial = new THREE.MeshPhysicalMaterial({
    color: '#24164D', emissive: '#49358A', emissiveIntensity: 0.22,
    metalness: 0.22, roughness: 0.32, clearcoat: 0.92, clearcoatRoughness: 0.18,
  });
  const shellMaterial = new THREE.MeshBasicMaterial({
    color: '#7186ff', wireframe: true, transparent: true, opacity: 0.3,
  });
  const orbRingMaterial = new THREE.MeshBasicMaterial({
    color: '#6382ff', transparent: true, opacity: 0.45,
  });
  const orbAccentMaterial = new THREE.MeshBasicMaterial({
    color: '#7757d9', transparent: true, opacity: 0.3,
  });
  const pointMaterial = new THREE.PointsMaterial({
    color: '#b9eaf2', size: mobile ? 0.055 : 0.06, transparent: true, opacity: 0.63,
    depthWrite: false, sizeAttenuation: true,
  });
  [trackMaterial, archMaterial, violetMaterial, floorMaterial, networkMaterial, nodeMaterial, platformMaterial, pillarMaterial, orbMaterial, shellMaterial, orbRingMaterial, orbAccentMaterial, pointMaterial].forEach((material) => resources.materials.add(material));

  const ringCount = mobile ? 9 : 13;
  const ringObjects: THREE.Group[] = [];
  for (let index = 0; index < ringCount; index += 1) {
    const p = 0.035 + (index / (ringCount - 1)) * 0.93;
    const useViolet = index === 3 || index === 8 || index === ringCount - 1;
    const radius = index === 6 ? 5.3 : 3.15 + (index % 3) * 0.34;
    const ring = makeRing(scene, path, p, radius, useViolet ? violetMaterial : archMaterial, index === 6 ? 0.065 : 0.034);
    ringObjects.push(ring);
    ring.traverse((object) => {
      if (object instanceof THREE.Mesh) resources.geometries.add(object.geometry);
    });
  }

  const floorPositions: number[] = [];
  const gridSteps = mobile ? 35 : 58;
  for (let index = 0; index <= gridSteps; index += 1) {
    const t = index / gridSteps;
    const point = path.getPointAt(t);
    const tangent = path.getTangentAt(t).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    const crossbar = side.clone().multiplyScalar(19);
    const elevation = new THREE.Vector3(0, -2.1, 0);
    const a = point.clone().add(elevation).sub(crossbar);
    const b = point.clone().add(elevation).add(crossbar);
    floorPositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    if (index % 2 === 0) {
      const length = tangent.clone().multiplyScalar(3.4);
      floorPositions.push(a.x, a.y, a.z, a.x + length.x, a.y + length.y, a.z + length.z);
      floorPositions.push(b.x, b.y, b.z, b.x + length.x, b.y + length.y, b.z + length.z);
    }
  }
  const floorGeometry = new THREE.BufferGeometry();
  floorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(floorPositions, 3));
  scene.add(new THREE.LineSegments(floorGeometry, floorMaterial));
  resources.geometries.add(floorGeometry);

  const nodeMeshes: THREE.Mesh[] = [];
  const nodePoints: THREE.Vector3[] = [];
  const projectPlatforms: { platform: THREE.Mesh; edge: THREE.Mesh; display: THREE.Mesh }[] = [];
  const networkCount = mobile ? 5 : 8;
  for (let index = 0; index < networkCount; index += 1) {
    const t = 0.21 + index * 0.035;
    const point = path.getPointAt(t);
    const tangent = path.getTangentAt(t).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    const offset = index % 2 === 0 ? 1 : -1;
    const nodePoint = point.clone().addScaledVector(side, offset * (2.5 + (index % 3))).add(new THREE.Vector3(0, index % 3 === 1 ? 2.2 : -0.35, 0));
    nodePoints.push(nodePoint);
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.12 + (index % 2) * 0.045, 12, 10), nodeMaterial);
    node.position.copy(nodePoint);
    scene.add(node);
    nodeMeshes.push(node);
    resources.geometries.add(node.geometry);
  }
  for (let index = 0; index < nodePoints.length - 1; index += 1) {
    scene.add(makeLine([nodePoints[index], nodePoints[index + 1]], networkMaterial));
  }
  for (let index = 0; index < nodePoints.length - 2; index += 2) {
    scene.add(makeLine([nodePoints[index], nodePoints[index + 2]], floorMaterial));
  }
  scene.traverse((object) => {
    if (object instanceof THREE.Line && !(object instanceof THREE.LineSegments)) resources.geometries.add(object.geometry);
  });

  const projectProgress = [0.59, 0.67, 0.75];
  projectProgress.forEach((progress, index) => {
    const point = path.getPointAt(progress);
    const tangent = path.getTangentAt(progress).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    const direction = index % 2 === 0 ? -1 : 1;
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.2, 0.22, 32), platformMaterial);
    platform.position.copy(point).addScaledVector(side, direction * 4.5);
    platform.position.y -= 1.2;
    scene.add(platform);
    resources.geometries.add(platform.geometry);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(2.08, 0.024, 6, 48), index === 2 ? violetMaterial : trackMaterial);
    edge.rotation.x = Math.PI / 2;
    edge.position.copy(platform.position);
    edge.position.y += 0.12;
    scene.add(edge);
    resources.geometries.add(edge.geometry);
    const display = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.1 + (index % 2) * 0.65, 0.08),
      index === 2 ? violetMaterial : archMaterial,
    );
    display.position.copy(platform.position).addScaledVector(side, -direction * 0.2);
    display.position.y += 1.15;
    scene.add(display);
    resources.geometries.add(display.geometry);
    projectPlatforms.push({ platform, edge, display });
  });

  [0.81, 0.845, 0.88, 0.915].forEach((progress, index) => {
    const point = path.getPointAt(progress);
    const tangent = path.getTangentAt(progress).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    const sign = index % 2 === 0 ? -1 : 1;
    const height = 5.5 + (index % 2) * 1.7;
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.32, height, 10, 1),
      index === 2 ? violetMaterial : pillarMaterial,
    );
    pillar.position.copy(point).addScaledVector(side, sign * (3.9 + (index % 2) * 1.1));
    pillar.position.y += height / 2 - 1.25;
    scene.add(pillar);
    resources.geometries.add(pillar.geometry);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 6, 24), trackMaterial);
    collar.position.copy(pillar.position);
    collar.position.y += height / 2 - 0.2;
    scene.add(collar);
    resources.geometries.add(collar.geometry);
  });

  const orb = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.56, 28, 22), orbMaterial);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), shellMaterial);
  const orbitA = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.013, 6, 80), orbRingMaterial);
  const orbitB = new THREE.Mesh(new THREE.TorusGeometry(1.43, 0.009, 6, 80), orbAccentMaterial);
  orbitA.rotation.set(0.85, 0.28, 0.1);
  orbitB.rotation.set(1.2, -0.55, -0.35);
  const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), nodeMaterial);
  satellite.position.set(1.15, 0, 0);
  orbitA.add(satellite);
  orb.add(core, shell, orbitA, orbitB);
  const orbLight = new THREE.PointLight('#e0d6ff', 1.1, 6, 2);
  orb.add(orbLight);
  scene.add(orb);
  [core.geometry, shell.geometry, orbitA.geometry, orbitB.geometry, satellite.geometry].forEach((geometry) => resources.geometries.add(geometry));

  const starCount = mobile ? 360 : 1100;
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    const randomA = (Math.sin(index * 127.1 + 3.7) * 43758.5453) % 1;
    const randomB = (Math.sin(index * 311.7 + 11.2) * 23421.631) % 1;
    const randomC = (Math.sin(index * 74.7 + 1.9) * 34783.219) % 1;
    starPositions[index * 3] = (randomA < 0 ? randomA + 1 : randomA) * 42 - 21;
    starPositions[index * 3 + 1] = (randomB < 0 ? randomB + 1 : randomB) * 28 - 10;
    starPositions[index * 3 + 2] = 20 - (index / starCount) * 158 - (randomC < 0 ? randomC + 1 : randomC) * 3;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, pointMaterial);
  scene.add(stars);
  resources.geometries.add(starGeometry);

  return { orb, orbitA, orbitB, stars, ringObjects, nodeMeshes, projectPlatforms, networkMaterial, resources };
}

export function CinematicWorld() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 220);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#080d17', 0.012);
    scene.add(new THREE.HemisphereLight('#b9d4e8', '#11131e', 1.05));
    const keyLight = new THREE.DirectionalLight('#b7eaf4', 1.55);
    keyLight.position.set(-4, 9, 8);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight('#7767c4', 22, 48, 2);
    fillLight.position.set(5, 5, -55);
    scene.add(fillLight);

    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, 25),
      new THREE.Vector3(0, 1.35, 10),
      new THREE.Vector3(-1.2, 1.1, -5),
      new THREE.Vector3(-3.2, 1.8, -22),
      new THREE.Vector3(-0.8, 1.1, -38),
      new THREE.Vector3(2.8, 1.4, -54),
      new THREE.Vector3(0.6, 2.9, -72),
      new THREE.Vector3(-2, 1.5, -89),
      new THREE.Vector3(-0.4, 2.2, -107),
      new THREE.Vector3(0.4, 1.3, -128),
    ], false, 'catmullrom', 0.36);

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrame = 0;
    let failed = false;
    let targetProgress = 0;
    let currentProgress = 0;
    let lastFrame = 0;
    let hoveredSkillIndex = -1;
    let hoveredProjectIndex = -1;
    let pointerX = 0;
    let pointerY = 0;
    const currentLook = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();
    const desiredOrb = new THREE.Vector3();
    const orbTangent = new THREE.Vector3();
    const orbRight = new THREE.Vector3();
    let environment: ReturnType<typeof buildEnvironment> | null = null;
    const cleanupClasses = () => {
      document.documentElement.classList.remove('webgl-ready', 'world-fallback');
    };
    const activateFallback = () => {
      if (failed) return;
      failed = true;
      document.documentElement.classList.remove('webgl-ready');
      document.documentElement.classList.add('world-fallback');
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (environment) {
        environment.resources.geometries.forEach((geometry) => geometry.dispose());
        environment.resources.materials.forEach((material) => material.dispose());
        environment = null;
      }
      if (renderer) {
        renderer.domElement.remove();
        renderer.dispose();
        renderer.forceContextLoss();
        renderer = null;
      }
    };

    const measure = () => {
      if (!renderer) return;
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.65));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      targetProgress = Math.min(1, Math.max(0, window.scrollY /
        Math.max(1, document.documentElement.scrollHeight - window.innerHeight)));
      if (reducedMotion) currentProgress = targetProgress;
    };

    const updateProgress = () => {
      targetProgress = Math.min(1, Math.max(0, window.scrollY /
        Math.max(1, document.documentElement.scrollHeight - window.innerHeight)));
    };

    const updateInteraction = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const skill = target?.closest<HTMLElement>('[data-skill-index]');
      const project = target?.closest<HTMLElement>('[data-project-index]');
      hoveredSkillIndex = skill ? Number.parseInt(skill.dataset.skillIndex ?? '', 10) : -1;
      hoveredProjectIndex = project ? Number.parseInt(project.dataset.projectIndex ?? '', 10) : -1;
      pointerX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointerY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };

    try {
      const probeCanvas = document.createElement('canvas');
      const probeContext = probeCanvas.getContext('webgl2');
      if (!probeContext) throw new Error('WebGL2 is unavailable');
      probeContext.getExtension('WEBGL_lose_context')?.loseContext();

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !mobile,
        powerPreference: 'low-power',
        stencil: false,
        depth: true,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.94;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.className = 'cinematic-webgl-canvas';
      host.appendChild(renderer.domElement);
      const activeEnvironment = buildEnvironment(scene, path, mobile);
      environment = activeEnvironment;

      const render = (timestamp: number) => {
        if (!renderer || failed) return;
        animationFrame = window.requestAnimationFrame(render);
        if (mobile && lastFrame && timestamp - lastFrame < 1000 / 30) return;
        const delta = Math.min(0.05, lastFrame ? (timestamp - lastFrame) / 1000 : 0.016);
        lastFrame = timestamp;
        if (reducedMotion) currentProgress = targetProgress;
        else currentProgress += (targetProgress - currentProgress) * (1 - Math.exp(-delta * 6.5));

        const cameraT = Math.min(0.965, currentProgress * 0.965);
        const lookT = Math.min(0.995, cameraT + 0.038);
        desiredCamera.copy(path.getPointAt(cameraT));
        desiredLook.copy(path.getPointAt(lookT));
        desiredLook.y += 0.18;
        const orbT = Math.min(0.995, cameraT + 0.043);
        desiredOrb.copy(path.getPointAt(orbT));
        path.getTangentAt(orbT, orbTangent).normalize();
        orbRight.crossVectors(orbTangent, camera.up).normalize();
        const heroSeparation = 1 - THREE.MathUtils.smoothstep(currentProgress, 0.2, 0.3);
        desiredOrb.addScaledVector(orbRight, 3.8 * heroSeparation);

        if (reducedMotion) {
          camera.position.copy(desiredCamera);
          currentLook.copy(desiredLook);
          activeEnvironment.orb.position.copy(desiredOrb);
        } else {
          camera.position.lerp(desiredCamera, 1 - Math.exp(-delta * 8));
          currentLook.lerp(desiredLook, 1 - Math.exp(-delta * 8));
          activeEnvironment.orb.position.lerp(desiredOrb, 1 - Math.exp(-delta * 7));
          activeEnvironment.orb.rotation.y += delta * 0.16;
          activeEnvironment.orb.rotation.x += delta * 0.07;
          activeEnvironment.orbitA.rotation.z += delta * 0.42;
          activeEnvironment.orbitB.rotation.z -= delta * 0.24;
          activeEnvironment.stars.rotation.y = Math.sin(timestamp * 0.000035) * 0.035;
          activeEnvironment.ringObjects.forEach((ring, index) => {
            ring.rotation.z = Math.sin(timestamp * 0.00018 + index * 0.8) * 0.018;
          });
          const networkGlow = hoveredSkillIndex >= 0 ? 0.92 : 0.46;
          activeEnvironment.networkMaterial.opacity += (networkGlow - activeEnvironment.networkMaterial.opacity) * (1 - Math.exp(-delta * 10));
          activeEnvironment.nodeMeshes.forEach((node, index) => {
            const selected = hoveredSkillIndex >= 0 && index === hoveredSkillIndex % activeEnvironment.nodeMeshes.length;
            const targetScale = selected ? 1.75 : 1;
            const pulse = 1 + Math.sin(timestamp * 0.001 + index) * 0.055;
            const nextScale = targetScale * pulse;
            node.scale.setScalar(node.scale.x + (nextScale - node.scale.x) * (1 - Math.exp(-delta * 11)));
          });
          activeEnvironment.projectPlatforms.forEach(({ platform, edge, display }, index) => {
            const selected = hoveredProjectIndex === index;
            const nextScale = selected ? 1.08 : 1;
            const blend = 1 - Math.exp(-delta * 10);
            platform.scale.y += (nextScale - platform.scale.y) * blend;
            edge.scale.setScalar(1 + (selected ? 0.06 : 0) * blend);
            display.rotation.y += ((selected ? pointerX * 0.13 : 0) - display.rotation.y) * blend;
            display.rotation.x += ((selected ? pointerY * -0.08 : 0) - display.rotation.x) * blend;
          });
        }
        camera.lookAt(currentLook);
        try {
          renderer.render(scene, camera);
        } catch {
          activateFallback();
        }
      };

      measure();
      updateProgress();
      window.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('pointermove', updateInteraction, { passive: true });
      window.addEventListener('resize', measure);
      document.documentElement.classList.remove('world-fallback');
      document.documentElement.classList.add('webgl-ready');
      animationFrame = window.requestAnimationFrame(render);
    } catch {
      activateFallback();
    }

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('pointermove', updateInteraction);
      window.removeEventListener('resize', measure);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (environment) {
        environment.resources.geometries.forEach((geometry) => geometry.dispose());
        environment.resources.materials.forEach((material) => material.dispose());
      }
      renderer?.dispose();
      renderer?.forceContextLoss();
      if (renderer?.domElement.parentElement === host) host.removeChild(renderer.domElement);
      cleanupClasses();
    };
  }, []);

  return <div ref={hostRef} className="webgl-world" aria-hidden="true" />;
}
