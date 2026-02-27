/**
 * WB Canvas - Shortcuts Tests
 * 
 * Unit tests for keyboard shortcuts system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShortcutManager } from './shortcut-manager';
import { KeyBinding, ShortcutError } from '../../types/shortcuts';

describe('ShortcutManager', () => {
    let manager: ShortcutManager;

    beforeEach(() => {
        manager = new ShortcutManager();
    });

    // =========================================================================
    // Registration Tests
    // =========================================================================

    describe('register', () => {
        it('should register a valid binding', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding);
            const bindings = manager.getBindings();

            expect(bindings).toHaveLength(1);
            expect(bindings[0].id).toBe('test');
        });

        it('should throw error if binding ID is empty', () => {
            const binding: KeyBinding = {
                id: '',
                name: 'Test',
                description: 'Test binding',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            expect(() => manager.register(binding)).toThrow(ShortcutError);
        });

        it('should throw error if binding has no keys', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: [],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            expect(() => manager.register(binding)).toThrow(ShortcutError);
        });

        it('should throw error if action is not a function', () => {
            const binding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: 'not a function',
                category: 'edit',
                enabled: true,
            } as any;

            expect(() => manager.register(binding)).toThrow(ShortcutError);
        });

        it('should warn if binding conflicts with existing binding', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const binding1: KeyBinding = {
                id: 'test1',
                name: 'Test 1',
                description: 'Test binding 1',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const binding2: KeyBinding = {
                id: 'test2',
                name: 'Test 2',
                description: 'Test binding 2',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding1);
            manager.register(binding2);

            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });

    // =========================================================================
    // Unregistration Tests
    // =========================================================================

    describe('unregister', () => {
        it('should unregister a binding', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding);
            expect(manager.getBindings()).toHaveLength(1);

            manager.unregister('test');
            expect(manager.getBindings()).toHaveLength(0);
        });

        it('should not throw if unregistering non-existent binding', () => {
            expect(() => manager.unregister('non-existent')).not.toThrow();
        });
    });

    // =========================================================================
    // Retrieval Tests
    // =========================================================================

    describe('getBindings', () => {
        it('should return all bindings', () => {
            const binding1: KeyBinding = {
                id: 'test1',
                name: 'Test 1',
                description: 'Test binding 1',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const binding2: KeyBinding = {
                id: 'test2',
                name: 'Test 2',
                description: 'Test binding 2',
                keys: ['b'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'view',
                enabled: true,
            };

            manager.register(binding1);
            manager.register(binding2);

            const bindings = manager.getBindings();
            expect(bindings).toHaveLength(2);
        });

        it('should return empty array if no bindings', () => {
            expect(manager.getBindings()).toHaveLength(0);
        });
    });

    describe('getBindingsByCategory', () => {
        it('should return bindings by category', () => {
            const binding1: KeyBinding = {
                id: 'test1',
                name: 'Test 1',
                description: 'Test binding 1',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const binding2: KeyBinding = {
                id: 'test2',
                name: 'Test 2',
                description: 'Test binding 2',
                keys: ['b'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'view',
                enabled: true,
            };

            manager.register(binding1);
            manager.register(binding2);

            const editBindings = manager.getBindingsByCategory('edit');
            expect(editBindings).toHaveLength(1);
            expect(editBindings[0].id).toBe('test1');
        });
    });

    // =========================================================================
    // Conflict Detection Tests
    // =========================================================================

    describe('findConflicts', () => {
        it('should find conflicting bindings', () => {
            const binding1: KeyBinding = {
                id: 'test1',
                name: 'Test 1',
                description: 'Test binding 1',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const binding2: KeyBinding = {
                id: 'test2',
                name: 'Test 2',
                description: 'Test binding 2',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding1);
            manager.register(binding2);

            const conflicts = manager.findConflicts();
            expect(conflicts).toHaveLength(1);
            expect(conflicts[0].binding1.id).toBe('test1');
            expect(conflicts[0].binding2.id).toBe('test2');
        });

        it('should not find conflicts if bindings are disabled', () => {
            const binding1: KeyBinding = {
                id: 'test1',
                name: 'Test 1',
                description: 'Test binding 1',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: false,
            };

            const binding2: KeyBinding = {
                id: 'test2',
                name: 'Test 2',
                description: 'Test binding 2',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding1);
            manager.register(binding2);

            const conflicts = manager.findConflicts();
            expect(conflicts).toHaveLength(0);
        });

        it('should not find conflicts if keys differ', () => {
            const binding1: KeyBinding = {
                id: 'test1',
                name: 'Test 1',
                description: 'Test binding 1',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const binding2: KeyBinding = {
                id: 'test2',
                name: 'Test 2',
                description: 'Test binding 2',
                keys: ['b'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding1);
            manager.register(binding2);

            const conflicts = manager.findConflicts();
            expect(conflicts).toHaveLength(0);
        });

        it('should not find conflicts if modifiers differ', () => {
            const binding1: KeyBinding = {
                id: 'test1',
                name: 'Test 1',
                description: 'Test binding 1',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const binding2: KeyBinding = {
                id: 'test2',
                name: 'Test 2',
                description: 'Test binding 2',
                keys: ['a'],
                modifiers: ['shift'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding1);
            manager.register(binding2);

            const conflicts = manager.findConflicts();
            expect(conflicts).toHaveLength(0);
        });
    });

    describe('hasConflict', () => {
        it('should return true if binding has conflict', () => {
            const binding1: KeyBinding = {
                id: 'test1',
                name: 'Test 1',
                description: 'Test binding 1',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const binding2: KeyBinding = {
                id: 'test2',
                name: 'Test 2',
                description: 'Test binding 2',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding1);
            expect(manager.hasConflict(binding2)).toBe(true);
        });

        it('should return false if binding has no conflict', () => {
            const binding1: KeyBinding = {
                id: 'test1',
                name: 'Test 1',
                description: 'Test binding 1',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const binding2: KeyBinding = {
                id: 'test2',
                name: 'Test 2',
                description: 'Test binding 2',
                keys: ['b'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding1);
            expect(manager.hasConflict(binding2)).toBe(false);
        });
    });

    // =========================================================================
    // Key String Tests
    // =========================================================================

    describe('getKeyString', () => {
        it('should return formatted key string', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['s'],
                modifiers: ['ctrl', 'shift'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const keyString = manager.getKeyString(binding);
            expect(keyString).toContain('Ctrl');
            expect(keyString).toContain('Shift');
            expect(keyString).toContain('S');
        });

        it('should handle special keys', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['Enter'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const keyString = manager.getKeyString(binding);
            expect(keyString).toContain('Enter');
        });

        it('should handle arrow keys', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['ArrowUp'],
                modifiers: [],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const keyString = manager.getKeyString(binding);
            expect(keyString).toContain('↑');
        });
    });

    // =========================================================================
    // Configuration Tests
    // =========================================================================

    describe('exportConfig', () => {
        it('should export configuration', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding);
            const config = manager.exportConfig();

            expect(config.bindings).toHaveLength(1);
            expect(config.enableGlobal).toBe(true);
        });
    });

    describe('importConfig', () => {
        it('should import configuration', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            const config = {
                bindings: [binding],
                enableGlobal: true,
                enableInInput: false,
                conflictResolution: 'first' as const,
            };

            manager.importConfig(config);
            const bindings = manager.getBindings();

            expect(bindings).toHaveLength(1);
            expect(bindings[0].id).toBe('test');
        });

        it('should throw error if config is invalid', () => {
            expect(() => manager.importConfig(null as any)).toThrow(ShortcutError);
        });
    });

    // =========================================================================
    // Clear Tests
    // =========================================================================

    describe('clear', () => {
        it('should clear all bindings', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding);
            expect(manager.getBindings()).toHaveLength(1);

            manager.clear();
            expect(manager.getBindings()).toHaveLength(0);
        });
    });

    // =========================================================================
    // Platform-specific Tests
    // =========================================================================

    describe('platform-specific bindings', () => {
        it('should handle platform-specific bindings', () => {
            const macBinding: KeyBinding = {
                id: 'test-mac',
                name: 'Test Mac',
                description: 'Test binding for Mac',
                keys: ['a'],
                modifiers: ['meta'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
                platform: 'mac',
            };

            const windowsBinding: KeyBinding = {
                id: 'test-windows',
                name: 'Test Windows',
                description: 'Test binding for Windows',
                keys: ['a'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
                platform: 'windows',
            };

            manager.register(macBinding);
            manager.register(windowsBinding);

            const bindings = manager.getBindings();
            expect(bindings).toHaveLength(2);
        });
    });

    // =========================================================================
    // Multiple Keys Tests
    // =========================================================================

    describe('multiple keys', () => {
        it('should handle bindings with multiple keys', () => {
            const binding: KeyBinding = {
                id: 'test',
                name: 'Test',
                description: 'Test binding',
                keys: ['a', 'b'],
                modifiers: ['ctrl'],
                action: vi.fn(),
                category: 'edit',
                enabled: true,
            };

            manager.register(binding);
            const bindings = manager.getBindings();

            expect(bindings).toHaveLength(1);
            expect(bindings[0].keys).toHaveLength(2);
        });
    });
});
