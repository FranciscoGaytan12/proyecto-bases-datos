const express = require("express");
const router = express.Router();
const db = require("../db");

// Obtener todos los comentarios
router.get("/", async (req, res) => {
  try {
    const [comments] = await db.query("SELECT * FROM comments ORDER BY timestamp DESC");
    res.json({ success: true, comments });
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    res.status(500).json({ success: false, message: "Error al obtener comentarios" });
  }
});

// Crear un nuevo comentario
router.post("/", async (req, res) => {
  try {
    const { name, comment, reference } = req.body;
    if (!name || !comment) {
      return res.status(400).json({ success: false, message: "Nombre y comentario son requeridos" });
    }
    const [result] = await db.query(
      "INSERT INTO comments (name, comment, reference) VALUES (?, ?, ?)",
      [name, comment, reference || null]
    );
    res.status(201).json({ success: true, comment_id: result.insertId });
  } catch (error) {
    console.error("Error al crear comentario:", error);
    res.status(500).json({ success: false, message: "Error al crear comentario" });
  }
});

module.exports = router;
