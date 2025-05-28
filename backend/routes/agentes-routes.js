const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Obtener todos los agentes
router.get('/', async (req, res) => {
  try {
    const [agentes] = await db.query('SELECT * FROM seguros_agentes ORDER BY nombre');
    res.json(agentes);
  } catch (error) {
    console.error('Error al obtener agentes:', error);
    res.status(500).json({ message: 'Error al obtener los agentes' });
  }
});

// Obtener un agente por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const [agente] = await db.query('SELECT * FROM seguros_agentes WHERE id = ?', [req.params.id]);
    if (agente.length === 0) {
      return res.status(404).json({ message: 'Agente no encontrado' });
    }
    res.json(agente[0]);
  } catch (error) {
    console.error('Error al obtener agente:', error);
    res.status(500).json({ message: 'Error al obtener el agente' });
  }
});

module.exports = router;
