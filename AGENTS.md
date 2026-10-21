# Modo de trabajo: maqueta de carta pública

## Punto de partida

- Alcance actual: únicamente la vista del cliente en `/c/red-gas`. Leer `docs/context.md`, especialmente las secciones 6 y 9, antes de cambiar componentes. No iniciar administración, backend ni productos reales por cuenta propia.
- Diseño **mobile-first**: comprobar primero una pantalla de ~375 px y luego escritorio. Respetar la identidad Red Gas: paleta cálida, Archivo Black para titulares, DM Sans para lectura y Bree Serif para acentos breves.
- Usar **pnpm**. La elección actual del usuario es **sin TDD**; sí exigir verificaciones funcionales y visuales.
- Separar datos mock tipados de componentes. Mantener reemplazables los datos, imágenes y colores para una futura personalización; no crear infraestructura de configuración antes de necesitarla.

## Un componente por vez

1. Explorar el componente siguiente y acotar la implementación. Preservar los componentes que el usuario ya aprobó.
2. Renderizarlo en la ruta pública con datos de ejemplo. No simular enlaces, filtros ni contenido que todavía no existan.
3. Ejecutar `pnpm lint` y `pnpm build` con el servidor detenido. Luego iniciar la vista previa, revisar móvil/escritorio, interacción por clic/teclado cuando corresponda, desborde horizontal, carga de recursos y consola.
4. Mostrarle al usuario la URL que **responda correctamente en ese momento** y esperar aprobación visual explícita antes de pasar al próximo componente. La aprobación visual no autoriza por sí sola un commit; pedir autorización explícita para confirmar cada unidad. No hacer push ni abrir PR sin solicitud.
5. Registrar avances, controles pendientes y decisiones en el ODD local y su espejo de memoria si está disponible. `odd/` y `docs/` están ignorados por `.gitignore`: no forzar su inclusión en commits. No incluir `.codegraph/` por accidente.

## Estado al cerrar esta sesión

- Encabezado `MenuHeader` aprobado y confirmado en `a2d898b` (`feat/public-menu-header`). Preservar el logo redondo sin borde, la ubicación mock `Salta, Argentina` y el fondo fotográfico con overlay.
- En la rama `feat/public-menu-categories`, `CategoryNav` y los datos mock de categorías están implementados, **visualmente aprobados** y confirmados en `bb4279e`. Los botones cambian solamente la selección resaltada (`aria-pressed`); aún no filtran ni navegan porque no existen secciones/productos. Ver `odd/tasks/public-menu-category-nav.md` para el estado detallado.
- `pnpm lint` y `pnpm build` pasaron; la vista de producción dio 200 en `/c/red-gas` y 404 en un slug desconocido. Se comprobaron selección por clic y teclado, foco visible y scroll horizontal móvil sin desbordar la página.
- Incidente pendiente: `pnpm dev` produjo un error de worker de Next al consultar un slug desconocido y luego devolvió 500; causa no confirmada. Para la última vista previa se detuvo dev, se ejecutó un build limpio y se usó `pnpm start`. **No ejecutar `pnpm build` simultáneamente con `pnpm dev` o `pnpm start`**: ambos usan `.next`. Diagnosticar el fallo de dev antes de darlo por resuelto.

## Reanudación

Primero revisar `git status`, el ODD local y la versión actual de `docs/context.md`; no inferir que la vista previa siga activa ni que los archivos ignorados estén versionados. Acordar el próximo componente antes de implementarlo.
