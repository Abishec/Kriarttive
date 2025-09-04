// ==================== FIREBASE SETUP INSTRUCTIONS ====================
/*
FIREBASE SETUP GUIDE - PLEASE READ CAREFULLY:

1. Go to https://console.firebase.google.com/
2. Create a new project named "kriattive" (or any name you prefer)
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
   - Add these admin users manually in Authentication > Users:
     * abishecshah70@gmail.com
     * rennybaniya@gmail.com
     * Set password: Jaleshwaram@1 for both

4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Start with default security rules (we'll update them)

5. Enable Storage:
   - Go to Storage
   - Get started with default rules

6. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Click "Add app" > Web app
   - Register app and copy the config object

7. Replace the firebaseConfig below with your actual config

8. Update Firestore Security Rules:
   Go to Firestore Database > Rules and replace with:

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Products - readable by all, writable by authenticated admin users
       match /products/{document} {
         allow read: if true;
         allow write: if request.auth != null && 
           request.auth.token.email in ['abishecshah70@gmail.com', 'rennybaniya@gmail.com'];
       }
       
       // Requests - readable/writable by authenticated users
       match /requests/{document} {
         allow read, write: if request.auth != null;
       }
     }
   }

9. Update Storage Security Rules:
   Go to Storage > Rules and replace with:

   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
*/

// ==================== FIREBASE CONFIGURATION ====================
// REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "kriattive-xxx.firebaseapp.com",
  projectId: "kriattive-xxx",
  storageBucket: "kriattive-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id-here"
};

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let products = [];
let allProducts = []; // Keep original list for filtering
let requests = [];
let currentEditingProduct = null;
let selectedFile = null;
let firebaseInitialized = false;
let db, auth, storage;

// ==================== FIREBASE INITIALIZATION ====================
function initializeFirebase() {
  try {
    // Check if Firebase config is still using placeholder values
    if (firebaseConfig.apiKey === "your-api-key-here") {
      console.warn('Firebase configuration not set up. Using mock data for demonstration.');
      initializeMockData();
      return false;
    }

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    storage = firebase.storage();
    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    console.log('Falling back to mock data mode');
    initializeMockData();
    return false;
  }
}

// ==================== MOCK DATA FOR DEMONSTRATION ====================
function initializeMockData() {
  // Sample product images using colorful placeholders
  const sampleImages = [
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM4QjVDRjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNBNzc4RkYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii0xMCI+V29vZGVuIEJvd2w8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjgpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMTAiPkhhbmRjcmFmdGVkPC90ZXh0Pjwvc3ZnPg==',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGNTkzNEYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGQkI2OEYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgZmlsbD0idXJsKCNiKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii0xMCI+Q29mZmVlIE11ZzwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIxMCI+Q2VyYW1pYzwvdGV4dD48L3N2Zz4=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImMiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxMEI5ODEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzNEQ0QUEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgZmlsbD0idXJsKCNjKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii0xMCI+QmFza2V0IFNldDwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIxMCI+V292ZW48L3RleHQ+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNEQzI2MjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGMzY4NjgiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgZmlsbD0idXJsKCNkKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii0xMCI+QnJhc3MgUGxhdGU8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjgpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMTAiPkRlY29yYXRpdmU8L3RleHQ+PC9zdmc+'
  ];

  products = [
    {
      id: '1',
      name: "Handcrafted Wooden Bowl",
      price: 2500,
      description: "Beautiful handmade wooden bowl perfect for serving traditional Nepali dishes",
      imageUrl: sampleImages[0],
      dateAdded: new Date(),
      status: 'active'
    },
    {
      id: '2',
      name: "Ceramic Coffee Mug",
      price: 1200,
      description: "Elegant ceramic mug with traditional Nepali patterns, perfect for your morning coffee",
      imageUrl: sampleImages[1],
      dateAdded: new Date(),
      status: 'active'
    },
    {
      id: '3',
      name: "Woven Basket Set",
      price: 3800,
      description: "Set of 3 different sized woven baskets made from local materials",
      imageUrl: sampleImages[2],
      dateAdded: new Date(),
      status: 'active'
    },
    {
      id: '4',
      name: "Brass Decorative Plate",
      price: 4500,
      description: "Intricately designed brass plate with traditional Nepali motifs",
      imageUrl: sampleImages[3],
      dateAdded: new Date(),
      status: 'active'
    }
  ];

  // Keep a copy of all products for filtering
  allProducts = [...products];

  requests = [
    {
      id: '1',
      productName: 'Handcrafted Wooden Bowl',
      customerName: 'Demo Customer',
      phone: '+977-1234567890',
      address: 'Kathmandu, Nepal',
      message: 'Interested in this beautiful wooden bowl',
      date: new Date(),
      status: 'Pending'
    }
  ];

  // Render initial data
  setTimeout(() => {
    UIManager.renderProducts(products, false);
    UIManager.renderProducts(products, true);
    UIManager.renderRequests(requests);
    UIManager.updateStats();
  }, 100);
}

// ==================== AUTHENTICATION ====================
class AuthManager {
  static async login(email, password) {
    try {
      const adminEmails = ['abishecshah70@gmail.com', 'rennybaniya@gmail.com'];
      
      if (!adminEmails.includes(email)) {
        throw new Error('Access denied. Admin privileges required.');
      }

      if (firebaseInitialized) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        // Mock authentication for demo
        if (adminEmails.includes(email) && password === 'Jaleshwaram@1') {
          currentUser = { email, uid: 'mock-uid' };
          UIManager.updateAuthUI(currentUser);
          return true;
        } else {
          throw new Error('Invalid credentials');
        }
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      if (firebaseInitialized) {
        await auth.signOut();
      } else {
        currentUser = null;
        UIManager.updateAuthUI(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  static onAuthStateChanged(callback) {
    if (firebaseInitialized) {
      return auth.onAuthStateChanged(callback);
    } else {
      // For mock mode, just call callback with current user
      setTimeout(() => callback(currentUser), 100);
      return () => {}; // Return empty unsubscribe function
    }
  }
}

// ==================== FIREBASE DATA MANAGEMENT ====================
class DataManager {
  // Products Management
  static async getProducts() {
    try {
      if (!firebaseInitialized) {
        return products.filter(p => p.status === 'active');
      }

      const snapshot = await db.collection('products')
        .where('status', '==', 'active')
        .orderBy('dateAdded', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async addProduct(productData) {
    try {
      if (!firebaseInitialized) {
        const newProduct = {
          id: Date.now().toString(),
          ...productData,
          dateAdded: new Date(),
          status: 'active'
        };
        products.push(newProduct);
        allProducts.push(newProduct);
        UIManager.renderProducts(products, false);
        UIManager.renderProducts(products, true);
        UIManager.updateStats();
        return newProduct.id;
      }

      const docRef = await db.collection('products').add({
        ...productData,
        dateAdded: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  static async updateProduct(productId, productData) {
    try {
      if (!firebaseInitialized) {
        const index = products.findIndex(p => p.id === productId);
        const allIndex = allProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
          products[index] = { ...products[index], ...productData };
        }
        if (allIndex !== -1) {
          allProducts[allIndex] = { ...allProducts[allIndex], ...productData };
        }
        UIManager.renderProducts(products, false);
        UIManager.renderProducts(products, true);
        return;
      }

      await db.collection('products').doc(productId).update(productData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async deleteProduct(productId) {
    try {
      if (!firebaseInitialized) {
        const index = products.findIndex(p => p.id === productId);
        const allIndex = allProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
          products[index].status = 'deleted';
        }
        if (allIndex !== -1) {
          allProducts[allIndex].status = 'deleted';
        }
        const activeProducts = products.filter(p => p.status === 'active');
        products = activeProducts;
        UIManager.renderProducts(products, false);
        UIManager.renderProducts(products, true);
        UIManager.updateStats();
        return;
      }

      await db.collection('products').doc(productId).update({
        status: 'deleted'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Requests Management
  static async addRequest(requestData) {
    try {
      if (!firebaseInitialized) {
        const newRequest = {
          id: Date.now().toString(),
          ...requestData,
          date: new Date(),
          status: 'Pending'
        };
        requests.push(newRequest);
        UIManager.renderRequests(requests);
        UIManager.updateStats();
        return newRequest.id;
      }

      const docRef = await db.collection('requests').add({
        ...requestData,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'Pending'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding request:', error);
      throw error;
    }
  }

  static async updateRequestStatus(requestId, status) {
    try {
      if (!firebaseInitialized) {
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          requests[index].status = status;
          UIManager.renderRequests(requests);
          UIManager.updateStats();
        }
        return;
      }

      await db.collection('requests').doc(requestId).update({ status });
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }
}

// ==================== IMAGE UPLOAD MANAGEMENT ====================
class ImageManager {
  static async uploadImage(file, productName) {
    try {
      if (!firebaseInitialized) {
        // For demo purposes, simulate upload and return a placeholder
        this.updateUploadProgress(30);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.updateUploadProgress(60);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.updateUploadProgress(100);
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImUiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2MzY2RjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM4QjVDRjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNlKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAiPlVwbG9hZGVkIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
      }

      // Validate file
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please use JPG, PNG, GIF, or WEBP.');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('File too large. Please use images smaller than 5MB.');
      }

      // Create unique filename
      const timestamp = Date.now();
      const filename = `products/${timestamp}_${productName.replace(/[^a-z0-9]/gi, '_')}.${file.name.split('.').pop()}`;
      
      // Create storage reference
      const storageRef = storage.ref().child(filename);
      
      // Upload file with progress tracking
      const uploadTask = storageRef.put(file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            // Progress tracking
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            this.updateUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            // Upload completed successfully
            try {
              const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  static updateUploadProgress(progress) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `Uploading... ${Math.round(progress)}%`;
    }
  }
}

// ==================== UI MANAGEMENT ====================
class UIManager {
  static showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (container.contains(notification)) {
          container.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  static showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      // Focus management
      const firstInput = modal.querySelector('input, textarea, select, button');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  static hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  static updateConnectionStatus(isOnline) {
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
      statusEl.textContent = isOnline ? 'Online' : 'Offline';
      statusEl.className = `connection-status ${isOnline ? '' : 'offline'}`;
    }
  }

  static updateAuthUI(user) {
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminPanel = document.getElementById('adminPanel');
    
    if (user) {
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      adminPanel.classList.remove('hidden');
    } else {
      loginBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
      adminPanel.classList.add('hidden');
    }
  }

  static renderProducts(productsList, isAdmin = false) {
    const container = isAdmin ? 
      document.getElementById('adminProductsList') : 
      document.getElementById('productsList');
    
    if (!container) return;

    if (!productsList || productsList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No products available</h3>
          <p>${isAdmin ? 'Add your first product to get started.' : 'Please check back later for new products.'}</p>
        </div>
      `;
      return;
    }

    const filteredProducts = isAdmin ? productsList : productsList.filter(p => p.status !== 'deleted');
    container.innerHTML = filteredProducts.map(product => {
      if (isAdmin) {
        return this.renderAdminProductCard(product);
      } else {
        return this.renderPublicProductCard(product);
      }
    }).join('');
  }

  static renderAdminProductCard(product) {
    const imageUrl = product.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    
    return `
      <div class="admin-product-card fade-in">
        <img src="${imageUrl}" alt="${product.name}" class="admin-product-image">
        <div class="admin-product-content">
          <div class="admin-product-header">
            <h4 class="admin-product-name">${product.name}</h4>
            <span class="admin-product-price">Rs. ${product.price.toLocaleString()}</span>
          </div>
          <p class="admin-product-description">${product.description}</p>
          <div class="admin-product-actions">
            <button class="btn btn--outline" onclick="editProduct('${product.id}')">Edit</button>
            <button class="btn btn--outline" style="color: var(--color-error); border-color: var(--color-error);" onclick="deleteProduct('${product.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  static renderPublicProductCard(product) {
    const imageUrl = product.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    
    return `
      <div class="product-card fade-in" onclick="requestProduct('${product.name}')">
        <img src="${imageUrl}" alt="${product.name}" class="product-image">
        <div class="product-content">
          <h3 class="product-name">${product.name}</h3>
          <div class="product-price">Rs. ${product.price.toLocaleString()}</div>
          <p class="product-description">${product.description}</p>
          <div class="product-actions">
            <button class="btn btn--primary" onclick="event.stopPropagation(); requestProduct('${product.name}')">Request Product</button>
          </div>
        </div>
      </div>
    `;
  }

  static renderRequests(requestsList) {
    const container = document.getElementById('requestsList');
    if (!container) return;
    
    if (!requestsList || requestsList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No customer requests</h3>
          <p>Customer requests will appear here once submitted.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = requestsList.map(request => `
      <div class="request-card fade-in">
        <div class="request-header">
          <div>
            <div class="request-product">${request.productName}</div>
            <div class="request-date">${this.formatDate(request.date)}</div>
          </div>
          <span class="status status--${request.status.toLowerCase()}">${request.status}</span>
        </div>
        <div class="request-details">
          <div class="request-field">
            <span class="request-label">Customer Name</span>
            <span class="request-value">${request.customerName}</span>
          </div>
          <div class="request-field">
            <span class="request-label">Phone</span>
            <span class="request-value">${request.phone}</span>
          </div>
          <div class="request-field">
            <span class="request-label">Address</span>
            <span class="request-value">${request.address}</span>
          </div>
          ${request.message ? `
            <div class="request-field">
              <span class="request-label">Message</span>
              <span class="request-value">${request.message}</span>
            </div>
          ` : ''}
        </div>
        <div class="request-actions">
          <button class="btn btn--outline btn--sm" onclick="updateRequestStatus('${request.id}', 'Contacted')">Mark Contacted</button>
          <button class="btn btn--primary btn--sm" onclick="updateRequestStatus('${request.id}', 'Completed')">Mark Completed</button>
        </div>
      </div>
    `).join('');
  }

  static formatDate(timestamp) {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static updateStats() {
    const totalEl = document.getElementById('totalProducts');
    const pendingEl = document.getElementById('pendingRequests');
    
    if (totalEl) {
      const activeProducts = products.filter(p => p.status === 'active');
      totalEl.textContent = activeProducts.length;
    }
    
    if (pendingEl) {
      const pendingCount = requests.filter(r => r.status === 'Pending').length;
      pendingEl.textContent = pendingCount;
    }
  }
}

// ==================== GLOBAL FUNCTIONS ====================
window.editProduct = async function(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  currentEditingProduct = product;
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  
  // Populate form
  document.getElementById('productName').value = product.name;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productDescription').value = product.description;
  
  // Show existing image
  if (product.imageUrl) {
    document.getElementById('previewImg').src = product.imageUrl;
    document.getElementById('imagePreview').classList.remove('hidden');
    document.getElementById('imageUploadZone').style.display = 'none';
  }
  
  UIManager.showModal('productModal');
};

window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  try {
    await DataManager.deleteProduct(productId);
    UIManager.showNotification('Product deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting product:', error);
    UIManager.showNotification('Error deleting product', 'error');
  }
};

window.requestProduct = function(productName) {
  // Clear form first
  document.getElementById('requestForm').reset();
  
  // Set the product name in both visible text and hidden input
  const requestProductNameInput = document.getElementById('requestProductName');
  if (requestProductNameInput) {
    requestProductNameInput.value = productName;
  }
  
  // Also add a visible product name display in the modal
  const modalTitle = document.querySelector('#requestModal .modal-header h3');
  if (modalTitle) {
    modalTitle.innerHTML = `Request Product: <span style="color: var(--color-primary);">${productName}</span>`;
  }
  
  UIManager.showModal('requestModal');
};

window.updateRequestStatus = async function(requestId, status) {
  try {
    await DataManager.updateRequestStatus(requestId, status);
    UIManager.showNotification(`Request marked as ${status.toLowerCase()}`, 'success');
  } catch (error) {
    console.error('Error updating request status:', error);
    UIManager.showNotification('Error updating request status', 'error');
  }
};

// ==================== EVENT HANDLERS ====================
function setupEventListeners() {
  // Authentication Events
  document.getElementById('adminLoginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    UIManager.showModal('loginModal');
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await AuthManager.logout();
      UIManager.showNotification('Logged out successfully', 'success');
    } catch (error) {
      UIManager.showNotification('Error logging out', 'error');
    }
  });

  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      await AuthManager.login(email, password);
      UIManager.hideModal('loginModal');
      UIManager.showNotification('Login successful!', 'success');
      document.getElementById('loginForm').reset();
    } catch (error) {
      UIManager.showNotification(error.message, 'error');
    }
  });

  // Modal Events
  document.getElementById('closeLoginModal')?.addEventListener('click', () => {
    UIManager.hideModal('loginModal');
  });

  document.getElementById('closeProductModal')?.addEventListener('click', () => {
    UIManager.hideModal('productModal');
    resetProductForm();
  });

  document.getElementById('closeRequestModal')?.addEventListener('click', () => {
    UIManager.hideModal('requestModal');
    // Reset modal title when closing
    const modalTitle = document.querySelector('#requestModal .modal-header h3');
    if (modalTitle) {
      modalTitle.textContent = 'Request Product';
    }
  });

  document.getElementById('cancelProduct')?.addEventListener('click', () => {
    UIManager.hideModal('productModal');
    resetProductForm();
  });

  document.getElementById('cancelRequest')?.addEventListener('click', () => {
    UIManager.hideModal('requestModal');
    // Reset modal title when canceling
    const modalTitle = document.querySelector('#requestModal .modal-header h3');
    if (modalTitle) {
      modalTitle.textContent = 'Request Product';
    }
  });

  // Tab Events
  document.getElementById('productsTab')?.addEventListener('click', () => {
    switchTab('products');
  });

  document.getElementById('requestsTab')?.addEventListener('click', () => {
    switchTab('requests');
  });

  // Product Management Events
  document.getElementById('addProductBtn')?.addEventListener('click', () => {
    currentEditingProduct = null;
    document.getElementById('productModalTitle').textContent = 'Add New Product';
    resetProductForm();
    UIManager.showModal('productModal');
  });

  document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProduct();
  });

  // Image Upload Events
  const imageUploadZone = document.getElementById('imageUploadZone');
  const imageInput = document.getElementById('imageInput');

  imageUploadZone?.addEventListener('click', () => {
    imageInput.click();
  });

  imageUploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadZone.classList.add('dragover');
  });

  imageUploadZone?.addEventListener('dragleave', () => {
    imageUploadZone.classList.remove('dragover');
  });

  imageUploadZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  });

  imageInput?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageSelect(e.target.files[0]);
    }
  });

  document.getElementById('removeImage')?.addEventListener('click', () => {
    removeSelectedImage();
  });

  // Request Form Events
  document.getElementById('requestForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitRequest();
  });

  // Search and Filter Events with improved functionality
  document.getElementById('searchInput')?.addEventListener('input', debounce(filterProducts, 300));
  document.getElementById('priceFilter')?.addEventListener('change', filterProducts);

  // Export Events
  document.getElementById('exportRequestsBtn')?.addEventListener('click', exportRequests);

  // Close modals on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal:not(.hidden)');
      modals.forEach(modal => {
        modal.classList.add('hidden');
        // Reset modal titles when closing with escape
        if (modal.id === 'requestModal') {
          const modalTitle = modal.querySelector('.modal-header h3');
          if (modalTitle) {
            modalTitle.textContent = 'Request Product';
          }
        }
      });
    }
  });

  // Close modals on backdrop click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
      // Reset modal titles when closing
      if (e.target.id === 'requestModal') {
        const modalTitle = e.target.querySelector('.modal-header h3');
        if (modalTitle) {
          modalTitle.textContent = 'Request Product';
        }
      }
    }
  });
}

// ==================== HELPER FUNCTIONS ====================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`${tab}Tab`)?.classList.add('active');
  
  // Show/hide content
  document.getElementById('productsSection')?.classList.toggle('hidden', tab !== 'products');
  document.getElementById('requestsSection')?.classList.toggle('hidden', tab !== 'requests');
}

function resetProductForm() {
  document.getElementById('productForm')?.reset();
  removeSelectedImage();
  document.getElementById('uploadProgress')?.classList.add('hidden');
  currentEditingProduct = null;
  selectedFile = null;
}

function handleImageSelect(file) {
  selectedFile = file;
  
  // Validate file
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    UIManager.showNotification('Please select a valid image file (JPG, PNG, GIF, WEBP)', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    UIManager.showNotification('File too large. Please select an image smaller than 5MB', 'error');
    return;
  }
  
  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('imagePreview')?.classList.remove('hidden');
    const uploadZone = document.getElementById('imageUploadZone');
    if (uploadZone) uploadZone.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeSelectedImage() {
  selectedFile = null;
  document.getElementById('imagePreview')?.classList.add('hidden');
  const uploadZone = document.getElementById('imageUploadZone');
  if (uploadZone) uploadZone.style.display = 'block';
  const imageInput = document.getElementById('imageInput');
  if (imageInput) imageInput.value = '';
}

async function saveProduct() {
  const name = document.getElementById('productName').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const description = document.getElementById('productDescription').value.trim();
  
  if (!name || !price || !description) {
    UIManager.showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    let imageUrl = '';
    
    // Upload image if selected
    if (selectedFile) {
      const progressEl = document.getElementById('uploadProgress');
      if (progressEl) progressEl.classList.remove('hidden');
      imageUrl = await ImageManager.uploadImage(selectedFile, name);
      if (progressEl) progressEl.classList.add('hidden');
    } else if (currentEditingProduct && currentEditingProduct.imageUrl) {
      imageUrl = currentEditingProduct.imageUrl;
    }
    
    const productData = {
      name,
      price,
      description,
      imageUrl
    };
    
    if (currentEditingProduct) {
      await DataManager.updateProduct(currentEditingProduct.id, productData);
      UIManager.showNotification('Product updated successfully!', 'success');
    } else {
      await DataManager.addProduct(productData);
      UIManager.showNotification('Product added successfully!', 'success');
    }
    
    UIManager.hideModal('productModal');
    resetProductForm();
    
  } catch (error) {
    console.error('Error saving product:', error);
    UIManager.showNotification(`Error saving product: ${error.message}`, 'error');
    const progressEl = document.getElementById('uploadProgress');
    if (progressEl) progressEl.classList.add('hidden');
  }
}

async function submitRequest() {
  const productName = document.getElementById('requestProductName').value;
  const customerName = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  const message = document.getElementById('customerMessage').value.trim();
  
  if (!customerName || !phone || !address) {
    UIManager.showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    await DataManager.addRequest({
      productName,
      customerName,
      phone,
      address,
      message
    });
    
    UIManager.showNotification('Request submitted successfully! We will contact you soon.', 'success');
    UIManager.hideModal('requestModal');
    
    // Reset modal title
    const modalTitle = document.querySelector('#requestModal .modal-header h3');
    if (modalTitle) {
      modalTitle.textContent = 'Request Product';
    }
  } catch (error) {
    console.error('Error submitting request:', error);
    UIManager.showNotification('Error submitting request. Please try again.', 'error');
  }
}

function filterProducts() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const priceFilter = document.getElementById('priceFilter')?.value || '';
  
  // Start with all active products
  let filtered = allProducts.filter(product => product.status === 'active');
  
  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply price filter
  if (priceFilter) {
    filtered = filtered.filter(product => {
      if (priceFilter === '0-2000') {
        return product.price <= 2000;
      } else if (priceFilter === '2000-4000') {
        return product.price > 2000 && product.price <= 4000;
      } else if (priceFilter === '4000-6000') {
        return product.price > 4000 && product.price <= 6000;
      } else if (priceFilter === '6000+') {
        return product.price > 6000;
      }
      return true;
    });
  }
  
  // Update the products array for display
  products = filtered;
  UIManager.renderProducts(filtered, false);
}

function exportRequests() {
  if (requests.length === 0) {
    UIManager.showNotification('No requests to export', 'info');
    return;
  }
  
  const csvContent = [
    'Product,Customer Name,Phone,Address,Message,Date,Status',
    ...requests.map(request => [
      request.productName,
      request.customerName,
      request.phone,
      request.address.replace(/,/g, ';'),
      (request.message || '').replace(/,/g, ';'),
      UIManager.formatDate(request.date),
      request.status
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kriattive_requests_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  UIManager.showNotification('Requests exported successfully!', 'success');
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Kriattive application...');
  
  // Initialize Firebase or mock data
  firebaseInitialized = initializeFirebase();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check network status
  UIManager.updateConnectionStatus(navigator.onLine);
  window.addEventListener('online', () => UIManager.updateConnectionStatus(true));
  window.addEventListener('offline', () => UIManager.updateConnectionStatus(false));
  
  // Auth state listener
  AuthManager.onAuthStateChanged(async (user) => {
    currentUser = user;
    UIManager.updateAuthUI(user);
  });
  
  console.log('Kriattive app initialized successfully!');
  console.log(firebaseInitialized ? 'Firebase connected' : 'Running in demo mode with mock data');
  
  if (!firebaseInitialized) {
    UIManager.showNotification('Demo mode: Replace Firebase config to enable full functionality', 'info');
  }
});