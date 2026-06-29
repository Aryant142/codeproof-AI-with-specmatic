/**
 * Kafka Async Producer for Specmatic Mock Usage
 * ------------------------------------------------
 * Publishes valid test messages to all 4 Kafka topics defined in
 * specs/asyncapi/analysis.yaml so the Specmatic async stub marks
 * every operation as "used" and generates a 100% Mock Usage Report.
 *
 * Topics covered:
 *   1. new-analyses       (submitAnalysis - send)
 *   2. wip-analyses       (submitAnalysis reply - receive)
 *   3. accepted-analyses  (reportGenerated - receive)
 *   4. completed-analyses (processingCompleted - send)
 */

const { Kafka } = require("kafkajs");
const { v4: uuidv4 } = require("uuid");

const BROKER = process.env.KAFKA_BROKER || "kafka:29092";
const DELAY_MS = 2000; // Wait between each publish for Specmatic to track it

const kafka = new Kafka({
  clientId: "specmatic-async-producer",
  brokers: [BROKER],
  retry: { retries: 5 },
});

const producer = kafka.producer();

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function sendMessage(topic, key, headers, value) {
  console.log(`\n📤 Publishing to topic: "${topic}"`);
  console.log(`   Headers: ${JSON.stringify(headers)}`);
  console.log(`   Payload: ${JSON.stringify(value)}`);

  await producer.send({
    topic,
    messages: [
      {
        key,
        headers,
        value: JSON.stringify(value),
      },
    ],
  });

  console.log(`   ✅ Published successfully to "${topic}"`);
}

async function run() {
  console.log("===========================================");
  console.log(" Specmatic Async Mock - Kafka Producer     ");
  console.log("===========================================");
  console.log(`🔌 Connecting to Kafka broker at ${BROKER}...`);

  await producer.connect();
  console.log("✅ Connected to Kafka!\n");

  const requestId = uuidv4();
  const userId = uuidv4();
  const insightId = uuidv4();
  const orderId = 42;

  // 1. new-analyses → submitAnalysis (action: send)
  await sendMessage(
    "new-analyses",
    requestId,
    { requestId },
    { userId, productId: 101, inventory: 10 }
  );
  await sleep(DELAY_MS);

  // 2. wip-analyses → submitAnalysis reply (action: receive)
  await sendMessage(
    "wip-analyses",
    requestId,
    { requestId },
    { orderId, status: "PENDING" }
  );
  await sleep(DELAY_MS);

  // 3. accepted-analyses → reportGenerated (action: receive)
  await sendMessage(
    "accepted-analyses",
    requestId,
    { requestId },
    { status: "ACCEPTED", insightId }
  );
  await sleep(DELAY_MS);

  // 4. completed-analyses → processingCompleted (action: send)
  await sendMessage(
    "completed-analyses",
    requestId,
    { requestId },
    { orderId }
  );
  await sleep(DELAY_MS);

  console.log("\n===========================================");
  console.log(" ✅ All 4 topics published successfully!   ");
  console.log("===========================================");
  console.log("Now stop the stub to generate the async mock usage report.\n");

  await producer.disconnect();
}

run().catch(async (err) => {
  console.error("❌ Error:", err.message);
  await producer.disconnect();
  process.exit(1);
});
