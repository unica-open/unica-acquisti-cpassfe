/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[cpassFormatAmount]'
})
export class FormatAmountDirective {

  constructor() { }

  @HostListener ('blur') lostFocus() {
    // TODO?
  }
}
