"use client";

import { useState, type FormEvent } from "react";
import { CopyIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/Switch";
import { adminRequest } from "@/features/admin/api-errors";
import { settingsErrorMessage } from "@/features/admin/settings/errors";
import {
  MAX_RANGES_PER_DAY,
  WEEK_DAYS,
  copyDayToAll,
  nextRange,
  rowsToWeek,
  validateWeek,
  weekToRows,
  type DaySchedule,
  type TimeRange,
} from "@/features/admin/settings/hours";
import type { OpeningHoursRow } from "@/server/public-menu/mapper";
import { formatOpeningHours } from "@/server/public-menu/mapper";
import { SaveBar, SettingsCard, fieldClass, iconButtonClass, useCardStatus } from "./parts";

const MONDAY = 1;

export function HoursCard({
  initial,
  readOnly,
}: {
  initial: OpeningHoursRow[];
  readOnly: boolean;
}) {
  const card = useCardStatus();
  const [week, setWeek] = useState<DaySchedule[]>(() => rowsToWeek(initial));
  const [errors, setErrors] = useState<Record<number, string>>({});
  const locked = readOnly || card.saving;

  function change(next: DaySchedule[]) {
    setWeek(next);
    setErrors({});
    card.reset();
  }

  function updateDay(dayOfWeek: number, ranges: TimeRange[]) {
    change(week.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ranges } : day)));
  }

  const liveErrors = validateWeek(week);
  const preview =
    Object.keys(liveErrors).length === 0 ? formatOpeningHours(weekToRows(week)) : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (locked) return;

    const found = validateWeek(week);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      card.fail("Revisá los días marcados.");
      return;
    }

    card.start();
    const result = await adminRequest("/api/admin/business/opening-hours", {
      method: "PUT",
      body: { hours: weekToRows(week) },
    });
    if (!result.ok) {
      card.handleFailure(
        result,
        result.code === "validation_error"
          ? "Revisá los horarios: el cierre va después de la apertura y no se pueden superponer."
          : settingsErrorMessage(result.code),
      );
      return;
    }
    card.succeed();
  }

  return (
    <SettingsCard
      id="hours"
      title="Horarios"
      hint="Elegí cuándo abrís. Podés cargar más de un horario por día, por ejemplo mañana y tarde."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <ul className="flex flex-col gap-2">
          {WEEK_DAYS.map(({ dayOfWeek, label }) => {
            const day = week.find((entry) => entry.dayOfWeek === dayOfWeek)!;
            const open = day.ranges.length > 0;
            const error = errors[dayOfWeek];
            return (
              <li key={dayOfWeek} className="rounded-2xl bg-cream p-2.5 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-espresso">{label}</p>
                  <Switch
                    checked={open}
                    disabled={locked}
                    label={`${label}: abierto`}
                    text={open ? "Abierto" : "Cerrado"}
                    onChange={(on) => updateDay(dayOfWeek, on ? [nextRange([])] : [])}
                  />
                </div>

                {open && (
                  <ul className="mt-3 flex flex-col gap-2">
                    {day.ranges.map((range, index) => (
                      <li key={index} className="flex items-center gap-1.5">
                        <input
                          type="time"
                          name={`hours-${dayOfWeek}-${index}-opens`}
                          value={range.opensAt}
                          disabled={locked}
                          aria-label={`${label}, horario ${index + 1}: apertura`}
                          onChange={(event) =>
                            updateDay(
                              dayOfWeek,
                              day.ranges.map((r, i) =>
                                i === index ? { ...r, opensAt: event.target.value } : r,
                              ),
                            )
                          }
                          className={`${fieldClass} min-w-0 flex-1 px-1.5! text-center text-[15px]! tabular-nums max-sm:[&::-webkit-calendar-picker-indicator]:hidden`}
                        />
                        <span aria-hidden="true" className="text-roast">
                          a
                        </span>
                        <input
                          type="time"
                          name={`hours-${dayOfWeek}-${index}-closes`}
                          value={range.closesAt}
                          disabled={locked}
                          aria-label={`${label}, horario ${index + 1}: cierre`}
                          onChange={(event) =>
                            updateDay(
                              dayOfWeek,
                              day.ranges.map((r, i) =>
                                i === index ? { ...r, closesAt: event.target.value } : r,
                              ),
                            )
                          }
                          className={`${fieldClass} min-w-0 flex-1 px-1.5! text-center text-[15px]! tabular-nums max-sm:[&::-webkit-calendar-picker-indicator]:hidden`}
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            disabled={locked}
                            aria-label={`Quitar horario ${index + 1} del ${label.toLowerCase()}`}
                            title="Quitar horario"
                            onClick={() =>
                              updateDay(
                                dayOfWeek,
                                day.ranges.filter((_, i) => i !== index),
                              )
                            }
                            className={`${iconButtonClass} hover:text-[#b45309]`}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {open && !readOnly && day.ranges.length < MAX_RANGES_PER_DAY && (
                  <button
                    type="button"
                    disabled={locked}
                    aria-label={`Agregar otro horario el ${label.toLowerCase()}`}
                    title="Agregar otro horario"
                    onClick={() => updateDay(dayOfWeek, [...day.ranges, nextRange(day.ranges)])}
                    className={`${iconButtonClass} mt-1 bg-white`}
                  >
                    <PlusIcon />
                  </button>
                )}

                {error && <p className="mt-2 text-sm font-semibold text-[#b45309]">{error}</p>}
              </li>
            );
          })}
        </ul>

        {!readOnly && (
          <div>
            <button
              type="button"
              disabled={locked}
              onClick={() => {
                change(copyDayToAll(week, MONDAY));
                card.info("Copiamos el horario del lunes a todos los días. Falta guardar.");
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cream px-4 text-sm font-semibold text-espresso transition-colors hover:bg-[#f3e6cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <CopyIcon />
              Copiar el lunes a todos los días
            </button>
          </div>
        )}

        <div className="rounded-2xl bg-espresso p-4 text-cream">
          <p className="font-accent text-base text-coffee-yellow">Así se ve en tu carta</p>
          <p className="mt-1.5 text-sm leading-relaxed">
            {preview ?? "Corregí los días marcados para ver cómo queda."}
          </p>
        </div>

        <SaveBar status={card.status} readOnly={readOnly} label="Guardar horarios" />
      </form>
    </SettingsCard>
  );
}
