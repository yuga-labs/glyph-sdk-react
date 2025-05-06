const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// Debug middleware to log requested assets
app.use((req, _, next) => {
	console.debug(`Request for: ${req.path}`);
	next();
});

// Serve each example from its own path
app.use("/privy", express.static(path.join(__dirname, "privy/dist")));
app.use("/cross-app", express.static(path.join(__dirname, "cross-app/dist")));
app.use("/rainbowkit", express.static(path.join(__dirname, "rainbowkit/dist")));
app.use("/connectkit", express.static(path.join(__dirname, "connectkit/dist")));
app.use(
	"/native-integration",
	express.static(path.join(__dirname, "native-integration/dist"))
);
app.use("/dynamic", express.static(path.join(__dirname, "dynamic/dist")));

// Health check
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// Serve the main index app
app.use("/", express.static(path.join(__dirname, "/")));

// Fallback route - send to 404 page
app.get("*", (req, res) => {
	res.status(404).send("404 Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
