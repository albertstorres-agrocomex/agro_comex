import type { CSSProperties, MouseEvent, ReactNode } from "react"

declare module "react-simple-maps" {
  export interface GeoFeature {
    rsmKey: string
    id: string | number
    type: string
    properties: Record<string, unknown>
    geometry: unknown
  }

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: {
      scale?: number
      center?: [number, number]
      rotate?: [number, number, number]
    }
    width?: number
    height?: number
    style?: CSSProperties
    className?: string
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: GeoFeature[] }) => ReactNode
  }

  export interface GeographyProps {
    geography: GeoFeature
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: CSSProperties
      hover?: CSSProperties
      pressed?: CSSProperties
    }
    onMouseEnter?: (evt: MouseEvent<SVGPathElement>) => void
    onMouseMove?: (evt: MouseEvent<SVGPathElement>) => void
    onMouseLeave?: (evt: MouseEvent<SVGPathElement>) => void
    onClick?: (evt: MouseEvent<SVGPathElement>) => void
    className?: string
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element
  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element
  export function ZoomableGroup(props: {
    center?: [number, number]
    zoom?: number
    children?: ReactNode
  }): JSX.Element
  export function Marker(props: {
    coordinates: [number, number]
    children?: ReactNode
  }): JSX.Element
}
