// Common Header JavaScript
let currentLanguage = 'en';

// Toggle language dropdown
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('languageDropdown');
    const languageBtn = document.querySelector('.language-btn');
    
    if (!languageBtn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Change language function
function changeLanguage(lang) {
    currentLanguage = lang;
    
    // Update language button
    const currentLangSpan = document.querySelector('.current-lang');
    currentLangSpan.textContent = lang.toUpperCase();
    
    // Update dropdown active state
    document.querySelectorAll('.language-option').forEach(option => {
        option.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update all translatable elements
    updatePageLanguage();
    
    // Close dropdown
    document.getElementById('languageDropdown').classList.remove('show');
}

// Update page language
function updatePageLanguage() {
    const elements = document.querySelectorAll('[data-en][data-ja]');
    
    elements.forEach(element => {
        if (currentLanguage === 'ja') {
            element.textContent = element.getAttribute('data-ja');
        } else {
            element.textContent = element.getAttribute('data-en');
        }
    });
}

// Add scroll effect to header
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Set logo link based on current page
function setLogoLink() {
    const logoLink = document.getElementById('logo-link');
    if (logoLink) {
        const currentPage = window.location.pathname;
        if (currentPage.includes('Kamifu-games.html')) {
            logoLink.href = 'KamiFu.html';
        } else {
            logoLink.href = 'KamiFu.html';
        }
    }
}

// Initialize header when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setLogoLink();
});
