/*
    SWADE Item Tables is a module for Foundry VTT that presents Items from
    Compendia in a table layout for easy access while editing Actors.

    Copyright (C) 2023 Kristian Serrano

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { MODULE } from "./swade-item-tables.js";

export class SWADEItemTablesForm extends FormApplication {
    constructor(options) {
        super(options);
        this._includedItems = {};
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: `${MODULE.id}`,
            title: `${MODULE.translationPrefix}.Title`,
            template: `modules/${MODULE.id}/templates/swade-item-tables.hbs`,
            tabs: [
                {
                    group: 'category-tabs',
                    navSelector: '.tabs',
                    contentSelector: '.sheet-body',
                    initial: 'hindrances',
                },
                {
                    group: 'subcategory-tabs',
                    navSelector: '.subsection.--equipment .tabs',
                    contentSelector: '.subsection.--equipment',
                    initial: 'gear',
                },
            ],
            width: 800,
            height: 600,
            closeOnSubmit: false,
            submitOnClose: false,
            submitOnChange: true,
            classes: ['swade-app', 'swade-item-tables'],
            resizable: true,
        });
    }

    /** @override */
    async _render(force = false, options = {}) {
        await super._render(force, options);
    }

    /** @override */
    async getData(options = {}) {
        const includedItemUuids = game.settings.get(`${MODULE.id}`, 'included-item-uuids');
        for (const uuid of includedItemUuids) {
            const item = await fromUuid(uuid);
            if (item) {
                let category = '';
                if (item.type === 'ability' && item.system.subtype === 'race') {
                    category = 'ancestries';
                } else if (item.type === 'hindrance') {
                    category = 'hindrances';
                } else if (item.type === 'skill') {
                    category = 'skills';
                } else if (item.type === 'edge') {
                    category = 'edges';
                } else if (item.type === 'gear') {
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
                    const hasFightingAction = addActions.find(a => a.override === fighting);
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

        return foundry.utils.mergeObject(await super.getData(options), this._includedItems);
    }

    async _updateObject(event, formData) { }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        const item = html.find('a');
        item.on('click', this._onClick.bind(this))
        item.on('dragstart', this._onDrag.bind(this))
    }

    async _onClick(event) {
        const uuid = event.currentTarget.dataset.uuid;
        const item = await fromUuid(uuid);
        await item?.sheet?.render(true);
    }

    async _onDrag(event) {
        const data = {
            type: 'Item',
            uuid: event.target.dataset.uuid
        }
        event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data));
    }

    _sortArray(array, property) {
        array.sort((a, b) => {
            return a[property].localeCompare(b[property]);
        })
    }

    _processItem(item, category) {
        const pack = game.packs.get(item.pack);
        const packageType = pack.metadata.packageType;
        const packageName = pack.metadata.packageName;
        let itemsCategory = this._includedItems[category];
        let packageTitle = '';
        if (packageType === 'system') {
            packageTitle = game.system.title;
        } else if (packageType === 'module') {
            packageTitle = game.modules.find(m => m.id === packageName).title;
        } else if (packageType === 'world') {
            packageTitle = game.world.title;
        }

        if (!this._includedItems[category]) {
            this._includedItems[category] = [{
                id: packageName,
                title: packageTitle,
                packageType: packageType,
                items: [item]
            }];
        } else {
            const includedPackage = this._includedItems[category].find(pckg => pckg.id === packageName);
            if (includedPackage) {
                includedPackage.items.push(item);
                this._sortArray(includedPackage.items, 'name');
            } else {
                this._includedItems[category].push({
                    id: packageName,
                    title: packageTitle,
                    packageType: packageType,
                    items: [item]
                })
                this._sortArray(this._includedItems[category], 'title');
            }
        }
    }
}
