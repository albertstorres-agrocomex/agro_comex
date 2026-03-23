"use client"

import { useState, useCallback } from "react"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error react-simple-maps v3 ships no bundled types
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

// AgroComex data viz palette — green intensity ramp
const INTENSITY_FILLS = [
  "var(--muted)",           // 0: no data
  "oklch(0.80 0.06 148)",  // 1: low
  "oklch(0.63 0.09 147)",  // 2: moderate-low
  "oklch(0.46 0.095 145)", // 3: moderate
  "oklch(0.32 0.080 145)", // 4: high (near --primary)
  "oklch(0.87 0.185 125)", // 5: very high (--accent lime)
] as const

const HOVER_FILL = "var(--chart-4)"

function intensityLevel(value: number, max: number): number {
  if (!value || max === 0) return 0
  const r = value / max
  if (r >= 0.50) return 5
  if (r >= 0.25) return 4
  if (r >= 0.10) return 3
  if (r >= 0.04) return 2
  return 1
}

export interface TradeCountry {
  /** ISO 3166-1 numeric code as string (e.g. "156" = China, "076" = Brazil) */
  id: string
  name: string
  value: number
  share?: number
}

export interface WorldMapComexProps {
  data: TradeCountry[]
  title?: string
  description?: string
  /** ISO numeric id of the origin country. Defaults to "076" (Brazil). */
  originCountryId?: string
  valueFormatter?: (v: number) => string
  shareFormatter?: (v: number) => string
  className?: string
}

export function WorldMapComex({
  data,
  title,
  description,
  originCountryId = "076",
  valueFormatter = (v) => `US$ ${(v / 1e9).toFixed(1)}B`,
  shareFormatter = (v) => `${v.toFixed(1)}%`,
  className,
}: WorldMapComexProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{
    clientX: number
    clientY: number
    id: string | null
  }>({ clientX: 0, clientY: 0, id: null })

  const dataMap = new Map(data.map((d) => [d.id, d]))
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0
  const topPartners = [...data].sort((a, b) => b.value - a.value).slice(0, 5)

  const handleEnter = useCallback(
    (id: string, evt: React.MouseEvent<SVGPathElement>) => {
      setHoveredId(id)
      setTooltip({ clientX: evt.clientX, clientY: evt.clientY, id })
    },
    []
  )

  const handleMove = useCallback((evt: React.MouseEvent<SVGPathElement>) => {
    setTooltip((prev) => ({
      ...prev,
      clientX: evt.clientX,
      clientY: evt.clientY,
    }))
  }, [])

  const handleLeave = useCallback(() => {
    setHoveredId(null)
    setTooltip({ clientX: 0, clientY: 0, id: null })
  }, [])

  const tooltipCountry = tooltip.id ? (dataMap.get(tooltip.id) ?? null) : null

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        {(title || description) && (
          <CardHeader className="pb-2">
            {title && (
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
            )}
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </CardHeader>
        )}

        <CardContent className="p-0">
          {/* Map */}
          <div
            className="relative w-full select-none"
            style={{ aspectRatio: "16 / 7", backgroundColor: "var(--card)" }}
          >
            <ComposableMap
              projection="geoNaturalEarth1"
              projectionConfig={{ scale: 145, center: [10, 10] }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: Array<{ rsmKey: string; id: string | number; [k: string]: unknown }> }) =>
                  geographies.map((geo) => {
                    const id = String(geo.id)
                    const isOrigin = id === originCountryId
                    const isHovered = id === hoveredId
                    const country = dataMap.get(id)
                    const level = country
                      ? intensityLevel(country.value, maxValue)
                      : 0

                    const fill = isOrigin
                      ? "var(--primary)"
                      : isHovered
                      ? HOVER_FILL
                      : INTENSITY_FILLS[level]

                    return (
                      <Geography
                        key={geo.rsmKey as string}
                        geography={geo}
                        fill={fill}
                        stroke="var(--background)"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none" },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(evt: React.MouseEvent<SVGPathElement>) => handleEnter(id, evt)}
                        onMouseMove={handleMove}
                        onMouseLeave={handleLeave}
                      />
                    )
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>

          {/* Footer: scale + origin legend + top partners */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-t border-border/50 px-4 py-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Volume comercial
              </span>
              <div className="flex items-center gap-0.5">
                <span className="mr-1 text-[10px] text-muted-foreground">baixo</span>
                {(INTENSITY_FILLS.slice(1) as string[]).map((color, i) => (
                  <div
                    key={i}
                    className="h-2 w-5"
                    style={{
                      backgroundColor: color,
                      borderRadius:
                        i === 0
                          ? "2px 0 0 2px"
                          : i === 4
                          ? "0 2px 2px 0"
                          : undefined,
                    }}
                  />
                ))}
                <span className="ml-1 text-[10px] text-muted-foreground">alto</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="h-2 w-4 rounded-sm bg-primary" />
              <span className="text-[10px] text-muted-foreground">Brasil (origem)</span>
            </div>

            {topPartners.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Principais destinos
                </span>
                {topPartners.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 text-[10px]">
                    <span className="w-3 font-mono text-muted-foreground">{i + 1}</span>
                    <span className="text-foreground">{p.name}</span>
                    {p.share !== undefined && (
                      <span className="ml-auto pl-4 font-mono text-muted-foreground">
                        {shareFormatter(p.share)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fixed tooltip — rendered outside Card to avoid overflow clipping */}
      {hoveredId !== null && (
        <div
          className="pointer-events-none fixed z-50 min-w-[130px] rounded-md border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm"
          style={{ left: tooltip.clientX + 14, top: tooltip.clientY - 44 }}
        >
          {tooltipCountry ? (
            <>
              <p className="text-xs font-semibold text-foreground">
                {tooltipCountry.name}
              </p>
              <p className="mt-0.5 font-mono text-xs text-accent-foreground">
                {valueFormatter(tooltipCountry.value)}
              </p>
              {tooltipCountry.share !== undefined && (
                <p className="font-mono text-[10px] text-muted-foreground">
                  {shareFormatter(tooltipCountry.share)} do total
                </p>
              )}
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground">Sem dados</p>
          )}
        </div>
      )}
    </>
  )
}
