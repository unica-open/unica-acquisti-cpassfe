/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { TemplateRef, Directive } from '@angular/core';

@Directive({selector: 'ng-template[cpassPaginationHead]'})
export class PaginationHeadDirective {
  constructor(
    public templateRef: TemplateRef<{}>
  ) {}
}
