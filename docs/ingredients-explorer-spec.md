# Ingredients Explorer — Spec

## Contexto

Expansión de la página existente `/[locale]/app/ingredients` para convertirla
en un explorador completo de ingredientes con 6 vistas navegables por tabs.
No se crean nuevas rutas: todo vive dentro de la página actual.

Stack: Next.js 14 App Router · TypeScript · Tailwind · React Query · Supabase

---

## Lo que ya existe (no tocar)

| Archivo | Qué aporta |
|---|---|
| `src/app/[locale]/app/ingredients/page.tsx` | página raíz — se reemplaza su contenido |
| `src/lib/api/ingredients.ts` | `getAllIngredients(locale)`, `getIngredientById(id, locale)` |
| `src/hooks/useIngredients.ts` | `useIngredientSearch`, `useIngredientById` |
| `src/components/ingredients/NutritionCard.tsx` | card de detalle con barra de % RDA |
| `src/components/ingredients/IngredientSearch.tsx` | búsqueda por texto |
| `src/constants/nutrition.ts` | `RDA`, `CATEGORIES` |
| `src/types/domain.ts` | type `Ingredient` con 13 campos nutricionales |

---

## Cambio en hooks — 1 adición

**Archivo:** `src/hooks/useIngredients.ts`

Agregar:

```ts
export function useAllIngredients(locale: string) {
  return useQuery({
    queryKey: ['ingredients', 'all', locale],
    queryFn: () => getAllIngredients(locale),
    staleTime: 1000 * 60 * 10,
  })
}
```

Importar `getAllIngredients` desde `@/lib/api/ingredients`.
Este hook es compartido por todas las vistas del explorador.

---

## Nutrientes disponibles

Claves exactas del type `Ingredient`:

```
cal · protein_g · carbs_g · fat_g · fiber_g
iron_mg · calcium_mg · zinc_mg
vit_b12_mcg · vit_d_mcg · vit_c_mg · omega3_g
```

---

## Nutrientes críticos en dieta vegana (para VeganDeficitsView)

```ts
const VEGAN_CRITICAL = ['vit_b12_mcg', 'vit_d_mcg', 'calcium_mg', 'omega3_g', 'zinc_mg', 'iron_mg']
```

---

## Estructura de archivos nueva

```
src/
  components/
    ingredients/
      IngredientSearch.tsx          (existente)
      NutritionCard.tsx             (existente)
      IngredientDetailModal.tsx     (nuevo)
      tabs/
        IngredientTabs.tsx          (nuevo — navegación entre vistas)
        CategoryView.tsx            (nuevo)
        NutrientRankingView.tsx     (nuevo)
        VeganDeficitsView.tsx       (nuevo)
        ComparatorView.tsx          (nuevo)
        NutrientExplorerView.tsx    (nuevo — scatter plot)
```

---

## Página raíz actualizada

**Archivo:** `src/app/[locale]/app/ingredients/page.tsx`

Responsabilidades:
- Leer `locale` del layout
- Invocar `useAllIngredients(locale)`
- Renderizar `<IngredientTabs>` pasándole `ingredients` y `locale`
- Mostrar skeleton/spinner mientras carga

```tsx
'use client'
// ...
export default function IngredientsPage() {
  const locale = useLocale()
  const { data: ingredients = [], isLoading } = useAllIngredients(locale)

  if (isLoading) return <LoadingSkeleton />

  return (
    <div>
      <h1 ...>{t('ingredient.title')}</h1>
      <IngredientTabs ingredients={ingredients} locale={locale} />
    </div>
  )
}
```

---

## Componentes nuevos — descripción funcional

### 1. `IngredientTabs`

- Tabs: Categorías · Ranking · Déficits Veganos · Comparador · Explorador
- Estado local `activeTab`
- Renderiza el componente de vista correspondiente pasándole `ingredients`
- Props: `ingredients: Ingredient[]`, `locale: string`

---

### 2. `CategoryView`

**Propósito:** navegar el catálogo como "nevera" organizada.

Comportamiento:
- Chips de categoría arriba (Fruits, Vegetables, Grains, Legumes, Proteins, Seeds, Other)
  — toma las labels de `CATEGORIES` de `constants/nutrition.ts`
- Input de búsqueda por nombre (filtra sobre `ingredients` ya cargados, sin llamada a Supabase)
- Grilla de cards; cada card muestra: nombre, categoría, cal, proteína
- Click en card → abre `IngredientDetailModal`

Props: `ingredients: Ingredient[]`, `locale: string`

---

### 3. `NutrientRankingView`

**Propósito:** "¿qué ingrediente tiene más hierro / proteína / calcio?"

Comportamiento:
- Select con los 12 nutrientes (label legible, ej. "Proteína (g)")
- Slider o input numérico opcional: cantidad de resultados (5 / 10 / 20)
- Lista ordenada de mayor a menor del nutriente seleccionado
- Cada fila: posición, nombre, valor + unidad, barra proporcional (% del máximo en la lista)
- Click en fila → abre `IngredientDetailModal`

Props: `ingredients: Ingredient[]`

---

### 4. `VeganDeficitsView`

**Propósito:** guía educativa sobre los 6 déficits más comunes en dieta vegana.

Comportamiento:
- 6 cards fijas, una por nutriente crítico: B12 · D · Calcio · Omega-3 · Zinc · Hierro
- Cada card muestra:
  - Nombre del nutriente + RDA referencial (de `RDA`)
  - Por qué es crítico en veganos (texto corto hardcodeado, 1 línea)
  - Top 5 ingredientes ordenados de mayor a menor para ese nutriente
- Click en ingrediente → `IngredientDetailModal`

Props: `ingredients: Ingredient[]`

---

### 5. `ComparatorView`

**Propósito:** comparar hasta 3 ingredientes lado a lado.

Comportamiento:
- Buscador/selector para agregar ingredientes (reutiliza lógica de `IngredientSearch` o filtra sobre `ingredients`)
- Máximo 3 slots; cada slot muestra el nombre y un botón ✕ para quitar
- Tabla: filas = 12 nutrientes, columnas = ingredientes seleccionados
- Resaltar (bold o color) el valor más alto de cada fila
- Botón "Limpiar"

Props: `ingredients: Ingredient[]`

---

### 6. `NutrientExplorerView`

**Propósito:** scatter plot para ver relaciones entre nutrientes.

Comportamiento:
- Dos selects: eje X y eje Y (cualquiera de los 12 nutrientes)
- Punto por ingrediente, coloreado por categoría (usar misma paleta que `CATEGORIES`)
- Tooltip al hover: nombre, valor X, valor Y
- Usar `recharts` (ya disponible) o implementar con SVG simple si no está instalado

Props: `ingredients: Ingredient[]`

---

### 7. `IngredientDetailModal`

**Propósito:** detalle completo de un ingrediente, abre desde cualquier vista.

Comportamiento:
- Modal centrado con overlay oscuro
- Encabezado: nombre + categoría
- Contenido: `<NutritionCard ingredient={selected} grams={100} />`  (componente existente)
- Botón cerrar (X) o click fuera cierra

Props: `ingredient: Ingredient`, `onClose: () => void`

---

## Orden de implementación

1. `useAllIngredients` hook (1 adición en archivo existente)
2. `IngredientDetailModal`
3. `CategoryView`
4. `NutrientRankingView`
5. `VeganDeficitsView`
6. `ComparatorView`
7. `NutrientExplorerView`
8. `IngredientTabs` (ensambla todo)
9. `page.tsx` actualizada

---

## Notas de implementación

- **i18n:** todos los textos de UI que no sean nombres de nutrientes deben tener clave de traducción.
  Los nutrientes reutilizan las claves que ya usa `NutritionCard` (`nutrition.*`).
- **Sin nueva llamada a Supabase:** todas las vistas reciben `ingredients` como prop
  desde el único `useAllIngredients` en la página raíz. Cero waterfalls.
- **Recharts:** verificar si está en `package.json`; si no, el prompt de `NutrientExplorerView`
  incluye instrucción de instalación (`npm install recharts`).
- **Mobile:** `CategoryView` usa grilla responsive. Las demás vistas pueden ser scroll horizontal
  en mobile en esta primera iteración.
