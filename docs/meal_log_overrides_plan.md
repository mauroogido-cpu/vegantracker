# Feature: Meal Log — Ingredient Overrides por Entrada

## Contexto

La receta es una **plantilla de referencia**: define los ingredientes y sus cantidades base.
Cuando el usuario loggea una receta, puede querer usar cantidades distintas ese día
(más o menos de algún ingrediente) sin modificar la receta original.
El override aplica **únicamente a esa entrada del log**; la próxima vez que loguee
la misma receta parte de las cantidades base nuevamente.

**Ejemplo real:** Batido con 2 bananos. Hoy los bananos pesaban 110 g cada uno (220 g total).
La semana pasada pesaban 90 g cada uno (180 g). El log de cada día refleja la realidad de ese día.

---

## Resumen de cambios

| Capa | Qué cambia |
|---|---|
| **SQL** | Nueva tabla `meal_log_ingredient_overrides` + índice + RLS |
| **API** | `logMeal` acepta overrides e inserta ambas tablas en una transacción; `getDayLog` trae overrides en el JOIN; `getRecipeIngredients` (ya existe) no cambia |
| **Types** | `MealLog` recibe campo opcional `overrides`; nuevo tipo `MealLogOverride` |
| **Hook** | `useLogMeal` pasa los overrides al mutationFn |
| **Form** | Al seleccionar receta, se expande la lista de ingredientes con cantidades editables |
| **Nutrition** | `calcDayNutrition` prioriza overrides cuando los hay |

---

## Reglas de negocio

1. Los overrides solo aplican a entradas de tipo **receta** (`recipe_id IS NOT NULL`).
2. Si un ingrediente de la receta **no tiene override**, se usa `recipe_ingredient.quantity_g × (log.servings / recipe.servings)`.
3. Si tiene override, se usa `override.quantity_g` directamente (ya es el total para esa entrada).
4. No es obligatorio hacer override de todos los ingredientes; se persisten solo los que el usuario modificó.
5. Si el usuario no toca ninguna cantidad, no se inserta ningún override (mismo comportamiento actual).
6. Los overrides se eliminan en cascada cuando se borra la entrada del log.

---

## SQL — `005_meal_log_overrides.sql`

```sql
CREATE TABLE meal_log_ingredient_overrides (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_log_id   UUID         NOT NULL
                   REFERENCES meal_log(id) ON DELETE CASCADE,
  ingredient_id UUID         NOT NULL
                   REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_g    NUMERIC(8,2) NOT NULL CHECK (quantity_g > 0),
  UNIQUE (meal_log_id, ingredient_id)
);

CREATE INDEX idx_mloverrides_meal_log_id
  ON meal_log_ingredient_overrides(meal_log_id);
```

RLS: el usuario solo puede ver/insertar/borrar overrides de sus propios logs
(verificado vía JOIN a meal_log.user_id).

---

## API — `src/lib/api/meallog.ts`

### Tipo de entrada extendido

```ts
type LogMealPayload = Omit<MealLog, 'id' | 'created_at'> & {
  overrides?: Array<{ ingredient_id: string; quantity_g: number }>
}
```

### `logMeal` — nueva firma

```ts
async function logMeal(entry: LogMealPayload): Promise<MealLog | null>
```

Internamente:
1. `INSERT` en `meal_log` → obtiene el `id` retornado.
2. Si `entry.overrides?.length`, hace `INSERT` en `meal_log_ingredient_overrides`
   usando el `id` recién creado.
3. Ambas inserciones ocurren en la misma llamada (Supabase no tiene transacciones
   en cliente; se usa `rpc` o dos inserts secuenciales con rollback manual si falla el segundo).
   **Recomendado**: una función RPC en Postgres que haga todo en una transacción real.

### `getDayLog` — extender la query

Actualmente hace `select('*')`. Cambiar a:

```ts
.select('*, meal_log_ingredient_overrides(*)')
```

Supabase devuelve los overrides como array anidado en cada row.

---

## Types — `src/types/domain.ts`

```ts
export type MealLogOverride = {
  id: string
  meal_log_id: string
  ingredient_id: string
  quantity_g: number
}

export type MealLog = {
  // ...campos actuales...
  overrides?: MealLogOverride[]   // ← nuevo, viene del JOIN
}
```

---

## Hooks — `src/hooks/useMealLog.ts`

`useLogMeal` no cambia su firma pública: `mutationFn: logMeal` ya recibe
el payload extendido automáticamente. El form es el que arma los overrides.

---

## Nutrition — `src/lib/nutrition.ts`

`calcDayNutrition` necesita conocer los ingredientes de cada receta para aplicar overrides.
Firma extendida:

```ts
function calcDayNutrition(
  logs: MealLog[],
  recipeNutritionMap: ...,
  recipeServingsMap: ...,
  ingredientMap: Map<string, Ingredient>,
  recipeIngredientsMap: Map<string, RecipeIngredient[]>  // ← nuevo
): Record<NutritionKey, number>
```

Lógica para logs de receta con overrides:

```
Para cada RecipeIngredient de la receta:
  si hay override para ese ingredient_id → usar override.quantity_g
  si no                                  → usar ri.quantity_g × (log.servings / recipe.servings)
Sumar nutrientes con esa cantidad real
```

---

## Frontend — `MealLogForm.tsx`

### Flujo UX

```
[Tab: Receta] → usuario elige receta del select
  → el form expande un panel "Ingredientes" (colapsable)
  → lista cada ingrediente con su nombre y un input numérico
    mostrando la cantidad calculada (quantity_g × servings / recipeServings) como default
  → usuario puede editar cualquier campo; si no toca nada → no hay overrides
  → al submit: se comparan los valores con los defaults; solo los que difieren se envían como overrides
```

### Estado local nuevo

```ts
const [ingredientOverrides, setIngredientOverrides] = useState<
  Record<string, string>  // ingredient_id → quantity_g como string para el input
>({})
```

Cuando el usuario selecciona una receta se inicializa con los valores default
(traídos de `useRecipeIngredients(recipeId)`); el usuario edita los que quiera.

Al submitear:

```ts
const overrides = Object.entries(ingredientOverrides)
  .filter(([id, val]) => {
    const def = defaultQuantities[id]
    return Math.abs(parseFloat(val) - def) > 0.01   // solo los que cambiaron
  })
  .map(([ingredient_id, quantity_g]) => ({
    ingredient_id,
    quantity_g: parseFloat(quantity_g),
  }))
```

---

## Archivos a crear / modificar

| Archivo | Acción |
|---|---|
| `SQL/Migrations/005_meal_log_overrides.sql` | Crear |
| `src/types/domain.ts` | Agregar `MealLogOverride`, extender `MealLog` |
| `src/lib/api/meallog.ts` | Extender `logMeal` y `getDayLog` |
| `src/lib/nutrition.ts` | Extender `calcDayNutrition` |
| `src/hooks/useMealLog.ts` | Sin cambios de firma; revisar si el payload llega bien |
| `src/hooks/useRecipes.ts` | Agregar `useRecipeIngredients(recipeId)` si no existe |
| `src/components/meallog/MealLogForm.tsx` | Agregar panel de overrides en modo receta |

---

## Decisión pendiente: RPC vs. dos inserts

Para garantizar atomicidad (si falla la inserción de overrides, no queda un log huérfano):

**Opción A — RPC Postgres** (recomendada): una función `log_meal_with_overrides(entry, overrides[])` que hace todo en una transacción. Requiere un archivo SQL adicional para la función.

**Opción B — Dos inserts secuenciales**: más simple de implementar; si el segundo falla, se borra el primero manualmente. Aceptable para MVP.

---

## Orden de implementación recomendado

1. `005_meal_log_overrides.sql` → aplicar en Supabase
2. `domain.ts` → tipos
3. `meallog.ts` (API) → extender funciones
4. `nutrition.ts` → extender cálculo
5. `useRecipes.ts` → hook `useRecipeIngredients`
6. `MealLogForm.tsx` → UI de overrides
