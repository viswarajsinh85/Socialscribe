// Self-contained JavaScript for the application logic and Three.js scene.

// --- DOM Elements ---
const topicInput = document.getElementById('post-topic');
const templateButtons = document.querySelectorAll('.template-btn');
const platformButtons = document.querySelectorAll('.platform-btn');
const toneButtons = document.querySelectorAll('.tone-btn');
const wordCountSlider = document.getElementById('word-count');
const wordCountValueSpan = document.getElementById('word-count-value');
const hashtagsToggle = document.getElementById('toggle-hashtags');
const emojiToggle = document.getElementById('toggle-emoji');
const postsToGenerateInput = document.getElementById('posts-to-generate');
const generateBtn = document.getElementById('generate-btn');
const loader = document.getElementById('loader');
const btnText = document.getElementById('btn-text');
const outputContainer = document.getElementById('output-container');
const postsContainer = document.getElementById('posts-container');
const copyBtn = document.getElementById('copy-btn');
const customAlert = document.getElementById('custom-alert');

// --- Three.js Variables ---
const canvas = document.getElementById('three-canvas');
let scene, camera, renderer, particles, particleSystem, particleLight;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// --- State Management ---
let selectedTemplate = null;
let selectedPlatform = null;
let selectedTone = null;

// --- Initialization ---
window.onload = function() {
    initThreeJs();
    animate();
    document.addEventListener('mousemove', onDocumentMouseMove, false);
};

// --- Three.js Functions ---
function initThreeJs() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create a particle system
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const color = new THREE.Color();
    const colorsList = [0x14b8a6, 0xfacc15, 0x1d4ed8, 0x06b6d4, 0xffffff]; // Teal, Amber, Blue, Cyan, White

    for (let i = 0; i < particleCount; i++) {
        // Positions
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 50;
        positions.push(x, y, z);

        // Colors
        color.set(colorsList[Math.floor(Math.random() * colorsList.length)]);
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Create a subtle, glowing particle light
    const sphere = new THREE.SphereGeometry(0.1, 16, 8);
    particleLight = new THREE.PointLight(0xffffff, 1, 100);
    particleLight.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xffffff })));
    scene.add(particleLight);

    camera.position.z = 10;
    
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
}

function animate() {
    requestAnimationFrame(animate);

    // Animate particles
    const time = Date.now() * 0.0001;
    particleSystem.rotation.y = time;
    particleSystem.rotation.x = time * 0.5;

    // Animate the light to create a dynamic glowing effect
    particleLight.position.x = Math.sin(time * 7) * 5;
    particleLight.position.y = Math.cos(time * 5) * 5;
    particleLight.position.z = Math.cos(time * 3) * 5;

    // Add subtle camera movement based on mouse position
    camera.position.x += (mouseX * 0.0005 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.0005 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// --- Event Listeners ---
templateButtons.forEach(button => {
    button.addEventListener('click', () => {
        templateButtons.forEach(btn => btn.classList.remove('active', 'bg-teal-600'));
        button.classList.add('active', 'bg-teal-600');
        selectedTemplate = button.dataset.template;
    });
});

platformButtons.forEach(button => {
    button.addEventListener('click', () => {
        platformButtons.forEach(btn => {
            btn.classList.remove('active', 'bg-pink-600', 'bg-sky-500', 'bg-blue-600', 'bg-blue-700', 'bg-red-600', 'bg-red-700', 'bg-blue-500', 'bg-orange-500');
            btn.classList.add('bg-gray-800', 'text-gray-300', 'border-gray-700');

            // Remove invert class from all images
            const img = btn.querySelector('img');
            if (img) {
                img.classList.remove('invert');
            }
        });
        
        const platformColor = getPlatformColor(button.dataset.platform);
        button.classList.remove('bg-gray-800', 'text-gray-300', 'border-gray-700');
        button.classList.add('active', platformColor, 'text-white', 'border-transparent');
        selectedPlatform = button.dataset.platform;

        // Add invert class to the X icon for better visibility on dark backgrounds
        const img = button.querySelector('img');
        if (img && button.dataset.platform === 'twitter') {
            img.classList.add('invert');
        }
    });
});

toneButtons.forEach(button => {
    button.addEventListener('click', () => {
        toneButtons.forEach(btn => btn.classList.remove('bg-teal-600', 'text-white'));
        button.classList.add('bg-teal-600', 'text-white');
        selectedTone = button.dataset.tone;
    });
});

wordCountSlider.addEventListener('input', () => {
    wordCountValueSpan.textContent = wordCountSlider.value;
});

generateBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    const wordCount = wordCountSlider.value;
    const includeHashtags = hashtagsToggle.checked;
    const includeEmojis = emojiToggle.checked;
    const numPosts = postsToGenerateInput.value;

    if (!topic || !selectedPlatform) {
        showCustomAlert('Please enter a topic and select a social media platform.');
        return;
    }
    
    // Show loading state
    generateBtn.disabled = true;
    btnText.textContent = 'Generating...';
    loader.classList.remove('hidden');
    outputContainer.classList.add('hidden');
    postsContainer.innerHTML = ''; // Clear previous posts

    try {
        const posts = [];
        for (let i = 0; i < numPosts; i++) {
            const generatedText = await generatePostWithAI({
                topic,
                platform: selectedPlatform,
                template: selectedTemplate,
                tone: selectedTone,
                wordCount,
                includeHashtags,
                includeEmojis
            });
            posts.push(generatedText);
        }

        posts.forEach(postText => {
            const postDiv = document.createElement('div');
            postDiv.className = 'bg-gray-700 p-4 rounded-xl shadow-inner text-gray-200 whitespace-pre-wrap leading-relaxed';
            postDiv.textContent = postText;
            postsContainer.appendChild(postDiv);
        });
        
        outputContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Failed to generate post:', error);
        postsContainer.innerHTML = '<div class="text-red-400">Error: Failed to generate post. Please try again.</div>';
        outputContainer.classList.remove('hidden');
    } finally {
        generateBtn.disabled = false;
        btnText.textContent = 'Generate Post';
        loader.classList.add('hidden');
    }
});


copyBtn.addEventListener('click', () => {
    // Collect all posts into a single string
    let allPosts = '';
    document.querySelectorAll('#posts-container > div').forEach(postDiv => {
        allPosts += postDiv.textContent + '\n\n---\n\n';
    });
    
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = allPosts.trim(); // Trim extra newlines
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);
    
    showCustomAlert('All posts copied to clipboard!');
});


// --- API Call to Backend ---
async function generatePostWithAI(options) {
    const apiUrl = 'http://127.0.0.1:5000/generate';
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options)
        });
        
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        
        const result = await response.json();
        const text = result.text;
        
        if (!text) {
            throw new Error('API response did not contain expected text.');
        }
        
        return text;
        
    } catch (error) {
        console.error("Error calling backend:", error);
        throw error;
    }
}

// --- Utility Functions ---
function getPlatformColor(platform) {
    switch (platform) {
        case 'instagram': return 'bg-pink-600';
        case 'twitter': return 'bg-sky-500';
        case 'linkedin': return 'bg-blue-600';
        case 'facebook': return 'bg-blue-700';
        case 'pinterest': return 'bg-red-600';
        case 'youtube': return 'bg-red-700';
        case 'google-business': return 'bg-blue-500';
        case 'ad': return 'bg-orange-500';
        default: return 'bg-gray-800';
    }
}

function showCustomAlert(message) {
    customAlert.textContent = message;
    customAlert.classList.remove('opacity-0');
    customAlert.classList.add('opacity-100');
    setTimeout(() => {
        customAlert.classList.remove('opacity-100');
        customAlert.classList.add('opacity-0');
    }, 2000);
}
