/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable, EventEmitter } from '@angular/core';

export interface ActiveComponent {
  name: string;
  id: string;
}

export const COMP_NONE = 'none';
export const COMP_DESTINATARIO = 'destinatario';
export const COMP_RIGA = 'riga';
export const COMP_IMPEGNO = 'impegno';

@Injectable()
export class OrdineActiveComponentService {

  public changeActiveComponentEvent = new EventEmitter<ActiveComponent>();
  private activeComponent: ActiveComponent;

  constructor() { }

  setActiveComponent(nameNew: string, idNew: string) {
    this.activeComponent = { 
      name: nameNew, 
      id: idNew
    };
    this.changeActiveComponentEvent.emit(this.activeComponent);
  }

  getActiveComponent() {
    return this.activeComponent;
  }

  resetActiveComponent() {
    this.setActiveComponent(COMP_NONE, null);
    this.activeComponent = null;
  }

  isCurrentComponentActive(activeComponent: ActiveComponent, name: string, id: string) {
    var currentComponentActive = true;
    if (activeComponent.name == COMP_NONE) {
      currentComponentActive = true;
    } else if (activeComponent.name == name && activeComponent.id == id) {
      currentComponentActive = true;
    } else {
      currentComponentActive = false;
    }
    return currentComponentActive;
  }

}
