// JS for timer (Flash Sale)
document.addEventListener('DOMContentLoaded', function () {
  const timer = document.querySelector('.flash-timer');
  if (timer) {
    // initial duration in seconds (2:59:23)
    let time = 2 * 3600 + 59 * 60 + 23;

    function format(t) {
      const h = Math.floor(t / 3600).toString().padStart(2, '0');
      const m = Math.floor((t % 3600) / 60).toString().padStart(2, '0');
      const s = (t % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    }

    function updateTimer() {
      timer.textContent = format(time);
      if (time <= 0) {
        clearInterval(interval);
        timer.textContent = '00:00:00';
        return;
      }
      time--;
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
  }

  // Load real products from API
  loadProducts();
  
  // Initialize search functionality
  initializeSearch();
});

// API helpers for frontend
const API_BASE = 'http://localhost:3000/api'

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`)
    if (!response.ok) throw new Error('Failed to fetch products')
    return await response.json()
  } catch (error) {
    console.error('Fetch products error:', error)
    return []
  }
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Load and render real products
async function loadProducts() {
  const productsGrid = document.querySelector('.products-grid')
  if (!productsGrid) return

  // HTML already has skeleton loader, so we just wait for API and replace it
  try {
    const products = await fetchProducts()
    
    // Minimum loading time to show skeleton (for better UX)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Store all products globally for search functionality
    allProducts = products;
    
    // Clear skeleton loader
    productsGrid.innerHTML = ''
    
    if (!products.length) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 2rem; color: #64748b;">
          <dotlottie-player 
            src="https://assets-v2.lottiefiles.com/a/2de40e6a-1165-11ee-a4c9-3b31eaa5cc5c/QGhkumedjW.lottie" 
            background="transparent" 
            speed="1" 
            style="width: 200px; height: 200px; margin: 0 auto 1rem auto;" 
            loop 
            autoplay>
          </dotlottie-player>
          <h3 style="color: #ef4444; font-size: 1.5rem; font-weight: 600; margin: 0 0 0.5rem 0;">Sold Out</h3>
          <p style="font-size: 1rem; margin: 0; opacity: 0.8;">All products are currently sold out</p>
          <p style="font-size: 0.875rem; margin-top: 1rem; opacity: 0.6;">Check back soon for new arrivals!</p>
        </div>
      `
      return
    }

    // Show products based on screen size
    const maxProducts = getMaxProductsForScreen();
    const displayProducts = products.slice(0, maxProducts);
    renderProducts(displayProducts);
    
  } catch (error) {
    console.error('Error loading products:', error)
    productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #ef4444;">
        <p>Failed to load products. Please try again later.</p>
      </div>
    `
  }
}

// Global variable to store all products for search functionality
let allProducts = [];

// Get maximum products to display based on screen size
function getMaxProductsForScreen() {
  if (window.innerWidth >= 1024) {
    return 8; // 4x2 grid on large screens
  } else if (window.innerWidth >= 768) {
    return 6; // 3x2 grid on medium screens
  } else {
    return 4; // 2x2 grid on mobile
  }
}

// Show skeleton loader while products are loading
function showSkeletonLoader() {
  const productsGrid = document.querySelector('.products-grid');
  if (!productsGrid) return;
  
  const maxProducts = getMaxProductsForScreen();
  let skeletonHTML = '';
  
  for (let i = 0; i < maxProducts; i++) {
    skeletonHTML += `
      <div class="skeleton-card">
        <div class="skeleton-loader skeleton-image"></div>
        <div class="skeleton-loader skeleton-text rating"></div>
        <div class="skeleton-loader skeleton-text title"></div>
        <div class="skeleton-loader skeleton-text price"></div>
      </div>
    `;
  }
  
  productsGrid.innerHTML = skeletonHTML;
}

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    filterProducts(searchTerm);
  });
}

// Filter and display products based on search term
function filterProducts(searchTerm) {
  const productsGrid = document.querySelector('.products-grid');
  if (!productsGrid || !allProducts.length) return;
  
  // If no search term, show all products (responsive amount)
  if (!searchTerm) {
    const maxProducts = getMaxProductsForScreen();
    renderProducts(allProducts.slice(0, maxProducts));
    return;
  }
  
  // Filter products by title and description
  const filteredProducts = allProducts.filter(product => {
    const title = (product.title || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    return title.includes(searchTerm) || description.includes(searchTerm);
  });
  
  // Show filtered results (responsive amount)
  const maxProducts = getMaxProductsForScreen();
  renderProducts(filteredProducts.slice(0, maxProducts));
}

// Render products to the grid
function renderProducts(products) {
  const productsGrid = document.querySelector('.products-grid');
  if (!productsGrid) return;
  
  // Clear existing content
  productsGrid.innerHTML = '';
  
  if (!products.length) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 2rem; color: #64748b;">
        <dotlottie-player 
          src="https://lottie.host/63ef97a4-7b00-4e1a-aae0-66cd49e0e14c/CR1czQWeVu.lottie" 
          background="transparent" 
          speed="1" 
          style="width: 150px; height: 150px; margin: 0 auto 1rem auto;" 
          loop 
          autoplay>
        </dotlottie-player>
        <h3 style="color: #f97316; font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem 0;">No Results Found</h3>
        <p style="font-size: 0.875rem; margin: 0; opacity: 0.8;">No products match your search</p>
        <p style="font-size: 0.75rem; margin-top: 1rem; opacity: 0.6;">Try different keywords or browse all products</p>
      </div>
    `;
    return;
  }
  
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card' + (product.sold_out ? ' sold-out' : '');
    
    const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop&auto=format';
    
    productCard.innerHTML = `
      <div class="product-fav">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="heart" class="lucide lucide-heart">
          <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path>
        </svg>
      </div>
      ${product.sold_out ? '<div class="product-badge sold-out">Sold Out</div>' : '<div class="product-badge">New</div>'}
      <div class="image-container">
        <div class="image-placeholder"></div>
        <img 
          data-src="${imageUrl}" 
          alt="${escapeHtml(product.title)}" 
          class="lazy-image" 
          style="opacity: 0; transition: opacity 0.3s ease;"
          onerror="this.src='https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop&auto=format'; this.style.opacity='1';" 
        />
      </div>
      <div class="product-info">
        <div class="product-rating">
          <div class="stars">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="star" class="lucide lucide-star star filled">
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
            </svg>
          </div>
          <span class="rating-text">4.8 (New)</span>
        </div>
        <div class="product-title">${escapeHtml(product.title)}</div>
        <div class="product-prices">
          <span class="price">${escapeHtml(product.price || '$0.00')}</span>
        </div>
      </div>
    `;
    
    productsGrid.appendChild(productCard);
  });

  // Initialize lazy loading for images
  initializeLazyLoading();

  // Re-initialize Lucide icons for new content
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Initialize lazy loading with intersection observer
function initializeLazyLoading() {
  const lazyImages = document.querySelectorAll('.lazy-image');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const placeholder = img.previousElementSibling;
          
          img.src = img.dataset.src;
          img.onload = () => {
            img.style.opacity = '1';
            if (placeholder) {
              placeholder.style.opacity = '0';
              setTimeout(() => placeholder.remove(), 300);
            }
          };
          
          img.classList.remove('lazy-image');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px' // Load images 50px before they come into view
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for browsers without intersection observer
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.style.opacity = '1';
      img.classList.remove('lazy-image');
    });
  }
}
