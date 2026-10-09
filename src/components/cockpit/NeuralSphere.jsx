import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'

// ── 节点定义：对应工作台的 12 个功能模块 ──
const NODES = [
  { view: 'knowledge', label: '知识中心', color: '#00d4ff' },
  { view: 'data', label: '数据中心', color: '#00d4ff' },
  { view: 'skills', label: '技能库', color: '#7c4dff' },
  { view: 'hermes-skills', label: 'Hermes技能', color: '#7c4dff' },
  { view: 'clawhub', label: '向量知识库', color: '#00d4ff' },
  { view: 'fleet', label: '实例集群', color: '#7c4dff' },
  { view: 'content', label: '图文制作', color: '#00e676' },
  { view: 'selflearning', label: '自主学习', color: '#00e676' },
  { view: 'practice', label: '任务练习', color: '#00e676' },
  { view: 'projects', label: '项目中心', color: '#00d4ff' },
  { view: 'git', label: 'Git管理', color: '#7c4dff' },
  { view: 'delivery', label: '交付驾驶舱', color: '#ff9100' },
]

// ── 斐波那契球面均匀分布 ──
function fibSphere(n, r) {
  const pts = []
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const rad = Math.sqrt(Math.max(0, 1 - y * y))
    const th = phi * i
    pts.push(new THREE.Vector3(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r))
  }
  return pts
}

// ── 径向辉光贴图（Canvas 程序化生成，无外部资源） ──
function makeGlowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.28, 'rgba(140,220,255,0.4)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// ── 中央能量核心 ──
function Core({ glowTex }) {
  const solid = useRef()
  const wire = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (solid.current) solid.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.035)
    if (wire.current) {
      wire.current.rotation.y = t * 0.16
      wire.current.rotation.x = t * 0.07
      wire.current.scale.setScalar(1.22 + Math.sin(t * 0.9 + 1) * 0.05)
    }
  })
  return (
    <group>
      <sprite scale={[3.6, 3.6, 1]}>
        <spriteMaterial map={glowTex} color="#00d4ff" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh ref={solid}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial color="#0a1e38" emissive="#00d4ff" emissiveIntensity={0.85} metalness={0.4} roughness={0.25} />
      </mesh>
      <mesh ref={wire}>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

// ── 核心内部粒子云 ──
function InnerCloud() {
  const ref = useRef()
  const geo = useMemo(() => {
    const N = 380
    const arr = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const r = Math.cbrt(Math.random()) * 0.92
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th)
      arr[i * 3 + 1] = r * Math.cos(ph)
      arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [])
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.12
      ref.current.rotation.z = clock.elapsedTime * 0.04
    }
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.028} color="#7cd6ff" transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  )
}

// ── 背景星野 ──
function Starfield() {
  const ref = useRef()
  const geo = useMemo(() => {
    const N = 550
    const arr = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const r = 9 + Math.random() * 5
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th)
      arr[i * 3 + 1] = r * Math.cos(ph)
      arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [])
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.008
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.045} color="#9db9d8" transparent opacity={0.5} depthWrite={false} sizeAttenuation />
    </points>
  )
}

// ── 技能节点（可点击 → 跳转功能页） ──
function SkillNode({ position, node, glowTex, onNavigate }) {
  const [hovered, setHovered] = useState(false)
  const ball = useRef()
  const glow = useRef()
  useFrame((_, dt) => {
    if (ball.current) {
      const target = hovered ? 1.7 : 1
      ball.current.scale.lerp(new THREE.Vector3(target, target, target), Math.min(1, dt * 10))
    }
    if (glow.current) {
      const target = hovered ? 1.7 : 1
      glow.current.scale.lerp(new THREE.Vector3(1.15 * target, 1.15 * target, 1), Math.min(1, dt * 10))
    }
  })
  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onNavigate(node.view) }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      <sprite ref={glow} scale={[1.15, 1.15, 1]}>
        <spriteMaterial map={glowTex} color={node.color} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh ref={ball}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={node.color} />
      </mesh>
      <Html center distanceFactor={11} zIndexRange={[20, 0]}>
        <div
          className={`n-label${hovered ? ' hot' : ''}`}
          style={{ borderColor: hovered ? node.color : undefined, color: hovered ? node.color : undefined }}
          onClick={(e) => { e.stopPropagation(); onNavigate(node.view) }}
        >
          {node.label}
        </div>
      </Html>
    </group>
  )
}

// ── 飞线（核心 → 节点，带流动脉冲） ──
function FlightLine({ curve, color, offset }) {
  const pts = useMemo(() => curve.getPoints(48), [curve])
  const pulse = useRef()
  useFrame(({ clock }) => {
    if (!pulse.current) return
    const t = (clock.elapsedTime * 0.13 + offset) % 1
    pulse.current.position.copy(curve.getPointAt(t))
    const mat = pulse.current.material
    mat.opacity = 0.35 + Math.sin(t * Math.PI) * 0.65
  })
  return (
    <group>
      <Line points={pts} color={color} transparent opacity={0.26} lineWidth={1} />
      <mesh ref={pulse}>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

// ── 场景组装 ──
function Scene({ onNavigate }) {
  const glowTex = useMemo(() => makeGlowTexture(), [])
  const group = useRef()
  const positions = useMemo(() => fibSphere(NODES.length, 2.35), [])
  const curves = useMemo(
    () =>
      positions.map((p) => {
        const dir = p.clone().normalize()
        const start = dir.clone().multiplyScalar(1.08)
        const mid = dir.clone().multiplyScalar(2.75)
        mid.y += dir.y * 0.5
        const end = p.clone().multiplyScalar(0.94)
        return new THREE.QuadraticBezierCurve3(start, mid, end)
      }),
    [positions]
  )
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.055
  })
  return (
    <group ref={group}>
      <Core glowTex={glowTex} />
      <InnerCloud />
      {NODES.map((n, i) => (
        <SkillNode key={n.view} position={positions[i]} node={n} glowTex={glowTex} onNavigate={onNavigate} />
      ))}
      {curves.map((c, i) => (
        <FlightLine key={i} curve={c} color={NODES[i].color} offset={i / NODES.length} />
      ))}
    </group>
  )
}

export default function NeuralSphere({ onNavigate }) {
  return (
    <div className="neural-sphere">
      <Canvas
        camera={{ position: [0, 0.7, 8.6], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <fog attach="fog" args={['#0f0f1f', 9.5, 19]} />
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 0]} intensity={14} color="#00d4ff" distance={10} decay={2} />
        <Starfield />
        <Scene onNavigate={onNavigate} />
        <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={5.5} maxDistance={13} />
      </Canvas>
    </div>
  )
}
