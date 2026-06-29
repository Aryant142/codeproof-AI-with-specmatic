let unsubscribeProcess;
let numberOfCards = 0;
const noTabsElement = document.getElementById('no-tabs');
// Removed activeProcIds and isProcActive tracking as per refactor
(() => subscribeProcessEvents())();
hydrateProcessEvents();

// --- Reset Utilities (invoked on WATCHER_RESET) ---
function resetProcessUI() {
    try {
        const tabsList = document.getElementById('tabs-list');
        if (tabsList) {
            while (tabsList.firstChild) tabsList.removeChild(tabsList.firstChild);
        }
        numberOfCards = 0;
        const badge = document.getElementById('activity-badge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
            badge.classList.remove('pulse-animation');
        }
        if (noTabsElement) {
            // Show placeholder again if you have one; if not present this is a no-op
            noTabsElement.style.display = '';
        }
        const exportBtn = document.getElementById('exportSpecmaticBtn');
        if (exportBtn) exportBtn.style.display = 'none';
    } catch (e) {
        console.warn('Failed to reset process UI', e);
    }
}
// Expose for centralized reset handler
window.resetProcessUI = resetProcessUI;

function subscribeProcessEvents() {
    if (unsubscribeProcess) unsubscribeProcess();
    unsubscribeProcess = SseEventStreamer.subscribe({
        eventId: 'process',
        callbacks: {
            onData: async (data) => {
                handleProcEvent(data);
            },
            onError: (err) => {
                createAlert({ title: 'SSE Error', message: 'Failed to receive process events', type: 'error' });
            }
        }
    });
    window.addEventListener('beforeunload', () => unsubscribeProcess && unsubscribeProcess());
}

async function hydrateProcessEvents() {
    try {
        const { data, error } = await makeHttpCall("/process/events", { method: "GET" });
        if (error) return; // Silent fail; real-time SSE will still populate new events
        if (!Array.isArray(data)) return;
        for (const event of data) {
            try { await handleProcEvent({ ...event, hydrateEvent: true }); } catch { /* ignore individual failures */ }
        }
    } catch (e) {
        console.warn("Failed to hydrate process events", e);
    }
}

async function handleProcEvent(payload) {
    const { type, id, specPath, port, remove, removeScreen, errorMessage, hydrateEvent } = payload;
    if (remove && type === 'PROXY') {
        await updateProxyFormStatus();
    }

    if (type === 'MOCK' || type === 'REPLAY') {
        await hydrateMockEvents(payload);
    }

    if(!specPath) return;
    const className = `${type.toLowerCase()}-bar`;
    const status = !remove ? "running" : "stopped";
    
    if (remove) {
        const groupId = `accordion-group-${type}`;
        const group = document.getElementById(groupId);
        if (group) {
            const groupContent = group.querySelector('.accordion-content');
            const cards = groupContent.querySelectorAll(`.${className}`);
            cards.forEach(card => {
                const match = (type === 'PROXY') ? card.getAttribute('data-spec-path') === specPath : card.getAttribute('data-id') === id;
                if (!match) return;
                if (removeScreen) {
                    card.remove();
                    numberOfCards = Math.max(0, numberOfCards - 1);
                } else {
                    const status = (type === 'TEST') ? "done" : "stopped";
                    updateCard(card, type, port, getSpecName(specPath), status);
                }
            });
        }

        updateBadge(numberOfCards);
        if (numberOfCards === 0 && noTabsElement) noTabsElement.style.display = '';
        return;
    }
    
    const groupContent = ensureAccordionGroup(type);
    const cards = groupContent.querySelectorAll(`.${className}`);
    let updated = false;
    const title = type === 'PROXY' ? specPath : getSpecName(specPath);
    let updatedCard = null;
    
    cards.forEach(card => {
        if (card.getAttribute('data-spec-path') === specPath) {
            updateCard(card, type, port, title, status);
            if (id) card.setAttribute('data-id', id);
            updated = true;
            updatedCard = card;
        }
    });
    
    const updatedActivityBadgeAndHighlight = (card) => {
        if (!card) return;
        updateBadge(numberOfCards);
        animateBadgeTemporarily();
        setTimeout(() => {
            card.classList.add('highlight');
            setTimeout(() => {
                card.classList.remove('highlight');
            }, 4000);
        }, 400);
    };
    
    if (updated) {
        updatedActivityBadgeAndHighlight(updatedCard);
    } else {
        const card = buildCard(type, id, specPath, port, title, status);
        card.onclick = () => {
            Workspace.switchTo(type === 'PROXY' ? 'proxy' : specPath, true);
            if (type !== 'PROXY') {
                const normalizedType = type === "REPLAY" ? "MOCK" : type
                Workspace.setScreenActive(specPath, normalizedType.toLowerCase());
            }
        };
        if (type === 'PROXY') card.id = 'proxy-card';
        noTabsElement.style.display = 'none';
        groupContent.prepend(card);
        updatedActivityBadgeAndHighlight(card);
    }

    // Show export link after first MOCK or TEST appears
    if (!remove && (type === 'MOCK' || type === 'TEST')) {
        const exportBtn = document.getElementById('exportSpecmaticBtn');
        if (exportBtn && exportBtn.style.display !== 'inline') {
            exportBtn.style.display = 'inline';
        }
    }
}

async function hydrateMockEvents(payload) {
    const { id, specPath, port, remove, removeScreen, errorMessage, hydrateEvent, type } = payload;
    if (remove === true && typeof onMockProcessStopped === 'function') {
        if (errorMessage && !hydrateEvent) createAlert({ title: "Mock Server Stopped", message: errorMessage, type: "error", lockForMs: 2000 });
        onMockProcessStopped({ eventId: id, specPath });
        if (removeScreen) onMockScreenRemoved({ specPath })
        return;
    }

    if (remove === undefined && type === "REPLAY" && typeof onMockProcessStarted === "function") {
        if (errorMessage && !hydrateEvent) {
            createAlert({title: "Failed to start Server", message: errorMessage, type: "error", lockForMs: 2000})
            return;
        }

        await waitForPath({ path: specPath, maxWait: 10000 });
        await onMockProcessStarted({ eventId: id, specPath, port, type });
    }
}

function updateCard(card, type, port, title, status) {
    card.className = `process-bar ${type.toLowerCase()}-bar ${status}-bar`;
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const dotClass = status === "running" ? "green-dot" : "red-dot";
    const portHtml = port ? `<div class="process-port">Port: ${port}</div>` : '';
    card.innerHTML = `
        <div class="process-bar-content">
            <div class="process-title-col">
                <div class="process-title">${title}</div>
                ${portHtml}
            </div>
            <div class="status-col">
                <span class="${dotClass}"></span>
                <span class="status-text">${statusText}</span>
            </div>
        </div>
    `;
}

function buildCard(type, id, specPath, port, title, status) {
    const card = document.createElement('div');
    card.className = `process-bar ${type.toLowerCase()}-bar ${status}-bar`;
    card.style.cssText = 'cursor:pointer;';
    if (id) card.setAttribute('data-id', id);
    if (specPath) card.setAttribute('data-spec-path', specPath);
    updateCard(card, type, port, title, status);
    
    card.addEventListener('mouseenter', () => card.classList.add('hover'));
    card.addEventListener('mouseleave', () => card.classList.remove('hover'));
    numberOfCards++;
    return card;
}

function getSpecName(path) {
    return path.split('/').pop().split('\\').pop();
}

// Map type to icon filename
const typeIcons = {
    MOCK: 'static/mock-icon.svg',
    TEST: 'static/test-icon.svg',
    PROXY: 'static/proxy-icon.svg',
    REPLAY: 'static/mock-icon.svg'
};

const typeToTitles = {
    MOCK: "Mock",
    TEST: "Test",
    PROXY: "Live Proxy",
    REPLAY: "Replay Proxy"
};

function iconImgFor(type) {
    const iconPath = typeIcons[type.toUpperCase()];
    const iconImg = document.createElement('img');
    iconImg.src = iconPath;
    iconImg.alt = `${type} icon`;
    iconImg.className = 'accordion-type-icon';
    return iconImg;
}

function ensureAccordionGroup(type) {
    const sidebar = document.querySelector('#tabs-list');
    const groupId = `accordion-group-${type}`;
    let group = document.getElementById(groupId);
    if (!group) {
        group = document.createElement('div');
        group.id = groupId;
        group.className = 'accordion-group';
        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.tabIndex = 0;
        header.setAttribute('role', 'button');
        header.setAttribute('aria-expanded', 'true');

        const typeTitle = typeToTitles[type.toUpperCase()];
        header.innerHTML = '';
        header.appendChild(iconImgFor(type));
        header.appendChild(document.createTextNode(' ' + typeTitle));

        const content = document.createElement('div');
        content.className = 'accordion-content';
        header.onclick = () => {
            const expanded = header.getAttribute('aria-expanded') === 'true';
            header.setAttribute('aria-expanded', String(!expanded));
            content.style.display = expanded ? 'none' : 'block';
        };
        group.appendChild(header);
        group.appendChild(content);
        sidebar.appendChild(group);
    }
    return group.querySelector('.accordion-content');
}
