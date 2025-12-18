document.addEventListener('DOMContentLoaded', function () {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const fileInput = document.getElementById('csvFile');
            const file = fileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/analysis/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const err = await response.json();
                    alert('Error: ' + err.detail);
                    return;
                }

                const data = await response.json();
                displayResults(data);
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during upload.');
            }
        });
    }

    const simulateBtn = document.getElementById('simulateBtn');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', async function () {
            const message = document.getElementById('marketingMessage').value;
            if (!message) {
                alert('Please enter a message.');
                return;
            }

            // We need current personas to simulate. 
            // For simplicity, we assume they are stored in a global variable or we re-fetch/pass them.
            // Here we will just use the ones currently displayed if we had a way to get them back,
            // or better, the API should handle it if we had a session/ID.
            // Since this is MVP and stateless, let's just assume we send the personas back or the server remembers (server doesn't remember in this code).
            // So we need to store 'currentPersonas' when we get them.

            if (!window.currentPersonas) {
                alert('Please analyze data first.');
                return;
            }

            try {
                const response = await fetch('/api/analysis/simulate-message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: message,
                        personas: window.currentPersonas
                    })
                });

                const results = await response.json();
                displaySimulationResults(results);
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }
});

function displayResults(data) {
    document.getElementById('resultsSection').classList.remove('d-none');
    document.getElementById('summaryAlert').textContent = `Successfully analyzed ${data.total_users} users. Identified ${data.clusters} distinct personas.`;

    window.currentPersonas = data.personas; // Store for simulation

    const container = document.getElementById('personasContainer');
    container.innerHTML = '';

    data.personas.forEach(p => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
            <div class="card persona-card h-100">
                <div class="card-body">
                    <h5 class="card-title">${p.name}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${p.summary}</h6>
                    <p class="card-text"><strong>Motivation:</strong> ${p.motivation}</p>
                    <p class="card-text"><strong>Risk:</strong> ${p.risk_signal}</p>
                    <p class="card-text"><strong>Content:</strong> ${p.content_preference}</p>
                    <div class="feature-list">
                        <small>Avg Features: ${JSON.stringify(p.features).substring(0, 50)}...</small>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function displaySimulationResults(results) {
    const container = document.getElementById('simulationResults');
    container.innerHTML = '<h4>Simulation Results</h4>';

    results.forEach(r => {
        const div = document.createElement('div');
        div.className = `alert alert-${r.reaction === 'Positive' ? 'success' : r.reaction === 'Negative' ? 'danger' : 'secondary'}`;
        div.innerHTML = `
            <strong>Persona Type ${r.persona_id + 1}:</strong> ${r.reaction}
            <br>
            <small>${r.reason}</small>
            <br>
            <small><em>Suggestion: ${r.suggestion}</em></small>
        `;
        container.appendChild(div);
    });
}
