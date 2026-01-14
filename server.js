const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

/* ---------------------------
   ARCHIVOS JSON
----------------------------*/
const HISTORIAL_FILE = "./data/historial.json";
const EMPLEADOS_FILE = "./data/empleados.json";
const CATALOGO_FILE = "./data/catalogo.json";

/* ---------------------------
   FUNCIONES DE ARCHIVOS
----------------------------*/
function cargarJSON(path) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (e) {
    return [];
  }
}

function guardarJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

/* ---------------------------
   LOGIN
----------------------------*/
app.post("/login", (req, res) => {
  const { usuario, clave } = req.body;
  const empleados = cargarJSON(EMPLEADOS_FILE);

  const encontrado = Object.entries(empleados).find(
    ([id, info]) => info.usuario === usuario && info.clave === clave
  );

  if (!encontrado) {
    return res.json({ ok: false });
  }

  const [id, info] = encontrado;

  res.json({
    ok: true,
    id,
    nombre: info.nombre
  });
});

/* ---------------------------
   LISTA DE EMPLEADOS
----------------------------*/
app.get("/empleados", (req, res) => {
  const empleados = cargarJSON(EMPLEADOS_FILE);
  const lista = {};

  Object.entries(empleados).forEach(([id, info]) => {
    lista[id] = info.nombre;
  });

  res.json(lista);
});

/* ---------------------------
   CATÁLOGO DE TAREAS
----------------------------*/
app.get("/catalogo", (req, res) => {
  res.json(cargarJSON(CATALOGO_FILE));
});

/* ---------------------------
   AGREGAR TAREA (ADMIN)
----------------------------*/
app.post("/admin/agregar-tarea", (req, res) => {
  const { id, fecha, tarea } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.push({
    id,
    fecha,
    tarea,
    estado: "pendiente",
    obsEmpleado: "",
    obsAdmin: "",
    motivoNoRealizada: ""
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ---------------------------
   TAREAS COMPLETAS (ADMIN)
----------------------------*/
app.get("/admin/tareas-completas", (req, res) => {
  const { fecha } = req.query;
  const historial = cargarJSON(HISTORIAL_FILE);
  const empleados = cargarJSON(EMPLEADOS_FILE);

  const tareas = historial
    .filter(t => t.fecha === fecha)
    .map(t => ({
      ...t,
      nombre: empleados[t.id]?.nombre || t.id
    }));

  res.json(tareas);
});

/* ---------------------------
   APROBAR TAREA (ADMIN)
----------------------------*/
app.post("/admin/aprobar", (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.estado = "terminada";
      if (observacionAdmin) t.obsAdmin = observacionAdmin;
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ---------------------------
   DEVOLVER TAREA (ADMIN)
----------------------------*/
app.post("/admin/devolver", (req, res) => {
  const { id, fecha, tarea, motivo } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.estado = "devuelto";
      t.motivoNoRealizada = motivo;
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ---------------------------
   REPROGRAMAR TAREA (ADMIN)
----------------------------*/
app.post("/admin/reprogramar", (req, res) => {
  const { id, fecha, tarea, nuevaFecha, observacionAdmin } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.fecha = nuevaFecha;
      t.estado = "pendiente";
      if (observacionAdmin) t.obsAdmin = observacionAdmin;
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ---------------------------
   GUARDAR ESTADO (EMPLEADO)
   ⭐ CORREGIDO: YA NO ROMPE "devuelto"
----------------------------*/
app.post("/guardar-estado", (req, res) => {
  const { empleado, fecha, tarea, estado, motivoNoRealizada } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == empleado && t.fecha === fecha && t.tarea === tarea) {

      // ⭐ El empleado marca terminada → pasa a revisión
      if (estado === "terminada") {
        t.estado = "en_revision";
      }

      // ⭐ El empleado marca no realizada → pasa a revisión
      else if (estado === "no_realizada") {
        t.estado = "en_revision";
        t.motivoNoRealizada = motivoNoRealizada || "";
      }

      // ⭐ El admin devuelve → NO se toca aquí
      else if (estado === "devuelto") {
        t.estado = "devuelto";
      }

      // ⭐ Otros estados normales
      else {
        t.estado = estado;
      }
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ---------------------------
   OBSERVACIÓN DEL EMPLEADO
----------------------------*/
app.post("/guardar-observacion", (req, res) => {
  const { empleado, fecha, tarea, observacion } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == empleado && t.fecha === fecha && t.tarea === tarea) {
      t.obsEmpleado = observacion;
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ---------------------------
   OBSERVACIÓN DEL ADMIN
----------------------------*/
app.post("/guardar-observacion-admin", (req, res) => {
  const { id, fecha, tarea, observacionAdmin } = req.body;

  const historial = cargarJSON(HISTORIAL_FILE);

  historial.forEach(t => {
    if (t.id == id && t.fecha === fecha && t.tarea === tarea) {
      t.obsAdmin = observacionAdmin;
    }
  });

  guardarJSON(HISTORIAL_FILE, historial);

  res.json({ ok: true });
});

/* ---------------------------
   TAREAS DEL DÍA (EMPLEADO)
----------------------------*/
app.get("/tareas-del-dia/:id", (req, res) => {
  const { id } = req.params;
  const { fecha } = req.query;

  const historial = cargarJSON(HISTORIAL_FILE);

  const tareas = historial.filter(
    t => t.id == id && t.fecha === fecha
  );

  res.json({ tareas });
});

/* ---------------------------
   INICIAR SERVIDOR
----------------------------*/
app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});