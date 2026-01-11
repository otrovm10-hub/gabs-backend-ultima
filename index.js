import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente");
});

// Ejemplo de ruta empleados
app.get("/api/empleados", (req, res) => {
  res.json([
    { id: 1, nombre: "Empleado 1" },
    { id: 2, nombre: "Empleado 2" }
  ]);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});