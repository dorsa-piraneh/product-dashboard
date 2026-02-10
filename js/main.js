/* ========================================================================================
                                     DOM ELEMENTS
======================================================================================== */
const productsList = document.querySelector('.products-list');
const pagination = document.querySelector('.pagination');
const searchInput = document.querySelector('.search-input');
const categoriesContainer = document.querySelector('.category-select');

const sidebarToggleBtn = document.querySelector('#sidebarToggleBtn');
const sidebar = document.querySelector('.sidebar');
const sidebarToggleIcon = document.querySelector('.sidebar-toggle-icon');

const toggleMenuBtn = document.querySelector('.toggle-menu-btn');

const toggleThemeBtn = document.querySelector('.toggle-theme-btn');
const themeIcon = document.querySelector('#themeIcon');

const addBtn = document.querySelector('#addBtn');

const deleteModalEl = document.querySelector('#deleteProductModal');
const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);

const productFormModalEl = document.querySelector('#productFormModal');
const productFormModal = bootstrap.Modal.getOrCreateInstance(productFormModalEl);

const productTitleInput = document.querySelector('#productTitle');

const productFormSubmitBtn = document.querySelector('#productFormSubmitBtn');
const confirmDeleteProductBtn = document.querySelector('#confirmDeleteProductBtn');

const productDetailsImage = document.querySelector('#productDetailsImage .carousel-inner');
const productDetailsInfo = document.querySelector('#productDetailsInfo ul');
const carouselPrevBtn = document.querySelector('.carousel-control-prev');
const carouselNextBtn = document.querySelector('.carousel-control-next');

// Enable Bootstrap Tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));

/* ========================================================================================
                                     INITIAL STATE
======================================================================================== */

let currentPage = 1;
let productsPerPage = 6;

let totalProducts = 0;
let category = 'all';
let userSearch = '';
let productIdToDelete = null;
let productIdToEdit = null;

let userToggledSidebar = false;

/* ========================================================================================
                                      FUNCTIONS
======================================================================================== */

const showLoading = () => {
  productsList.innerHTML = `<tr>
          <td colspan="6" class="text-center py-2">
            <div class="spinner-border loader">
              <span class="visually-hidden">Loading...</span>
            </div>
          </td>
          </tr>`;
};

const buildURL = () => {
  const skip = (currentPage - 1) * productsPerPage;

  if (userSearch && category !== 'all') {
    return `https://dummyjson.com/products/search?q=${userSearch}&limit=${productsPerPage}&skip=${skip}`;
  }
  if (category != 'all') {
    return `https://dummyjson.com/products/category/${category}?limit=${productsPerPage}&skip=${skip}`;
  }

  if (userSearch) {
    return `https://dummyjson.com/products/search?q=${userSearch}&limit=${productsPerPage}&skip=${skip}`;
  }
  return `https://dummyjson.com/products?limit=${productsPerPage}&skip=${skip}`;
};

const showSuccessAlert = (message) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    text: message,
    iconColor: 'transparent',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'my-toast',
    },
  });
};

const showErrorAlert = (message) => {
  Swal.fire({
    icon: 'error',
    text: message,
    showConfirmButton: true,
    confirmButtonText: 'OK',
    iconColor: '#d90429',
    customClass: {
      container: 'popup-container',
      popup: 'my-popup',
      icon: 'popup-icon',
      confirmButton: 'popup-confirm-button',
    },
  });
};

const fetchProducts = async () => {
  try {
    const response = await fetch(buildURL());

    if (!response.ok) return;

    const data = await response.json();
    totalProducts = data.total;
    return data.products;
  } catch (error) {
    console.error('[fetchProducts] Failed to fetch products list', error);
    showErrorAlert('Unable to load products. Please try again later.');
  }
};

const fetchCategories = async () => {
  try {
    const response = await fetch('https://dummyjson.com/products/category-list');

    if (!response.ok) return;

    const data = response.json();
    return data;
  } catch (error) {
    console.error('[fetchCategories] Failed to fetch categories', error);
    showErrorAlert('Unable to load categories. Please refresh the page.');
  }
};

const renderCategories = async () => {
  const categories = await fetchCategories();
  categories.forEach((category) => {
    categoriesContainer.insertAdjacentHTML('beforeend', `<option value="${category}">${category}</option>`);
  });
};

const renderProducts = (products) => {
  productsList.innerHTML = '';
  products.forEach((product) => {
    productsList.insertAdjacentHTML(
      'beforeend',
      `
         <tr class="product-row" data-id=${product.id}>
            <td class="product-info">
              <div class="info-wrapper d-flex justify-content-start align-items-center gap-2">
                <img src=${product.images[0]} class="product-img rounded-circle"/>
                <div class="text-start">
                  <p class="product-name">${product.title}</p>
                  <p class="product-stock">Stock : ${product.stock}</p>
                </div>
               </div>
            </td>
            <td class="product-category">${product.category}</td>
            <td class="product-price"><span class="currency-symbol">$</span>${product.price}</td>
            <td class="product-status">
              <span class="rounded-pill" data-status=${product.availabilityStatus} >${product.availabilityStatus}</span>
            </td>
            <td class="product-rating">${product.rating}</td>
            <td class="table-actions">
              <div class="actions-wrapper d-flex justify-content-center align-items-end gap-1" data-bs-toggle="modal" data-bs-target="#exampleModal">
               <button type="button" class="p-2 rounded-circle action-btn detail-btn" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip" data-bs-title="Product details">
                  <i class="fa-regular fa-circle-info action-icon" data-bs-toggle="modal" data-bs-target="#productDetailsModal"></i>
                </button>
                <button type="button" class="p-2 rounded-circle action-btn edit-btn" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip" data-bs-title="Edit product">
                  <i class="fa-regular fa-pen-to-square action-icon" data-bs-toggle="modal" data-bs-target="#productFormModal"></i>
                </button>
                <button type="button" class="p-2 rounded-circle action-btn delete-btn" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip" data-bs-title="Delete product">
                  <i class="fa-regular fa-trash-can action-icon" data-bs-toggle="modal" data-bs-target="#deleteProductModal"></i>
                </button>
              </div>
            </td>
          </tr>
      `,
    );
  });
};

const renderPagination = () => {
  const pageCount = Math.ceil(totalProducts / productsPerPage);
  pagination.innerHTML = '';

  let html = '';
  let visiblePages = window.innerWidth < 480 ? 1 : 2;
  const SAFE_PAGES_FROM_START = 2;

  // Previous button
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" onclick="goToPage(${currentPage - 1})">Prev</a>
          </li>`;

  // Page 1
  html += `<li class="page-item ${currentPage === 1 ? 'active' : ''}">
            <a class="page-link" onclick="goToPage(1)">1</a>
          </li>`;

  // ...

  if (currentPage > visiblePages + SAFE_PAGES_FROM_START) {
    html += ` <li class="page-item disabled">
                <a class="page-link">...</a>
              </li>
            `;
  }

  // Middle Pages
  const start = Math.max(SAFE_PAGES_FROM_START, currentPage - visiblePages);
  const end = Math.min(pageCount - 1, currentPage + visiblePages);

  for (let i = start; i <= end; i++) {
    html += ` <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" onclick="goToPage(${i})">${i}</a>
              </li>
            `;
  }

  // ...
  if (currentPage < pageCount - visiblePages - 1) {
    html += ` <li class="page-item disabled">
                 <a class="page-link">...</a>
              </li>
            `;
  }

  // Last page
  if (pageCount > 1) {
    html += `<li class="page-item ${currentPage === pageCount ? 'active' : ''}">
    <a class="page-link" onclick="goToPage(${pageCount})">${pageCount}</a>
    </li>`;
  }

  // Next button
  html += `<li class="page-item ${currentPage === pageCount ? 'disabled' : ''}">
            <a class="page-link" onclick="goToPage(${currentPage + 1})">Next</a>
          </li>`;

  pagination.insertAdjacentHTML('beforeend', html);
};

const init = async () => {
  showLoading();
  const products = await fetchProducts();
  renderProducts(products);
  initTooltips(); // Re-initialize Bootstrap tooltips for dynamically added elements
  renderPagination();
};

const initTooltips = () => {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));
};

const goToPage = (pageNumber) => {
  currentPage = pageNumber;
  init();
};

const editProduct = async () => {
  const productTitle = productTitleInput.value.trim();

  if (productTitle) {
    try {
      const response = await fetch(`https://dummyjson.com/products/${productIdToEdit}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: productTitle,
        }),
      });

      if (!response.ok) return;

      const data = await response.json();
      productFormModal.hide();
      showSuccessAlert('The product has been successfully updated.');
      init();
    } catch (error) {
      console.error('[editProduct] Failed to update product', error);
      showErrorAlert('Failed to update the product. Please try again.');
    }
  } else {
    showErrorAlert('Product name cannot be empty.');
  }
};

const addProduct = async () => {
  const productTitle = productTitleInput.value.trim();

  if (productTitle) {
    const newProduct = {
      title: productTitle,
    };

    try {
      const response = await fetch('https://dummyjson.com/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) return;

      const data = await response.json();

      productFormModal.hide();
      showSuccessAlert(`Product "${data.title}" has been added successfully.`);
      init();
    } catch (error) {
      console.error('[addProduct] Failed to add new product', error);
      showErrorAlert('Failed to add the product. Please try again.');
    }
  } else {
    showErrorAlert('Product name cannot be empty.');
  }
};

const deleteProduct = async () => {
  try {
    const response = await fetch(`https://dummyjson.com/products/${productIdToDelete}`, {
      method: 'DELETE',
    });

    if (!response.ok) return;

    const data = await response.json();

    if (data.isDeleted) {
      deleteModal.hide();
      showSuccessAlert('The product has been removed successfully.');
      init();
    }
  } catch (error) {
    console.error('[deleteProduct] Failed to delete product', error);
    showErrorAlert('Failed to delete the product. Please try again.');
  }
};

const showProductDetais = async (id) => {
  productDetailsImage.innerHTML = '';
  productDetailsInfo.innerHTML = '';
  try {
    const response = await fetch(`https://dummyjson.com/products/${id}`);
    if (!response.ok) return;
    const data = await response.json();

    // Add each product image to the carousel
    data.images.forEach((imgSrc, index) => {
      productDetailsImage.insertAdjacentHTML(
        'beforeend',
        ` <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="${imgSrc}" class="d-block mx-auto"/>
          </div>
        `,
      );
      });

    // Insert product details into the modal list
    productDetailsInfo.innerHTML = `
        <li class="list-group-item">
          <strong>Name : </strong>
          <span>${data.title}</span>
        </li>
        <li class="list-group-item">
          <strong>Brand : </strong>
          <span class="product-brand"> ${data.brand}</span>
        </li>
        <li class="list-group-item">
          <strong>Price : </strong>
          <span class="fw-bolder">$</span>${data.price}
        </li>
        <li class="list-group-item">
          <strong>Discount : </strong>
          <span class="fw-bolder">%</span>${data.discountPercentage}
        </li>
        <li class="list-group-item">
          <strong>Minimum Order : </strong>
          <span>${data.minimumOrderQuantity}</span>
        </li>
        <li class="list-group-item">
          <strong>Description : </strong>
          <span>${data.description}</span>
        </li>`;

    // Hide carousel navigation if there's only one image
    if (data.images.length <= 1) {
      carouselPrevBtn.classList.add('d-none');
      carouselNextBtn.classList.add('d-none');
    } else {
      carouselPrevBtn.classList.remove('d-none');
      carouselNextBtn.classList.remove('d-none');
    }
  } catch (error) {
    console.error('[showProductDetais] Failed to load product details', error);
    showErrorAlert('Unable to load product details. Please try again.');
  } finally {
    // hideLoadingInDetails()
  }
};

const handleResize = () => {
  if (window.innerWidth < 1200) {
    sidebar.classList.add('collapsed');
    sidebarToggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
    userToggledSidebar = false;
  } else {
    if (!userToggledSidebar) {
      sidebar.classList.remove('collapsed');
      sidebarToggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
    }
  }

  toggleMenuBtn.classList.toggle('d-none', window.innerWidth > 992);

  // Re-render pagination on resize
  renderPagination();
};

const changeTheme = (event) => {
  let themeName = '';

  if (event.target.classList.contains('fa-moon')) {
    themeName = 'dark';
    themeIcon.classList.replace('fa-moon', 'fa-sun-bright');
  } else {
    themeName = 'light';
    themeIcon.classList.replace('fa-sun-bright', 'fa-moon');
  }

  document.documentElement.dataset.theme = themeName;
  localStorage.setItem('theme', themeName);
};

/* ========================================================================================
                                      EVENT LISTENERS
======================================================================================== */

window.addEventListener('load', () => {
  init();
  renderCategories();
  handleResize();

  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.dataset.theme = savedTheme;
  themeIcon.classList = savedTheme == 'light' ? 'fa-regular fa-moon' : 'fa-regular fa-sun-bright';
});

let searchTimeout;
searchInput.addEventListener('input', (event) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    userSearch = event.target.value;
    currentPage = 1;
    init();
  }, 300);
});

categoriesContainer.addEventListener('change', (event) => {
  category = event.target.value;
  currentPage = 1;
  init();
});

productsList.addEventListener('click', (event) => {
  if (event.target.closest('.detail-btn')) {
    const productId = event.target.closest('.product-row').dataset.id;
    showProductDetais(productId);
  }

  // Edit Product
  if (event.target.closest('.edit-btn')) {
    document.querySelector('#productFormModalTitle').textContent = 'Edit Product';
    setTimeout(() => {
      productTitleInput.focus();
    }, 200);
    productIdToEdit = event.target.closest('.product-row').dataset.id;
    fetch(`https://dummyjson.com/products/${productIdToEdit}`)
      .then((response) => response.json())
      .then((data) => {
        productTitleInput.value = data.title;
      });
  }

  // Delete Product
  if (event.target.closest('.delete-btn')) {
    productIdToDelete = event.target.closest('.product-row').dataset.id;
  }
});

addBtn.addEventListener('click', () => {
  document.querySelector('#productFormModalTitle').textContent = 'Create Product';
  productTitleInput.value = '';
  setTimeout(() => {
    productTitleInput.focus();
  }, 200);
  productIdToEdit = null;
});

productFormSubmitBtn.addEventListener('click', () => {
  if (productIdToEdit) {
    editProduct();
  } else {
    addProduct();
  }
});

confirmDeleteProductBtn.addEventListener('click', deleteProduct);

sidebarToggleBtn.addEventListener('click', () => {
  userToggledSidebar = true;
  sidebar.classList.toggle('collapsed');
  if (sidebar.classList.contains('collapsed')) {
    sidebarToggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
  } else {
    sidebarToggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
  }
});

toggleMenuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

window.addEventListener('resize', handleResize);

toggleThemeBtn.addEventListener('click', (event) => {
  changeTheme(event);
});
