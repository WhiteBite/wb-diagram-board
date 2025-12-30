# Connector Architecture: Analysis and Improvements

## Overview

This document analyzes the current connector binding system in wb-diagram-board and proposes improvements based on Excalidraw's approach.

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Excalidraw's Approach](#excalidraws-approach)
3. [Comparison](#comparison)
4. [Proposed Improvements](#proposed-improvements)
5. [Implementation Plan](#implementation-plan)

---

## Current Architecture

### Data Structures

#### Binding Type (`types/canvas.ts`)

```typescript
export type BindingPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface Binding {
    elementId: string;
    position?: BindingPosition;  // Explicit position on edge
    focus?: number;              // Legacy: -1 to 1 position (deprecated)
    gap: number;                 // Distance from element edge
}
```

#### ConnectorElement

```typescript
export interface ConnectorElement extends BaseElement {
    type: 'connector';
    stroke: StrokeStyle;
    startArrow: ArrowHead;
    endArrow: ArrowHead;
    startBinding?: Binding;
    endBinding?: Binding;
    routeType: 'straight' | 'elbow' | 'curved';
    waypoints: Point[];
    label?: string;
    labelStyle?: TextStyle;
}
```

### Architecture Components

```
src/core/binding/
├── types.ts          # BindingPoint, BindingResolver interface, BindingError
├── resolver.ts       # ShapeBindingResolver, TextBindingResolver, etc.
├── registry.ts       # BindingResolverRegistry singleton
├── snap-utils.ts     # findNearestBindingPoint, createBindingFromResult
└── index.ts          # Public exports
```

### Current Flow

1. **Connector Creation**: User draws connector → `findNearestBindingPoint()` finds nearby shapes → creates `Binding` with position
2. **Endpoint Drag**: User drags endpoint → `findNearestBindingPoint()` searches for snap targets → updates binding
3. **Shape Move**: Shape moves → `updateConnectorBindings()` recalculates connector waypoints

### Strengths ✅

1. **Registry Pattern**: Extensible resolver system for different element types
2. **Position-based Binding**: Clear discrete positions (top, right, bottom, left, center)
3. **Snap Threshold**: Configurable distance for snapping
4. **Zoom-aware Snapping**: `getScaledThreshold()` adjusts for zoom level

### Weaknesses ❌

1. **Fixed Binding Points**: Only 5 positions per element (no continuous edge binding)
2. **No Intersection Calculation**: Doesn't calculate actual shape boundary intersection
3. **No Gap Support**: `gap` field exists but not used for visual offset
4. **No Bidirectional Binding**: Shape doesn't know which connectors are attached
5. **No Rotation Support**: Binding points don't account for element rotation

---

## Excalidraw's Approach

Based on research of Excalidraw's element binding system:

### Key Concepts

#### 1. PointBinding Structure

Excalidraw uses a more flexible binding structure:

```typescript
// Excalidraw's approach (conceptual)
interface PointBinding {
    elementId: string;
    focus: number;      // -1 to 1: position along element perimeter
    gap: number;        // Visual gap from element edge
    fixedPoint?: Point; // Optional fixed point for precise positioning
}
```

#### 2. Focus Parameter

- **Focus** is a normalized value (-1 to 1) representing position along the element's perimeter
- For rectangles: -1 = left center, 0 = top/bottom center, 1 = right center
- Allows **continuous positioning** along edges, not just discrete points

#### 3. Bidirectional Binding

Excalidraw maintains binding information on both sides:
- Arrow stores `startBinding` and `endBinding`
- Shape stores `boundElements` array with references to attached arrows

#### 4. Intersection Calculation

When updating bindings, Excalidraw:
1. Calculates the line from arrow endpoint to shape center
2. Finds intersection with shape boundary (accounting for shape type)
3. Applies gap offset along the intersection normal

#### 5. Automatic Updates

`updateBoundElements()` is called when:
- Shape is moved, resized, or rotated
- Arrow endpoint is dragged
- Elements are duplicated or deleted

### Edge Cases Handled

1. **Shape Deletion**: Removes binding from arrow, arrow remains with free endpoint
2. **Arrow Deletion**: Removes arrow from shape's `boundElements`
3. **Rotation**: Recalculates binding point based on rotated shape geometry
4. **Resize**: Maintains relative position (focus) on resized shape
5. **Undo/Redo**: Binding state is part of history

---

## Comparison

| Feature | WB-Diagram-Board | Excalidraw |
|---------|------------------|------------|
| Binding Positions | 5 discrete (top, right, bottom, left, center) | Continuous (focus -1 to 1) |
| Shape Awareness | No (one-way binding) | Yes (bidirectional) |
| Gap Support | Field exists, not implemented | Fully implemented |
| Rotation Support | No | Yes |
| Intersection Calculation | No (uses fixed points) | Yes (per shape type) |
| Elbow Routing | Basic | Advanced with heading detection |
| Binding Visualization | Shows binding points on hover | Shows binding indicator |

---

## Proposed Improvements

### Phase 1: Bidirectional Binding (High Priority)

**Problem**: When a shape is deleted, we must search all connectors to find affected ones.

**Solution**: Add `boundElements` to shapes.

```typescript
// Add to ShapeElement, TextElement, StickyElement, etc.
interface BindableElement extends BaseElement {
    boundElements?: BoundElement[];
}

interface BoundElement {
    id: string;           // Connector ID
    type: 'connector' | 'arrow';
    endpoint: 'start' | 'end';
}
```

**Benefits**:
- O(1) lookup for connected elements
- Easier cascade deletion
- Better undo/redo support

### Phase 2: Continuous Edge Binding (Medium Priority)

**Problem**: Only 5 fixed positions limits connector aesthetics.

**Solution**: Implement focus-based positioning.

```typescript
interface Binding {
    elementId: string;
    // New: continuous position along perimeter
    focus: number;        // -1 to 1
    // New: which edge (for disambiguation)
    edge?: 'top' | 'right' | 'bottom' | 'left';
    gap: number;
}
```

**Implementation**:

```typescript
// In resolver.ts
function getBindingPointFromFocus(
    element: CanvasElement,
    focus: number,
    edge?: string
): Point {
    const { x, y, width, height } = element;
    
    // Map focus to position on edge
    if (edge === 'top' || (!edge && focus >= -0.5 && focus <= 0.5)) {
        return {
            x: x + width * (0.5 + focus * 0.5),
            y: y
        };
    }
    // ... similar for other edges
}
```

### Phase 3: Shape Boundary Intersection (Medium Priority)

**Problem**: Connectors attach to fixed points, not actual shape boundaries.

**Solution**: Calculate intersection with shape geometry.

```typescript
interface ShapeGeometry {
    getIntersection(line: Line): Point | null;
    getNormalAt(point: Point): Vector;
}

// For ellipse
class EllipseGeometry implements ShapeGeometry {
    getIntersection(line: Line): Point | null {
        // Parametric ellipse intersection
        const { cx, cy, rx, ry } = this;
        // ... intersection calculation
    }
}
```

### Phase 4: Gap Implementation (Low Priority)

**Problem**: `gap` field exists but connectors touch shape edges.

**Solution**: Apply gap offset along intersection normal.

```typescript
function applyGap(point: Point, normal: Vector, gap: number): Point {
    return {
        x: point.x + normal.x * gap,
        y: point.y + normal.y * gap
    };
}
```

### Phase 5: Rotation Support (Low Priority)

**Problem**: Binding points don't account for element rotation.

**Solution**: Transform binding points by element rotation.

```typescript
function getRotatedBindingPoint(
    element: CanvasElement,
    position: string
): Point {
    const basePoint = getBindingPoint(element, position);
    const center = getElementCenter(element);
    return rotatePoint(basePoint, center, element.rotation);
}
```

---

## Implementation Plan

### Step 1: Add BoundElements to Store (1-2 hours)

```typescript
// In canvas-store.ts
interface CanvasState {
    // ... existing fields
    boundElements: Record<string, BoundElement[]>; // elementId -> bound connectors
}

// Update when connector is created/updated/deleted
function updateBoundElements(connectorId: string, binding: Binding | null, endpoint: 'start' | 'end') {
    // Add/remove from boundElements map
}
```

### Step 2: Refactor Binding Resolution (2-3 hours)

```typescript
// New file: src/core/binding/geometry.ts
export interface ShapeGeometry {
    getBoundaryPoint(direction: Vector): Point;
    getIntersection(line: Line): Point | null;
}

export function createGeometry(element: CanvasElement): ShapeGeometry {
    switch (element.type) {
        case 'rectangle': return new RectangleGeometry(element);
        case 'ellipse': return new EllipseGeometry(element);
        case 'diamond': return new DiamondGeometry(element);
        // ...
    }
}
```

### Step 3: Update SelectionOverlay (1-2 hours)

```typescript
// In SelectionOverlay.tsx - handleMouseMove for endpoint drag
const geometry = createGeometry(targetElement);
const direction = normalize(subtract(canvasPoint, getCenter(targetElement)));
const bindingPoint = geometry.getBoundaryPoint(direction);
```

### Step 4: Add Tests (2-3 hours)

```typescript
// New tests for binding improvements
describe('Bidirectional Binding', () => {
    it('should add connector to shape boundElements when binding', () => {});
    it('should remove connector from boundElements when unbinding', () => {});
    it('should delete connector when bound shape is deleted', () => {});
});

describe('Continuous Edge Binding', () => {
    it('should calculate binding point from focus value', () => {});
    it('should maintain focus when shape is resized', () => {});
});
```

---

## Code Examples

### Example 1: Bidirectional Binding Update

```typescript
// When creating/updating connector binding
function setConnectorBinding(
    connectorId: string,
    endpoint: 'start' | 'end',
    binding: Binding | null,
    state: CanvasState
): CanvasState {
    const connector = state.elements[connectorId] as ConnectorElement;
    const oldBinding = endpoint === 'start' ? connector.startBinding : connector.endBinding;
    
    // Remove from old bound element
    if (oldBinding) {
        const oldBoundElements = state.boundElements[oldBinding.elementId] || [];
        state.boundElements[oldBinding.elementId] = oldBoundElements.filter(
            be => !(be.id === connectorId && be.endpoint === endpoint)
        );
    }
    
    // Add to new bound element
    if (binding) {
        const boundElements = state.boundElements[binding.elementId] || [];
        state.boundElements[binding.elementId] = [
            ...boundElements,
            { id: connectorId, type: 'connector', endpoint }
        ];
    }
    
    // Update connector
    return {
        ...state,
        elements: {
            ...state.elements,
            [connectorId]: {
                ...connector,
                [endpoint === 'start' ? 'startBinding' : 'endBinding']: binding
            }
        }
    };
}
```

### Example 2: Shape Boundary Intersection

```typescript
// Rectangle boundary intersection
function getRectangleIntersection(
    rect: { x: number; y: number; width: number; height: number },
    fromPoint: Point,
    toPoint: Point
): Point | null {
    const center = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
    };
    
    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    
    // Check each edge
    const edges = [
        { p1: { x: rect.x, y: rect.y }, p2: { x: rect.x + rect.width, y: rect.y } }, // top
        { p1: { x: rect.x + rect.width, y: rect.y }, p2: { x: rect.x + rect.width, y: rect.y + rect.height } }, // right
        { p1: { x: rect.x, y: rect.y + rect.height }, p2: { x: rect.x + rect.width, y: rect.y + rect.height } }, // bottom
        { p1: { x: rect.x, y: rect.y }, p2: { x: rect.x, y: rect.y + rect.height } }, // left
    ];
    
    let closestIntersection: Point | null = null;
    let minDistance = Infinity;
    
    for (const edge of edges) {
        const intersection = lineIntersection(fromPoint, toPoint, edge.p1, edge.p2);
        if (intersection) {
            const dist = distance(fromPoint, intersection);
            if (dist < minDistance) {
                minDistance = dist;
                closestIntersection = intersection;
            }
        }
    }
    
    return closestIntersection;
}
```

---

## Summary

### Priority Order

1. **Bidirectional Binding** - Biggest architectural improvement, enables efficient updates
2. **Continuous Edge Binding** - Better UX, more flexible connector placement
3. **Shape Boundary Intersection** - Visual improvement, connectors look more natural
4. **Gap Implementation** - Polish feature
5. **Rotation Support** - Complete feature parity

### Estimated Effort

| Phase | Effort | Impact |
|-------|--------|--------|
| Bidirectional Binding | 3-4 hours | High |
| Continuous Edge Binding | 4-5 hours | Medium |
| Shape Boundary Intersection | 5-6 hours | Medium |
| Gap Implementation | 2-3 hours | Low |
| Rotation Support | 3-4 hours | Low |

### Next Steps

1. Create feature branch `feature/binding-improvements`
2. Implement Phase 1 (Bidirectional Binding) with tests
3. Review and merge
4. Continue with subsequent phases

---

*Document created based on analysis of wb-diagram-board codebase and Excalidraw's element binding system.*
