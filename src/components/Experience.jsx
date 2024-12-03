import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'
import { Model } from './Model'

export default function Experience() {
    const playerRef = useRef()
    const cameraRef = useRef()
    const [projectiles, setProjectiles] = useState([])

    // Configuration des contrôles clavier
    const [, getKeys] = useKeyboardControls()

    // Gérer le tir avec la touche espace
    const handleShoot = (event) => {
        if (event.code === 'Space' && playerRef.current) {
            const playerPosition = playerRef.current.position.clone()
            setProjectiles(prev => [...prev, {
                position: playerPosition,
                id: Date.now(),
                direction: new THREE.Vector3(0, 0, -1)
            }])
        }
    }

    useEffect(() => {
        window.addEventListener('keydown', handleShoot)
        return () => window.removeEventListener('keydown', handleShoot)
    }, [])

    useFrame((state, delta) => {
        if (!playerRef.current) return

        const { forward, backward, left, right } = getKeys()
        const speed = 5

        // Déplacement du modèle
        if (forward) playerRef.current.position.z -= speed * delta
        if (backward) playerRef.current.position.z += speed * delta
        if (left) playerRef.current.position.x -= speed * delta
        if (right) playerRef.current.position.x += speed * delta

        // Mise à jour des projectiles
        setProjectiles(prev => 
            prev.map(projectile => {
                const newPosition = projectile.position.clone()
                newPosition.add(projectile.direction.clone().multiplyScalar(10 * delta))
                return {
                    ...projectile,
                    position: newPosition
                }
            }).filter(projectile => projectile.position.z > -50)
        )

        // La caméra suit le modèle
        if (cameraRef.current) {
            const offset = new THREE.Vector3(0, 2, 4)
            const playerPosition = playerRef.current.position
            cameraRef.current.position.lerp(
                new THREE.Vector3(
                    playerPosition.x + offset.x,
                    playerPosition.y + offset.y,
                    playerPosition.z + offset.z
                ),
                0.1
            )
            cameraRef.current.lookAt(playerPosition)
        }
    })

    return (
        <>
            <PerspectiveCamera 
                ref={cameraRef}
                makeDefault 
                position={[0, 2, 4]} 
                fov={75}
            />

            {/* Modèle du jet avec sa lumière suivante */}
            <group ref={playerRef}>
                <Model />
                <pointLight
                    position={[0, 3, -0.5]}
                    intensity={6}
                    color="#ffffff"
                    distance={6}
                    decay={2}
                />
                <spotLight
                    position={[0, 4, 0]}
                    angle={0.5}
                    penumbra={0.5}
                    intensity={1}
                    castShadow
                    color="#4444ff"
                />
            </group>

            {/* Projectiles */}
            {projectiles.map(projectile => (
                <mesh key={projectile.id} position={projectile.position.toArray()}>
                    <sphereGeometry args={[0.1]} />
                    <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={2} />
                </mesh>
            ))}

            {/* Éclairage ambiant */}
            <ambientLight intensity={1} />

            {/* Sol */}
            <mesh rotation-x={-Math.PI * 0.5} position-y={-0.5} receiveShadow>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="gray" />
            </mesh>
        </>
    )
}
