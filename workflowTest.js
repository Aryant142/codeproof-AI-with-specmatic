/** @type {Map<HTMLElement, TableMaker>} */
const screenToWorkflowTestTableMaker = new Map();
/** @type {Map<HTMLElement, DrillDown>} */
const screenToWorkflowTestDrillDown = new Map();
/** @type {Map<HTMLElement, TableFilter>} */
const screenToWorkflowTableFilter = new Map();
/** @type {Map<HTMLElement, MermaidDrillDown>} */
const screenToMermaidDrillDown = new Map();

async function clearWorkflowTestFor(screen) {
    if (!screenToWorkflowTestTableMaker.has(screen)) return;
    screenToWorkflowTestTableMaker.get(screen).destroy();
    screenToWorkflowTestTableMaker.delete(screen);
    await initWorkflowTest(screen);
}

async function initWorkflowTest(screen) {
    await init({
        screen,
        tab: screen.querySelector(".details .test"),
        withSelection: false,
        tableStore: screenToWorkflowTestTableMaker,
        filterStore: screenToWorkflowTableFilter,
        groupBy: new Set(["workflow", "step"])
    });
}

async function runWorkflowTest(screen) {
    const path = screen.id;
    run({
        screen,
        tab: screen.querySelector(".details .test"),
        tableStore: screenToWorkflowTestTableMaker,
        drillDownStore: screenToWorkflowTestDrillDown,
        filterStore: screenToWorkflowTableFilter,
        getEventId: async () => await getWorkflowTestEventId(screen, path),
        onDrillDown: getWorkflowTestDetails,
        groupBy: new Set(["workflow", "step"]),
        onEnd: (eventId) => {
            const drillDown = getOrPut({
                cache: screenToMermaidDrillDown,
                key: screen,
                defaultValue: () => new MermaidDrillDown({
                    eventId: eventId,
                    container: screen.querySelector(".test .diagrams")
                })
            });
            drillDown.reset(eventId);
            screen.querySelector(".details .test table").setAttribute("data-diagrams", "true")
        }
    })
}

/**
 * @param {HTMLElement} screen
 * @param {String} path
 * @returns {Promise<{eventId: String}>}
 */
async function getWorkflowTestEventId(screen, path) {
    const serverPicker = screen.querySelector(".details .test server-picker");
    const servers = serverPicker.getServers();
    const { data, error } = await makeHttpCall("/workflow/test", { method: "POST", body: { path, servers } });
    if (error) {
        screen.querySelector(".details .test button.run").setAttribute("data-running", "false");
        createAlert({ title: "Failed to run workflow tests", message: error, type: "error" });
        throw new Error(error);
    }

    screen.querySelector(".details .test table").setAttribute("data-diagrams", "false");
    return { eventId: data.id };
}

/**
 * @param {Object} options
 * @param {String} options.eventId
 * @param {Object} options.data
 * @param {String?} options.filter
 * @returns {Promise<Object[]?>}
 */
async function getWorkflowTestDetails({ eventId, data, filter }) {
    const { data: details, error } = await makeHttpCall(`/workflow/${eventId}`, { method: "POST", body: data });
    if (error) {
        createAlert({ title: "Failed to get endpoint details", message: error, type: "error" });
        return null;
    }

    if (!filter || filter === "total") return details;
    return details.filter(d => d.result.toLowerCase() === filter.toLowerCase());
}
