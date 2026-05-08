# NPT Calculadora Clínica — PWA

Calculadora de Nutrición Parenteral Total basada en guías ESPEN.
Funciona offline una vez instalada.

---

## Cómo publicar (5 minutos)

### Paso 1 — Crear cuentas gratuitas
1. Ir a **github.com** → "Sign up" → crear cuenta
2. Ir a **vercel.com** → "Sign up" → elegir "Continue with GitHub"

### Paso 2 — Subir el proyecto a GitHub
1. En GitHub, click en "+" (arriba a la derecha) → "New repository"
2. Nombre: `npt-calc` → click "Create repository"
3. Click "uploading an existing file"
4. **Arrastrar y soltar TODA la carpeta** `npt-app` (o los archivos dentro)
5. Click "Commit changes"

### Paso 3 — Publicar en Vercel
1. En Vercel, click "Add New Project"
2. Seleccionar el repositorio `npt-calc`
3. Vercel detecta Vite automáticamente → click "Deploy"
4. En ~1 minuto te da el link: `npt-calc.vercel.app`

---

## Cómo instalar como app en el celular

**iPhone (Safari):**
1. Abrir el link en Safari
2. Tocar el botón compartir (□↑)
3. "Agregar a pantalla de inicio"

**Android (Chrome):**
1. Abrir el link en Chrome
2. Tocar el menú (⋮) → "Agregar a pantalla de inicio"
   o esperar el banner automático "Instalar app"

---

## Desarrollo local (opcional)

```bash
npm install
npm run dev
```

Abre http://localhost:5173

---

Calculadora basada en guías ESPEN 2009/2019/2023.
Herramienta de apoyo clínico — no reemplaza el criterio profesional.
