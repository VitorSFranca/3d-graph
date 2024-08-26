import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

let renderer, scene, camera, controls;
let mainSphere, childSphere1, childSphere2, edge1, edge2;
let cameraHelper;

// Configuration
const sphereRadius = 0.5;
const edgeRadius = 0.05;
const mainSphereColor = 0x44aa88;
const childSphereColor = 0x4488aa;
const edgeColor = 0xaaaaaa;

// Camera settings
let fov = 75;
let near = 0.1;
let far = 50;

// Angle between child spheres (in radians)
let angleBetweenChildren = Math.PI / 4; // Start with 45 degrees

function createSphere(color) {
    const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color });
    return new THREE.Mesh(geometry, material);
}

function createEdge(start, end) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const edgeGeometry = new THREE.CylinderGeometry(edgeRadius, edgeRadius, length, 8, 1);
    const edgeMaterial = new THREE.MeshBasicMaterial({ color: edgeColor });
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);

    edge.position.copy(start);
    edge.position.addScaledVector(direction, 0.5);
    edge.lookAt(end);
    edge.rotateX(Math.PI / 2);

    return edge;
}

function createAxisHelper() {
    const axisLength = 5;
    const axisMaterial = new THREE.LineBasicMaterial({ vertexColors: true });

    // X-axis (red)
    const xGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(axisLength, 0, 0)
    ]);
    xGeometry.setAttribute('color', new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0], 3));
    const xAxis = new THREE.Line(xGeometry, axisMaterial);

    // Y-axis (green)
    const yGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, axisLength, 0)
    ]);
    yGeometry.setAttribute('color', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0], 3));
    const yAxis = new THREE.Line(yGeometry, axisMaterial);

    // Z-axis (blue)
    const zGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, axisLength)
    ]);
    zGeometry.setAttribute('color', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 3));
    const zAxis = new THREE.Line(zGeometry, axisMaterial);

    const axisHelper = new THREE.Group();
    axisHelper.add(xAxis);
    axisHelper.add(yAxis);
    axisHelper.add(zAxis);

    return axisHelper;
}

function createAxisLabels() {
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textOptions = {
            font: font,
            size: 0.5,
            height: 0.1
        };

        const xLabel = new THREE.Mesh(new TextGeometry('X', textOptions), textMaterial);
        xLabel.position.set(5.5, 0, 0);

        const yLabel = new THREE.Mesh(new TextGeometry('Y', textOptions), textMaterial);
        yLabel.position.set(0, 5.5, 0);

        const zLabel = new THREE.Mesh(new TextGeometry('Z', textOptions), textMaterial);
        zLabel.position.set(0, 0, 5.5);

        scene.add(xLabel);
        scene.add(yLabel);
        scene.add(zLabel);
    });
}

function updateChildPositions() {
    const distance = 3;
    const halfAngle = angleBetweenChildren / 2;

    childSphere1.position.set(Math.sin(halfAngle) * distance, -distance, -Math.cos(halfAngle) * distance);
    childSphere2.position.set(-Math.sin(halfAngle) * distance, -distance, -Math.cos(halfAngle) * distance);

    // Remove old edges
    scene.remove(edge1);
    scene.remove(edge2);

    // Create new edges
    edge1 = createEdge(mainSphere.position, childSphere1.position);
    edge2 = createEdge(mainSphere.position, childSphere2.position);

    scene.add(edge1);
    scene.add(edge2);
}

function main() {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 10;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333); // Lighter background

    // Create spheres
    mainSphere = createSphere(mainSphereColor);
    childSphere1 = createSphere(childSphereColor);
    childSphere2 = createSphere(childSphereColor);

    scene.add(mainSphere);
    scene.add(childSphere1);
    scene.add(childSphere2);

    updateChildPositions();

    // Add a grid for reference
    const gridHelper = new THREE.GridHelper(20, 20, 0xffffff, 0xffffff);
    scene.add(gridHelper);

    // Add colored axes
    const axisHelper = createAxisHelper();
    scene.add(axisHelper);

    // Add axis labels
    createAxisLabels();

    // Add camera helper
    cameraHelper = new THREE.CameraHelper(camera);
    scene.add(cameraHelper);

    // Add OrbitControls
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Add key listeners to adjust angle and camera settings
    window.addEventListener('keydown', onKeyDown, false);

    requestAnimationFrame(render);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cameraHelper.update();
}

function onKeyDown(event) {
    const step = Math.PI / 36; // 5 degrees
    switch(event.key) {
        case 'ArrowLeft':
            angleBetweenChildren = Math.max(0, angleBetweenChildren - step);
            updateChildPositions();
            break;
        case 'ArrowRight':
            angleBetweenChildren = Math.min(Math.PI, angleBetweenChildren + step);
            updateChildPositions();
            break;
        case 'f':
            fov = Math.max(10, fov - 5);
            updateCamera();
            break;
        case 'F':
            fov = Math.min(120, fov + 5);
            updateCamera();
            break;
        case 'n':
            near = Math.max(0.1, near - 0.1);
            updateCamera();
            break;
        case 'N':
            near = Math.min(10, near + 0.1);
            updateCamera();
            break;
        case 'r':
            far = Math.max(10, far - 5);
            updateCamera();
            break;
        case 'R':
            far = Math.min(100, far + 5);
            updateCamera();
            break;
    }
}

function updateCamera() {
    camera.fov = fov;
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
    cameraHelper.update();
    console.log(`FOV: ${fov}, Near: ${near}, Far: ${far}`);
}

function render() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

// Ensure the DOM is fully loaded before running main
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}