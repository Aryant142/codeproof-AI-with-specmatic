const PROTOCOL = window.location.protocol === "https:" ? "https" : "http";
const WS_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws"; // retained if other code still references
const BASE_URL = `${PROTOCOL}://${window.location.host}/_specmatic/studio`;
let lockAlertsUntil = 0;

function showLogoutPopupAndRedirect() {
    const popup = document.createElement('div');
    popup.id = 'logout-popup';
    popup.textContent = "You've been logged out. Redirecting to the login page..";

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.classList.add('show');
    }, 10);

    setTimeout(() => {
        window.location.href = '/auth/login';
    }, 3000);
}

/**
 * @param {string} endpoint
 * @param {object} options
 * @param {string} options.method
 * @param {string?} [options.baseUrl]
 * @param {object?} [options.body]
 * @param {object?} [options.queryParams]
 * @returns {Promise<{data: any, error: any}>}
 */
async function makeHttpCall(endpoint, { method, body, baseUrl, queryParams }) {
    if (!endpoint) throw new Error("Endpoint is required");
    if (!method) throw new Error("HTTP method is required");

    const url = new URL(`${baseUrl || BASE_URL}${endpoint}`);
    if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => url.searchParams.append(key, value));
    }

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const fetchOptions = {
        method,
        headers: isFormData ? undefined : body ? { "Content-Type": "application/json" } : undefined,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    };

    try {
        const resp = await fetch(url.toString(), fetchOptions);
        const contentType = resp.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await resp.json() : await resp.text();

        if(resp.status == 401) {
            showLogoutPopupAndRedirect();
            return null;
        }

        if (!resp.ok) {
            const errorMsg = (data?.message) || data || "Something went wrong";
            return { data: null, error: errorMsg };
        }

        return { data, error: null };
    } catch (err) {
        return { data: null, error: err.message || "Something went wrong" };
    }
}

/**
 * @param {object} options
 * @param {string} options.title
 * @param {string?} [options.message]
 * @param {"info"|"error"|"success"} options.type="info"
 * @param {number?} [options.duration]
 */
function createAlert({ title, message, type = "info", duration = null, lockForMs = null }) {
    const stdout = type === "error" ? console.error : console.log;
    stdout(`${title}: ${message}`)

    const now = Date.now();
    if (now < lockAlertsUntil) {
        console.debug(`Skipping alert until ${lockAlertsUntil}`)
        return
    };

    const alertBox = document.createElement("div");
    alertBox.classList.add("alert-msg", "slide-in-left", type);

    const alertTitle = document.createElement("p");
    alertTitle.textContent = title;

    const alertMsg = document.createElement("pre");
    alertMsg.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.textContent = "×";

    closeButton.onclick = () => {
        alertBox.classList.add("slide-out-left");
        setTimeout(() => { alertBox.remove() }, 250);
        lockAlertsUntil = 0;
    }

    alertBox.appendChild(closeButton);
    alertBox.appendChild(alertTitle);
    alertBox.appendChild(alertMsg);
    alertContainer?.replaceChildren(alertBox);

    if (lockForMs) {
        lockAlertsUntil = now + lockForMs;
        setTimeout(() => { lockAlertsUntil = 0; }, lockForMs);
    } else if (duration) {
        setTimeout(() => closeButton.click(), duration);
    }
}

/**
 * @param {function} callback
 * @param {number} wait
 * @returns {function}
 */
const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback(...args);
        }, wait);
    };
}

const leadingKeyedDebounce = (func, wait, getKey, immediate = true) => {
    const timeouts = new Map();
    return (...args) => {
        const key = getKey(...args);
        if (!key) return;
        if (timeouts.has(key)) return;
        if (immediate) func(...args);

        timeouts.set(
            key,
            setTimeout(() => {
                timeouts.delete(key);
                if (!immediate) func(...args);
            }, wait)
        );
    };
};

async function uploadFiles() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".json, .yaml, .yml";

    input.onchange = async () => {
        const files = input.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (const file of files) formData.append("files", file);

        try {
            const { data: { imported, disposed }, error } = await makeHttpCall("/specifications/import", { method: "POST", body: formData });
            if (error) {
                createAlert({ title: "Failed to import files", message: error, type: "error" });
                return;
            }

            for (const node of imported) addNode({ ...node, highlight: false })
            if (disposed.length === 0) {
                createAlert({ title: "Files imported", type: "success", duration: 2000 });
                return;
            }

            createAlert({ title: "File import errors", message: disposed.join("\n"), type: "error" });
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    input.click();
}

function getParentPath(path) {
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  if (lastSlash === -1) return '';
  return path.slice(0, lastSlash);
}

function objectsEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
        if (obj1[key] !== obj2[key]) return false;
    }
    return true;
}

const titleCase = (value) => value.toLowerCase().replace(/^./, c => c.toUpperCase());
