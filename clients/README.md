# BRUNN — Clients

Cada cliente vive en su propia carpeta. La primera solución es `reports/`
(dashboard de performance mensual). En el futuro, cada cliente puede sumar
otras soluciones como carpetas hermanas (landing, portal, etc.).

## Estructura

```
clients/
  _assets/              motor compartido por TODOS los clientes (una sola vez)
    reports.js
    reports.css
  [slug]/
    reports/
      index.html        caparazón; referencia ../../_assets/ (ruta relativa)
      data/
        index.json      manifiesto: cliente, tipo y lista de períodos
        YYYY-MM.json     un archivo por mes
```

## Reglas

1. Agregar un mes: subir el `YYYY-MM.json` a `reports/data/` del cliente y
   sumar la línea en `index.json`. Nada más.
2. Cliente sin reportes aún: el `index.json` lleva `"periodos": []` y el
   dashboard muestra un estado vacío limpio hasta que entre el primer mes.
3. Mejorar diseño/motor: editar `_assets/reports.css` o `_assets/reports.js`.
   El cambio aplica a todos los clientes a la vez.
4. El `index.html` y `_assets/` no se tocan en la operación mensual.

## Tipos por cliente

| Cliente | Slug | Tipo | Tienda |
|---|---|---|---|
| VIMAR | vimar | community | — |
| El Che Almohadón | elche | ecommerce | Tiendanube |
| BT Importados | bt | ecommerce | Tiendanube |
| Farmacias RED | red | ecommerce | Tiendastic |
| Finder's | finders | ecommerce | Tiendanube |
| Peak | peak | ecommerce | Tiendanube |
| JDR Biomédica | jdr | leads | — |
| La Roca Motors | laroca | leads | — |
| Luxe Lens | luxe | leads | — |
| Momo | momo | ecommerce (solo Meta) | sin acceso |
