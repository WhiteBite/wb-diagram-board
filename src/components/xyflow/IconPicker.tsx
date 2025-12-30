/**
 * IconPicker - Component for selecting Lucide icons
 *
 * Features:
 * - Search through available icons
 * - Grid display of icons
 * - Click to select
 */

import { memo, useState, useCallback, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import styles from './IconPicker.module.css';

// =============================================================================
// Types
// =============================================================================

export interface IconPickerProps {
    /** Currently selected icon name */
    selectedIcon?: string;
    /** Callback when icon is selected */
    onSelect: (iconName: string | undefined) => void;
    /** Dark mode */
    isDark?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/** Popular icons to show first */
const POPULAR_ICONS = [
    'Star', 'Heart', 'Check', 'X', 'Plus', 'Minus',
    'User', 'Users', 'Settings', 'Home', 'Search', 'Mail',
    'Phone', 'Calendar', 'Clock', 'Bell', 'Lock', 'Unlock',
    'Eye', 'EyeOff', 'Edit', 'Trash', 'Copy', 'Download',
    'Upload', 'Share', 'Link', 'ExternalLink', 'Folder', 'File',
    'Image', 'Video', 'Music', 'Camera', 'Mic', 'Volume2',
    'Wifi', 'Bluetooth', 'Battery', 'Zap', 'Sun', 'Moon',
    'Cloud', 'CloudRain', 'Thermometer', 'Map', 'MapPin', 'Navigation',
    'Car', 'Plane', 'Train', 'Ship', 'Bike', 'Footprints',
    'ShoppingCart', 'CreditCard', 'DollarSign', 'Percent', 'TrendingUp', 'TrendingDown',
    'BarChart', 'PieChart', 'Activity', 'Target', 'Award', 'Gift',
    'Flag', 'Bookmark', 'Tag', 'Hash', 'AtSign', 'Globe',
    'Database', 'Server', 'HardDrive', 'Cpu', 'Monitor', 'Smartphone',
    'Tablet', 'Laptop', 'Printer', 'Keyboard', 'Mouse', 'Headphones',
    'Code', 'Terminal', 'GitBranch', 'GitCommit', 'GitMerge', 'GitPullRequest',
    'Box', 'Package', 'Archive', 'Inbox', 'Send', 'MessageSquare',
    'MessageCircle', 'ThumbsUp', 'ThumbsDown', 'Smile', 'Frown', 'Meh',
    'AlertCircle', 'AlertTriangle', 'Info', 'HelpCircle', 'CheckCircle', 'XCircle',
];

/** Get all icon names from Lucide */
const getAllIconNames = (): string[] => {
    return Object.keys(LucideIcons).filter(
        (key) => key !== 'default' && key !== 'createLucideIcon' && typeof (LucideIcons as Record<string, unknown>)[key] === 'function'
    );
};

// =============================================================================
// Icon Component
// =============================================================================

interface IconButtonProps {
    name: string;
    isSelected: boolean;
    onClick: () => void;
    isDark?: boolean;
}

const IconButton = memo(({ name, isSelected, onClick, isDark }: IconButtonProps) => {
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name];

    if (!IconComponent) return null;

    return (
        <button
            className={`${styles.iconButton} ${isSelected ? styles.selected : ''} ${isDark ? styles.dark : ''}`}
            onClick={onClick}
            title={name}
            type="button"
        >
            <IconComponent size={20} />
        </button>
    );
});

IconButton.displayName = 'IconButton';

// =============================================================================
// Main Component
// =============================================================================

export const IconPicker = memo(function IconPicker({
    selectedIcon,
    onSelect,
    isDark = false,
}: IconPickerProps) {
    const [search, setSearch] = useState('');

    const allIcons = useMemo(() => getAllIconNames(), []);

    const filteredIcons = useMemo(() => {
        if (!search.trim()) {
            // Show popular icons first, then rest alphabetically
            const popularSet = new Set(POPULAR_ICONS);
            const otherIcons = allIcons.filter((name) => !popularSet.has(name)).sort();
            return [...POPULAR_ICONS.filter((name) => allIcons.includes(name)), ...otherIcons];
        }

        const searchLower = search.toLowerCase();
        return allIcons.filter((name) => name.toLowerCase().includes(searchLower));
    }, [search, allIcons]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    }, []);

    const handleClear = useCallback(() => {
        onSelect(undefined);
    }, [onSelect]);

    return (
        <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
            <div className={styles.header}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search icons..."
                    value={search}
                    onChange={handleSearchChange}
                />
                {selectedIcon && (
                    <button
                        className={styles.clearButton}
                        onClick={handleClear}
                        title="Remove icon"
                        type="button"
                    >
                        <LucideIcons.X size={16} />
                    </button>
                )}
            </div>

            <div className={styles.grid}>
                {filteredIcons.slice(0, 100).map((name) => (
                    <IconButton
                        key={name}
                        name={name}
                        isSelected={selectedIcon === name}
                        onClick={() => onSelect(name)}
                        isDark={isDark}
                    />
                ))}
            </div>

            {filteredIcons.length > 100 && (
                <div className={styles.moreHint}>
                    +{filteredIcons.length - 100} more icons. Use search to find specific icons.
                </div>
            )}

            {filteredIcons.length === 0 && (
                <div className={styles.noResults}>No icons found for "{search}"</div>
            )}
        </div>
    );
});

export default IconPicker;
