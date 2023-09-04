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

import { SWADEAllowedItemsConfiguration } from './SWADEAllowedItemsConfiguration.js';
import { SWADEItemTablesForm } from './SWADEItemTablesForm.js';

export const MODULE = {
    id: 'swade-item-tables',
    translationPrefix: 'SWADEItemTables',
};

Hooks.on('init', function () {
    game.settings.register(MODULE.id, 'omit-system-items', {
        name: `${MODULE.translationPrefix}.HideSystem.Name`,
        hint: `${MODULE.translationPrefix}.HideSystem.Hint`,
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        submitOnChange: true,
        onChange: async value => {
            const includedItemUuids = game.settings.get(MODULE.id, 'included-item-uuids');
            const filteredUuids = includedItemUuids.filter(u => !u.includes('Compendium.swade.'));
            await game.settings.set(MODULE.id, 'included-item-uuids', filteredUuids);
        }
    })
    game.settings.register(MODULE.id, 'included-item-uuids', {
        scope: 'world',
        config: false,
        type: Array,
        default: []
    });
    game.settings.registerMenu(MODULE.id, 'allowed-items-configuration', {
        name: `${MODULE.translationPrefix}.ItemsList.Name`,
        label: `${ MODULE.translationPrefix }.ItemsList.Label`,
        hint: `${MODULE.translationPrefix}.ItemsList.Hint`,
        icon: 'fas fa-list',
        type: SWADEAllowedItemsConfiguration,
        restricted: true,
    });
});

Hooks.on('setup', function () {
    // Preload the template and render the UI
    loadTemplates([
        `modules/${MODULE.id}/templates/swade-item-tables.hbs`,
        `modules/${MODULE.id}/templates/allowed-items-configuration.hbs`,
        `modules/${MODULE.id}/templates/partials/tabs.hbs`,
        `modules/${MODULE.id}/templates/partials/subtabs.hbs`,
        `modules/${MODULE.id}/templates/partials/items-by-source.hbs`,
        `modules/${MODULE.id}/templates/partials/allowed-items-by-source.hbs`,
        `modules/${MODULE.id}/templates/partials/table-subheading.hbs`,
    ]);
});

/* Handlebars Helpers */
// Search an array for a string
Handlebars.registerHelper('SWADEItemTables_Includes', function (array, str) {
    return array?.includes(str);
});

// Look up localized attribute names
Handlebars.registerHelper('SWADEItemTables_AttributeString', function (attribute) {
    return game.i18n.localize(CONFIG.SWADE.attributes[attribute].long);
});

// Rewrite @str as Str
Handlebars.registerHelper('SWADEItemTables_FormatStr', function (string) {
    return string.replace("@str", game.i18n.localize(CONFIG.SWADE.attributes.strength.short));
});

// Localize numbers
Handlebars.registerHelper('SWADEItemTables_LocalizeNumber', function (number) {
    return number.toLocaleString();
});


CONFIG.SWADEItemTablesForm = SWADEItemTablesForm;
