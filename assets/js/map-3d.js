// Map 3D Manager
// "3D mode" in Leaflet raster maps = pitch simulation via CSS perspective on the MAP WRAPPER
// (not the tile pane — that causes the tile filter/contrast bug).
// All injected <style> tags are tracked and removed on disable3DMode().
class Map3DManager {
  constructor() {
    this.is3DMode = false;
    this.bearing   = 0;
    this.tiltAngle = 45;
    this._injectedStyles = []; // track every <style> we inject so we can clean up
    this._savedWrapperStyle = null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  enable3DMode() {
    if (this.is3DMode) return;
    this.is3DMode = true;
    this._apply3DWrapper();
    this._injectRouteStyle();
    console.log('3D navigation mode enabled');
  }

  disable3DMode() {
    if (!this.is3DMode) return;
    this.is3DMode = false;
    this._reset3DWrapper();
    this._removeAllInjectedStyles();
    console.log('3D navigation mode disabled');
  }

  updateBearing(heading) {
    if (!this.is3DMode) return;
    const target = ((heading % 360) + 360) % 360;
    let diff = target - this.bearing;
    if (diff >  180) diff -= 360;
    if (diff < -180) diff += 360;
    this.bearing = ((this.bearing + Math.max(-5, Math.min(5, diff))) % 360 + 360) % 360;
    this._apply3DWrapper();
  }

  adjustTilt(angle) {
    this.tiltAngle = Math.max(0, Math.min(55, angle));
    if (this.is3DMode) this._apply3DWrapper();
  }

  followUserLocation(lat, lng, heading = 0) {
    if (!this.is3DMode || !window.mapManager) return;
    window.mapManager.map.panTo([lat, lng], { animate: true, duration: 0.8 });
    this.updateBearing(heading);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  // Apply perspective tilt to the map WRAPPER div (not the Leaflet tile pane).
  // This keeps tiles rendering normally; the tilt is purely visual on the container.
  _apply3DWrapper() {
    const wrapper = document.getElementById('map');
    if (!wrapper) return;

    // Scale up slightly so tilted edges don't show white gaps
    const scale = 1.15;
    const tilt  = Math.min(this.tiltAngle, 20); // cap at 20° to keep tiles visible

    wrapper.style.transform       = `perspective(1800px) rotateX(${tilt}deg) rotateZ(${-this.bearing}deg) scale(${scale})`;
    wrapper.style.transformOrigin = '50% 60%';
    wrapper.style.transition      = 'transform 0.4s ease-out';
    wrapper.classList.add('map-3d-active');
  }

  _reset3DWrapper() {
    const wrapper = document.getElementById('map');
    if (!wrapper) return;
    wrapper.style.transform       = '';
    wrapper.style.transformOrigin = '';
    wrapper.style.transition      = '';
    wrapper.classList.remove('map-3d-active');

    // Force Leaflet to recalculate its container size
    setTimeout(() => {
      if (window.mapManager && window.mapManager.map) {
        window.mapManager.map.invalidateSize();
      }
    }, 450);
  }

  // Inject a <style> and track it so disable3DMode can remove it
  _injectStyle(id, css) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
    this._injectedStyles.push(id);
  }

  _removeAllInjectedStyles() {
    this._injectedStyles.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    this._injectedStyles = [];
  }

  _injectRouteStyle() {
    this._injectStyle('map3d-route', `
      .map-3d-active .leaflet-overlay-pane path {
        filter: drop-shadow(0 3px 8px rgba(26,115,232,0.45));
      }
      .map-3d-active .leaflet-marker-icon {
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));
      }
    `);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.map3DManager = new Map3DManager();
});
