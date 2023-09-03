import { MODULE } from "./swade-item-tables.js";
/**
 * The UI element which displays the list of Compendium Packs available to the User.
 * @extends {Application}
 */

export class SWADEAllowedItemsConfiguration extends FormApplication {
    constructor(options) {
        super(options);
        this._allSwadeItems = {
            //includedItemUuids: game.settings.get(MODULE.id, 'included-item-uuids')
        };
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: `${MODULE.id}-pack-selector`,
            title: `${MODULE.translationPrefix}.ItemsSelector`,
            template: `modules/${MODULE.id}/templates/allowed-items-configuration.hbs`,
            tabs: [
                {
                    group: 'category-tabs',
                    navSelector: '.tabs',
                    contentSelector: '.sheet-body',
                    initial: 'ancestries',
                },
                {
                    group: 'subcategory-tabs',
                    navSelector: '.subsection.--equipment .tabs',
                    contentSelector: '.subsection.--equipment',
                    initial: 'gear',
                },
            ],
            width: 600,
            height: 800,
            closeOnSubmit: false,
            submitOnClose: false,
            submitOnChange: true,
            classes: ['swade-app', 'swade-item-tables'],
            resizable: true
        });
    }

    /** @override */
    async _render(force = false, options = {}) {
        await super._render(force, options);
    }

    /** @override */
    async getData(options = {}) {
        // Get all Item Packs made for SWADE
        const itemPacks = game.packs.filter(p => p.metadata.type === "Item" && p.metadata.system === "swade");
        // Loop through all filtered itemPacks
        for (const pack of itemPacks) {
            // Get all Items from the pack.
            const packItems = await pack.getDocuments();
            for (const item of packItems) {
                if (item.type !== 'action') {
                    let category = '';
                    if (item.type === 'ability' && item.system.subtype === 'race') {
                        category = 'ancestries';
                    } else if (item.type === 'hindrance') {
                        category = 'hindrances';
                    } else if (item.type === 'skill') {
                        category = 'skills';
                    } else if (item.type === 'edge') {
                        category = 'edges';
                    } else if (item.type === 'gear' || item.type === 'consumable') {
                        category = 'gear';
                    } else if (item.type === 'armor') {
                        category = 'armor';
                    } else if (item.type === 'shield') {
                        category = 'shields';
                    } else if (item.type === 'weapon') {
                        if (item.system.range !== '') {
                            category = 'ranged-weapons';
                            this._processItem(item, category);
                        }
                        const fighting = game.settings.get('swade', 'parryBaseSkill');
                        const addActions = Object.values(item.system.actions.additional);
                        const hasFightingAction = addActions.find(a => a.override === fighting)
                        if (item.system.actions.trait === fighting || hasFightingAction) {
                            category = 'melee-weapons';
                            this._processItem(item, category);
                        }
                    } else if (item.type === 'power') {
                        category = 'powers';
                    } else if (item.type === 'ability' && item.system.subtype !== 'race') {
                        category = 'abilities';
                    }
                    if (item.type !== 'weapon') {
                        this._processItem(item, category);
                    }
                }
            }
        }
        const includedItemUuids = game.settings.get(MODULE.id, 'included-item-uuids');
        this._allSwadeItems.includedItemUuids = includedItemUuids;
        return foundry.utils.mergeObject(await super.getData(options), this._allSwadeItems);
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.package-checkbox').on('change', this._onChangeAll.bind(this));
        html.find('.item-checkbox').on('change', this._onChangeItem.bind(this));
        html.find('label').on('contextmenu', this._onRightClick.bind(this));
    }

    async _updateObject(event, formData) { }

    async _onChangeAll(event) {
        const checkbox = event.currentTarget;
        const parentFieldset = checkbox.closest('fieldset');
        const packageItemCheckboxes = parentFieldset.querySelectorAll('.item-checkbox');
        let includedItemUuids = game.settings.get(MODULE.id, 'included-item-uuids');
        for (const itemCheckbox of packageItemCheckboxes) {
            itemCheckbox.checked = checkbox.checked;
            const uuid = itemCheckbox.dataset.uuid;
            if (itemCheckbox.checked) {
                if (!includedItemUuids.includes(uuid)) includedItemUuids.push(uuid);
            } else {
                if (includedItemUuids.includes(uuid)) {
                    includedItemUuids = includedItemUuids.filter(u => u !== uuid);
                }
            }
        }
        await game.settings.set(MODULE.id, 'included-item-uuids', includedItemUuids);
    }

    async _onChangeItem(event) {
        const itemCheckbox = event.currentTarget;
        const uuid = itemCheckbox.dataset.uuid;
        let includedItemUuids = game.settings.get(MODULE.id, 'included-item-uuids');

        if (itemCheckbox.checked) {
            if (!includedItemUuids.includes(uuid)) includedItemUuids.push(uuid);
        } else {
            if (includedItemUuids.includes(uuid)) {
                includedItemUuids = includedItemUuids.filter(u => u !== uuid);
            }
        }

        const parentFieldset = itemCheckbox.closest('fieldset');
        const packageCheckbox = parentFieldset.querySelector('.package-checkbox');
        const packageItemCheckboxes = Array.from(parentFieldset.querySelectorAll('.item-checkbox'));
        const all = packageItemCheckboxes.every(c => c.checked);
        const some = packageItemCheckboxes.some(c => c.checked);
        const none = !some;

        if (all) {
            packageCheckbox.checked = true;
            packageCheckbox.indeterminate = false;
        } else if (some && !all) {
            packageCheckbox.checked = false;
            packageCheckbox.indeterminate = true;
        } else if (none) {
            packageCheckbox.checked = false;
            packageCheckbox.indeterminate = false;
        }
        await game.settings.set(MODULE.id, 'included-item-uuids', includedItemUuids);
    }

    async _onRightClick(event) {
        const uuid = event.currentTarget.dataset.uuid;
        const item = await fromUuid(uuid);
        await item?.sheet?.render(true);
    }

    _sortArray(array, property) {
        array.sort((a, b) => {
            return a[property].localeCompare(b[property]);
        });
    }

    _processItem(item, category) {
        const pack = game.packs.get(item.pack);
        const omitSystemItems = game.settings.get(MODULE.id, 'omit-system-items');
        const isSystemItem = pack.metadata.packageType === 'system';
        if (isSystemItem && omitSystemItems) return;
        let packageTitle = '';
        const packageName = pack.metadata.packageName;
        if (isSystemItem) {
            packageTitle = `${game.system.title} system`;
        } else {
            packageTitle = game.modules.find(m => m.id === packageName).title;
        }

        const packageCategory = this._allSwadeItems[category];
        if (packageCategory) {
            const sourcePackage = packageCategory.find(p => p.id === packageName);
            if (sourcePackage) {
                sourcePackage.items.push(item);
                this._sortArray(sourcePackage.items, 'name');
            } else {
                packageCategory.push({
                    title: packageTitle,
                    id: packageName,
                    items: [item],
                });
                this._allChecked(packageCategory, packageName);
            }
        } else {
            const newPackageCategory = this._allSwadeItems[category] = [];
            newPackageCategory.push({
                title: packageTitle,
                id: packageName,
                items: [item],
            });
            this._allChecked(newPackageCategory, packageName);
            this._sortArray(newPackageCategory, 'title');
        }
    }

    _allChecked(packageCategory, packageName) {
        const includedItemUuids = game.settings.get(MODULE.id, 'included-item-uuids');
        const sourcePackage = packageCategory.find(p => p.id === packageName);
        const some = sourcePackage.items.some(i => includedItemUuids.includes(i.uuid));
        const all = sourcePackage.items.every(i => includedItemUuids.includes(i.uuid));
        if (all) {
            sourcePackage.allChecked = 'all';
        } else if (some) {
            sourcePackage.allChecked = 'some';
        } else if (!some) {
            sourcePackage.allChecked = 'none';
        }
    }
}