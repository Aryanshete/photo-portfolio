document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS animations with custom settings
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 50
    });

    // DOM Elements
    const photoGrid = document.getElementById('photo-grid');
    const loadingSpinner = document.getElementById('loading-spinner');
    const modal = document.getElementById('photo-modal');
    const shareModal = document.getElementById('share-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalCategory = document.getElementById('modal-category');
    const modalDate = document.getElementById('modal-date');
    const likeButton = document.getElementById('like-button');
    const addCollectionButton = document.getElementById('add-collection-button');
    const shareButton = document.getElementById('share-button');
    const prevButton = document.getElementById('prev-photo');
    const nextButton = document.getElementById('next-photo');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    const themeToggle = document.getElementById('theme-toggle');
    const categoryFilters = document.querySelectorAll('.category-tag');

    let currentCategory = 'all';
    let currentPhoto = null;
    let allPhotos = [];
    let filteredPhotos = [];
    let masonryInstance = null;

    // Theme handling
    const theme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-mode', theme === 'dark');
    updateThemeIcon();

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon();
    });

    function updateThemeIcon() {
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}"></i>`;
    }

    // Smooth scrolling for navigation
    window.scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        section.scrollIntoView({ behavior: 'smooth' });
    };

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase();
            filterPhotos(query);
        }, 300);
    });

    function filterPhotos(query) {
        if (!query) {
            filteredPhotos = [...allPhotos];
        } else {
            filteredPhotos = allPhotos.filter(photo => 
                photo.title.toLowerCase().includes(query) ||
                photo.description.toLowerCase().includes(query) ||
                photo.category.toLowerCase().includes(query)
            );
        }

        displayPhotos(filteredPhotos);
        noResults.style.display = filteredPhotos.length === 0 ? 'flex' : 'none';
    }

    // Load photos from server with better error handling and loading states
    async function loadPhotos(category = 'all') {
        try {
            loadingSpinner.style.display = 'flex';
            photoGrid.style.opacity = '0.5';

            const response = await fetch(`/api/photos${category !== 'all' ? `?category=${category}` : ''}`);
            if (!response.ok) {
                throw new Error('Failed to fetch photos');
            }

            allPhotos = await response.json();
            filteredPhotos = [...allPhotos];

            // Pre-load images before displaying them
            await preloadImages(filteredPhotos);
            displayPhotos(filteredPhotos);
        } catch (error) {
            showToast('Failed to load photos: ' + error.message, 'error');
            noResults.style.display = 'flex';
        } finally {
            loadingSpinner.style.display = 'none';
            photoGrid.style.opacity = '1';
        }
    }

    // Preload images to prevent layout shifts
    async function preloadImages(photos) {
        const imagePromises = photos.map(photo => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = photo.url;
            });
        });

        try {
            await Promise.all(imagePromises);
        } catch (error) {
            console.error('Some images failed to load:', error);
        }
    }

    // Display photos with improved layout handling
    function displayPhotos(photos) {
        // Clear existing content
        photoGrid.innerHTML = '';
        
        // Create and append photo cards with fade-in animation
        photos.forEach((photo, index) => {
            const card = document.createElement('div');
            card.className = 'photo-card fade-in';
            card.dataset.id = photo.id;
            card.dataset.aos = 'fade-up';
            card.dataset.aosDelay = (index * 100).toString();
            
            card.innerHTML = `
                <div class="photo-card-inner">
                    <img src="${photo.url}" 
                         alt="${photo.title}"
                         loading="lazy"
                         onerror="this.src='/images/placeholder.jpg'">
                    <div class="photo-info">
                        <h3>${photo.title}</h3>
                        <span class="category-tag">${photo.category}</span>
                        <div class="photo-overlay">
                            <button class="view-btn">View Details</button>
                        </div>
                    </div>
                </div>
            `;
            
            photoGrid.appendChild(card);
        });

        // Initialize or reinitialize masonry with improved layout handling
        if (masonryInstance) {
            masonryInstance.destroy();
        }

        // Initialize masonry after images are loaded
        imagesLoaded(photoGrid, () => {
            masonryInstance = new Masonry(photoGrid, {
                itemSelector: '.photo-card',
                columnWidth: '.photo-card',
                percentPosition: true,
                transitionDuration: '0.3s',
                initLayout: true,
                stagger: 30
            });

            // Refresh layout after a short delay to ensure proper positioning
            setTimeout(() => {
                masonryInstance.layout();
            }, 100);
        });

        // Add click listeners to photos
        document.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', () => openPhotoModal(card.dataset.id));
        });

        // Show no results message if needed
        noResults.style.display = photos.length === 0 ? 'flex' : 'none';
    }

    // Modal navigation
    function updateModalNavigation() {
        const currentIndex = filteredPhotos.findIndex(p => p.id === currentPhoto.id);
        prevButton.style.display = currentIndex > 0 ? 'block' : 'none';
        nextButton.style.display = currentIndex < filteredPhotos.length - 1 ? 'block' : 'none';
    }

    prevButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentIndex = filteredPhotos.findIndex(p => p.id === currentPhoto.id);
        if (currentIndex > 0) {
            openPhotoModal(filteredPhotos[currentIndex - 1].id);
        }
    });

    nextButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentIndex = filteredPhotos.findIndex(p => p.id === currentPhoto.id);
        if (currentIndex < filteredPhotos.length - 1) {
            openPhotoModal(filteredPhotos[currentIndex + 1].id);
        }
    });

    // Modal functions with improved transitions
    async function openPhotoModal(photoId) {
        try {
            modal.classList.add('loading');
            modal.style.display = 'flex';
            
            const response = await fetch(`/api/photos/${photoId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch photo details');
            }
            
            const photo = await response.json();
            currentPhoto = photo;

            // Preload the image before showing it
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = photo.url;
            });

            modalImg.src = photo.url;
            modalTitle.textContent = photo.title;
            modalDescription.textContent = photo.description;
            modalCategory.textContent = photo.category;
            modalDate.textContent = new Date(photo.dateCreated).toLocaleDateString();
            
            updateLikeButton();
            updateModalNavigation();
            
            modal.classList.remove('loading');
            document.body.style.overflow = 'hidden';
            
            // Trigger fade-in animation
            modalImg.classList.add('fade-in');
            setTimeout(() => modalImg.classList.remove('fade-in'), 300);
        } catch (error) {
            showToast('Failed to load photo details: ' + error.message, 'error');
            closePhotoModal();
        }
    }

    function closePhotoModal() {
        modal.classList.add('fade-out');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('fade-out');
            document.body.style.overflow = 'auto';
            currentPhoto = null;
            modalImg.src = '';
        }, 300);
    }

    // Share functionality
    shareButton.addEventListener('click', () => {
        shareModal.style.display = 'flex';
    });

    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.dataset.platform;
            const url = encodeURIComponent(window.location.origin + '/photo/' + currentPhoto.id);
            const title = encodeURIComponent(currentPhoto.title);

            let shareUrl;
            switch (platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                    break;
                case 'pinterest':
                    shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${encodeURIComponent(currentPhoto.url)}&description=${title}`;
                    break;
                case 'copy':
                    navigator.clipboard.writeText(window.location.origin + '/photo/' + currentPhoto.id);
                    showToast('Link copied to clipboard!');
                    shareModal.style.display = 'none';
                    return;
            }

            window.open(shareUrl, '_blank', 'width=600,height=400');
            shareModal.style.display = 'none';
        });
    });

    // Like functionality
    async function toggleLike() {
        if (!isLoggedIn()) {
            showToast('Please log in to like photos', 'error');
            return;
        }

        try {
            const response = await fetch('/api/user/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({ photoId: currentPhoto.id })
            });

            if (response.ok) {
                updateLikeButton(true);
                showToast('Photo added to favorites', 'success');
            }
        } catch (error) {
            showToast('Failed to like photo', 'error');
        }
    }

    function updateLikeButton(isLiked = false) {
        const icon = likeButton.querySelector('i');
        if (isLiked) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            likeButton.classList.add('liked');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            likeButton.classList.remove('liked');
        }
    }

    // Collection functionality
    async function showCollectionDialog() {
        if (!isLoggedIn()) {
            showToast('Please log in to add to collection', 'error');
            return;
        }

        try {
            const response = await fetch('/api/user/collections', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            });
            
            const collections = await response.json();
            
            // Create and show collection dialog
            const dialog = document.createElement('div');
            dialog.className = 'collection-dialog';
            dialog.innerHTML = `
                <h3>Add to Collection</h3>
                <div class="collections-list">
                    ${collections.map(collection => `
                        <div class="collection-item" data-id="${collection.id}">
                            <span>${collection.name}</span>
                            <button class="add-to-collection-btn">Add</button>
                        </div>
                    `).join('')}
                </div>
                <button class="create-collection-btn">Create New Collection</button>
            `;

            modal.appendChild(dialog);

            // Add event listeners for collection actions
            dialog.querySelectorAll('.add-to-collection-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const collectionId = e.target.closest('.collection-item').dataset.id;
                    addToCollection(collectionId);
                });
            });

            dialog.querySelector('.create-collection-btn').addEventListener('click', createNewCollection);
        } catch (error) {
            showToast('Failed to load collections', 'error');
        }
    }

    async function addToCollection(collectionId) {
        try {
            const response = await fetch(`/api/user/collections/${collectionId}/photos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({ photoId: currentPhoto.id })
            });

            if (response.ok) {
                showToast('Added to collection', 'success');
                closeCollectionDialog();
            }
        } catch (error) {
            showToast('Failed to add to collection', 'error');
        }
    }

    function closeCollectionDialog() {
        const dialog = document.querySelector('.collection-dialog');
        if (dialog) {
            dialog.remove();
        }
    }

    // Category filter functionality
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            const category = filter.dataset.category;
            if (category === currentCategory) return;

            // Update active state
            categoryFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            // Load new photos
            currentCategory = category;
            loadPhotos(category);
        });
    });

    // Improved toast notification system
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type} slide-in`;
        toast.textContent = message;
        
        const toastContainer = document.getElementById('toast-container');
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('slide-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Helper functions
    function isLoggedIn() {
        return !!localStorage.getItem('userToken');
    }

    // Event listeners
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            shareModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });

    [modal, shareModal].forEach(modalEl => {
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) {
                modalEl.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });

    likeButton.addEventListener('click', toggleLike);
    addCollectionButton.addEventListener('click', showCollectionDialog);

    // Initial load
    loadPhotos();
});
