import publicWidget from "@web/legacy/js/public/public_widget";
import { mount } from "@odoo/owl";
import { NineMensMorrisApp } from "./nine_mens_morris_app";
import { templates } from "@web/core/assets";

publicWidget.registry.NineMensMorrisAppWidget = publicWidget.Widget.extend({
    selector: "#nine_mens_morris_root",

    start: async function() {
        await mount(NineMensMorrisApp, this.el, {
            templates,
            dev: false,
        });
        return this._super.apply(this, arguments);
    },
});