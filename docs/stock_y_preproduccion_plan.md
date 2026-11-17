# Plan: Gestión de Stock, Compras y Pre-producción
## Vegan Tracker — Módulo de Cocina

📅 Noviembre 2026 · Integrado con la arquitectura MVP existente (Next.js 15 + Supabase)

---

## Índice

1. [Contexto y objetivos](#1-contexto-y-objetivos)
2. [Tres niveles de stock](#2-tres-niveles-de-stock)
3. [Modelo conceptual de datos](#3-modelo-conceptual-de-datos)
4. [Flujos principales](#4-flujos-principales)
5. [Pre-producción y tareas de cocina](#5-pre-producción-y-tareas-de-cocina)
6. [Productos derivados (transformaciones)](#6-productos-derivados-transformaciones)
7. [Reportes y balances](#7-reportes-y-balances)
8. [Integración con el MVP actual](#8-integración-con-el-mvp-actual)
9. [Orden de implementación sugerido](#9-orden-de-implementación-sugerido)

---

## 1. Contexto y objetivos

### Lo que ya existe en el MVP
- Tabla `ingredients` con ~82 ingredientes veganos y datos nutricionales
- Tabla `ingredient_costs` con precio por compra (precio, cantidad en gramos, tienda, fecha)
- `price_per_100g` generado automáticamente
- `recipes` y `recipe_ingredients` con cantidades en gramos
- `meal_log` con registro de comidas diarias

### Lo que falta para gestionar stock real
El MVP actual registra **costos de referencia** (precio/100g para cálculo de recetas), pero no gestiona **inventario ni movimientos reales** de stock. Este módulo agrega esa capa.

### Objetivos del módulo
- Saber cuánto hay disponible de cada ingrediente/preparación en cada momento
- Estimar el costo real de una receta (con el WAC del día)
- Saber cuánto se gastó por semana en insumos
- Hacer balance mensual: compré vs. gasté vs. stock real
- Gestionar pre-producción: lavar, cortar, porcionar, congelar
- Gestionar transformaciones: soya → tofu, naranjas → jugo, almendras → leche
- Registrar mejores proveedores por ingrediente
- Planificar cuándo y qué comprar

---

## 2. Tres niveles de stock

La clave del sistema es distinguir tres tipos de items en el inventario:

```
NIVEL 1 — Ingrediente bruto
  Ejemplo: 1 kg de piña comprado en el mercado
  → Stock en gramos BRUTOS
  → Al recibir: aplicar yield_pct → calcular gramos netos disponibles

NIVEL 2 — Prep (pre-producción)
  Ejemplo: piña pelada y cortada en cubos, porcionada en bolsas de 150g
  → Stock en unidades o gramos NETOS, listo para usar
  → Creado desde NIVEL 1 (descuenta del bruto)
  → Puede ir al congelador o nevera

NIVEL 3 — Producto terminado
  Ejemplo: 12 laddu, 8 porciones de granola, 1 bloque de tofu
  → Stock en unidades o porciones terminadas
  → Creado desde una receta ejecutada (descuenta NIVEL 1 o NIVEL 2)
  → Listo para consumir o usar en otra receta
```

### Regla de movimiento
Cada nivel solo se puede crear desde el nivel anterior o desde una compra (NIVEL 1). El consumo siempre descuenta del nivel más alto disponible que se haya especificado.

---

## 3. Modelo conceptual de datos

### 3.1 Nuevas tablas a agregar (SQL)

**`stock_items`** — el inventario maestro por usuario

Cada fila representa un "tipo de cosa" que el usuario puede tener en stock. Puede ser:
- Un ingrediente bruto (referencia a `ingredients`)
- Una preparación (ej: "apio lavado y cortado en cubos")
- Un producto terminado (referencia a `recipes`)

```
stock_items
├── id (uuid PK)
├── user_id
├── kind: 'ingredient' | 'prep' | 'product'
├── ingredient_id (FK nullable → ingredients)   — para kind='ingredient'
├── recipe_id    (FK nullable → recipes)        — para kind='product'
├── name         — nombre propio (obligatorio para kind='prep')
├── description  — ej: "Lavado, cortado en cubos de 1cm, sin hojas"
├── unit: 'g' | 'ml' | 'unit'
├── yield_pct    — rendimiento (solo para kind='ingredient')
├── storage_type: 'pantry' | 'fridge' | 'freezer'
├── shelf_life_days
├── reorder_point_g   — nivel mínimo antes de avisar restock
└── created_at
```

**`stock_movements`** — cada entrada o salida del inventario

```
stock_movements
├── id (uuid PK)
├── user_id
├── stock_item_id (FK → stock_items)
├── movement_type:
│   'purchase'    — compra de materia prima
│   'prep_in'     — creación de prep o producto terminado
│   'prep_out'    — consumo de bruto para hacer un prep
│   'recipe_use'  — uso en una receta ejecutada
│   'adjustment'  — corrección manual (merma real, vencimiento, error)
│   'inventory'   — resultado de recuento físico
├── quantity         — positivo=entrada, negativo=salida, en unidad del item
├── quantity_net     — para 'purchase': quantity × yield_pct
├── unit_cost_wac    — WAC en el momento del movimiento
├── total_cost       — quantity_net × unit_cost_wac
├── reference_id     — ID del objeto relacionado (purchase_id, prep_task_id, meal_log_id)
├── notes
└── moved_at (timestamptz)
```

**`purchases`** y **`purchase_items`** — registro de compras

```
purchases
├── id, user_id, purchased_at, supplier_id, total_paid, currency, notes

purchase_items
├── id, purchase_id
├── stock_item_id (kind='ingredient')
├── quantity_gross       — gramos brutos comprados
├── price_paid           — total pagado por esta línea
├── price_per_kg         — calculado
├── price_per_100g_net   — calculado: price_paid / (gross × yield_pct / 100)
└── store_notes
```

**`suppliers`** — proveedores

```
suppliers
├── id, user_id
├── name        — ej: "Mercado de Surquillo", "Bio Feria Miraflores"
├── location
├── visit_days  — ej: "sábados" (texto libre)
└── notes
```

**`prep_tasks`** — tareas de pre-producción

```
prep_tasks
├── id, user_id
├── task_type: 'prep' | 'transform' | 'cook'
│   'prep'      — lavar, cortar, porcionar (mismo ingrediente)
│   'transform' — soya→tofu, naranjas→jugo (ingrediente diferente)
│   'cook'      — receta completa → producto terminado en stock
├── status: 'pending' | 'in_progress' | 'done'
├── scheduled_for (date)
├── done_at (timestamptz nullable)
└── notes

prep_task_inputs   — qué consume la tarea (stock_item_id + quantity)
prep_task_outputs  — qué produce (stock_item_id + quantity_expected + quantity_actual)
                     La diferencia entre expected y actual = merma de proceso
```

**`stock_snapshots`** — recuentos físicos mensuales

```
stock_snapshots         — header: fecha + notas
stock_snapshot_items    — por item: quantity_counted vs. quantity_theoretical → varianza
```

---

## 4. Flujos principales

### 4.1 Registrar una compra

```
1. Crear Purchase (fecha, proveedor, moneda)
2. Agregar líneas: 1.2 kg piña a S/6, 500g apio a S/2.50
3. Sistema calcula:
   quantity_net = quantity_gross × yield_pct
   (piña: 1200g × 0.60 = 720g netos)
   price_per_100g_net = price_paid / (quantity_net / 100)
   (piña: S/6 / 7.2 = S/0.833 por 100g neto)
4. stock_movement tipo 'purchase' → suma netos al saldo
5. Recalcula WAC del ingrediente
```

### 4.2 Pre-producción (apio)

```
Estado inicial: 800g apio bruto (yield 85% = 680g netos)

Crear prep_task tipo 'prep':
  Input:  800g de "Apio entero"
  Output: "Apio pre-cortado en cubos 1cm" — 5 porciones de 120g

Al ejecutar:
  → prep_out: -800g de apio bruto
  → prep_in:  +4 porciones de "Apio pre-cortado" (realidad fue 480g)
  → adjustment: 200g merma de proceso

Resultado:
  Apio entero:      0g
  Apio pre-cortado: 4 × 120g = 480g (con costo asignado)
```

### 4.3 Transformación (soya → tofu)

```
prep_task tipo 'transform':
  Input:  X gramos de soya + nigari
  Output: Y gramos de tofu (según proporción real)

El tofu entra al stock con costo =
  (costo soya usada + costo nigari) / gramos de tofu resultantes
```

### 4.4 Producto terminado (laddu)

```
prep_task tipo 'cook' vinculado a recipes("Laddu"):
  Input:  todos los recipe_ingredients en las cantidades usadas
  Output: 20 unidades de "Laddu" como stock_item 'product'

Costo por unidad = costo total insumos / 20
Consumo en meal_log → descuenta 1 unidad del stock
```

### 4.5 Balance mensual

```
1. Recuento físico → stock_snapshot
2. Sistema compara stock teórico vs. stock real contado
3. Varianza → merma no explicada / error de registro
4. Reporte: compras / consumo / merma / varianza / costo por receta
```

---

## 5. Gestión de tareas de pre-producción

El módulo sugiere tareas cuando:
- Un ingrediente lleva días en la nevera → mejor procesar hoy
- Una receta planificada para los próximos 3 días necesita preps
- El stock de un prep está bajo y el bruto está disponible

### Vista de tareas pendientes

```
📋 Pre-producción pendiente

🟡 HOY — Apio (800g en nevera, lleva 2 días)
   → Lavar, cortar en cubos, hacer 5 porciones de 120g → congelador
   
🟡 HOY — Piña (1 kg comprada ayer)
   → Pelar, descorazonar, porcionar 150g → congelador
   
🔵 MAÑANA — Soya (500g en despensa) 
   → Hacer tofu casero → nevera
   
⚪ CUANDO QUIERAS — Laddu (tenés todos los insumos)
   → Hornear 20 unidades → guardá en frasco hermético
```

### Tipos de tareas

| Tipo | Qué hace | Ejemplo |
|------|----------|---------|
| `prep` | Mismo ingrediente, mejor estado | Lavar/cortar/porcionar apio |
| `transform` | Ingrediente → otro producto | Soya → tofu, almendras → leche |
| `cook` | Receta → producto terminado | Laddu, granola, brownies |

---

## 6. Productos derivados (transformaciones)

### Ejemplo completo: Soya → Tofu → Uso en receta

```
Compra:
  1 kg soya a S/8 → 1000g al WAC S/0.008/g

Transformación:
  Input:  500g soya + 5g nigari
  Output: 300g tofu firme
  Costo tofu: (500 × 0.008 + 5 × WAC_nigari) / 300g = ~S/0.0133/g

Uso en "Revuelto de tofu":
  150g × S/0.0133/g = S/2.00 costo del tofu en la receta
  Sobran 150g de tofu en stock
```

---

## 7. Reportes y balances

### Dashboard semanal

```
Semana actual:
  Compras:            S/85.50 (3 compras, 2 proveedores)
  Consumo registrado: S/62.30
  Stock disponible:   ~S/120.00
  Tareas pendientes:  3
```

### Costo de receta con WAC real

```
Kitchadi (2 porciones):
  Arroz basmati 200g   × S/0.0045/g = S/0.90
  Lentejas rojas 150g  × S/0.0062/g = S/0.93
  Apio pre-cortado 120g× S/0.0030/g = S/0.36
  Zanahoria 100g       × S/0.0025/g = S/0.25
  Ghee de coco 20g     × S/0.0180/g = S/0.36
  ─────────────────────────────────────────────
  Total receta:    S/2.80
  Costo/porción:   S/1.40
```

### Balance mensual completo

```
COMPRAS (entradas al stock):
  Verduras y frutas:   S/180.00
  Granos y legumbres:  S/95.00
  Semillas y frutos:   S/120.00
  Otros:               S/45.00
  TOTAL:               S/440.00

CONSUMO REGISTRADO (salidas por recetas y meal log):
  Desayunos:           S/85.00
  Almuerzos:           S/150.00
  Meriendas y snacks:  S/60.00
  TOTAL:               S/295.00

AJUSTES (merma):
  Merma de pre-producción: S/18.00
  Varianza de recuento:    S/12.00
  TOTAL:                   S/30.00

BALANCE:
  Stock inicial:    S/80.00
  + Compras:        S/440.00
  - Consumo:        S/295.00
  - Ajustes:        S/30.00
  = Stock teórico:  S/195.00
  Stock real:       S/185.00
  Varianza:         -S/10.00 (2.3% — aceptable)

ANÁLISIS DE PROVEEDORES:
  Mercado de Surquillo:  S/280 — mejor precio en verduras y frutas
  Wong San Isidro:       S/105 — granos y aceites
  Bio Feria Miraflores:  S/55  — orgánicos, domingos
```

### Optimizador de compras (Fase 5)

- Consumo promedio semanal por ingrediente (últimas 4 semanas)
- Días de stock restantes según ese promedio
- Mejor proveedor por precio histórico
- Lista de compras ordenada por proveedor y día de visita

---

## 8. Integración con el MVP actual

### Qué se conserva sin cambios
- `ingredients` (seed) — referencia nutricional, sin tocar
- `recipes` y `recipe_ingredients` — cálculo nutricional igual
- `meal_log` — registro diario igual
- `ingredient_costs` — sigue como precio de referencia rápido

### Flag de activación

```
user_profile.stock_tracking_enabled:
  false (default): costos de receta usan ingredient_costs (comportamiento actual)
  true:            costos de receta usan WAC de stock_movements
```

### Nueva sección en la navegación

```
Sidebar actual:   Diary | Recipes | Catalog | Ingredients | Costs | Profile

Sidebar nuevo:    Diary | Recipes | Catalog | Ingredients
                  ── Despensa ──
                  Stock | Compras | Pre-producción | Proveedores | Balance
```

---

## 9. Orden de implementación

### Fase 1 — Stock básico

| Paso | Qué se hace |
|------|-------------|
| A | SQL: `suppliers`, `stock_items`, `stock_movements` |
| B | SQL: `purchases` y `purchase_items` |
| C | UI: Formulario de nueva compra |
| D | UI: Vista de stock actual (cantidad disponible, WAC) |
| E | Lógica: recalcular WAC al registrar compra |

### Fase 2 — Pre-producción

| Paso | Qué se hace |
|------|-------------|
| F | SQL: `prep_tasks`, `prep_task_inputs`, `prep_task_outputs` |
| G | UI: Crear prep task (tipo, inputs/outputs) |
| H | UI: Lista de tareas pendientes + botón "Completar" |
| I | UI: Al completar → ingresar cantidad real → registrar movimientos |
| J | UI: Stock diferenciado por nivel (bruto / prep / producto) |

### Fase 3 — Recetas → stock

| Paso | Qué se hace |
|------|-------------|
| K | `prep_tasks` tipo 'cook' vinculado a recipes |
| L | Ejecutar receta → stock_item 'product' con costo calculado |
| M | meal_log → descuenta del stock automáticamente |
| N | Lógica: prioriza prep sobre bruto al descontar |

### Fase 4 — Reportes y balance

| Paso | Qué se hace |
|------|-------------|
| O | Reporte semanal: compras vs. consumo |
| P | Costo de receta con WAC real |
| Q | Balance mensual completo |
| R | `stock_snapshots`: recuento físico y reconciliación |
| S | Análisis de proveedores: precio histórico por ingrediente |

### Fase 5 — Optimización

| Paso | Qué se hace |
|------|-------------|
| T | Consumo promedio semanal (últimas 4 semanas) |
| U | Alertas: stock bajo del `reorder_point_g`, items por vencer |
| V | Lista de compras sugerida por proveedor y día de visita |
| W | Sugerir tareas de pre-producción según stock disponible |

---

## Decisiones de diseño pendientes

**D-S1 — ¿Yield por usuario o yield global?**
- Opción A: `yield_pct` en `stock_items` (por usuario — más preciso)
- Opción B: `yield_pct` en `ingredients` como valor de referencia global
- **Recomendado: B para empezar, el usuario puede sobrescribir en `stock_items`**

**D-S2 — ¿Descontar stock desde meal_log automático o manual?**
- Opción A: Automático — cada meal_log genera stock_movement
- Opción B: Manual — el usuario decide cuándo ejecutó la receta
- **Recomendado: A con opción "sin descuento" para cuando no se quiere rastrear**

**D-S3 — ¿Unidad de tracking de preps?**
- Siempre en gramos o ml. Las "porciones" son una vista (4 × 120g) pero el sistema mide en g.
- **Recomendado: gramos siempre, más consistente con el resto de la app**

**D-S4 — ¿Cómo llamarlo en la UI?**
- **Recomendado: "Despensa"** como sección principal, **"Pre-producción"** para las tareas
