import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// Cargar empleados
app.get("/api/empleados", (req, res) => {
  const data = fs.readFileSync("empleados.json", "utf8");
  res.json(JSON.parse(data));
});

// Tareas del día
app.get("/api/tareas-del-dia", (req, res) => {
  const { id, fecha } = req.query;
  const data = JSON.parse(fs.readFileSync("tareas.json", "utf8"));

  const tareas = data.filter(t => t.empleadoId == id && t.fecha == fecha);
  res.json({ tareas });
});

// Guardar estado
app.post("/api/guardar-estado", (req, res) => {
  const { empleadoId, tareaId, estado } = req.body;
  const data = JSON.parse(fs.readFileSync("tareas.json", "utf8"));

  const tarea = data.find(t => t.id == tareaId && t.empleadoId == empleadoId);
  if (tarea) tarea.estado = estado;

  fs.writeFileSync("tareas.json", JSON.stringify(data, null, 2));
  res.json({ ok: true });
});

// Guardar observación
app.post("/api/guardar-observacion", (req, res) => {
  const { empleadoId, observacion } = req.body;
  const data = JSON.parse(fs.readFileSync("tareas.json", "utf8"));

  data.push({
    id: Date.now(),
    empleadoId,
    tarea: "Observación",
    fecha: new Date().toISOString().slice(0, 10),
    estado: "observacion",
    observacion
  });

  fs.writeFileSync("tareas.json", JSON.stringify(data, null, 2));
  res.json({ ok: true });
});

app.listen(10000, () => console.log("Backend funcionando en puerto 10000"));