<template>
  <section class="container py-4">
    <h1 class="mb-3">Find Support Near You</h1>

    <!-- Controls -->
    <div class="card p-3 mb-3 shadow-sm">
      <div class="row g-2 align-items-end">
        <div class="col-md-4">
          <label class="form-label">Search nearby (keyword)</label>
          <input v-model="query" type="text" class="form-control" placeholder="e.g., counselling, clinic, youth centre" />
        </div>
        <div class="col-md-2">
          <label class="form-label">Radius (km)</label>
          <input v-model.number="radiusKm" type="number" min="1" max="50" class="form-control" />
        </div>
        <div class="col-md-3">
          <button
            class="btn btn-custom w-100"
            @click="searchNearby"
            :disabled="!ready || searching"
          >
            {{ searching ? 'Searching…' : 'Search Places Near Me' }}
          </button>
        </div>
        <div class="col-md-3">
          <button class="btn btn-outline-secondary w-100" @click="clearResults">Clear Results</button>
        </div>
      </div>

      <hr class="my-3"/>

      <div class="row g-2">
        <div class="col-md-5">
          <label class="form-label">From</label>
          <input v-model="fromText" type="text" class="form-control" placeholder="Use my location or type an address" />
          <small class="text-muted">Tip: leave blank to use your current location.</small>
          <!-- explicit fallback locate button -->
          <button class="btn btn-outline-primary mt-2" @click="useMyLocation">📍 Use my location</button>
        </div>
        <div class="col-md-5">
          <label class="form-label">To</label>
          <input v-model="toText" type="text" class="form-control" placeholder="Click a marker or type an address" />
          <small class="text-muted">Click a map marker to auto-fill.</small>
        </div>
        <div class="col-md-2 d-grid">
          <button class="btn btn-custom" @click="route">Get Route</button>
        </div>
      </div>

      <div v-if="trip" class="alert alert-info mt-3 mb-0">
        <strong>Trip:</strong> {{ trip.distanceKm.toFixed(2) }} km • {{ trip.durationMin.toFixed(0) }} mins ({{ trip.profile }})
      </div>
    </div>

    <!-- Layout: Map + Results list -->
    <div class="row g-3">
      <div class="col-lg-8">
        <div id="map" class="mapbox"></div>
      </div>
      <div class="col-lg-4">
        <div class="card p-3 shadow-sm h-100">
          <h5 class="mb-2">Results ({{ results.length }})</h5>
          <div v-if="!results.length" class="text-muted">No places yet—try a nearby search above.</div>

          <ul class="list-group list-group-flush small overflow-auto" style="max-height: 480px" v-else>
            <li
              v-for="(r, idx) in results"
              :key="idx"
              class="list-group-item"
            >
              <div class="d-flex align-items-start justify-content-between">
                <div class="me-2">
                  <div class="fw-semibold">{{ r.text }}</div>
                  <div class="text-muted">{{ r.place_name }}</div>
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-secondary" @click="flyTo(r)">Fly</button>
                  <button class="btn btn-sm btn-custom" @click="selectTo(r)">Route</button>
                </div>
              </div>
            </li>
          </ul>

          <div class="mt-3">
            <button class="btn btn-outline-danger w-100" @click="clearRoute" :disabled="!routeDrawn">Clear Route</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const token = import.meta.env.VITE_MAPBOX_TOKEN
mapboxgl.accessToken = token

// state
const map = ref(null)
const geolocateCtrl = ref(null)
const userLngLat = ref(null)      // [lng, lat]
const ready = ref(false)
const searching = ref(false)      // UI loading state

const query = ref('counselling')
const radiusKm = ref(5)
const results = ref([])

const fromText = ref('')
const toText = ref('')

// route state
const routeId = 'route-line'
const routeDrawn = ref(false)
const trip = ref(null)

onMounted(async () => {
  if (!token) {
    alert('Mapbox token missing. Add VITE_MAPBOX_TOKEN to your .env')
    return
  }

  map.value = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [144.9631, -37.8136], // Melbourne default
    zoom: 11
  })

  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right')
  geolocateCtrl.value = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true
  })
  map.value.addControl(geolocateCtrl.value, 'top-left')

  // Guarded geolocate events
  geolocateCtrl.value.on('geolocate', (evt) => {
    const coords = evt?.coords || evt?.position?.coords
    const lng = typeof coords?.longitude === 'number' ? coords.longitude : null
    const lat = typeof coords?.latitude  === 'number' ? coords.latitude  : null
    if (lng == null || lat == null) return
    userLngLat.value = [lng, lat]
    fromText.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    map.value?.flyTo({ center: [lng, lat], zoom: Math.max(map.value.getZoom(), 13) })
  })

  geolocateCtrl.value.on('error', (err) => {
    console.warn('Geolocation error:', err)
    alert('Could not access your location. You can still type an address.')
  })

  map.value.on('load', () => {
    ready.value = true
    // do not auto-trigger; use the explicit button
  })
})

/* ---------- Ensure we have a usable origin (NEW) ---------- */
async function ensureUserLocation () {
  // 1) already available?
  if (userLngLat.value && Number.isFinite(userLngLat.value[0])) return userLngLat.value

  // 2) try From field (coords or address)
  const parsed = await stringToLngLat(fromText.value)
  if (parsed) {
    userLngLat.value = parsed
    return userLngLat.value
  }

  // 3) try Geolocate control with a short wait
  if (geolocateCtrl.value) {
    try {
      const pos = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('geolocate timeout')), 5000)
        const onGeo = (evt) => {
          clearTimeout(timer)
          geolocateCtrl.value?.off('geolocate', onGeo)
          const c = evt?.coords || evt?.position?.coords
          if (c && Number.isFinite(c.longitude) && Number.isFinite(c.latitude)) {
            resolve([c.longitude, c.latitude])
          } else reject(new Error('bad coords'))
        }
        geolocateCtrl.value.on('geolocate', onGeo)
        geolocateCtrl.value.trigger()
      })
      if (pos) {
        userLngLat.value = pos
        fromText.value = `${pos[1].toFixed(5)}, ${pos[0].toFixed(5)}`
        return userLngLat.value
      }
    } catch { /* fall through */ }
  }

  // 4) fallback: navigator.geolocation
  if ('geolocation' in navigator) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve([p.coords.longitude, p.coords.latitude]),
          (e) => reject(e),
          { enableHighAccuracy: true, timeout: 10000 }
        )
      })
      userLngLat.value = pos
      fromText.value = `${pos[1].toFixed(5)}, ${pos[0].toFixed(5)}`
      return userLngLat.value
    } catch { /* ignore */ }
  }
  return null
}

/* ---------- Fallback locate button ---------- */
function useMyLocation () {
  try {
    if (geolocateCtrl.value) {
      geolocateCtrl.value.trigger()
      alert('Waiting for your location — please allow the browser prompt.')
      return
    }
  } catch (e) {}

  if ('geolocation' in navigator) {
    alert('Waiting for your location (browser will prompt)…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords
        userLngLat.value = [longitude, latitude]
        fromText.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        map.value?.flyTo({ center: [longitude, latitude], zoom: 15 })
      },
      (err) => alert('Could not get location: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  } else {
    alert('Geolocation is not supported in this browser.')
  }
}

/* ---------- Geocoding helpers (with timeout + fallback) ---------- */
// Broader geocode with flexible types and optional country bias
async function geocode(text, proximityLngLat, opts = {}) {
  const ctrl = new AbortController()
  const timeoutMs = opts.timeoutMs ?? 10000
  const t = setTimeout(() => ctrl.abort('timeout'), timeoutMs)
  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json`
    )
    url.searchParams.set('access_token', token)
    url.searchParams.set('limit', String(opts.limit ?? 25))
    // try a wider set of types so general words (clinic/hospital/park/etc.) work
    url.searchParams.set('types', 'poi,place,locality,neighborhood,address')
    url.searchParams.set('language', 'en')
    // helpful but not required; comment out if you want global results
    url.searchParams.set('country', 'AU')
    if (proximityLngLat) {
      url.searchParams.set('proximity', `${proximityLngLat[0]},${proximityLngLat[1]}`)
    }

    const r = await fetch(url, { signal: ctrl.signal })
    if (!r.ok) throw new Error(`geocode ${r.status}`)
    const data = await r.json()
    return data.features || []
  } finally {
    clearTimeout(t)
  }
}


/* ---------- Nearby search (UPDATED to use ensureUserLocation) ---------- */
async function searchNearby() {
  const base = await ensureUserLocation()
  if (!base) {
    alert('Could not determine your location yet. Click “📍 Use my location” or type an origin.')
    return
  }
  if (!query.value.trim()) return

  searching.value = true
  try {
    // Clear old
    clearResults()

    // Try with proximity first, then fallback without in case of 0 or timeouts.
    let feats = []
    try {
      feats = await geocode(query.value, base, { timeoutMs: 10000 })
    } catch (e) {
      console.warn('Proximity geocode failed/timeout; retry without proximity', e)
    }
    if (!feats.length) {
      feats = await geocode(query.value, null, { timeoutMs: 10000 })
    }

    // Filter to within radius
    const filtered = feats.filter(f => {
      const d = haversineKm(base[1], base[0], f.center[1], f.center[0])
      return d <= radiusKm.value
    })
    results.value = filtered

    // Add markers and fit bounds
    filtered.forEach(addMarker)
    if (filtered.length) {
      const bounds = new mapboxgl.LngLatBounds()
      filtered.forEach(f => bounds.extend(f.center))
      bounds.extend(base)
      map.value.fitBounds(bounds, { padding: 40 })
    } else {
      alert('No matches within the selected radius. Try a broader search or different keyword.')
    }
  } catch (e) {
    console.warn('Nearby search failed', e)
    alert('Search timed out or failed. Please try again or broaden your search.')
  } finally {
    searching.value = false
  }
}

function addMarker(feature) {
  const el = document.createElement('div')
  el.className = 'poi-marker'
  const marker = new mapboxgl.Marker(el).setLngLat(feature.center)

  const popupHtml = `
    <div style="max-width:240px">
      <strong>${escapeHtml(feature.text)}</strong>
      <div class="text-muted" style="font-size:12px">${escapeHtml(feature.place_name)}</div>
      <div class="mt-2 d-flex gap-2">
        <button id="fly-${feature.id}" class="btn btn-sm btn-outline-secondary">Fly</button>
        <button id="route-${feature.id}" class="btn btn-sm btn-custom">Route</button>
      </div>
    </div>
  `
  marker.setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(popupHtml))
  marker.addTo(map.value)

  // wire popup buttons after open
  marker.getElement().addEventListener('click', () => {
    setTimeout(() => {
      const flyBtn = document.getElementById(`fly-${feature.id}`)
      const routeBtn = document.getElementById(`route-${feature.id}`)
      flyBtn && flyBtn.addEventListener('click', () => flyTo(feature))
      routeBtn && routeBtn.addEventListener('click', () => selectTo(feature))
    })
  })
}

function flyTo(f) {
  map.value.flyTo({ center: f.center, zoom: 15 })
}

function selectTo(f) {
  toText.value = f.place_name
  flyTo(f)
}

/* ---------- Routing ---------- */
async function route() {
  const from = await stringToLngLat(fromText.value) || userLngLat.value
  const to   = await stringToLngLat(toText.value)

  if (!from || !to) { alert('Please provide valid From and To locations.'); return }

  const profile = 'driving'
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}`)
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('overview', 'full')
  url.searchParams.set('access_token', token)

  const r = await fetch(url)
  const data = await r.json()
  const route = data?.routes?.[0]
  if (!route) { alert('No route found.'); return }

  const geojson = { type: 'Feature', geometry: route.geometry, properties: {} }

  if (map.value.getSource(routeId)) {
    map.value.getSource(routeId).setData(geojson)
  } else {
    map.value.addSource(routeId, { type: 'geojson', data: geojson })
    map.value.addLayer({
      id: routeId,
      type: 'line',
      source: routeId,
      paint: { 'line-color': '#0078ff', 'line-width': 5, 'line-opacity': 0.85 }
    })
  }
  routeDrawn.value = true
  trip.value = { profile, distanceKm: route.distance / 1000, durationMin: route.duration / 60 }

  const bounds = new mapboxgl.LngLatBounds()
  route.geometry.coordinates.forEach(c => bounds.extend(c))
  map.value.fitBounds(bounds, { padding: 50 })
}

function clearRoute() {
  if (map.value?.getLayer(routeId)) map.value.removeLayer(routeId)
  if (map.value?.getSource(routeId)) map.value.removeSource(routeId)
  routeDrawn.value = false
  trip.value = null
}

function clearResults() {
  document.querySelectorAll('.poi-marker').forEach(el => el.remove())
  results.value = []
}

/* ---------- Utilities ---------- */
async function stringToLngLat(text) {
  const t = (text || '').trim()
  if (!t) return null

  const m = t.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/)
  if (m) {
    const a = parseFloat(m[1]); const b = parseFloat(m[3])
    const maybeLngLat = (Math.abs(a) <= 180 && Math.abs(b) <= 90) ? [a, b] : [b, a]
    return maybeLngLat
  }

  const feats = await geocode(t, userLngLat.value || undefined)
  return feats[0]?.center || null
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2-lat1) * Math.PI/180
  const dLon = (lon2-lon1) * Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function escapeHtml (s = '') {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;')
}
</script>

<style scoped>
.mapbox {
  width: 100%;
  height: 520px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
}

/* simple marker */
.poi-marker {
  width: 18px;
  height: 18px;
  background: #7c3aed; /* matches your theme */
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0,0,0,.2);
  cursor: pointer;
}

/* Ensure the geolocate control is visible */
:deep(.mapboxgl-ctrl-geolocate) { display: inline-flex !important; }
:deep(.mapboxgl-ctrl-top-left) { margin-top: 6px; margin-left: 6px; }
</style>
