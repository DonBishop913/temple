import express from "express";
import path from "path";
const app = express();
const PORT = process.env.PORT || 5174;

app.use(express.static(path.join(process.cwd(), "dist")));

app.get("/api", (req, res) => res.send("Living Dashboard Backend OK!"));

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
