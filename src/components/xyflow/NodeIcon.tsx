/**
 * NodeIcon - Renders a Lucide icon inside a node
 *
 * Used by various node types to display icons
 */

import { memo, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface NodeIconProps {
    /** Lucide icon name */
    name?: string;
    /** Icon size in pixels */
    size?: number;
    /** Icon color */
    color?: string;
    /** Additional className */
    className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const NodeIcon = memo(function NodeIcon({
    name,
    size = 20,
    color,
    className,
}: NodeIconProps) {
    const IconComponent = useMemo(() => {
        if (!name) return null;
        return (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name];
    }, [name]);

    if (!IconComponent) return null;

    return (
        <IconComponent
            size={size}
            color={color}
            className={className}
            style={{ flexShrink: 0 }}
        />
    );
});

export default NodeIcon;
