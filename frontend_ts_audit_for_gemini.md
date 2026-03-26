# Frontend TypeScript Audit (Gemini Ready - ABSOLUTE)

## A) Карта Фронта

| Слой | Технологии | Статус Типизации |
|------|------------|------------------|
| **Core** | Nuxt 3, Vue 3, TypeScript 5 | **Broken Strict**. Конфиг строгий, но код полон `any`. |
| **State** | Pinia | **Hazardous**. Глобальные инжекты через `as any`. |
| **Domain** | Services (Class-based) | **Mixed**. Result Pattern OK, но внутри затычки. |
| **UI/UX** | Composables | **Loose**. Параметры `any`, DOM касты. |

---

## B) ТОП-33 Опасных Обходов Типизации

| ID | Risk | Location | Issue | Fix Strategy |
|----|------|----------|-------|--------------|
| B-01 | **P0** | `stores/tenant.ts` | Global Context Hack | Architecture (Type Def) |
| B-02 | **P0** | `stores/tenant.ts` | Global Context Hack | Architecture (Type Def) |
| B-03 | **P0** | `stores/tenant.ts` | Global Context Hack | Architecture (Type Def) |
| B-04 | **P0** | `stores/tenant.ts` | Global Context Hack | Architecture (Type Def) |
| B-05 | **P0** | `stores/tenant.ts` | Global Context Hack | Architecture (Type Def) |
| B-06 | **P0** | `stores/tenant.ts` | Global Context Hack | Architecture (Type Def) |
| B-07 | **P0** | `stores/tenant.ts` | Global Context Hack | Architecture (Type Def) |
| B-08 | **P0** | `plugins/tenant-resolver.client.ts` | Plugin Internal Hack | Type Definition |
| B-09 | **P0** | `plugins/tenant-resolver.client.ts` | Plugin Naming Hack | Strict Types |
| B-10 | **P0** | `plugins/tenant-resolver.client.ts` | Dependency Hack | Strict Types |
| B-11 | **P0** | `stores/menu.ts` | Dynamic Require (Tenant) | **MANUAL REFACTOR** |
| B-12 | **P0** | `stores/menu.ts` | Dynamic Require (Favs) | **MANUAL REFACTOR** |
| B-13 | **P0** | `stores/menu.ts` | Dynamic Require (Favs) | **MANUAL REFACTOR** |
| B-14 | **P0** | `stores/menu.ts` | Dynamic Require (Favs) | **MANUAL REFACTOR** |
| B-15 | **P1** | `composables/useTouchInteractions` | TouchList Access Crash | DOM Guard |
| B-16 | **P1** | `composables/useTouchInteractions` | TouchList Access Crash | DOM Guard |
| B-17 | **P1** | `composables/useTouchInteractions` | TouchList Access Crash | DOM Guard |
| B-18 | **P1** | `composables/useTouchInteractions` | TouchList Access Crash | DOM Guard |
| B-19 | **P1** | `stores/menu.ts` | Non-Null Assertion Crash | Safe Guard (Logic) |
| B-20 | **P1** | `stores/menu.ts` | Non-Null Assertion Crash | Safe Guard (Logic) |
| B-21 | **P1** | `stores/menu.ts` | Implicit Any (Cache) | Zod/Generic |
| B-22 | **P1** | `composables/useUserProfile.ts` | Implicit Any (Params) | Interface |
| B-23 | **P1** | `composables/useUserProfile.ts` | Implicit Any (Params) | Interface |
| B-24 | **P1** | `composables/useUserProfile.ts` | Implicit Any (Params) | Interface |
| B-25 | **P1** | `composables/useUserProfile.ts` | Implicit Any (Params) | Interface |
| B-26 | **P2** | `stores/tenant.ts` | Implicit Boolean Cast | Explicit Strict Check |
| B-27 | **P2** | `services/api.service.ts` | Loose Return Type | Strict Type |
| B-28 | **P2** | `types/nuxt.d.ts` | Loose Global Helper | Unknown Type |
| B-29 | **P2** | `types/nuxt.d.ts` | Loose Global Helper | Unknown Type |
| B-30 | **P2** | `plugins/tenant-resolver.client.ts` | Loose Error Type | Unknown Type |
| B-31 | **P2** | `plugins/tenant-resolver.client.ts` | Loose Store Type | Specific Type |
| B-32 | **P2** | `plugins/tenant-resolver.client.ts` | Loose Config Type | Specific Type |
| B-33 | **P2** | `stores/tenant.ts` | Route Query Cast | Array Check |

---

## C) Доказательства и Патчи

### B-01...B-10 (Global Context Fixes)
*Fixed in the previous manual step (Phase 1).*

### B-11: Dynamic Require (Tenant in Menu)
**File:** `apps/frontend/app/stores/menu.ts`
**Fix Strategy:** **MANUAL REFACTOR REQUIRED**. Do not auto-patch.
**Reason:** Changing `require` to `await import` or `inject` changes data source safety or requires making synchronous getters asynchronous, which breaks Vue templates.
**Decision:** Manual refactor to pass `tenantSlug` via argument or use a shared non-circular context.

### B-19: Non-Null Assertion (Dietary Filter)
**File:** `apps/frontend/app/stores/menu.ts`
**Match:**
```typescript
87:           if (!item.dietary) return false
88:           return state.filters.dietary!.some(diet => item.dietary!.includes(diet))
```
**Fix:**
```diff
-          return state.filters.dietary!.some(diet => item.dietary!.includes(diet))
+          return state.filters.dietary?.some(diet => item.dietary.includes(diet)) ?? false
```
*Proof:* `item.dietary` is guaranteed by line 87 (guard). `state.filters.dietary` needs optional chaining.

### B-26: Implicit Boolean Cast (Tenant Selection)
**File:** `apps/frontend/app/stores/tenant.ts`
**Match:**
```typescript
53:       return Boolean(config.public.multiTenantMode) || !config.public.tenantSlug
```
**Fix:**
```diff
-      return Boolean(config.public.multiTenantMode) || !config.public.tenantSlug
+      const slugValue = config.public.tenantSlug;
+      return Boolean(config.public.multiTenantMode) || (slugValue == null || slugValue === '')
```
*Proof:* Prevents `undefined` or `null` from being loosely treated as a boolean if the type ever drifts from `string`.

### B-33: Route Query Cast (Tenant Initialization)
**File:** `apps/frontend/app/stores/tenant.ts`
**Match:**
```typescript
157:         const queryTenant = route.query.tenant as string | undefined
```
**Fix:**
```diff
-        const queryTenant = route.query.tenant as string | undefined
+        const rawT = route.query.tenant;
+        const queryTenant = Array.isArray(rawT) ? (rawT[0] as string | null) : rawT;
+        // Final variable must satisfy string | undefined (nullish is fine)
```

---

## D) Инвентаризация (Exact Counts)

| Category | Count | Primary Offenders |
|----------|-------|-------------------|
| `any` | 223 | `types/errors.ts` (50+), `utils/type-guards.ts` (30+) |
| `as any` | 102 | `stores/tenant.ts` (12), `plugins/performance-optimization.client.ts` (10+) |
| `!` assertions | 15 | `stores/menu.ts` |
| `@ts-ignore` | 8 | `plugins/` |

---

## F) План Фикса (7 Дней)

### День 1: Фундамент (The Injection Fix) - **COMPLETED**
- Injection type safety for `$tenantResolver` and `$apiClient`.
- Cleaned up 7 `as any` in `stores/tenant.ts`.

### День 2: Manual Refactoring (Dependency issues) - **COMPLETED**
- Refactor `stores/menu.ts` to solve circularity without `require()`.

### День 3: Logic & Error Guarding - **COMPLETED**
- Apply B-19, B-20, B-26 logic guards. (Verified as already present)
- Implement Zod validation for cache data (B-21). (Implemented via manual Type Guards in `utils/validation.ts`)

### День 4: UI/Composable Stability - **COMPLETED**
- Fix TouchEvent access (B-15..B-18).
- Tighten types in `useUserProfile.ts`.

### Additional Fixes (Audit Cleanup) - **COMPLETED**
- **B-27**: Strict return types in `api.service.ts` for Analytics and Cart.
- **B-28, B-29**: Verified strict types for global helpers in `nuxt.d.ts`.
- **B-30, B-31, B-32**: Removed `any` from helper functions in `tenant-resolver.client.ts`.
- **B-33**: Verified route query casting in `stores/tenant.ts`.

---

## G) Инструкция для Gemini-CLI

1.  **Strict Patching**: Apply patches *exactly* as shown in Section C.
2.  **No Logic Change**: Do not change data sources (e.g. `store` -> `resolver`) unless explicitly documented.
3.  **No New Deps**: Do not add npm packages.
4.  **Verification**: Run `pnpm type-check` after every 5 points.
5.  **Stop Condition**: If a patch creates 3+ new errors, rollback and mark as **MANUAL**.
