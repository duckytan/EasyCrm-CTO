// AI-CRM Service Worker
// 版本号 - 更新此值会触发Service Worker更新
const CACHE_VERSION = 'ai-crm-v1.0.0';
const CACHE_NAME = `${CACHE_VERSION}::static`;
const DATA_CACHE_NAME = `${CACHE_VERSION}::data`;

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/customers.html',
  '/customer-detail.html',
  '/visits.html',
  '/products.html',
  '/presets.html',
  '/settings.html',
  '/css/base.css',
  '/js/app.js',
  '/js/api-client.js',
  '/js/auth-guard.js',
  '/js/customers.js',
  '/js/customer-detail.js',
  '/js/dashboard.js',
  '/js/visits.js',
  '/js/products.js',
  '/js/presets.js',
  '/js/settings.js',
  '/js/modal.js',
  '/js/navbar-loader.js',
  '/js/pwa-register.js',
  '/js/tiny-pinyin.min.js',
  '/components/navbar.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  // 强制立即激活新的Service Worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('[ServiceWorker] Cache addAll failed:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 确保Service Worker控制所有页面
        return self.clients.claim();
      })
  );
});

// Fetch事件 - 处理请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过chrome扩展和其他协议
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API请求 - 网络优先策略（Network First）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DATA_CACHE_NAME));
    return;
  }

  // 静态资源 - 缓存优先策略（Cache First）
  event.respondWith(cacheFirst(request, CACHE_NAME));
});

// 缓存优先策略 - 用于静态资源
async function cacheFirst(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      // 后台更新缓存
      updateCache(request, cacheName);
      return cached;
    }

    const response = await fetch(request);
    
    // 只缓存成功的响应
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[ServiceWorker] Cache first error:', error);
    
    // 如果是HTML页面请求失败，返回离线页面
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      const cached = await caches.match('/index.html');
      if (cached) {
        return cached;
      }
    }
    
    throw error;
  }
}

// 网络优先策略 - 用于API请求
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    // 缓存成功的API响应（5分钟有效期）
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      const clonedResponse = response.clone();
      
      // 添加时间戳到响应头
      const headers = new Headers(clonedResponse.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const cachedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return response;
  } catch (error) {
    console.warn('[ServiceWorker] Network request failed, trying cache:', error);
    
    const cached = await caches.match(request);
    if (cached) {
      // 检查缓存是否过期（5分钟）
      const cacheTime = cached.headers.get('sw-cache-time');
      if (cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 5 * 60 * 1000) { // 5分钟
          return cached;
        }
      }
      // 即使过期也返回缓存，总比没有好
      return cached;
    }
    
    throw error;
  }
}

// 后台更新缓存
async function updateCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response);
    }
  } catch (error) {
    // 静默失败
  }
}

// 监听消息事件 - 支持手动更新缓存
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// 后台同步事件（如果支持）
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync:', event.tag);
    
    if (event.tag === 'sync-data') {
      event.waitUntil(syncData());
    }
  });
}

async function syncData() {
  // 可以在这里实现后台数据同步逻辑
  console.log('[ServiceWorker] Syncing data...');
}
