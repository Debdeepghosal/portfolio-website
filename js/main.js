// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar Background Change
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
        navbar.classList.remove('scroll-up');
        navbar.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
        navbar.classList.remove('scroll-down');
        navbar.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Form Submission
const contactForm = document.getElementById('contact-form');
const formMessage = document.querySelector('.form-message');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        const mailto = `mailto:ghosaldebdeep16@gmail.com?subject=Portfolio Contact from ${encodeURIComponent(name)}&body=Name: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0A%0A${encodeURIComponent(message)}`;
        // Create a hidden <a> and click it
        let mailLink = document.createElement('a');
        mailLink.href = mailto;
        mailLink.style.display = 'none';
        document.body.appendChild(mailLink);
        mailLink.click();
        document.body.removeChild(mailLink);
        // Show fallback message
        if (formMessage) {
            formMessage.textContent = 'If your email client did not open, please send your message to ghosaldebdeep16@gmail.com.';
            formMessage.style.display = 'block';
            formMessage.style.color = 'var(--primary-color)';
        }
    });
}

// Intersection Observer for Animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Observe timeline items
document.querySelectorAll('.timeline-item').forEach(item => {
    observer.observe(item);
});

// Observe skill cards
document.querySelectorAll('.skill-card').forEach(card => {
    observer.observe(card);
});

// Observe project cards
document.querySelectorAll('.project-card').forEach(card => {
    observer.observe(card);
});

// Typing Animation for Hero Section
const heroTitle = document.querySelector('.hero-content h1');
const heroSubtitle = document.querySelector('.subtitle');

if (heroTitle && heroSubtitle) {
    const titleText = heroTitle.textContent;
    const subtitleText = heroSubtitle.textContent;
    
    heroTitle.textContent = '';
    heroSubtitle.textContent = '';
    
    let titleIndex = 0;
    let subtitleIndex = 0;
    
    function typeTitle() {
        if (titleIndex < titleText.length) {
            heroTitle.textContent += titleText.charAt(titleIndex);
            titleIndex++;
            setTimeout(typeTitle, 100);
        } else {
            setTimeout(typeSubtitle, 500);
        }
    }
    
    function typeSubtitle() {
        if (subtitleIndex < subtitleText.length) {
            heroSubtitle.textContent += subtitleText.charAt(subtitleIndex);
            subtitleIndex++;
            setTimeout(typeSubtitle, 50);
        }
    }
    
    setTimeout(typeTitle, 1000);
}

// Add hover effect to skill cards
document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Add hover effect to project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Skills Slider with Drag Functionality
const skillsTrack = document.querySelector('.skills-track');
const skillCards = document.querySelectorAll('.skill-card');
let isDragging = false;
let startPos = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let animationID = 0;
let currentIndex = 0;
let velocity = 0;
let lastTime = 0;
let lastPos = 0;

// Touch events
skillsTrack.addEventListener('touchstart', touchStart, { passive: true });
skillsTrack.addEventListener('touchmove', touchMove, { passive: true });
skillsTrack.addEventListener('touchend', touchEnd);

// Mouse events
skillsTrack.addEventListener('mousedown', touchStart);
skillsTrack.addEventListener('mousemove', touchMove);
skillsTrack.addEventListener('mouseup', touchEnd);
skillsTrack.addEventListener('mouseleave', touchEnd);

// Prevent context menu
window.oncontextmenu = function(event) {
    if (event.target === skillsTrack) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
}

function touchStart(event) {
    isDragging = true;
    startPos = getPositionX(event);
    lastPos = startPos;
    lastTime = performance.now();
    velocity = 0;
    skillsTrack.style.cursor = 'grabbing';
    skillsTrack.style.transition = 'none';
}

function touchMove(event) {
    if (isDragging) {
        const currentPosition = getPositionX(event);
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        const deltaPos = currentPosition - lastPos;
        
        // Calculate velocity
        velocity = deltaPos / deltaTime;
        
        currentTranslate = prevTranslate + currentPosition - startPos;
        
        // Update last position and time
        lastPos = currentPosition;
        lastTime = currentTime;
        
        setSliderPosition();
    }
}

function touchEnd() {
    isDragging = false;
    skillsTrack.style.cursor = 'grab';
    skillsTrack.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Calculate momentum
    const momentum = velocity * 100;
    const movedBy = currentTranslate - prevTranslate;
    
    // Determine if we should snap to next/previous card
    if (Math.abs(movedBy) > 50 || Math.abs(momentum) > 0.5) {
        if (movedBy < 0 || momentum < 0) {
            currentIndex = Math.min(currentIndex + 1, skillCards.length - 1);
        } else {
            currentIndex = Math.max(currentIndex - 1, 0);
        }
    }
    
    setPositionByIndex();
}

function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function animation() {
    setSliderPosition();
    if (isDragging) requestAnimationFrame(animation);
}

function setSliderPosition() {
    skillsTrack.style.transform = `translateX(${currentTranslate}px)`;
}

function setPositionByIndex() {
    const cardWidth = skillCards[0].offsetWidth + 24; // 24px for gap
    currentTranslate = currentIndex * -cardWidth;
    prevTranslate = currentTranslate;
    setSliderPosition();
}

// Initialize slider
setPositionByIndex();

// Update slider on window resize
window.addEventListener('resize', setPositionByIndex);

// Initialize VanillaTilt for experience cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.timeline-item');
    cards.forEach(card => {
        VanillaTilt.init(card, {
            max: 15,
            speed: 400,
            glare: true,
            'max-glare': 0.3,
            scale: 1.05,
            gyroscope: true,
            gyroscopeMinAngleX: -15,
            gyroscopeMaxAngleX: 15,
            gyroscopeMinAngleY: -15,
            gyroscopeMaxAngleY: 15,
            gyroscopeSamples: 10
        });
    });
}); 