const backBtns = document.querySelectorAll("button.back");
const graphBtn = document.querySelector("button#graph");
const printBtn = document.querySelector("button#print");
const mainElement = document.querySelector("main");
const reportTable = document.querySelector("table#reports");
const groupSummaryList = document.querySelector("ul#group-summary");
const scenariosList = document.querySelector("ol#scenarios");
const actionsTable = document.querySelector("table#actions");
const additionalInfoSection = document.querySelector("section#additional-info");
const infoHeader = additionalInfoSection.querySelector("div#header");
const testCountsLi = document.querySelector("ol#test-counts");
const allTests = document.querySelector("#All");
const tableRows = document.querySelectorAll("table#reports tbody tr");
const headerSummary = document.querySelector("header > #summary");
const mermaidDiagram = document.querySelector("div#diagramContainer");
const sideBar = document.querySelector("sidebar");
const selector = document.getElementById('diagramSelector');
const reports = document.querySelector("#reports");

/* VARIABLES */
const SCENARIOS = readJsonDataFromScript(document.querySelector("script#json-data"));
let selectedResponse = {
    coverage: 0,
    workflow: "",
    step: "",
    result: ""
};
let scrollYPosition = 0;
const groupedRows = groupRows(tableRows);

/* EVENT LISTENERS */
graphBtn.addEventListener("click", (e) => {
    mainElement.setAttribute("data-panel", "diagram");
    e.stopPropagation();
})


backBtns.forEach((btn) => btn.addEventListener("click", () => {
    goBackToTable(500, true);
}));

printBtn.addEventListener("click", () => {
    goBackToTable(500, false);
    window.print();
});

infoHeader.addEventListener("click", (event) => {
    const expand = additionalInfoSection.getAttribute("data-expand");
    additionalInfoSection.setAttribute("data-expand", expand === "true" ? "false" : "true");
})

reportTable.addEventListener("click", (event) => {
    const nearestRow = event.target?.closest("tr");

    if (nearestRow && nearestRow.parentElement?.nodeName !== "THEAD") {
        selectedResponse = extractRowValues(nearestRow);
        const summaryFragment = createResponseSummaryDetails(selectedResponse);
        groupSummaryList.replaceChildren(summaryFragment);
        const scenarios = getScenarios(selectedResponse);
        addScenariosToDetails(scenarios);
        scrollYPosition = window.scrollY;
        event.stopPropagation();
    }
});

scenariosList.addEventListener("click", (event) => {
    const target = event.target;
    const nearestListItem = target.closest("li");

    if (nearestListItem) {
        const dataExpand = nearestListItem.getAttribute("data-expand");
        nearestListItem.setAttribute("data-expand", dataExpand === "true" ? "false" : "true");
        event.stopPropagation();
    }
});

testCountsLi.addEventListener("click", (event) => {
    const target = event.target;
    const nearestListItem = target.closest("li");

    if (nearestListItem) {
        let liType = nearestListItem.getAttribute("id");
        if (reportTable.getAttribute("data-filter") === liType) {
            liType = "total";
        }

        updateTable(groupedRows[liType]);
        updateLiStyle(liType);
        reportTable.setAttribute("data-filter", liType);
        event.stopPropagation();
    }
});

/* FUNCTIONS */
function groupRows(tableRows) {
    const categories = { success: {}, error: {}, failed: {}, skipped: {}, total: {} };
    const initCategory = (category, workflow, step) => {
        category[workflow] = category[workflow] || {};
        category[workflow][step] = category[workflow][step] || [];
    };

    for (const row of tableRows) {
        const rowValues = extractRowValues(row);
        const { result, workflow, step } = rowValues;
        for (const [key, value] of Object.entries(result)) {
            if (value <= 0) continue;
            initCategory(categories[key], workflow, step);
            categories[key][workflow][step].push(rowValues);
        }

        initCategory(categories.total, workflow, step);
        categories.total[workflow][step].push(rowValues);
    }

    return categories;
}

function updateTable(groupedRows) {
    for (const row of tableRows) {
        const { workflow, step } = extractRowValues(row);
        const [coverageTd, workflowTd, stepTd, ...restTds] = Array.from(row.children);

        const showWorkflow = groupedRows[workflow] && row.getAttribute("data-main") === "true";
        const showStep = groupedRows[workflow] && groupedRows[workflow][step];

        workflowTd.classList.toggle("hidden", !showWorkflow);
        coverageTd.classList.toggle("hidden", !showWorkflow);
        stepTd.classList.toggle("hidden", !showStep);
        restTds.forEach((td) => td.classList.toggle("hidden", !showStep));
    }
}

function updateLiStyle(testType) {
    for (const li of testCountsLi.children) {
        li.classList.toggle("active", li.getAttribute("id") === testType);
    }
}


function readJsonDataFromScript(scriptElement) {
    const jsonData = scriptElement.textContent;
    return JSON.parse(jsonData || "{}");
}

function goBackToTable(timeoutToEmpty = 500, scrollBack = true) {
    mainElement.setAttribute("data-panel", "table");
    if (scrollBack) {
        window.scrollTo(0, scrollYPosition);
    }
}

function extractResultTd(td) {
    return {
        total: Number.parseInt(td.querySelector("span[data-key='total']").dataset.value),
        success: Number.parseInt(td.querySelector("span[data-key='success']").dataset.value),
        failed: Number.parseInt(td.querySelector("span[data-key='failed']").dataset.value),
        error: Number.parseInt(td.querySelector("span[data-key='error']").dataset.value),
        skipped: Number.parseInt(td.querySelector("span[data-key='skipped']").dataset.value),
    }
}

function extractRowValues(row) {
    const [coverageTd, workflowTd, stepTd, resulTd] = Array.from(row.children);
    return {
        coverage: Number.parseInt(coverageTd.textContent.trim().slice(0, -1)),
        workflow: workflowTd.querySelector("span").textContent.trim(),
        step: stepTd.textContent.trim(),
        result: extractResultTd(resulTd)
    };
}

function createResponseSummaryDetails(selectedRow) {
    const summaryFragment = document.createDocumentFragment();

    for (const [name, value] of Object.entries(selectedRow)) {
        if (name === "result") continue;
        const liElement = document.createElement("li");

        if (name === "coverage") {
            liElement.replaceChildren(...createKeyValueSpan(name, `${value}%`));
        } else {
            liElement.replaceChildren(...createKeyValueSpan(name, value));
        }

        summaryFragment.appendChild(liElement);
    }

    return summaryFragment;
}

function createKeyValueSpan(key, value, valueType = "span") {
    const keySpan = document.createElement("span");
    const valueSpan = document.createElement(valueType);
    keySpan.textContent = key;
    valueSpan.textContent = value;
    valueSpan.setAttribute("title", value);
    return [keySpan, valueSpan];
}

function getScenarios(groupValues) {
    return SCENARIOS[groupValues.workflow][groupValues.step].filter((e) => {
        if (reports.dataset.filter === "total") return true;
        return e.testResult === reports.dataset.filter;
    });
}

function addScenariosToDetails(scenarios) {
    try {
        if (scenarios.length === 0) throw new Error("No scenarios found");
        const docFragment = document.createDocumentFragment();
        for (const scenario of scenarios) {
            const scenarioLi = createScenarioLi(scenario);
            docFragment.appendChild(scenarioLi);
        }
        scenariosList.replaceChildren(docFragment);
    } catch (e) {
        scenariosList.replaceChildren("No scenarios found");
    } finally {
        scrollYPosition = window.scrollY;
        window.scrollTo(0, 0);
        mainElement.setAttribute("data-panel", "details");
    }
}

function createScenarioLi(scenario) {
    const scenarioLi = document.createElement("li");
    scenarioLi.classList.add("scenario");
    scenarioLi.setAttribute("data-expand", "false");

    const scenarioSummary = createScenarioInformation(scenario);
    const scenarioReqRes = createScenarioReqRes(scenario);
    scenarioLi.appendChild(scenarioSummary);
    scenarioLi.appendChild(scenarioReqRes);
    return scenarioLi;
}

function createScenarioInformation(scenario) {
    const scenarioInfoDiv = document.createElement("div");
    scenarioInfoDiv.classList.add("scenario-summary");

    const scenarioName = document.createElement("p");
    scenarioName.textContent = `${scenario.testDescription}`;

    const scenarioDuration = document.createElement("span");
    scenarioDuration.textContent = scenario.responseTime ? `${scenario.responseTime - scenario.requestTime}ms` : "0ms";

    const scenarioResult = document.createElement("span");
    scenarioResult.classList.add("pill", getColor(scenario.testResult));
    scenarioResult.textContent = scenario.testResult;

    const badgeDiv = document.createElement("div");
    badgeDiv.appendChild(scenarioDuration);
    badgeDiv.appendChild(scenarioResult);

    scenarioInfoDiv.appendChild(scenarioName);
    scenarioInfoDiv.appendChild(badgeDiv);

    return scenarioInfoDiv;
}

function createScenarioReqRes(scenario) {
    const reqResDetailsDiv = document.createElement("div");
    reqResDetailsDiv.classList.add("req-res");

    const additionalInfoDiv = document.createElement("div");
    additionalInfoDiv.classList.add("additional-info");
    additionalInfoDiv.appendChild(createParagraphWithSpan("Request URL", scenario.apiInformation.baseUrl));
    additionalInfoDiv.appendChild(createParagraphWithSpan("Specification File", scenario.apiInformation.apiName));
    additionalInfoDiv.appendChild(createParagraphWithSpan("Specification Source", scenario.apiInformation.source));
    reqResDetailsDiv.appendChild(additionalInfoDiv);

    reqResDetailsDiv.appendChild(createReqResDetailDiv("Details", "", scenario.result || `${scenario.testDescription} ${getSuffixed(scenario.testResult)}`));
    reqResDetailsDiv.appendChild(createReqResDetailDiv("Request", scenario.requestTime, scenario.request));
    reqResDetailsDiv.appendChild(createReqResDetailDiv("Response", scenario.responseTime, scenario.response));

    return reqResDetailsDiv;
}

function createReqResDetailDiv(title, epochTime, content) {
    const elementDiv = document.createElement("div");
    elementDiv.classList.add("req-res-detail");

    const titleDiv = document.createElement("div");
    titleDiv.classList.add("title");
    titleDiv.appendChild(document.createElement("p")).textContent = title;
    if (epochTime) {
        titleDiv.appendChild(document.createElement("span")).textContent = `at ${epochToDateTime(epochTime)}`;
    }

    elementDiv.appendChild(titleDiv);

    const elementPre = document.createElement("pre");
    elementDiv.appendChild(elementPre).textContent = content || "N/A";

    return elementDiv;
}

function epochToDateTime(epoch) {
    if (epoch === 0) return "N/A";
    return new Date(epoch).toISOString();
}

function createParagraphWithSpan(title, value) {
    const p = document.createElement("p");
    const span = document.createElement("span");
    span.textContent = value;
    p.textContent = `${title}: `;
    p.appendChild(span);
    return p;
}

function getColor(result) {
    switch (result) {
        case "success":
            return "green";
        case "skipped":
            return "yellow";
        default:
            return "red";
    }
}

function getSuffixed(testResult) {
    switch (testResult) {
        case "success":
            return "has Succeeded";
        case "skipped":
            return "has been Skipped";
        default:
            return "has Failed";
    }
}

const ExtractionLevel = Object.freeze({
    WORKFLOW: "WORKFLOW",
    STEP: "STEP",
    ACTION: "ACTION"
});

window.addEventListener("click", (event) => {
    if (!sideBar.contains(event.target)) {
        sideBar.setAttribute("data-open", "false");
    }
});

mermaidDiagram?.addEventListener("click", (event) => {
    const node = event.target?.closest("g.node.default");
    if (!node) return;

    const [, body = ""] = node.getAttribute("id")?.split("-") ?? [];
    const [workflow, stepKey, actionName] = body.split("_");
    const workflowData = SCENARIOS?.[workflow];
    if (!workflowData) return;

    const steps = stepKey ? workflowData?.[stepKey] : undefined;
    const selectedContext = selector.value;
    const stepObj = steps?.find(
        (s) => s?.inputContext?.contextName === selectedContext
    );

    let level;
    let data;
    if (actionName) {
        level = ExtractionLevel.ACTION;
        data = stepObj?.actionResults?.find((ar) => ar?.action?.name === actionName);
    } else if (stepKey) {
        level = ExtractionLevel.STEP;
        data = stepObj;
    } else {
        level = ExtractionLevel.WORKFLOW;
        data = workflowData;
    }

    if (!data) return;
    updateSideBar(data, level, stepObj?.context);
    sideBar.setAttribute("data-open", "true");
    event.stopPropagation();
});

function updateSideBar(data, level, context) {
    switch (level) {
        case ExtractionLevel.WORKFLOW:
            updateWithWorkflow(data);
            break;
        case ExtractionLevel.STEP:
            updateWithStep(data);
            break;
        case ExtractionLevel.ACTION:
            updateWithAction(data, context);
            break;
    }
    sideBar?.scrollTo(0, 0);
}

function updateWithAction(action, context) {
    const actionInfo = action.action
    const fragment = document.createDocumentFragment();

    fragment.appendChild(createWitHeading("Action",  extractActionInfo(action)));
    fragment.appendChild(createWitHeading("Criteria", actionInfo.criteria));
    fragment.appendChild(createWitHeading("Context", context, true));

    sideBar.replaceChildren(fragment);
}

function updateWithStep(step) {
    const fragment = document.createDocumentFragment();

    fragment.appendChild(createWitHeading("Step", {
        name: step.step,
        workflow: step.workflow,
        testResult: step.testResult
    }));
    fragment.appendChild(createWitHeading("Criteria", step.criteriaResults.map((it) => {return { ...it.criteria, satisfied: it.satisfied }}) || []));
    fragment.appendChild(createWitHeading("API Information", step.apiInformation));

    fragment.appendChild(createWitHeading("OnSuccess",
        step.actionResults.filter((action) => action.type === "onSuccess").map((action) => extractActionInfo(action))
    ));
    fragment.appendChild(createWitHeading("OnFailure",
        step.actionResults.filter((action) => action.type === "onFailure") .map((action) => extractActionInfo(action))
    ));

    fragment.appendChild(createWitHeading("Context", step.context, true));

    sideBar.replaceChildren(fragment);
}

function extractActionInfo(action) {
    return {
        name: action.action.name,
        type: action.action.type,
        stepId: action.action.stepId,
        workflowId: action.action.workflowId,
        satisfied: action.instruction != null
    }
}

function updateWithWorkflow(workflow) {
    const fragment = document.createDocumentFragment();
    const firstStep = workflow[Object.keys(workflow)[0]][0];

    fragment.appendChild(createWitHeading("Workflow", {name: firstStep.workflow, totalSteps: Object.keys(workflow).length}));
    fragment.appendChild(createWitHeading("Steps",
        Object.values(workflow).map((step) => {
            return { name: step.at(-1).step, ...step.at(-1).apiInformation }
        })
    ));


    sideBar.replaceChildren(fragment);
}

function createWitHeading(heading, data, toPre=false) {
    const groupDiv = document.createElement("div");
    groupDiv.classList.add("info", "sub-info");

    const headingPara = document.createElement("p");
    headingPara.textContent = heading;
    groupDiv.appendChild(headingPara);


    if (toPre) {
        const preElement = document.createElement("pre");
        preElement.classList.add("scrollable");
        preElement.textContent = JSON.stringify(data, null, 2);
        groupDiv.appendChild(preElement);
    } else {
        const dataFragment = dataToList(data);
        groupDiv.appendChild(dataFragment);
    }

    return groupDiv;
}

function dataToList(data) {
    const fragment = document.createDocumentFragment();
    const ulElement = document.createElement("ul");

    if (Array.isArray(data) && data.length === 0) {
        const liElement = document.createElement("li");
        liElement.textContent = "NONE";
        ulElement.appendChild(liElement);
        fragment.appendChild(ulElement);
        return fragment;
    }

    if (Array.isArray(data)) {
        const lastIndex = data.length - 1;
        for (let i = 0; i < data.length; i++) {
            const nestedFragment = dataToList(data[i]);
            const nestedUl = nestedFragment.firstElementChild;
            ulElement.append(...nestedUl.children);
            i < lastIndex && ulElement.appendChild(document.createElement("hr"));
        }
        fragment.appendChild(ulElement);
        return fragment;
    }

    for (const [key, value] of Object.entries(data)) {
        const liElement = document.createElement("li");
        const adjustedValue = value == null ? "none" : value;
        liElement.replaceChildren(...createKeyValueSpan(key, adjustedValue, "abbr"));
        ulElement.appendChild(liElement);
    }
    fragment.appendChild(ulElement);
    return fragment;
}

const updateCountsVisibility = () => {
  const filter = reports.dataset.filter;
  reports.querySelectorAll(".count").forEach(count => {
    if (!count.dataset.wasHidden) count.dataset.wasHidden = count.classList.contains("hidden");
    if ((filter === count.dataset.key || filter === "total") && count.dataset.wasHidden !== "true") {
      count.classList.remove("hidden");
    } else {
      count.classList.add("hidden");
    }
  });
};

new MutationObserver(updateCountsVisibility).observe(reports, { attributes: true, attributeFilter: ["data-filter"] });
