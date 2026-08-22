/**
 * Renders the vehicle image gallery (slideshow + thumbnails).
 * @param {Array} photos - List of image URLs
 */
export function renderImageGallery(photos = []) {
    if (!photos || photos.length === 0) {
        photos = ['https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=800&q=80'];
    }
    
    const mainPhoto = photos[0];
    const thumbHtml = photos.map((url, index) => `
        <img src="${url}" alt="Miniatura ${index + 1}" class="thumbnail-img ${index === 0 ? 'active' : ''}" data-index="${index}">
    `).join('');

    return `
    <div class="gallery-container" id="gallery-component">
        <div class="main-image-wrapper">
            <img src="${mainPhoto}" id="gallery-main-viewport" alt="Foto do veículo" class="gallery-main-img">
            
            ${photos.length > 1 ? `
                <button class="gallery-nav-btn gallery-nav-prev" id="gallery-prev-btn" aria-label="Foto anterior">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button class="gallery-nav-btn gallery-nav-next" id="gallery-next-btn" aria-label="Próxima foto">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            ` : ''}
        </div>
        
        ${photos.length > 1 ? `
            <div class="thumbnails-wrapper" id="gallery-thumbnails">
                ${thumbHtml}
            </div>
        ` : ''}
    </div>
    `;
}

/**
 * Initializes slideshow triggers.
 * @param {Array} photos - List of image URLs
 */
export function initGalleryEvents(photos = []) {
    if (photos.length <= 1) return;

    let currentIndex = 0;
    const mainViewport = document.getElementById('gallery-main-viewport');
    const thumbnails = document.querySelectorAll('#gallery-thumbnails .thumbnail-img');
    const prevBtn = document.getElementById('gallery-prev-btn');
    const nextBtn = document.getElementById('gallery-next-btn');

    function updateGallery(index) {
        currentIndex = (index + photos.length) % photos.length;
        
        // Update main photo with fade out-in transition effect
        mainViewport.style.opacity = 0;
        setTimeout(() => {
            mainViewport.src = photos[currentIndex];
            mainViewport.style.opacity = 1;
        }, 150);

        // Update thumbnails active state
        thumbnails.forEach((thumb, idx) => {
            if (idx === currentIndex) {
                thumb.classList.add('active');
                thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => updateGallery(currentIndex - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => updateGallery(currentIndex + 1));
    }

    thumbnails.forEach((thumb) => {
        thumb.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            updateGallery(index);
        });
    });
}
