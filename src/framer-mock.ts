/**
 * Mock implementation of the "framer" library for local web development.
 * This allows Framer code components importing from "framer" to run in standard React apps.
 */

export const ControlType = {
  Boolean: "boolean",
  Number: "number",
  String: "string",
  Color: "color",
  Enum: "enum",
  Padding: "padding",
  BorderRadius: "borderRadius",
  ComponentInstance: "componentInstance",
  Image: "image",
  File: "file",
  Transition: "transition",
} as const;

export function addPropertyControls(component: any, controls: any) {
  // Property controls are used by the Framer interface but are a no-op in standard React.
  if (component) {
    (component as any).propertyControls = controls;
  }
}

export function useIsStaticRenderer() {
  return false;
}
