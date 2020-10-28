/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { RigaOrdine } from 'src/app/modules/cpassapi';
import { LogService } from 'src/app/services';

@Injectable()
export class ComposizioneDatiService {

  private righeOrdine: RigaOrdine[];

  constructor(
    private logService: LogService
    ) { 
    this.logService.info(this.constructor.name, 'constructor', 'ComposizioneDatiService');
  }

  setRigheOrdine(righeOrdine) {
    this.righeOrdine = righeOrdine;
  }

  getRigheOrdine() {
    return this.righeOrdine;
  }

}
