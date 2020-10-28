/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable, EventEmitter } from '@angular/core';

export interface ActiveTab {
    name: string;
    mode: string;
}

export const MODE_EDIT = 'edit';
export const MODE_READ = 'read';

export const TAB_ORDINE = 'ordine';
export const TAB_FINANZIARI = 'finanziari';
export const TAB_DETTAGLIO = 'dettaglio';
export const TAB_RIEPILOGO = 'riepilogo';

@Injectable()
export class OrdineTabNavigationService {

    navigationEmitter = new EventEmitter<boolean>();
    changeActiveTabEvent = new EventEmitter<ActiveTab>();

    constructor() {}

    enableTabNavigation() {
        this.navigationEmitter.emit(true);
    }

    disableTabNavigation() {
        this.navigationEmitter.emit(false);
    }

    setActiveTab(tab: string, mode: string) {
        const activeTab = { name: tab, mode: mode };
        this.changeActiveTabEvent.emit(activeTab);

    }

}