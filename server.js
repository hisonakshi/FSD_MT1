const express = require("express");

const app = express();
const PORT = 3000;

// ---------- Middleware ----------
app.use(express.json());

// Handle malformed JSON bodies -> 400
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  next(err);
});

// ---------- In-memory data ----------
let registrations = [
  { id: 501, participantName: "Riya Sharma", eventName: "Tech Fest", department: "CSE", ticketCount: 2, paymentStatus: "Paid" },
  { id: 502, participantName: "Arjun Mehta", eventName: "Code Sprint", department: "IT", ticketCount: 1, paymentStatus: "Pending" },
  { id: 503, participantName: "Neha Verma", eventName: "Tech Fest", department: "ECE", ticketCount: 3, paymentStatus: "Paid" },
];

let nextId = 504;

// ---------- Helpers ----------
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function validateRegistration(body) {
  const errors = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["Request body must be a JSON object"];
  }

  const { participantName, eventName, department, ticketCount, paymentStatus } = body;

  if (!isNonEmptyString(participantName)) errors.push("participantName is required and must be a non-empty string");
  if (!isNonEmptyString(eventName)) errors.push("eventName is required and must be a non-empty string");
  if (!isNonEmptyString(department)) errors.push("department is required and must be a non-empty string");
  if (!Number.isInteger(ticketCount) || ticketCount <= 0) errors.push("ticketCount must be a positive integer");
  if (paymentStatus !== "Paid" && paymentStatus !== "Pending") errors.push("paymentStatus must be either 'Paid' or 'Pending'");

  return errors;
}

// ---------- Routes ----------
// NOTE: specific routes (/filter, /pending) are declared BEFORE /:id

// 1. GET all
app.get("/api/registrations", (req, res) => {
  res.status(200).json(registrations);
});

// 6. Filter by department (case-insensitive)
app.get("/api/registrations/filter", (req, res) => {
  const { department } = req.query;
  if (!isNonEmptyString(department)) {
    return res.status(400).json({ error: "department query parameter is required" });
  }
  const result = registrations.filter(
    (r) => r.department.toLowerCase() === department.trim().toLowerCase()
  );
  res.status(200).json(result); // empty array with 200 if no match
});

// 7. Pending registrations
app.get("/api/registrations/pending", (req, res) => {
  const result = registrations.filter((r) => r.paymentStatus === "Pending");
  res.status(200).json(result);
});

// 3. GET by ID
app.get("/api/registrations/:id", (req, res) => {
  const id = Number(req.params.id);
  const registration = registrations.find((r) => r.id === id);
  if (!registration) {
    return res.status(404).json({ error: `Registration with id ${req.params.id} not found` });
  }
  res.status(200).json(registration);
});

// 2. POST new record
app.post("/api/registrations", (req, res) => {
  const errors = validateRegistration(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const { participantName, eventName, department, ticketCount, paymentStatus } = req.body;
  const newRegistration = {
    id: nextId++,
    participantName: participantName.trim(),
    eventName: eventName.trim(),
    department: department.trim(),
    ticketCount,
    paymentStatus,
  };

  registrations.push(newRegistration);
  res.status(201).json(newRegistration);
});

// 4. PUT update record
app.put("/api/registrations/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = registrations.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Registration with id ${req.params.id} not found` });
  }

  const errors = validateRegistration(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const { participantName, eventName, department, ticketCount, paymentStatus } = req.body;
  registrations[index] = {
    id, // id never changes
    participantName: participantName.trim(),
    eventName: eventName.trim(),
    department: department.trim(),
    ticketCount,
    paymentStatus,
  };

  res.status(200).json(registrations[index]);
});

// 5. DELETE record
app.delete("/api/registrations/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = registrations.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Registration with id ${req.params.id} not found` });
  }

  const [removed] = registrations.splice(index, 1);
  res.status(200).json({ message: "Registration deleted successfully", deleted: removed });
});

// Unknown routes -> 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Event Registration API running on http://localhost:${PORT}`);
});