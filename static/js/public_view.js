(function () {
  const container = document.getElementById("public-zones-container");
  const emptyState = document.getElementById("public-zones-empty");
  const errorBox = document.getElementById("public-zones-error");
  const lastUpdated = document.getElementById("public-last-updated");

  if (!container) {
    return;
  }

  const eventId = container.dataset.eventId;

  function zoneCardMarkup(zone) {
    return `
      <article class="card card-subtle">
        <div class="event-row">
          <div>
            <h3 class="subsection-title">${zone.zone_name}</h3>
            <div class="detail-row">
              <span class="detail-chip">Current: ${zone.current_count}</span>
              <span class="detail-chip">Capacity: ${zone.capacity}</span>
            </div>
          </div>
          <span class="status-badge status-${zone.public_color}">${zone.public_status}</span>
        </div>
        <p class="alert-text">Guidance: ${zone.public_status}</p>
      </article>
    `;
  }

  function renderZones(zones) {
    container.innerHTML = "";

    if (!zones.length) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";
    container.innerHTML = zones.map(zoneCardMarkup).join("");
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
  }

  function clearError() {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }

  async function refreshZones() {
    try {
      const response = await fetch(`/api/public_zones/${eventId}`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Public crowd feed is temporarily unavailable.");
      }

      const data = await response.json();
      renderZones(data.zones || []);
      lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
      clearError();
    } catch (error) {
      showError(error.message);
    }
  }

  refreshZones();
  setInterval(refreshZones, 3000);
})();
