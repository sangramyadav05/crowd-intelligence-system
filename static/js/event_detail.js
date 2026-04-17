(function () {
  const container = document.getElementById("zones-container");
  const emptyState = document.getElementById("zones-empty");
  const errorBox = document.getElementById("zones-error");
  const lastUpdated = document.getElementById("last-updated");

  if (!container) {
    return;
  }

  const eventId = container.dataset.eventId;
  const editTemplate = container.dataset.editTemplate;
  const deleteTemplate = container.dataset.deleteTemplate;

  function zoneCardMarkup(zone) {
    const progress = Math.min(zone.occupancy_percent, 100);
    const editUrl = `${editTemplate}${zone.id}`;
    const deleteUrl = `${deleteTemplate}${zone.id}`;

    return `
      <article class="card card-subtle">
        <div class="event-row">
          <div>
            <h3 class="subsection-title">${zone.zone_name}</h3>
            <div class="detail-row">
              <span class="detail-chip">Current: ${zone.current_count}</span>
              <span class="detail-chip">Capacity: ${zone.capacity}</span>
              <span class="detail-chip">Occupancy: ${zone.occupancy_percent}%</span>
            </div>
          </div>
          <span class="status-badge status-${zone.organizer_color}">${zone.organizer_alert}</span>
        </div>
        <div class="progress-shell">
          <div class="progress-bar progress-${zone.organizer_color}" style="width: ${progress}%"></div>
        </div>
        <p class="alert-text">System assessment: ${zone.organizer_alert}</p>
        <div class="action-row">
          <a class="inline-link" href="${editUrl}">Edit</a>
          <form method="post" action="${deleteUrl}" onsubmit="return confirm('Delete this zone?');">
            <button class="ghost small-button" type="submit">Delete</button>
          </form>
        </div>
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

  function markUpdated() {
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
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
      const response = await fetch(`/api/update_crowd/${eventId}`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Live zone refresh failed.");
      }

      const data = await response.json();
      renderZones(data.zones || []);
      markUpdated();
      clearError();
    } catch (error) {
      showError(error.message);
    }
  }

  renderZones(window.initialZones || []);
  refreshZones();
  setInterval(refreshZones, 3000);
})();
