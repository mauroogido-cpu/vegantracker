# 🥗 Vegan Tracker — Arquitectura MVP

Plataforma de recetas veganas con cálculo de micronutrientes, costos y seguimiento diario de alimentación.

📅 Noviembre 2026 · 🧑‍💻 Stack: **Next.js 15 + TypeScript + Supabase** · 🌱 Solo recetas (no práctica de yoga)

---

## Índice

1. [Descripción y contexto](#1-descripción-y-contexto)
2. [Decisiones de diseño](#2-decisiones-de-diseño)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Base de datos (Supabase)](#4-base-de-datos-supabase)
5. [Arquitectura de capas](#5-arquitectura-de-capas)
6. [Estructura de carpetas](#6-estructura-de-carpetas)
7. [Todos los archivos — descripción](#7-todos-los-archivos--descripción)
8. [Orden de construcción](#8-orden-de-construcción)

---

## 1. Descripción y contexto

App para armar recetas a partir de ingredientes, calculando automáticamente calorías, macronutrientes y micronutrientes (vitaminas, minerales). Permite cargar costos de ingredientes para estimar el costo de cada receta. Incluye un registro diario de comidas para hacer seguimiento nutricional y de gasto.

### Funcionalidades core del MVP

| # | Feature |
|---|---------|
| 1 | **Ingredientes con nutrientes completos** — base de datos seed con calorías, macros y micronutrientes (hierro, calcio, zinc, B12, D, C, omega-3) por 100 g |
| 2 | **Constructor de recetas** — armar recetas sumando ingredientes con cantidades en gramos, cálculo automático de totales |
| 3 | **Costos por ingrediente** — precio por compra con cálculo automático de precio/100 g |
| 4 | **Catálogo público** — recetas públicas que cualquier usuario puede ver y forkear para adaptar a sus necesidades; indexadas por Google via SSR |
| 5 | **Registro diario** — log de comidas del día con resumen de nutrientes consumidos, calorías y costo |
| 6 | **Autenticación** — cada usuario tiene sus propias recetas y su propio historial de comidas |
| 7 | **Multiidioma** — interfaz en Inglés (EN) y Español (ES) desde el lanzamiento; nombres de ingredientes traducidos vía tabla `ingredient_translations` |

---

## 2. Decisiones de diseño

**D1 — Recetas privadas por defecto, catálogo opt-in**
Toda receta creada por un usuario es privada. El campo `is_public` la hace visible en el catálogo. En el MVP, solo el admin puede publicar al catálogo. El flag ya está en el schema para habilitar publicación de usuarios en el futuro.

**D2 — Fork de recetas públicas**
Al usar una receta del catálogo, se crea una copia privada (`source_recipe_id` apunta al original). El usuario puede modificarla libremente sin afectar el original.

**D3 — Cálculo de nutrientes en el cliente**
Los totales de una receta o de un día se calculan en el frontend con los datos traídos de Supabase. No hay lógica de cálculo en Edge Functions para el MVP. Simplifica el desarrollo y la latencia es aceptable.

**D4 — Costos opcionales por ingrediente**
Un ingrediente puede existir sin costo cargado. El cálculo de costo de receta solo aparece cuando todos los ingredientes tienen precio. El costo se guarda separado (`ingredient_costs`) para poder actualizar precios sin tocar el ingrediente. `price_per_100g` es una columna `GENERATED ALWAYS AS` — nunca puede quedar desfasada.

**D5 — Registro de comidas: receta O ingrediente directo**
Una entrada del meal log puede ser una receta completa (con porciones) o un ingrediente suelto (con gramos). Cubre el caso "comí una banana" sin crear receta. Garantizado con un `CHECK` a nivel de base de datos.

**D6 — RLS en Supabase como capa de seguridad**
Row Level Security garantiza que cada usuario solo accede a sus propios datos. No se necesita una API intermedia para el MVP. Las recetas públicas tienen policy de lectura abierta para todos los autenticados.

**D7 — Micronutrientes en columnas nombradas**
Hierro (Fe), Calcio (Ca), Zinc (Zn), Vitamina B12, Vitamina D, Vitamina C, Omega-3. Guardados en columnas nombradas, no en JSONB, para facilitar queries, filtros y la generación de tipos TypeScript.

**D8 — Next.js en lugar de Vite**
El catálogo público (`is_public = true`) se renderiza en el servidor (SSR). Esto permite indexación en Google — un usuario busca "receta vegana de lentejas" y llega a la app. Con una SPA pura (Vite) el HTML es vacío hasta que corre JS. El resto de la app (detrás de auth) funciona igual que una SPA.

**D9 — i18n con next-intl, routing `[locale]`**
Rutas con prefijo de locale: `/en/...` y `/es/...`. El middleware detecta el idioma preferido del browser y redirige. Los textos de UI van en archivos JSON de mensajes (`messages/en.json`, `messages/es.json`). Los nombres de ingredientes se cargan desde la tabla `ingredient_translations` usando el locale activo. Locales futuros: `pt-BR`, `ja`.

**D10 — Monedas**
Lanzamiento: **PEN, ARS, USD, EUR**. Preparadas en la base de datos para expansión: INR, BRL, JPY. El usuario selecciona su moneda preferida en el perfil. Los costos se guardan siempre con la moneda de la compra.

---

## 3. Stack tecnológico

| Herramienta | Rol | Por qué |
|---|---|---|
| **Next.js 15** (App Router) | Framework full-stack | SSR para catálogo público (SEO) + routing nativo + middleware de auth |
| **TypeScript** | Tipado | Tipos generados desde Supabase CLI, inferidos con Zod |
| **TailwindCSS** | Estilos | Utility-first, sin CSS-in-JS, excelente con App Router |
| **TanStack Query v5** | Cache y fetching | Manejo de loading/error states, invalidación de cache al mutar |
| **Zustand** | Estado de UI global | Solo para estado de UI (modals, tabs) — no datos del server |
| **Zod** | Validación de formularios | Validar inputs antes de enviar a Supabase, inferir tipos TS |
| **Supabase JS + SSR** | Cliente de DB y auth | `@supabase/ssr` para cookies en Server Components y middleware |
| **next-intl** | Internacionalización | i18n para App Router con routing `[locale]`, EN + ES |

---

## 4. Base de datos (Supabase)

### Tablas

**`ingredients`** — seed, solo lectura para usuarios

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Generado automáticamente |
| `name_en` | text | Nombre canónico en inglés (fallback) |
| `category` | text CHECK | `fruits` \| `vegetables` \| `grains` \| `legumes` \| `proteins` \| `seeds` \| `other` |
| `cal` | numeric(8,2) | Calorías por 100 g |
| `protein_g` | numeric(8,2) | Proteínas por 100 g |
| `carbs_g` | numeric(8,2) | Carbohidratos por 100 g |
| `fat_g` | numeric(8,2) | Grasas por 100 g |
| `fiber_g` | numeric(8,2) | Fibra por 100 g |
| `iron_mg` | numeric(8,3) | Hierro (Fe) mg |
| `calcium_mg` | numeric(8,2) | Calcio (Ca) mg |
| `zinc_mg` | numeric(8,3) | Zinc (Zn) mg |
| `vit_b12_mcg` | numeric(8,3) | Vitamina B12 µg |
| `vit_d_mcg` | numeric(8,3) | Vitamina D µg |
| `vit_c_mg` | numeric(8,2) | Vitamina C mg |
| `omega3_g` | numeric(8,3) | Omega-3 g |
| `fdc_id` | integer | ID de USDA FoodData Central para trazabilidad |
| `created_at` | timestamptz | Default `now()` |

**`ingredient_translations`** — traducciones de nombres por locale

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `ingredient_id` | uuid FK | → `ingredients(id)` CASCADE |
| `locale` | text CHECK | `'en'` \| `'es'` \| `'pt-BR'` \| `'ja'` |
| `name` | text | Nombre en ese locale |
| UNIQUE | | `(ingredient_id, locale)` |

**`ingredient_costs`** — precio por usuario por ingrediente

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `ingredient_id` | uuid FK | → `ingredients` CASCADE |
| `user_id` | uuid FK | → `auth.users` |
| `price` | numeric(10,2) | Precio pagado |
| `quantity_g` | numeric(10,2) | Gramos comprados a ese precio |
| `price_per_100g` | numeric(10,4) | **GENERATED** `price / quantity_g * 100` |
| `currency` | text CHECK | `'PEN'` \| `'ARS'` \| `'USD'` \| `'EUR'` \| `'INR'` \| `'BRL'` \| `'JPY'` |
| `store` | text | Nombre del mercado/tienda |
| `purchased_at` | date | Default `CURRENT_DATE` |

**`recipes`**

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | → `auth.users` |
| `name` | text | |
| `description` | text | |
| `servings` | integer CHECK > 0 | Porciones que rinde |
| `category` | text CHECK | `'breakfast'` \| `'lunch'` \| `'dinner'` \| `'snack'` \| `'dessert'` \| `'other'` |
| `is_public` | boolean | `FALSE` por defecto |
| `source_recipe_id` | uuid FK nullable | → `recipes(id)` si es fork |
| `prep_time_min` | integer | |
| `instructions` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Actualizado por trigger |

**`recipe_ingredients`**

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `recipe_id` | uuid FK | → `recipes` CASCADE |
| `ingredient_id` | uuid FK | → `ingredients` RESTRICT |
| `quantity_g` | numeric(8,2) CHECK > 0 | Gramos en la receta |
| `notes` | text | Ej: "picado fino" |
| `sort_order` | integer | Orden en la UI |
| UNIQUE | | `(recipe_id, ingredient_id)` |

**`meal_log`**

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `logged_at` | date | Default hoy |
| `meal_type` | text CHECK | `'breakfast'` \| `'lunch'` \| `'dinner'` \| `'snack'` |
| `recipe_id` | uuid FK nullable | Si se consumió una receta |
| `ingredient_id` | uuid FK nullable | Si se consumió un ingrediente suelto |
| `servings` | numeric(6,2) | Porciones (cuando `recipe_id` está set) |
| `quantity_g` | numeric(8,2) | Gramos (cuando `ingredient_id` está set) |
| `notes` | text | |

> **Constraint DB:** `meal_log_one_source` — exactamente uno de `recipe_id` o `ingredient_id` debe tener valor, con su campo de cantidad correspondiente.

### Archivos SQL

| Archivo | Contenido |
|---|---|
| `SQL/migrations/001_initial.sql` | Todas las tablas, índices, trigger `updated_at` |
| `SQL/migrations/002_rls.sql` | RLS habilitado en 6 tablas, 16 políticas |
| `SQL/seeds/ingredients.sql` | ~82 ingredientes veganos con datos FoodData Central + traducciones EN + ES |

---

## 5. Arquitectura de capas

```
┌──────────────────────────────────────────────────────┐
│                  USUARIO (Browser)                   │
└──────────────────────────┬───────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────┐
│          NEXT.JS 15 — App Router                     │
│                                                      │
│  middleware.ts  ←── refresca sesión en cada request  │
│         │            redirige /app/* si no auth      │
│         │                                            │
│  Server Components (catalog, recipe detail)          │
│    └── fetch directo a Supabase (SSR, SEO)           │
│                                                      │
│  Client Components (forms, builder, diary)           │
│    └── TanStack Query → Supabase browser client      │
│    └── Zustand → estado de UI (modals, tabs)         │
│    └── Zod → validación de formularios               │
│                                                      │
│  next-intl → routing [locale], mensajes EN/ES        │
└──────────────────────────┬───────────────────────────┘
                           │  @supabase/ssr
┌──────────────────────────▼───────────────────────────┐
│                   SUPABASE                           │
│                                                      │
│  • Auth (email + password, cookies via SSR)          │
│  • PostgreSQL + RLS                                  │
│  • Storage (imágenes de recetas — MVP 2)             │
└──────────────────────────────────────────────────────┘
```

### Flujo típico — Crear receta

```
RecipeBuilderPage (Client Component)
  → usa useRecipeForm() (estado local + Zod validation)
  → al submit llama useMutation de TanStack Query
      → supabase.from('recipes').insert(...)
      → supabase.from('recipe_ingredients').insert([...])
  → TanStack Query invalida cache ['recipes', userId]
  → RecipesPage se re-renderiza con la nueva receta
```

### Flujo típico — Catálogo público (SSR)

```
/en/catalog → Server Component
  → supabase server client (cookies) → SELECT recipes WHERE is_public = true
  → HTML renderizado en servidor → Google lo indexa
  → "Usar receta" → fork mutation en Client Component
      → INSERT INTO recipes (copia) + recipe_ingredients (copia)
      → redirect a /en/app/recipes/[new-id]
```

---

## 6. Estructura de carpetas

```
vegan-tracker/
├── SQL/
│   ├── migrations/
│   │   ├── 001_initial.sql
│   │   └── 002_rls.sql
│   └── seeds/
│       └── ingredients.sql
│
├── messages/
│   ├── en.json              ← textos de UI en inglés
│   └── es.json              ← textos de UI en español
│
└── src/
    ├── app/
    │   ├── layout.tsx           ← root layout (html, body, fonts)
    │   ├── [locale]/            ← i18n: /en/... y /es/...
    │   │   ├── layout.tsx       ← NextIntlClientProvider
    │   │   ├── page.tsx         ← redirect a /[locale]/app/diary
    │   │   ├── (public)/        ← rutas sin auth
    │   │   │   ├── catalog/
    │   │   │   │   ├── page.tsx         ← SSR — catálogo público
    │   │   │   │   └── [id]/
    │   │   │   │       └── page.tsx     ← SSR — detalle receta pública
    │   │   │   ├── login/page.tsx
    │   │   │   └── signup/page.tsx
    │   │   └── (app)/           ← rutas autenticadas
    │   │       ├── layout.tsx   ← AppShell (nav + sidebar)
    │   │       ├── diary/page.tsx
    │   │       ├── recipes/
    │   │       │   ├── page.tsx
    │   │       │   ├── new/page.tsx
    │   │       │   └── [id]/
    │   │       │       ├── page.tsx
    │   │       │       └── edit/page.tsx
    │   │       ├── ingredients/page.tsx
    │   │       ├── costs/page.tsx
    │   │       └── profile/page.tsx
    │   └── api/
    │       └── auth/
    │           └── callback/route.ts   ← OAuth callback (si se agrega)
    │
    ├── components/
    │   ├── ui/              ← componentes base reutilizables
    │   ├── layout/          ← AppShell, NavBar, Sidebar
    │   ├── ingredients/     ← IngredientTable, CostForm
    │   ├── recipes/         ← RecipeBuilder, RecipeCard, RecipeDetail
    │   ├── nutrition/       ← NutritionPanel, MacroChart, NutrientBar
    │   ├── meallog/         ← MealLogList, AddMealForm, DateNavigator
    │   └── catalog/         ← CatalogCard, CatalogFilters
    │
    ├── hooks/               ← custom hooks (queries + mutations)
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts    ← browser client (@supabase/ssr)
    │   │   └── server.ts    ← server client para Server Components
    │   ├── nutrition.ts     ← funciones de cálculo puras
    │   ├── costs.ts         ← funciones de costo puras
    │   └── formatters.ts    ← números, fechas, monedas
    │
    ├── stores/
    │   ├── authStore.ts     ← sesión (user, loading)
    │   └── uiStore.ts       ← modals, tabs, toasts
    │
    ├── types/
    │   ├── supabase.ts      ← tipos generados por Supabase CLI
    │   └── domain.ts        ← NutritionTotals, DayNutrition, etc.
    │
    ├── constants/
    │   └── nutrition.ts     ← RDA, categorías, unidades
    │
    └── middleware.ts        ← refresca sesión + protege /app/*
```

---

## 7. Todos los archivos — descripción

### ⚙️ Configuración

| Archivo | Tag | Descripción |
|---|---|---|
| `middleware.ts` | config | Refresca la sesión Supabase en cada request (via `@supabase/ssr`). Redirige a `/[locale]/login` si el usuario no está autenticado y quiere acceder a rutas `/(app)/`. |
| `next.config.ts` | config | Configuración de Next.js: plugin de next-intl, path aliases (`@/`). |
| `tailwind.config.ts` | config | Paleta de colores personalizada (verde principal, acentos neutros), fonts, breakpoints. |
| `messages/en.json` | i18n | Todos los textos de UI en inglés. Claves: `nav.*`, `recipe.*`, `ingredient.*`, `meallog.*`, `catalog.*`, `auth.*`. |
| `messages/es.json` | i18n | Todos los textos de UI en español. Mismas claves que `en.json`. |

### 🌐 i18n

| Archivo | Tag | Descripción |
|---|---|---|
| `src/i18n.ts` | i18n | Configuración de next-intl: locales disponibles (`en`, `es`), locale por defecto (`en`). |
| `src/app/[locale]/layout.tsx` | layout | Envuelve la app con `NextIntlClientProvider` pasando el locale y los mensajes. También monta `Providers` (TanStack Query, Zustand). |

### 🗄️ Supabase

| Archivo | Tag | Descripción |
|---|---|---|
| `src/lib/supabase/client.ts` | lib | `createBrowserClient` de `@supabase/ssr`. Usado en Client Components. Singleton para evitar múltiples instancias. |
| `src/lib/supabase/server.ts` | lib | `createServerClient` con `cookies()` de Next.js. Usado en Server Components y Route Handlers. |
| `src/types/supabase.ts` | types | Tipos generados por `supabase gen types typescript`. Reemplaza el placeholder `Database = any` tras correr el CLI. |

### 📐 Lógica de dominio

| Archivo | Tag | Descripción |
|---|---|---|
| `src/types/domain.ts` | types | Tipos del dominio: `Ingredient`, `Recipe`, `RecipeIngredient`, `MealLog`, `IngredientCost`, `NutritionTotals`, `DayNutrition`. |
| `src/constants/nutrition.ts` | lib | RDA (valores diarios recomendados) por nutriente, categorías de ingredientes con labels en clave i18n, tipos de comida, monedas soportadas: `PEN`, `ARS`, `USD`, `EUR`. |
| `src/lib/nutrition.ts` | lib | Funciones puras: `calcIngredientNutrition(ingredient, grams)`, `calcRecipeNutrition(recipe, recipeIngredients, ingredients)`, `calcDayNutrition(mealLogs, ...)`, `calcNutrientPercent(value, nutrientKey)`. Sin estado ni efectos. |
| `src/lib/costs.ts` | lib | Funciones puras: `calcRecipeCost(recipe, recipeIngredients, costs)`, `calcMealCost(mealLog, ...)`. Devuelve `null` si falta algún precio. |
| `src/lib/formatters.ts` | lib | `formatNutrient(value, unit)`, `formatCurrency(value, currency, locale)`, `formatDate(date, locale)`, `formatPct(value)`. |

### 🗃️ Estado global (Zustand)

| Archivo | Tag | Descripción |
|---|---|---|
| `src/stores/authStore.ts` | store | Usuario actual, estado de carga de sesión. Se inicializa escuchando `supabase.auth.onAuthStateChange`. Expone `user`, `isLoading`, `setUser`. |
| `src/stores/uiStore.ts` | store | Modal abierto, tab activa, cola de toasts. No persiste entre recargas. |

### 🔗 Hooks

| Archivo | Tag | Descripción |
|---|---|---|
| `src/hooks/useIngredients.ts` | hook | `useIngredients(locale)` — fetch de todos los ingredientes con nombre en el locale activo (JOIN a `ingredient_translations`). `useIngredient(id, locale)` — uno solo. |
| `src/hooks/useIngredientCosts.ts` | hook | `useIngredientCosts(userId)` — costos del usuario. `useUpsertCost()` — mutation para crear/actualizar. |
| `src/hooks/useRecipes.ts` | hook | `useRecipes(userId)` — recetas privadas. `useRecipeDetail(id)` — con ingredientes. `useCreateRecipe()`, `useUpdateRecipe()`, `useDeleteRecipe()`. |
| `src/hooks/useCatalog.ts` | hook | `useCatalog(filters)` — recetas públicas con filtros. `useForkRecipe()` — duplica la receta al usuario. |
| `src/hooks/useMealLog.ts` | hook | `useMealLog(userId, date)` — entradas del día. `useLogMeal()` — agregar al log. `useDeleteMealLog()` — eliminar. |
| `src/hooks/useDayNutrition.ts` | hook | Combina `useMealLog` + `useRecipes` + `useIngredients` y calcula totales del día: calorías, macros, micronutrientes, costo. |
| `src/hooks/useAuth.ts` | hook | Wrapper sobre `authStore`. Expone `user`, `isLoading`, `login(email, password)`, `register(email, password)`, `logout()`. |

### 🧩 Componentes UI base

| Archivo | Tag | Descripción |
|---|---|---|
| `components/ui/Button.tsx` | UI | Variantes: `primary`, `secondary`, `ghost`, `danger`. Props: `size`, `loading` (spinner), `disabled`. |
| `components/ui/Input.tsx` | UI | Input controlado con label, error, hint. Compatible con `react-hook-form`. |
| `components/ui/Card.tsx` | UI | Contenedor card con variantes de padding y borde. |
| `components/ui/Modal.tsx` | UI | Portal al body. Cierre con ESC y click fuera. Acepta `title` y `children`. |
| `components/ui/Badge.tsx` | UI | Badge/chip de colores por categoría. |
| `components/ui/SearchInput.tsx` | UI | Input con ícono de lupa y dropdown de resultados. Acepta `onSearch` y `renderItem`. |
| `components/ui/NutrientBar.tsx` | UI | Barra de progreso: label, valor actual, objetivo, % RDA. Color: verde/amarillo/rojo según %. |
| `components/ui/Toast.tsx` | UI | Sistema de toasts. `useToast()` expone `toast.success()`, `toast.error()`. Cola desde `uiStore`. |
| `components/ui/EmptyState.tsx` | UI | Estado vacío genérico: ícono emoji, título, descripción, CTA opcional. |
| `components/ui/LocaleSwitcher.tsx` | UI | Switcher EN / ES. Usa el routing de next-intl para cambiar de locale sin perder la ruta. |

### 🧩 Layout

| Archivo | Tag | Descripción |
|---|---|---|
| `components/layout/AppShell.tsx` | layout | Shell de páginas autenticadas: nav + sidebar + área de contenido. |
| `components/layout/NavBar.tsx` | layout | Barra superior con logo, links principales, `LocaleSwitcher` y avatar con menú de sesión. |
| `components/layout/Sidebar.tsx` | layout | Navegación lateral: Diary, Recipes, Catalog, Ingredients. Activo por ruta actual. |

### 🧩 Componentes de ingredientes

| Archivo | Tag | Descripción |
|---|---|---|
| `components/ingredients/IngredientTable.tsx` | component | Tabla con columnas: nombre (en locale activo), categoría, kcal, macros, micronutrientes clave. Búsqueda y filtro por categoría. |
| `components/ingredients/IngredientRow.tsx` | component | Fila individual: badge de categoría y botón "Editar precio". |
| `components/ingredients/CostForm.tsx` | component | Modal para cargar/editar precio: precio, gramos comprados, tienda, moneda (PEN/ARS/USD/EUR). Muestra precio/100 g calculado en tiempo real. |

### 🧩 Componentes de recetas

| Archivo | Tag | Descripción |
|---|---|---|
| `components/recipes/RecipeCard.tsx` | component | Tarjeta: nombre, categoría, resumen nutricional (kcal, proteínas), costo estimado, acciones. |
| `components/recipes/RecipeList.tsx` | component | Grid de `RecipeCard`. Maneja loading/error/empty states. Filtro por categoría. |
| `components/recipes/RecipeBuilder.tsx` | component | Crear/editar recetas. Buscador de ingredientes + lista con cantidades + preview nutricional en tiempo real. |
| `components/recipes/IngredientSelector.tsx` | component | Autocomplete para buscar y agregar ingredientes. Muestra nombre (locale), categoría, kcal/100 g. |
| `components/recipes/RecipeIngredientRow.tsx` | component | Fila dentro del builder: nombre, input de gramos, kcal calculadas, botón eliminar. |
| `components/recipes/RecipeDetail.tsx` | component | Vista completa: ingredientes, instrucciones, resumen nutricional detallado (macros + todos los micros), costo por porción y total. |

### 🧩 Componentes de nutrición

| Archivo | Tag | Descripción |
|---|---|---|
| `components/nutrition/NutritionPanel.tsx` | component | Panel reutilizable. Acepta `NutritionTotals` y muestra macros + micronutrientes con `NutrientBar` y % RDA. Usado en `RecipeDetail` y en el dashboard diario. |
| `components/nutrition/MacroChart.tsx` | component | Distribución de macros (% calorías de proteínas/carbos/grasas) como donut o barras horizontales. |
| `components/nutrition/DayNutritionSummary.tsx` | component | Resumen del día: calorías totales vs meta, macros, micronutrientes críticos, costo total. Usa `useDayNutrition()`. |

### 🧩 Componentes de meal log

| Archivo | Tag | Descripción |
|---|---|---|
| `components/meallog/MealLogList.tsx` | component | Comidas del día agrupadas por tipo. Muestra nombre de receta o ingrediente, cantidad y kcal. |
| `components/meallog/AddMealForm.tsx` | component | Formulario: tipo de comida, búsqueda de recetas propias o ingredientes sueltos, porciones/gramos. Preview de nutrientes antes de guardar. |
| `components/meallog/DateNavigator.tsx` | component | Navegación entre días `‹ fecha ›` con atajo a "Hoy". |

### 🧩 Componentes de catálogo

| Archivo | Tag | Descripción |
|---|---|---|
| `components/catalog/CatalogCard.tsx` | component | Tarjeta de receta pública: resumen nutricional, categoría, botón "Usar receta" que dispara el fork. |
| `components/catalog/CatalogFilters.tsx` | component | Filtros: categoría (tabs), búsqueda por nombre. Mantiene estado local. |

### 📄 Páginas (App Router)

| Archivo | Tag | Descripción |
|---|---|---|
| `app/[locale]/(public)/catalog/page.tsx` | page SSR | Catálogo de recetas públicas. **Server Component** — fetch directo a Supabase, HTML indexado por Google. `CatalogFilters` y `CatalogCard` hidratados en cliente. |
| `app/[locale]/(public)/catalog/[id]/page.tsx` | page SSR | Detalle de receta pública. **Server Component** con `generateMetadata` para SEO (título, descripción). `RecipeDetail` como Client Component. |
| `app/[locale]/(public)/login/page.tsx` | page | Form email + password. `useAuth().login()`. Link a signup. |
| `app/[locale]/(public)/signup/page.tsx` | page | Form de registro. Validación con Zod. |
| `app/[locale]/(app)/diary/page.tsx` | page | Dashboard del día. `DayNutritionSummary` + `MealLogList` + botón para agregar comida. `DateNavigator` para ver días anteriores. |
| `app/[locale]/(app)/recipes/page.tsx` | page | Listado de recetas propias. `RecipeList` + filtro por categoría + botón "Nueva receta". |
| `app/[locale]/(app)/recipes/new/page.tsx` | page | Creación de receta. Contiene `RecipeBuilder` en modo create. |
| `app/[locale]/(app)/recipes/[id]/page.tsx` | page | Detalle de receta propia. `RecipeDetail` + botones editar, eliminar, "Agregar al log de hoy". |
| `app/[locale]/(app)/recipes/[id]/edit/page.tsx` | page | Edición de receta. `RecipeBuilder` en modo edit, carga los datos existentes. |
| `app/[locale]/(app)/ingredients/page.tsx` | page | Tabla completa de ingredientes. Permite cargar/editar precios abriendo `CostForm` en modal. |
| `app/[locale]/(app)/costs/page.tsx` | page | Resumen de precios cargados por el usuario, ordenados por ingrediente y fecha. |
| `app/[locale]/(app)/profile/page.tsx` | page | Configuración: nombre, objetivo calórico diario, moneda preferida. Botón de cerrar sesión. |

---

## 8. Orden de construcción

| Paso | Qué se construye |
|---|---|
| **1** | **SQL** — migrations 001 + 002, seeds de ingredientes con FoodData Central data |
| **2** | **Setup del proyecto** — `create-next-app`, Tailwind, Supabase client/server, next-intl, tipos, messages EN/ES |
| **3** | **Auth** — middleware, login/signup pages, `authStore`, protección de rutas `/(app)/` |
| **4** | **Ingredientes** — `useIngredients`, `IngredientsPage`, `IngredientTable` (solo lectura, con nombres en locale activo) |
| **5** | **Costos** — `useIngredientCosts`, `CostForm`, columna de precio en `IngredientsPage` |
| **6** | **Recetas** — `useRecipes`, `RecipeBuilder`, `RecipesPage`, `RecipeDetailPage` con `NutritionPanel` |
| **7** | **Catálogo (SSR)** — `useCatalog`, `CatalogPage` como Server Component, fork de recetas |
| **8** | **Meal Log** — `useMealLog`, `MealLogPage`, `AddMealForm`, `useDayNutrition` |
| **9** | **Dashboard (Diary)** — `DayNutritionSummary`, resumen de calorías, macros y micros del día |
| **10** | **Polish** — toasts, loading/empty states, mobile responsiveness, `ProfilePage`, `LocaleSwitcher` |
