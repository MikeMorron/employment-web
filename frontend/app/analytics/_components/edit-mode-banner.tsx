"use client";

interface EditModeBannerProps {
  isDark: boolean;
}

export function EditModeBanner({ isDark }: EditModeBannerProps) {
  return (
    <section
      className={
        isDark
          ? "rounded-[1.2rem] border border-cyan-300/18 bg-cyan-300/10 px-4 py-3 text-cyan-100"
          : "rounded-[1.2rem] border border-sky-300 bg-sky-50 px-4 py-3 text-sky-800"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Modo de edición activo: arrastra los widgets desde el asa, cambia el tamaño desde las
          esquinas y usa el menú para configurar cada bloque.
        </p>
        <span
          className={
            isDark
              ? "rounded-full border border-cyan-300/20 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100"
              : "rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700"
          }
        >
          En edición
        </span>
      </div>
    </section>
  );
}
