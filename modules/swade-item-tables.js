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
