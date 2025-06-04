import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';

const DEBUG = false;

function log(...args) {
    if (DEBUG) {
        console.log('[EnergyEffect]', ...args);
    }
}

function warn(...args) {
    if (DEBUG) {
        console.warn('[EnergyEffect]', ...args);
    }
}

class EnergyEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1000, 1000, 1000, -1000, 0.1, 2000);
        this.camera.position.z = 100;
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        
        this.uniforms = {
            time: { value: 0.0 },
            fireColorBase: { value: new THREE.Color(0xff6600) },
            fireColorHot: { value: new THREE.Color(0xffffaa) },
            fireColorCool: { value: new THREE.Color(0xcc2200) }
        };
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.createEnergyRing();
        this.animate();
        this.handleResize();
    }
    
    setupRenderer() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);
    }
    
    createEnergyRing() {
        const material = new THREE.ShaderMaterial({
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader(),
            uniforms: this.uniforms,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            side: THREE.DoubleSide
        });
        
        const geometry = this.createRingGeometry();
        this.energyRing = new THREE.Mesh(geometry, material);
        this.scene.add(this.energyRing);
    }
    
    createRingGeometry() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        const gap = 10;
        const ringThickness = 20;
        const cornerRadius = 24;
        
        const outerWidth = width + 2 * (gap + ringThickness);
        const outerHeight = height + 2 * (gap + ringThickness);
        const outerRadius = cornerRadius + gap + ringThickness;
        
        const innerWidth = width + 2 * gap;
        const innerHeight = height + 2 * gap;
        const innerRadius = cornerRadius + gap;
        
        const shape = new THREE.Shape();
        shape.moveTo(-outerWidth/2 + outerRadius, -outerHeight/2);
        shape.lineTo(outerWidth/2 - outerRadius, -outerHeight/2);
        shape.quadraticCurveTo(outerWidth/2, -outerHeight/2, outerWidth/2, -outerHeight/2 + outerRadius);
        shape.lineTo(outerWidth/2, outerHeight/2 - outerRadius);
        shape.quadraticCurveTo(outerWidth/2, outerHeight/2, outerWidth/2 - outerRadius, outerHeight/2);
        shape.lineTo(-outerWidth/2 + outerRadius, outerHeight/2);
        shape.quadraticCurveTo(-outerWidth/2, outerHeight/2, -outerWidth/2, outerHeight/2 - outerRadius);
        shape.lineTo(-outerWidth/2, -outerHeight/2 + outerRadius);
        shape.quadraticCurveTo(-outerWidth/2, -outerHeight/2, -outerWidth/2 + outerRadius, -outerHeight/2);
        
        const innerPath = new THREE.Path();
        innerPath.moveTo(-innerWidth/2 + innerRadius, -innerHeight/2);
        innerPath.lineTo(innerWidth/2 - innerRadius, -innerHeight/2);
        innerPath.quadraticCurveTo(innerWidth/2, -innerHeight/2, innerWidth/2, -innerHeight/2 + innerRadius);
        innerPath.lineTo(innerWidth/2, innerHeight/2 - innerRadius);
        innerPath.quadraticCurveTo(innerWidth/2, innerHeight/2, innerWidth/2 - innerRadius, innerHeight/2);
        innerPath.lineTo(-innerWidth/2 + innerRadius, innerHeight/2);
        innerPath.quadraticCurveTo(-innerWidth/2, innerHeight/2, -innerWidth/2, innerHeight/2 - innerRadius);
        innerPath.lineTo(-innerWidth/2, -innerHeight/2 + innerRadius);
        innerPath.quadraticCurveTo(-innerWidth/2, -innerHeight/2, -innerWidth/2 + innerRadius, -innerHeight/2);
        
        shape.holes.push(innerPath);
        
        return new THREE.ShapeGeometry(shape, 48);
    }
    
    getVertexShader() {
        return `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                vec3 newPosition = position;
                
                float distortionAmount = 0.02;
                float distortion = noise(vec2(position.x * 0.05 + time * 0.1, position.y * 0.05 - time * 0.15)) * distortionAmount;
                
                vec2 normalizedPos = normalize(position.xy);
                newPosition.x += normalizedPos.x * distortion;
                newPosition.y += normalizedPos.y * distortion;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;
    }
    
    getFragmentShader() {
        return `
            uniform float time;
            uniform vec3 fireColorBase;
            uniform vec3 fireColorHot;
            uniform vec3 fireColorCool;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                
                vec2 u = f * f * (3.0 - 2.0 * f);
                
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            float turbulence(vec2 st, float baseFreq, int octaves) {
                float value = 0.0;
                float amplitude = 1.0;
                float frequency = baseFreq;
                
                for (int i = 0; i < octaves; i++) {
                    value += amplitude * abs(noise(st * frequency));
                    st = st * 1.4 + vec2(3.2, 1.7);
                    frequency *= 2.0;
                    amplitude *= 0.5;
                }
                
                return value;
            }
            
            void main() {
                float slowTime = time * 0.4;
                float mediumTime = time * 0.8;
                float fastTime = time * 1.6;
                
                vec2 centeredUv = vUv - vec2(0.5);
                float angle = atan(centeredUv.y, centeredUv.x);
                float normalizedAngle = (angle / (2.0 * 3.14159)) + 0.5;
                float radius = length(centeredUv) * 2.0;
                
                float flowSpeed = 2.0;
                float flowFrequency = 3.0;
                float baseFlow = sin(normalizedAngle * flowFrequency * 6.28318 + mediumTime * flowSpeed);
                baseFlow = baseFlow * 0.5 + 0.5;
                
                vec2 noiseCoord1 = vec2(
                    normalizedAngle * 8.0 + mediumTime * 0.3,
                    vUv.y * 4.0 - mediumTime * 0.4
                );
                float fireDetail1 = turbulence(noiseCoord1, 1.0, 4);
                
                vec2 noiseCoord2 = vec2(
                    normalizedAngle * 6.0 - mediumTime * 0.5,
                    vUv.y * 3.0 + mediumTime * 0.3
                );
                float fireDetail2 = turbulence(noiseCoord2, 1.5, 3);
                
                vec2 emberCoord = vec2(
                    normalizedAngle * 10.0,
                    mod(vUv.y * 3.0 - fastTime * 0.5, 3.0)
                );
                float embers = noise(emberCoord * 8.0);
                embers = pow(embers, 3.0) * smoothstep(0.4, 0.6, vUv.y);
                
                float widthModulation = 1.0 - pow(abs(vUv.y - 0.5) * 1.8, 2.0);
                widthModulation = clamp(widthModulation, 0.3, 1.0);
                
                float mainFlicker = 0.92 + 0.08 * sin(fastTime * 7.7);
                float microFlicker = 0.95 + 0.05 * sin(fastTime * 30.0) * sin(fastTime * 17.3);
                float combinedFlicker = mainFlicker * microFlicker;
                
                float fireDetail = fireDetail1 * 0.6 + fireDetail2 * 0.4;
                fireDetail = pow(fireDetail, 1.2);
                
                float baseIntensity = 0.7 + 0.3 * baseFlow;
                float turbulentIntensity = baseIntensity * fireDetail * widthModulation * combinedFlicker;
                
                float fineDetail = noise(noiseCoord1 * 3.0 + fastTime * 0.1) * 0.2;
                turbulentIntensity += fineDetail * widthModulation;
                
                turbulentIntensity += embers * 0.2;
                
                float finalIntensity = smoothstep(0.1, 0.9, turbulentIntensity);
                
                vec3 deepRed = vec3(0.7, 0.05, 0.01);
                vec3 midOrange = fireColorBase;
                vec3 brightYellow = vec3(1.0, 0.9, 0.3);
                vec3 hotWhite = vec3(1.0, 1.0, 0.95);
                
                vec3 finalColor;
                
                if (finalIntensity < 0.3) {
                    float t = finalIntensity / 0.3;
                    finalColor = mix(deepRed, midOrange, t);
                }
                else if (finalIntensity < 0.7) {
                    float t = (finalIntensity - 0.3) / 0.4;
                    finalColor = mix(midOrange, brightYellow, t);
                }
                else {
                    float t = (finalIntensity - 0.7) / 0.3;
                    finalColor = mix(brightYellow, hotWhite, t);
                }
                
                float blueHint = pow(finalIntensity, 5.0) * 0.1;
                finalColor = mix(finalColor, vec3(0.7, 0.8, 1.0), blueHint);
                
                float alpha = finalIntensity * 2.0;
                alpha = clamp(alpha, 0.0, 1.0);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.uniforms.time.value += 0.016;
        
        const time = this.uniforms.time.value;
        const hueShift = Math.sin(time * 0.1) * 0.05;
        
        const baseColor = new THREE.Color();
        baseColor.setHSL(0.07 + hueShift, 0.9, 0.55);
        this.uniforms.fireColorBase.value.copy(baseColor);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        window.addEventListener('resize', () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.renderer.setSize(rect.width, rect.height);
            
            if (this.energyRing) {
                this.energyRing.geometry.dispose();
                this.energyRing.geometry = this.createRingGeometry();
            }
        });
    }
}

// Initialize energy effects for all cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card-container');
    cards.forEach(card => {
        const canvas = card.querySelector('.energy-canvas');
        if (canvas) {
            new EnergyEffect(canvas);
        }
    });
}); 