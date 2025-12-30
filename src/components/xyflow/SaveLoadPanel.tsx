/**
 * SaveLoadPanel Component
 *
 * UI panel for managing diagram persistence:
 * - Save/load diagrams
 * - List saved diagrams
 * - Export/import files
 */

import { memo, useState, useCallback } from 'react';
import { useXYFlowPersistence } from '../../hooks/useXYFlowPersistence';
import type { DiagramMetadata } from '../../utils/xyflow-persistence';
import styles from './SaveLoadPanel.module.css';

// =============================================================================
// Icons (inline SVG for simplicity)
// =============================================================================

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
);

const SaveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 14H3a1 1 0 01-1-1V3a1 1 0 011-1h7l4 4v7a1 1 0 01-1 1z" />
        <path d="M11 14v-4H5v4M5 2v3h5" />
    </svg>
);

const FolderIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 13H2a1 1 0 01-1-1V4a1 1 0 011-1h4l2 2h6a1 1 0 011 1v6a1 1 0 01-1 1z" />
    </svg>
);

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 3v10M3 8h10" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2v8M4 7l4 4 4-4M2 12v2h12v-2" />
    </svg>
);

const UploadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 10V2M4 5l4-4 4 4M2 12v2h12v-2" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5" />
        <path d="M3 4l1 10a1 1 0 001 1h6a1 1 0 001-1l1-10" />
    </svg>
);

const FileIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 6h16l10 10v26a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" />
        <path d="M28 6v10h10" />
    </svg>
);

// =============================================================================
// Types
// =============================================================================

export interface SaveLoadPanelProps {
    /** Whether panel is open */
    isOpen: boolean;
    /** Close panel callback */
    onClose: () => void;
    /** Initial diagram ID to load */
    initialDiagramId?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

// =============================================================================
// Component
// =============================================================================

export const SaveLoadPanel = memo(function SaveLoadPanel({
    isOpen,
    onClose,
    initialDiagramId,
}: SaveLoadPanelProps) {
    const {
        save,
        load,
        saveAs,
        list,
        remove,
        exportFile,
        importFile,
        createNew,
        currentId,
        currentName,
        setCurrentName,
        isDirty,
        lastSaved,
    } = useXYFlowPersistence({ initialDiagramId });

    const [diagrams, setDiagrams] = useState<DiagramMetadata[]>(() => list());
    const [saveAsName, setSaveAsName] = useState('');
    const [showSaveAs, setShowSaveAs] = useState(false);

    // Refresh diagram list
    const refreshList = useCallback(() => {
        setDiagrams(list());
    }, [list]);

    // Handle save
    const handleSave = useCallback(() => {
        save();
        refreshList();
    }, [save, refreshList]);

    // Handle save as
    const handleSaveAs = useCallback(() => {
        if (!saveAsName.trim()) return;

        saveAs(saveAsName.trim());
        setSaveAsName('');
        setShowSaveAs(false);
        refreshList();
    }, [saveAs, saveAsName, refreshList]);

    // Handle load
    const handleLoad = useCallback(
        (id: string) => {
            load(id);
            refreshList();
        },
        [load, refreshList]
    );

    // Handle delete
    const handleDelete = useCallback(
        (id: string, e: React.MouseEvent) => {
            e.stopPropagation();

            if (!window.confirm('Are you sure you want to delete this diagram?')) {
                return;
            }

            remove(id);
            refreshList();
        },
        [remove, refreshList]
    );

    // Handle new diagram
    const handleNew = useCallback(() => {
        if (isDirty && !window.confirm('You have unsaved changes. Create new diagram anyway?')) {
            return;
        }

        createNew();
        refreshList();
    }, [createNew, isDirty, refreshList]);

    // Handle import
    const handleImport = useCallback(async () => {
        await importFile();
        refreshList();
    }, [importFile, refreshList]);

    // Handle name change
    const handleNameChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setCurrentName(e.target.value);
        },
        [setCurrentName]
    );

    if (!isOpen) return null;

    return (
        <div className={styles.panel}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>Diagrams</h2>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close panel">
                    <CloseIcon />
                </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {/* Current Diagram Section */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Current Diagram</h3>
                    <div className={styles.currentDiagram}>
                        <input
                            type="text"
                            className={styles.nameInput}
                            value={currentName}
                            onChange={handleNameChange}
                            placeholder="Diagram name"
                        />

                        <div className={styles.status}>
                            <span
                                className={`${styles.statusDot} ${isDirty ? styles.dirty : styles.saved}`}
                            />
                            {isDirty ? (
                                'Unsaved changes'
                            ) : lastSaved ? (
                                `Saved ${formatDate(lastSaved.toISOString())}`
                            ) : (
                                'Not saved'
                            )}
                        </div>

                        <div className={styles.actions}>
                            <button
                                className={`${styles.button} ${styles.buttonPrimary}`}
                                onClick={handleSave}
                            >
                                <SaveIcon />
                                Save
                            </button>

                            {showSaveAs ? (
                                <>
                                    <input
                                        type="text"
                                        className={styles.nameInput}
                                        value={saveAsName}
                                        onChange={(e) => setSaveAsName(e.target.value)}
                                        placeholder="New name"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveAs();
                                            if (e.key === 'Escape') setShowSaveAs(false);
                                        }}
                                    />
                                    <button
                                        className={`${styles.button} ${styles.buttonSecondary}`}
                                        onClick={handleSaveAs}
                                        disabled={!saveAsName.trim()}
                                    >
                                        Save
                                    </button>
                                </>
                            ) : (
                                <button
                                    className={`${styles.button} ${styles.buttonSecondary}`}
                                    onClick={() => setShowSaveAs(true)}
                                >
                                    Save As...
                                </button>
                            )}

                            <button
                                className={`${styles.button} ${styles.buttonSecondary}`}
                                onClick={handleNew}
                            >
                                <PlusIcon />
                                New
                            </button>
                        </div>
                    </div>
                </div>

                {/* Saved Diagrams Section */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Saved Diagrams ({diagrams.length})</h3>

                    {diagrams.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FileIcon />
                            <p className={styles.emptyText}>No saved diagrams yet</p>
                        </div>
                    ) : (
                        <div className={styles.diagramList}>
                            {diagrams.map((diagram) => (
                                <div
                                    key={diagram.id}
                                    className={`${styles.diagramItem} ${diagram.id === currentId ? styles.active : ''
                                        }`}
                                    onClick={() => handleLoad(diagram.id)}
                                >
                                    <FolderIcon />
                                    <div className={styles.diagramInfo}>
                                        <p className={styles.diagramName}>{diagram.name}</p>
                                        <span className={styles.diagramMeta}>
                                            {diagram.nodeCount} nodes, {diagram.edgeCount} edges •{' '}
                                            {formatDate(diagram.updatedAt)}
                                        </span>
                                    </div>
                                    <div className={styles.diagramActions}>
                                        <button
                                            className={`${styles.iconButton} ${styles.danger}`}
                                            onClick={(e) => handleDelete(diagram.id, e)}
                                            aria-label="Delete diagram"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* File Actions */}
                <div className={styles.fileActions}>
                    <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        onClick={exportFile}
                    >
                        <DownloadIcon />
                        Export
                    </button>
                    <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        onClick={handleImport}
                    >
                        <UploadIcon />
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
});

export default SaveLoadPanel;
