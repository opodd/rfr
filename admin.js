// Password Protection
const ADMIN_PASSWORD = 'Prem4422';

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already authenticated (stored in sessionStorage)
  const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
  
  if (isAuthenticated) {
    showAdminContent();
  } else {
    showLoginForm();
  }
});

function showLoginForm() {
  const loginOverlay = document.getElementById('loginOverlay');
  const adminContent = document.getElementById('adminContent');
  
  if (loginOverlay) loginOverlay.style.display = 'flex';
  if (adminContent) adminContent.style.display = 'none';
  
  // Handle login form submission
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('passwordInput');
  const errorMessage = document.getElementById('errorMessage');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const enteredPassword = passwordInput.value;
      
      if (enteredPassword === ADMIN_PASSWORD) {
        // Store authentication in session storage
        sessionStorage.setItem('adminAuthenticated', 'true');
        showAdminContent();
      } else {
        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        
        // Hide error message after 3 seconds
        setTimeout(() => {
          errorMessage.style.display = 'none';
        }, 3000);
      }
    });
  }
}

function showAdminContent() {
  const loginOverlay = document.getElementById('loginOverlay');
  const adminContent = document.getElementById('adminContent');
  
  if (loginOverlay) loginOverlay.style.display = 'none';
  if (adminContent) adminContent.style.display = 'block';
  
  // Initialize admin functionality
  initializeAdmin();
}

function initializeAdmin() {
  // Original admin initialization code goes here
  renderProducts();
  initializeEventListeners();
}

// Use relative API base URL to work with both local and deployed environments
const API_BASE = '/api'

// Global state
let allProducts = []
let currentView = 'grid-2x2'
let searchQuery = ''

// API helpers
async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`)
    if (!response.ok) throw new Error('Failed to fetch products')
    return await response.json()
  } catch (error) {
    console.error('Fetch products error:', error)
    showToast('Failed to load products', 'error')
    return []
  }
}

async function addProduct(formData) {
  try {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      body: formData
    })
    if (!response.ok) throw new Error('Failed to add product')
    return await response.json()
  } catch (error) {
    console.error('Add product error:', error)
    showToast('Failed to add product', 'error')
    return null
  }
}

async function updateProduct(id, data) {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update product')
    return await response.json()
  } catch (error) {
    console.error('Update product error:', error)
    showToast('Failed to update product', 'error')
    return null
  }
}

async function deleteProduct(id) {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete product')
    return true
  } catch (error) {
    console.error('Delete product error:', error)
    showToast('Failed to delete product', 'error')
    return false
  }
}

// UI helpers
function showToast(message, type = 'info') {
  // Simple toast notification
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 1000;
    padding: 12px 16px; border-radius: 8px; color: white;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Render products grid
async function renderProducts() {
  const grid = document.getElementById('products-grid')
  const products = await fetchProducts()
  
  // Store all products globally for filtering
  allProducts = products
  
  // Filter products based on search query
  const filteredProducts = filterProducts(products, searchQuery)
  
  // Update product count
  updateProductCount(filteredProducts.length, products.length)
  
  grid.innerHTML = ''
  
  if (!filteredProducts.length) {
    if (searchQuery) {
      grid.innerHTML = '<div class="small">🔍 No products found matching "' + escapeHtml(searchQuery) + '"</div>'
    } else {
      grid.innerHTML = '<div class="small">🛍️ No products yet. Add your first product to get started!</div>'
    }
    return
  }

  filteredProducts.forEach(product => {
    const card = document.createElement('div')
    card.className = 'product-card' + (product.sold_out ? ' sold' : '')
    
    const imageUrl = product.image_url || 'https://via.placeholder.com/280x200/2d3748/94a3b8?text=No+Image'
    
    card.innerHTML = `
      <img src="${imageUrl}" alt="${escapeHtml(product.title)}" onerror="this.src='https://via.placeholder.com/280x200/2d3748/94a3b8?text=No+Image'" />
      <div class="product-meta">
        <h4>${escapeHtml(product.title)}</h4>
        ${product.description ? `<div class="product-description">${escapeHtml(product.description)}</div>` : ''}
        ${product.price ? `<div class="product-price">${escapeHtml(product.price)}</div>` : ''}
        <div class="product-actions">
          <button class="pill sold-toggle" data-id="${product.id}">
            ${product.sold_out ? '✅ Mark Available' : '🔴 Mark Sold Out'}
          </button>
          <button class="trash" data-id="${product.id}">🗑️ Delete</button>
        </div>
      </div>
    `
    
    grid.appendChild(card)
  })

  // Add event listeners for all action buttons
  grid.querySelectorAll('.sold-toggle').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id
      const product = allProducts.find(p => p.id == id)
      if (product) {
        e.target.classList.add('loading')
        await updateProduct(id, { sold_out: !product.sold_out })
        showToast(product.sold_out ? 'Product marked as available' : 'Product marked as sold out', 'success')
        renderProducts()
      }
    })
  })

  grid.querySelectorAll('.trash').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id
      const product = allProducts.find(p => p.id == id)
      if (!confirm(`Are you sure you want to delete "${product?.title}"? This cannot be undone.`)) return
      
      e.target.classList.add('loading')
      const success = await deleteProduct(id)
      if (success) {
        showToast('Product deleted successfully', 'success')
        renderProducts()
      }
    })
  })
}

// Filter products based on search query
function filterProducts(products, query) {
  if (!query.trim()) return products
  
  const lowercaseQuery = query.toLowerCase()
  return products.filter(product => 
    product.title.toLowerCase().includes(lowercaseQuery) ||
    (product.description && product.description.toLowerCase().includes(lowercaseQuery)) ||
    (product.price && product.price.toLowerCase().includes(lowercaseQuery))
  )
}

// Update product count display
function updateProductCount(filtered, total) {
  const countElement = document.getElementById('product-count')
  if (countElement) {
    if (filtered === total) {
      countElement.textContent = `${total} item${total !== 1 ? 's' : ''}`
    } else {
      countElement.textContent = `${filtered} of ${total} item${total !== 1 ? 's' : ''}`
    }
  }
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById('search-input')
  if (searchInput) {
    // Debounce search input
    let searchTimeout
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value
        renderProducts()
      }, 300)
    })
  }
}

// Setup grid toggle functionality
function setupGridToggle() {
  const grid1x1Btn = document.getElementById('grid-1x1')
  const grid2x2Btn = document.getElementById('grid-2x2')
  const productsGrid = document.getElementById('products-grid')
  
  if (grid1x1Btn && grid2x2Btn && productsGrid) {
    grid1x1Btn.addEventListener('click', () => {
      currentView = 'grid-1x1'
      productsGrid.className = 'products-grid grid-1x1'
      grid1x1Btn.classList.add('active')
      grid2x2Btn.classList.remove('active')
    })
    
    grid2x2Btn.addEventListener('click', () => {
      currentView = 'grid-2x2'
      productsGrid.className = 'products-grid grid-2x2'
      grid2x2Btn.classList.add('active')
      grid1x1Btn.classList.remove('active')
    })
  }
}

// Initialize event listeners and admin functionality
function initializeEventListeners() {
  renderProducts()
  setupSearch()
  setupGridToggle()

  // Handle desktop product form submission
  const form = document.getElementById('product-form')
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await handleFormSubmission(form)
    })
  }

  // Handle mobile product form submission
  const mobileForm = document.getElementById('mobile-product-form')
  if (mobileForm) {
    mobileForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      await handleFormSubmission(mobileForm)
      closeModal()
    })
  }

  // Mobile modal functionality
  const fab = document.getElementById('mobile-add-btn')
  const modal = document.getElementById('mobile-modal')
  const closeBtn = document.getElementById('modal-close')
  const cancelBtn = document.getElementById('mobile-cancel')

  if (fab && modal) {
    fab.addEventListener('click', function(e) {
      e.preventDefault()
      openModal()
    })
    closeBtn?.addEventListener('click', closeModal)
    cancelBtn?.addEventListener('click', closeModal)
    
    // Close modal when clicking overlay
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal()
    })
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal()
      }
    })
  }

  // Handle image preview for both forms
  setupImagePreviews()

  // Other button handlers
  setupButtonHandlers()
}

// Form submission handler (works for both desktop and mobile)
async function handleFormSubmission(form) {
  const formData = new FormData(form)
  const title = formData.get('title')
  
  if (!title.trim()) {
    showToast('Product title is required', 'error')
    return
  }

  const submitBtn = form.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent
  submitBtn.textContent = 'Adding...'
  submitBtn.disabled = true

  try {
    const result = await addProduct(formData)
    if (result) {
      showToast('Product added successfully!', 'success')
      form.reset()
      
      // Reset image previews
      const preview = form.querySelector('.image-preview')
      if (preview) preview.classList.add('hidden')
      
      renderProducts()
    }
  } finally {
    submitBtn.textContent = originalText
    submitBtn.disabled = false
  }
}

// Modal functions
function openModal() {
  const modal = document.getElementById('mobile-modal')
  if (modal) {
    modal.classList.add('active')
    document.body.style.overflow = 'hidden'
    
    // Focus first input
    const firstInput = modal.querySelector('input')
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 300)
    }
  }
}

function closeModal() {
  const modal = document.getElementById('mobile-modal')
  const form = document.getElementById('mobile-product-form')
  
  if (modal) {
    modal.classList.remove('active')
    document.body.style.overflow = ''
    
    // Reset form
    if (form) {
      form.reset()
      const preview = form.querySelector('.image-preview')
      if (preview) preview.classList.add('hidden')
    }
  }
}

// Setup image previews for both desktop and mobile forms
function setupImagePreviews() {
  // Desktop image preview
  const imageInput = document.getElementById('product-image')
  const uploadArea = document.getElementById('upload-area')
  const preview = document.getElementById('image-preview')
  const previewImg = document.getElementById('preview-img')
  const removeBtn = document.getElementById('remove-image')

  if (imageInput && uploadArea && preview && previewImg) {
    setupImageUpload(imageInput, uploadArea, preview, previewImg, removeBtn)
  }

  // Mobile image preview
  const mobileImageInput = document.getElementById('mobile-product-image')
  const mobileUploadArea = document.getElementById('mobile-upload-area')
  const mobilePreview = document.getElementById('mobile-image-preview')
  const mobilePreviewImg = document.getElementById('mobile-preview-img')
  const mobileRemoveBtn = document.getElementById('mobile-remove-image')

  if (mobileImageInput && mobileUploadArea && mobilePreview && mobilePreviewImg) {
    setupImageUpload(mobileImageInput, mobileUploadArea, mobilePreview, mobilePreviewImg, mobileRemoveBtn)
  }
}

// Setup image upload with drag & drop for a specific form
function setupImageUpload(input, uploadArea, preview, previewImg, removeBtn) {
  let clickTimeout = null
  
  // File input change handler
  input.addEventListener('change', (e) => {
    // Clear any pending click timeout since we got a file
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      clickTimeout = null
    }
    
    handleFileSelect(e.target.files[0], preview, previewImg, uploadArea)
  })

  // Drag and drop handlers
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
    uploadArea.classList.add('dragover')
  })

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!uploadArea.contains(e.relatedTarget)) {
      uploadArea.classList.remove('dragover')
    }
  })

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    uploadArea.classList.remove('dragover')
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (validateImageFile(file)) {
        // Update the file input
        const dt = new DataTransfer()
        dt.items.add(file)
        input.files = dt.files
        
        handleFileSelect(file, preview, previewImg, uploadArea)
      }
    }
  })

  // Remove image handler
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      input.value = ''
      preview.classList.add('hidden')
      uploadArea.style.display = 'block'
    })
  }

  // Click handler for upload area
  uploadArea.addEventListener('click', (e) => {
    // Prevent multiple rapid clicks
    if (clickTimeout) return
    
    clickTimeout = setTimeout(() => {
      clickTimeout = null
    }, 1000) // 1 second debounce
    
    input.click()
  })
}

// Handle file selection (both drag & drop and file input)
function handleFileSelect(file, preview, previewImg, uploadArea) {
  if (!file) {
    preview.classList.add('hidden')
    uploadArea.style.display = 'block'
    return
  }

  if (!validateImageFile(file)) {
    showToast('Please select a valid image file (PNG, JPG, GIF) under 5MB', 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    previewImg.src = e.target.result
    preview.classList.remove('hidden')
    uploadArea.style.display = 'none'
  }
  reader.readAsDataURL(file)
}

// Validate image file
function validateImageFile(file) {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return false
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    showToast('File size must be less than 5MB', 'error')
    return false
  }

  return true
}

// Setup other button handlers
function setupButtonHandlers() {
  // Refresh button
  const refreshBtn = document.getElementById('refresh-btn')
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderProducts()
      showToast('Products refreshed', 'info')
    })
  }

  // Clear all button
  const clearBtn = document.getElementById('clear-btn')
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete ALL products? This cannot be undone.')) return
      
      const products = await fetchProducts()
      let deletedCount = 0
      
      for (const product of products) {
        const success = await deleteProduct(product.id)
        if (success) deletedCount++
      }
      
      showToast(`Deleted ${deletedCount} products`, 'success')
      renderProducts()
    })
  }
}
