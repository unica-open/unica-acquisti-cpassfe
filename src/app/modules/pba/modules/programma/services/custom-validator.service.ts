/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';


@Injectable()
export class CustomValidatorService {

  constructor() {

  }

  static isCharA(control: AbstractControl) {
    const char = control.value;
    console.log('char: ' + char);

    if (char !== 'a') {
      return { isCharA: false }; // bisogna ritornare un oggetto
    }

    return null; // se non ci sono errori
  }

  static isAnnoValid(control: AbstractControl) {
    const anno = control.value;
    if (!/^[1-2][0-9]{3}$/.test(anno)) {
      return { annoMalformed: true };
    } else {
      const now = new Date();
      const year = now.getFullYear();
      if (anno > year) {
        return { annoFuturo: true };
      }
    }
  }

}
