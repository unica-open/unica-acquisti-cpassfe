/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable, EventEmitter } from '@angular/core';
import { TestataEvasione } from 'src/app/modules/cpassapi';

export interface ActiveTab {
    name: string;
    mode: string;
}

export const MODE_EDIT = 'edit';
export const MODE_READ = 'read';

export const TAB_EVASIONE = 'evasione';
export const TAB_DETTAGLIO = 'dettaglio';
export const TAB_RIEPILOGO = 'riepilogo';

@Injectable()
export class EvasioneTabNavigationService {

    navigationEmitter = new EventEmitter<boolean>();
    changeActiveTabEvent = new EventEmitter<ActiveTab>();
    onEditEvasioneActivation = new EventEmitter<boolean>();
    refreshEvasioneEmitter = new EventEmitter<TestataEvasione>();

    constructor() {}

    enableTabNavigation() {
        this.navigationEmitter.emit(true);
    }

    disableTabNavigation() {
        this.navigationEmitter.emit(false);
    }

    setActiveTab(tab: string, mode: string) {
        const activeTab = { name: tab, mode };
        this.changeActiveTabEvent.emit(activeTab);
    }

}
