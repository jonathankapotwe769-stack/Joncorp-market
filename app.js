// Gestion des produits
let products = JSON.parse(localStorage.getItem('products')) || [];
let editMode = false;
let currentEditId = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
    updateStats();
    setupEventListeners();
    checkStockAlerts();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    document.getElementById('productForm').addEventListener('submit', handleFormSubmit);
    
    // Calcul automatique des bénéfices
    document.getElementById('purchasePrice').addEventListener('input', calculateProfit);
    document.getElementById('sellingPrice').addEventListener('input', calculateProfit);
    
    // Prévisualisation de l'image
    document.getElementById('productImage').addEventListener('change', previewImage);
}

// Calcul des bénéfices
function calculateProfit() {
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const sellingPrice = parseFloat(document.getElementById('sellingPrice').value) || 0;
    const profit = sellingPrice - purchasePrice;
    
    document.getElementById('profit').value = profit.toFixed(2) + ' €';
    
    if (profit < 0) {
        document.getElementById('profit').style.color = '#dc3545';
    } else {
        document.getElementById('profit').style.color = '#28a745';
    }
}

// Prévisualisation de l'image
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

// Gestion du formulaire
function handleFormSubmit(event) {
    event.preventDefault();
    
    const product = {
        id: editMode ? currentEditId : Date.now(),
        name: document.getElementById('productName').value,
        purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
        sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
        stock: parseInt(document.getElementById('stock').value),
        profit: parseFloat(document.getElementById('profit').value),
        image: document.getElementById('imagePreview').src || '',
        dateAdded: editMode ? products.find(p => p.id === currentEditId)?.dateAdded : new Date().toISOString()
    };
    
    if (editMode) {
        // Mise à jour du produit existant
        const index = products.findIndex(p => p.id === currentEditId);
        products[index] = product;
        showNotification('Produit mis à jour avec succès ! ✅');
    } else {
        // Ajout d'un nouveau produit
        products.push(product);
        showNotification('Produit ajouté avec succès ! ✅');
    }
    
    saveProducts();
    displayProducts();
    updateStats();
    resetForm();
    checkStockAlerts();
}

// Affichage des produits
function displayProducts(filteredProducts = null) {
    const productsList = document.getElementById('productsList');
    const productsToDisplay = filteredProducts || products;
    
    if (productsToDisplay.length === 0) {
        productsList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #999;">Aucun produit trouvé</div>';
        return;
    }
    
    productsList.innerHTML = productsToDisplay.map(product => {
        const isLowStock = product.stock <= 5;
        const stockPercentage = Math.min((product.stock / 100) * 100, 100);
        
        return `
            <div class="product-card ${isLowStock ? 'stock-low' : ''}">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" class="product-image">` :
                    `<div class="product-image-placeholder">📦</div>`
                }
                
                <div class="product-info">
                    <h3>${product.name}</h3>
                    
                    <div class="product-details">
                        <div class="detail-item">
                            <label>Prix d'achat</label>
                            <span>${product.purchasePrice.toFixed(2)} €</span>
                        </div>
                        <div class="detail-item">
                            <label>Prix de vente</label>
                            <span>${product.sellingPrice.toFixed(2)} €</span>
                        </div>
                        <div class="detail-item">
                            <label>Bénéfice</label>
                            <span class="${product.profit >= 0 ? 'profit' : 'loss'}">${product.profit.toFixed(2)} €</span>
                        </div>
                        <div class="detail-item">
                            <label>Stock</label>
                            <span style="color: ${isLowStock ? '#dc3545' : '#28a745'}">${product.stock} unités</span>
                        </div>
                    </div>
                    
                    <div class="stock-indicator">
                        <span>📊</span>
                        <div class="stock-bar">
                            <div class="stock-fill" style="width: ${stockPercentage}%"></div>
                        </div>
                        <span>${isLowStock ? '⚠️ Stock bas !' : '✅'}</span>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn btn-warning" onclick="editProduct(${product.id})">✏️ Modifier</button>
                        <button class="btn btn-primary" onclick="updateStock(${product.id}, 1)">➕</button>
                        <button class="btn btn-primary" onclick="updateStock(${product.id}, -1)">➖</button>
                        <button class="btn btn-danger" onclick="deleteProduct(${product.id})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Mise à jour du stock
function updateStock(productId, change) {
    const product = products.find(p => p.id === productId);
    if (product) {
        product.stock = Math.max(0, product.stock + change);
        saveProducts();
        displayProducts();
        updateStats();
        checkStockAlerts();
    }
}

// Modification d'un produit
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        editMode = true;
        currentEditId = productId;
        
        document.getElementById('formTitle').textContent = 'Modifier le Produit';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('purchasePrice').value = product.purchasePrice;
        document.getElementById('sellingPrice').value = product.sellingPrice;
        document.getElementById('stock').value = product.stock;
        
        if (product.image) {
            document.getElementById('imagePreview').src = product.image;
            document.getElementById('imagePreview').style.display = 'block';
        }
        
        calculateProfit();
        
        // Scroll vers le formulaire
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// Suppression d'un produit
function deleteProduct(productId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        products = products.filter(p => p.id !== productId);
        saveProducts();
        displayProducts();
        updateStats();
        showNotification('Produit supprimé avec succès ! 🗑️');
    }
}

// Réinitialisation du formulaire
function resetForm() {
    editMode = false;
    currentEditId = null;
    
    document.getElementById('formTitle').textContent = 'Ajouter un Produit';
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('profit').value = '';
    document.getElementById('profit').style.color = '#28a745';
}

// Sauvegarde des produits
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Mise à jour des statistiques
function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    
    const totalProfit = products.reduce((sum, product) => sum + product.profit, 0);
    document.getElementById('totalProfit').textContent = totalProfit.toFixed(2) + ' €';
    
    const lowStockCount = products.filter(p => p.stock <= 5).length;
    document.getElementById('stockAlerts').textContent = lowStockCount;
    
    if (lowStockCount > 0) {
        document.getElementById('stockAlerts').parentElement.classList.add('alert');
    } else {
        document.getElementById('stockAlerts').parentElement.classList.remove('alert');
    }
}

// Vérification des alertes de stock
function checkStockAlerts() {
    const lowStockProducts = products.filter(p => p.stock <= 5);
    
    if (lowStockProducts.length > 0) {
        const alertMessages = lowStockProducts.map(p => 
            `• ${p.name} : ${p.stock} unités restantes`
        ).join('<br>');
        
        document.getElementById('alertMessage').innerHTML = `
            <p style="margin-bottom: 20px;">Les produits suivants ont un stock bas :</p>
            <div style="text-align: left; margin-bottom: 20px;">${alertMessages}</div>
            <p>Veuillez réapprovisionner ces produits rapidement !</p>
        `;
        
        document.getElementById('alertModal').style.display = 'flex';
    }
}

// Fermeture de l'alerte
function closeAlert() {
    document.getElementById('alertModal').style.display = 'none';
}

// Recherche de produits
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm)
    );
    displayProducts(filtered);
}

// Affichage des notifications
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}